from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError
from backend.app.database.session import DbSession
from backend.app.database.models import Produto
from backend.app.schemas.insumo import CreateProductModel, UpdateCustoModel, EditInsumoModel
from backend.app.schemas.common import PaginatedParamsModel, UNIDADES_PADRAO
from backend.app.services.produto_service import ProdutoService

router = APIRouter(prefix="/api")


@router.get('/unidades')
async def getUnidades():
    return {"unidades": UNIDADES_PADRAO}


@router.post('/insumos/create')
async def create_produto(payload: CreateProductModel, session: DbSession):
    custo_unitario = payload.preco_referencia / payload.quantidade_referencia

    try:
        async with session.begin():
            produto_service = ProdutoService(session)
            await produto_service.ensure_external_product_id_available(payload.id_produto_externo)
            insumo = Produto(
                nome=payload.nome,
                tipo="insumo",
                quantidade_base=None,
                custo=custo_unitario,
                unidade=payload.unidade,
                quantidade_referencia=payload.quantidade_referencia,
                preco_referencia=payload.preco_referencia,
                id_produto_externo=payload.id_produto_externo,
            )
            session.add(insumo)
            await session.flush()
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Conflict")

    return {"id": insumo.id, "message": "Insumo criado com sucesso."}


@router.get('/get_produtos_select2')
async def get_produtos_select2(
    session: DbSession,
    q: str = None,
    page: int = 1,
    per_page: int = 20,
):
    payload = PaginatedParamsModel(q=q, page=page, per_page=per_page)

    async with session.begin():
        produto_service = ProdutoService(session)
        data = await produto_service.get_produtos_paginated_select2(
            payload.q,
            payload.page,
            payload.per_page
        )

    return data


@router.post('/insumos/update_custo')
async def update_custo(payload: UpdateCustoModel, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        insumo = await produto_service.edit_insumo(payload.id, nome=None, custo=payload.custo, unidade=payload.unidade)

    return {"id": insumo.id, "message": "Custo atualizado com sucesso."}


@router.patch('/insumos/{insumo_id}')
async def editInsumo(insumo_id: int, payload: EditInsumoModel, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        insumo = await produto_service.edit_insumo_gramatura(
            insumo_id,
            nome=payload.nome,
            unidade=payload.unidade,
            quantidade_referencia=payload.quantidade_referencia,
            preco_referencia=payload.preco_referencia,
            id_produto_externo=payload.id_produto_externo,
            update_id_produto_externo='id_produto_externo' in payload.model_fields_set,
        )

    return {"id": insumo.id, "message": "Insumo atualizado com sucesso."}


@router.delete('/insumos/{insumo_id}')
async def deleteInsumo(insumo_id: int, session: DbSession):
    async with session.begin():
        produto_service = ProdutoService(session)
        await produto_service.delete_insumo(insumo_id)

    return {"message": "Insumo deletado com sucesso."}
