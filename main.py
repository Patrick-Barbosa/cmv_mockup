from aiohttp import web
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import text
from app.database.models import Produto, ComponenteReceita
from app.database.session import init_db_conn, get_db_session
from app.database.initiliaze_db import init_db
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from app.decorators import with_pydantic
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Literal, Optional, List

from app.services.produto_service import ProdutoService


## Midlewares
# from app.example_middleware import error_middleware

## Jinja
import aiohttp_jinja2
import jinja2

## Session
# from aiohttp_session import setup as setup_session
# from aiohttp_session.cookie_storage import EncryptedCookieStorage
# from cryptography import fernet


routes = web.RouteTableDef()

@routes.get('/')
async def index(request):
    return web.FileResponse('./templates/home.html')
    #return web.FileResponse('./templates/index.html')

@routes.get('/static/{filename}')
async def static_file(request):
    return web.FileResponse(f'./static/{request.match_info["filename"]}')

@routes.get('/home')
async def home(request):
    return web.FileResponse('./templates/home.html')

@routes.get('/receitas')
@aiohttp_jinja2.template('receita_home.html')
async def receitas(request):
    async with get_db_session(request) as session:
        result = await session.execute(
                select(Produto)
                .where(Produto.tipo == "receita")
        )
        
        produtos: list[Produto] = result.scalars().all()

    return {"produtos" : produtos}

@routes.get(r'/receitas/{id:\d+}', name="receitas_view")
@aiohttp_jinja2.template('receita_view.html')
async def receitas_view(request):
    receita_id = int(request.match_info['id'])

    async with get_db_session(request) as session:
        produto_service = ProdutoService(session)

        receita = await produto_service.get_receita(receita_id)
        componentes = await produto_service.get_componentes_receita(receita_id)

    data = {
        "id": receita.id,
        "nome": receita.nome,
        "tipo": receita.tipo,
        "quantidade": receita.quantidade_base
    }

    def get_children(f_componentes, key):
        data_list = []
        f = [row for row in f_componentes if row.previous_key == key]
        for componente in f:
            data = {
                "id": componente.id_componente,
                "nome": componente.nome,
                "tipo": componente.tipo,
                "quantidade": componente.quantidade_acumulada,
                "children": [] if componente.tipo == "insumo" else get_children(f_componentes, componente.current_key)
            }
            data_list.append(data)
        return data_list
    
    data["children"] = get_children(componentes, None)

    return {"id": receita_id, "data": data}


@routes.get('/insumos', name="product")
@aiohttp_jinja2.template('produto_home.html')
async def index(request):
    async with get_db_session(request) as session:
        result = await session.execute(
                select(Produto)
                .where(Produto.tipo == "insumo")
        )
        produtos: list[Produto] = result.scalars().all()

    return {"produtos" : produtos}


class CreateProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str

@routes.post('/api/insumos/create')
@with_pydantic(CreateProductModel, input_type="json")
async def create_produto(request: web.Request):
    try:
        async with get_db_session(request) as session:
            insumo = Produto(nome=request.data.nome, tipo="insumo", quantidade_base=None)
            session.add(insumo)
            session.flush
            await session.commit()
    except IntegrityError as e:
        raise web.HTTPBadRequest(reason="Conflict")

    return web.json_response({"id": insumo.id, "message": "Insumo criado com sucesso."})


class PaginatedParamsModel(BaseModel):
    q: Optional[str] = None
    page: int = 1
    per_page: int = 20

    @field_validator('q', mode='before')
    @classmethod
    def _strip_q(cls, v):
        # se vier None, retorna None; se for string, faz strip()
        if isinstance(v, str):
            return v.strip()
        return v

@routes.get('/api/get_produtos_select2')
@with_pydantic(PaginatedParamsModel, input_type="query")
async def get_produtos_select2(request):
    payload: PaginatedParamsModel = request.data
    async with get_db_session(request) as session:
        produto_service = ProdutoService(session)

        data = await produto_service.get_produtos_paginated_select2(payload.q, payload.page, payload.per_page)

    return web.json_response(data)



class ComponenteCreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id_componente: int
    quantidade: float

class CreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
    quantidade_base: float
    componentes: List[ComponenteCreateRecipeModel] = Field(..., min_items=1)

@routes.post("/api/receitas/create")
@with_pydantic(CreateRecipeModel, input_type="json")
async def create_recipe(request):
    payload: CreateRecipeModel = request.data

    async with get_db_session(request) as session:
        produto_service = ProdutoService(session)
        async with session.begin():
            id = await produto_service.create_recipe(payload)

    return web.json_response({"id": id, "message": "Receita criada com sucesso."})



app = web.Application()

## Add Midlewares
# app = web.Application(middlewares=[error_middleware])

app.add_routes(routes)

subapp = web.Application()

app["main_router"] = subapp["main_router"] = app.router

from app.subapp_view_example import routes as subapp_routes
subapp.add_routes(subapp_routes)

aiohttp_jinja2.setup(
    subapp, 
    loader=jinja2.FileSystemLoader("templates"),
    context_processors=[aiohttp_jinja2.request_processor]
)

app.add_subapp('/subapp', subapp)
app["subapp"] = subapp  # Armazena a referência


aiohttp_jinja2.setup(
    app, 
    loader=jinja2.FileSystemLoader("templates"),
    context_processors=[aiohttp_jinja2.request_processor]
)



# env = jinja2.Environment(loader=jinja2.FileSystemLoader('templates'))
# aiohttp_jinja2.setup(app,       environment=env)
# aiohttp_jinja2.setup(sub_app,   environment=env)
# aiohttp_jinja2.setup(another_app, loader=jinja2.FileSystemLoader("templates"))


## Session setup
# fernet_key = fernet.Fernet.generate_key()
# secret_key = EncryptedCookieStorage(fernet_key.decode())  # <- decode para str
# setup_session(app, secret_key)


if __name__ == '__main__':
    app.on_startup.append(init_db_conn)
    app.on_startup.append(init_db)

    web.run_app(app, port=8080)