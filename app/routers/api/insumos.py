from fastapi import APIRouter
from sqlalchemy.exc import IntegrityError
from app.database.session import db_session
from app.database.models import Produto
from app.schemas.insumo import CreateProductModel
from app.schemas.common import PaginatedParamsModel
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.post('/insumos/create')
async def create_produto(payload: CreateProductModel):
    try:
        async with db_session.session_factory() as session:
            insumo = Produto(nome=payload.nome, tipo="insumo", quantidade_base=None)
            session.add(insumo)
            await session.flush()
            await session.commit()
    except IntegrityError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Conflict")

    return {"id": insumo.id, "message": "Insumo criado com sucesso."}


@router.get('/get_produtos_select2')
async def get_produtos_select2(q: str = None, page: int = 1, per_page: int = 20):
    payload = PaginatedParamsModel(q=q, page=page, per_page=per_page)
    
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        data = await produto_service.get_produtos_paginated_select2(
            payload.q, 
            payload.page, 
            payload.per_page
        )

    return data
