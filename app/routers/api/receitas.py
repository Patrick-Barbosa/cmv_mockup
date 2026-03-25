from fastapi import APIRouter
from app.database.session import db_session
from app.schemas.receita import CreateRecipeModel, EditReceitaModel
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.post("/receitas/create")
async def create_recipe(payload: CreateRecipeModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        async with session.begin():
            id = await produto_service.create_recipe(payload)

    return {"id": id, "message": "Receita criada com sucesso."}


@router.patch("/receitas/{receita_id}")
async def editReceita(receita_id: int, payload: EditReceitaModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        receita = await produto_service.edit_receita(
            receita_id, payload.nome, payload.quantidade_base, payload.unidade, payload.componentes
        )

    return {"id": receita.id, "message": "Receita atualizada com sucesso."}


@router.delete("/receitas/{receita_id}")
async def deleteReceita(receita_id: int):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        await produto_service.delete_receita(receita_id)

    return {"message": "Receita deletada com sucesso."}
