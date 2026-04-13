from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from backend.app.database.session import db_session
from backend.app.database.models import Produto
from backend.app.services.produto_service import ProdutoService

router = APIRouter()


@router.get('/')
async def index():
    return JSONResponse({"status": "ok", "message": "CMV Mockup API is running"})


@router.get('/home')
async def home():
    return JSONResponse({"status": "ok", "message": "CMV Mockup API is running"})


@router.get('/receitas', name="receitas")
async def receitas():
    async with db_session.session_factory() as session:
        result = await session.execute(
            select(Produto)
            .where(Produto.tipo == "receita")
        )
        produtos: list[Produto] = result.scalars().all()

    return JSONResponse([
        {"id": p.id, "nome": p.nome, "tipo": p.tipo}
        for p in produtos
    ])


@router.get('/receitas/{receita_id}', name="receitas_view")
async def receitas_view(receita_id: int):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)

        receita = await produto_service.get_receita(receita_id)
        componentes = await produto_service.get_componentes_receita(receita_id)

    data = {
        "id": receita.id,
        "nome": receita.nome,
        "tipo": receita.tipo,
        "quantidade": receita.quantidade_base,
        "unidade": receita.unidade,
    }

    def get_children(f_componentes, key):
        data_list = []
        f = [row for row in f_componentes if row.previous_key == key]
        for componente in f:
            item = {
                "id": componente.id_componente,
                "nome": componente.nome,
                "tipo": componente.tipo,
                "quantidade": componente.quantidade_acumulada,
                "custo": componente.custo,
                "unidade": componente.unidade,
                "children": [] if componente.tipo == "insumo" else get_children(f_componentes, componente.current_key)
            }
            data_list.append(item)
        return data_list

    data["children"] = get_children(componentes, None)

    return JSONResponse(data)


@router.get('/insumos', name="insumos")
async def insumos_home():
    async with db_session.session_factory() as session:
        result = await session.execute(
            select(Produto)
            .where(Produto.tipo == "insumo")
        )
        produtos: list[Produto] = result.scalars().all()

    return JSONResponse([
        {"id": p.id, "nome": p.nome, "tipo": p.tipo}
        for p in produtos
    ])
