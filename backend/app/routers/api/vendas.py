from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import ValidationError

from backend.app.database.session import db_session
from backend.app.schemas.venda import AnaliseLojaParamsModel
from backend.app.services.venda_service import VendaService

router = APIRouter(prefix="/api")


@router.post("/vendas/upload")
async def upload_vendas(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Envie um arquivo Excel no formato .xlsx.")

    file_bytes = await file.read()
    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.import_excel(file_bytes)


@router.get("/vendas/filtros")
async def getVendasFiltros():
    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.get_filters()


@router.get("/vendas/analise-loja")
async def getAnaliseLoja(store_id: str, month: str):
    try:
        payload = AnaliseLojaParamsModel(store_id=store_id, month=month)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.get_store_month_analysis(payload.store_id, payload.month)
