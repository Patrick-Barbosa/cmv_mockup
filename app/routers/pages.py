from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select
from app.database.session import db_session
from app.database.models import Produto
from app.services.produto_service import ProdutoService

router = APIRouter()
templates = Jinja2Templates(directory="templates")


@router.get('/')
async def index(request: Request):
    return templates.TemplateResponse(request, 'home.html')


@router.get('/home')
async def home(request: Request):
    return templates.TemplateResponse(request, 'home.html')


@router.get('/receitas', name="receitas")
async def receitas(request: Request):
    async with db_session.session_factory() as session:
        result = await session.execute(
            select(Produto)
            .where(Produto.tipo == "receita")
        )
        produtos: list[Produto] = result.scalars().all()

    return templates.TemplateResponse(request, 'receita_home.html', {
        "produtos": produtos
    })


@router.get('/receitas/{receita_id}', name="receitas_view")
async def receitas_view(request: Request, receita_id: int):
    async with db_session.session_factory() as session:
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

    return templates.TemplateResponse(request, 'receita_view.html', {
        "id": receita_id,
        "data": data
    })


@router.get('/insumos', name="insumos")
async def insumos_home(request: Request):
    async with db_session.session_factory() as session:
        result = await session.execute(
            select(Produto)
            .where(Produto.tipo == "insumo")
        )
        produtos: list[Produto] = result.scalars().all()

    return templates.TemplateResponse(request, 'produto_home.html', {
        "produtos": produtos
    })
