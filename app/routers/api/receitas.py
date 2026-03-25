from fastapi import APIRouter
from app.database.session import db_session
from app.schemas.receita import CreateRecipeModel
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.post("/receitas/create")
async def create_recipe(payload: CreateRecipeModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        async with session.begin():
            id = await produto_service.create_recipe(payload)

    return {"id": id, "message": "Receita criada com sucesso."}
