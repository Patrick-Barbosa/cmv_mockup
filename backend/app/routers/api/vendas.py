import io
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from backend.app.database.session import db_session
from backend.app.schemas.venda import AnaliseLojaParamsModel, BulkImportVendasModel, PaginatedSkusAusentesModel
from backend.app.services.venda_service import VendaService, EXPECTED_UPLOAD_COLUMNS

router = APIRouter(prefix="/api")


@router.get("/vendas/template")
async def get_vendas_template(format: str = "xlsx"):
    # Mockup data to exemplify the format
    mockup_data = [
        {"data": "2026-04-01", "id_loja": "LOJA-01", "id_produto": "SKU-001", "quantidade_produto": 10, "valor_total": 250.50},
        {"data": "2026-04-01", "id_loja": "LOJA-01", "id_produto": "SKU-002", "quantidade_produto": 5, "valor_total": 125.00},
        {"data": "2026-04-02", "id_loja": "LOJA-01", "id_produto": "SKU-001", "quantidade_produto": 8, "valor_total": 200.40},
        {"data": "2026-04-01", "id_loja": "LOJA-02", "id_produto": "SKU-001", "quantidade_produto": 15, "valor_total": 375.00},
        {"data": "2026-04-02", "id_loja": "LOJA-02", "id_produto": "SKU-003", "quantidade_produto": 20, "valor_total": 600.00},
    ]
    df = pd.DataFrame(mockup_data, columns=EXPECTED_UPLOAD_COLUMNS)
    
    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=template_vendas.csv"}
        )
    else:  # default xlsx
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Vendas')
        return StreamingResponse(
            io.BytesIO(output.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=template_vendas.xlsx"}
        )


@router.post("/vendas/bulk_import")
async def bulk_import_vendas(payload: BulkImportVendasModel):
    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.bulk_import(payload)


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
        # Pydantic v2 errors contain non-serializable objects in 'ctx'
        # We need to make them JSON serializable for the HTTPException
        errors = exc.errors()
        for err in errors:
            if "ctx" in err:
                # Convert ctx values to strings if they are not serializable
                for k, v in err["ctx"].items():
                    if isinstance(v, Exception):
                        err["ctx"][k] = str(v)
        raise HTTPException(status_code=422, detail=errors)

    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.get_store_month_analysis(payload.store_id, payload.month)


@router.get("/vendas/skus-ausentes", response_model=PaginatedSkusAusentesModel)
async def get_skus_ausentes(page: int = 1, size: int = 50):
    async with db_session.session_factory() as session:
        venda_service = VendaService(session)
        return await venda_service.get_missing_skus(page=page, size=size)
