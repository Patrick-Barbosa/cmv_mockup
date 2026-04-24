from io import BytesIO
from unittest.mock import AsyncMock, patch

from openpyxl import Workbook

from backend.tests.conftest import buildMockSession, overrideSession


class TestUploadVendas:
    def test_rejectsInvalidExtension(self, client):
        response = client.post(
            "/api/vendas/upload",
            files={"file": ("vendas.csv", b"fake-content", "text/csv")},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Envie um arquivo Excel no formato .xlsx."

    def test_success(self, client):
        session = buildMockSession()
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.append(["data", "id_loja", "id_produto", "quantidade_produto", "valor_total"])
        worksheet.append(["2026-04-01", "RJ-COPA", "PIZZA-001", 10, 250.0])

        file_bytes = BytesIO()
        workbook.save(file_bytes)

        with overrideSession(client, session), \
             patch("backend.app.routers.api.vendas.VendaService") as MockService:
            MockService.return_value.import_excel = AsyncMock(return_value={
                "message": "Vendas importadas com sucesso.",
                "linhas_importadas": 1,
                "lojas": ["RJ-COPA"],
                "meses": ["2026-04"],
            })

            response = client.post(
                "/api/vendas/upload",
                files={"file": ("vendas.xlsx", file_bytes.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            )

        assert response.status_code == 200
        assert response.json()["linhas_importadas"] == 1


class TestVendasFiltros:
    def test_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.vendas.VendaService") as MockService:
            MockService.return_value.get_filters = AsyncMock(return_value={
                "lojas": ["RJ-COPA"],
                "meses": ["2026-04"],
            })

            response = client.get("/api/vendas/filtros")

        assert response.status_code == 200
        assert response.json()["lojas"] == ["RJ-COPA"]


class TestAnaliseLoja:
    def test_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.vendas.VendaService") as MockService:
            MockService.return_value.get_store_month_analysis = AsyncMock(return_value={
                "loja_id": "RJ-COPA",
                "mes": "2026-04",
                "resumo": {
                    "receita_total": 100.0,
                    "receita_vinculada": 100.0,
                    "receita_sem_vinculo": 0.0,
                    "custo_ideal_total": 30.0,
                    "cmv_ideal_percentual": 30.0,
                    "quantidade_total": 10,
                    "produtos_vinculados": 1,
                    "produtos_sem_vinculo": 0,
                },
                "produtos": [],
            })

            response = client.get("/api/vendas/analise-loja?store_id=RJ-COPA&month=2026-04")

        assert response.status_code == 200
        assert response.json()["mes"] == "2026-04"

    def test_invalidMonth(self, client):
        response = client.get("/api/vendas/analise-loja?store_id=RJ-COPA&month=04-2026")

        assert response.status_code == 422


class TestSkusAusentes:
    def test_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.vendas.VendaService") as MockService:
            MockService.return_value.get_missing_skus = AsyncMock(return_value={
                "total": 1,
                "page": 1,
                "size": 50,
                "pages": 1,
                "items": [
                    {
                        "id_produto_externo": "SKU-AUSENTE-01",
                        "quantidade_total": 10,
                        "valor_total": 500.0,
                        "vendas_count": 2
                    }
                ]
            })

            response = client.get("/api/vendas/skus-ausentes?page=1&size=50")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id_produto_externo"] == "SKU-AUSENTE-01"
