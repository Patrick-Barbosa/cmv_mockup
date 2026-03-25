from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError
from app.database.session import db_session
from app.database.models import Produto
from app.schemas.insumo import CreateProductModel, UpdateCustoModel, EditInsumoModel
from app.schemas.common import PaginatedParamsModel, UNIDADES_PADRAO
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.get('/unidades')
async def getUnidades():
    return {"unidades": UNIDADES_PADRAO}


@router.post('/insumos/create')
async def create_produto(payload: CreateProductModel):
    try:
        async with db_session.session_factory() as session:
            insumo = Produto(nome=payload.nome, tipo="insumo", quantidade_base=None, custo=payload.custo, unidade=payload.unidade)
            session.add(insumo)
            await session.flush()
            await session.commit()
    except IntegrityError:
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


@router.post('/insumos/update_custo')
async def update_custo(payload: UpdateCustoModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        insumo = await produto_service.edit_insumo(payload.id, nome=None, custo=payload.custo, unidade=payload.unidade)

    return {"id": insumo.id, "message": "Custo atualizado com sucesso."}


@router.patch('/insumos/{insumo_id}')
async def editInsumo(insumo_id: int, payload: EditInsumoModel):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        insumo = await produto_service.edit_insumo(insumo_id, payload.nome, payload.custo, payload.unidade)

    return {"id": insumo.id, "message": "Insumo atualizado com sucesso."}


@router.delete('/insumos/{insumo_id}')
async def deleteInsumo(insumo_id: int):
    async with db_session.session_factory() as session:
        produto_service = ProdutoService(session)
        await produto_service.delete_insumo(insumo_id)

    return {"message": "Insumo deletado com sucesso."}
