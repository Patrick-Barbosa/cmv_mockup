from fastapi import APIRouter
from app.database.session import db_session
from app.schemas.receita import CreateRecipeModel, EditReceitaModel
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.get("/receitas/{receita_id}")
async def getReceita(receita_id: int):
    async with db_session.session_factory() as session:
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
        "componentes": componentes,
        "custo_total": custo_total,
    }


@router.post("/receitas/create")
async def create_recipe(payload: CreateRecipeModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        async with session.begin():
            id = await produto_service.create_recipe(payload)
            await produto_service.recompute_recipe_cost(id)

    return {"id": id, "message": "Receita criada com sucesso."}


@router.patch("/receitas/{receita_id}")
async def editReceita(receita_id: int, payload: EditReceitaModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        receita = await produto_service.edit_receita(
            receita_id, payload.nome, payload.quantidade_base, payload.unidade, payload.componentes
        )
        await produto_service.recompute_recipe_cost(receita_id)
        await session.commit()

    return {"id": receita.id, "message": "Receita atualizada com sucesso."}


@router.delete("/receitas/{receita_id}")
async def deleteReceita(receita_id: int):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        await produto_service.delete_receita(receita_id)

    return {"message": "Receita deletada com sucesso."}
