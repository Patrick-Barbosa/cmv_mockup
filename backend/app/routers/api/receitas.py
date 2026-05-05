from fastapi import APIRouter
from backend.app.database.session import DbSession
from backend.app.schemas.receita import CreateRecipeModel, EditReceitaModel
from backend.app.services.produto_service import ProdutoService
from backend.app.services.venda_service import VendaService

router = APIRouter(prefix="/api")


@router.get("/receitas/{receita_id}")
async def getReceita(receita_id: int, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        receita = await produto_service.get_receita(receita_id)
        componentes = await produto_service.get_componentes_diretos(receita_id)

    custo_total = sum(
        (c['custo_unitario'] or 0) * c['quantidade']
        for c in componentes
    )

    return {
        "id": receita.id,
        "nome": receita.nome,
        "quantidade_base": receita.quantidade_base,
        "unidade": receita.unidade,
        "id_produto_externo": receita.id_produto_externo,
        "componentes": componentes,
        "custo_total": custo_total,
    }


@router.get("/receitas/{receita_id}/analise-vendas")
async def getReceitaAnaliseVendas(receita_id: int, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        await produto_service.get_receita(receita_id)
        venda_service = VendaService(session)
        return await venda_service.get_product_monthly_analysis(receita_id)


@router.post("/receitas/create")
async def create_recipe(payload: CreateRecipeModel, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        id = await produto_service.create_recipe(payload)
        await produto_service.recompute_recipe_cost(id)

    return {"id": id, "message": "Receita criada com sucesso."}


@router.patch("/receitas/{receita_id}")
async def editReceita(receita_id: int, payload: EditReceitaModel, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        receita = await produto_service.edit_receita(
            receita_id,
            payload.nome,
            payload.quantidade_base,
            payload.unidade,
            payload.id_produto_externo,
            'id_produto_externo' in payload.model_fields_set,
            payload.componentes,
            payload.preco_venda,
        )
        await produto_service.recompute_recipe_cost(receita_id)

    return {"id": receita.id, "message": "Receita atualizada com sucesso."}


@router.delete("/receitas/{receita_id}")
async def deleteReceita(receita_id: int, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        await produto_service.delete_receita(receita_id)

    return {"message": "Receita deletada com sucesso."}
