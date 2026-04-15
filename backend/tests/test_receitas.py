from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from backend.tests.conftest import buildMockFactory, buildMockSession


class TestCreateReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.create_recipe = AsyncMock(return_value=42)
            MockService.return_value.recompute_recipe_cost = AsyncMock(return_value=None)

            response = client.post("/api/receitas/create", json={
                "nome": "Pao de Queijo",
                "quantidade_base": 10.0,
                "unidade": "un",
                "id_produto_externo": "PAO-QUEIJO-001",
                "componentes": [{"id_componente": 1, "quantidade": 200.0}],
            })

        assert response.status_code == 200
        assert response.json()["id"] == 42
        assert response.json()["message"] == "Receita criada com sucesso."

    def test_invalidUnidade(self, client):
        response = client.post("/api/receitas/create", json={
            "nome": "Pao de Queijo",
            "quantidade_base": 10.0,
            "unidade": "tonelada",
            "componentes": [{"id_componente": 1, "quantidade": 200.0}],
        })

        assert response.status_code == 422

    def test_emptyComponentes(self, client):
        response = client.post("/api/receitas/create", json={
            "nome": "Pao de Queijo",
            "quantidade_base": 10.0,
            "componentes": [],
        })

        assert response.status_code == 422

    def test_missingFields(self, client):
        response = client.post("/api/receitas/create", json={"nome": "Pao de Queijo"})

        assert response.status_code == 422

    def test_withoutUnidade(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.create_recipe = AsyncMock(return_value=1)
            MockService.return_value.recompute_recipe_cost = AsyncMock(return_value=None)

            response = client.post("/api/receitas/create", json={
                "nome": "Pao de Queijo",
                "quantidade_base": 10.0,
                "componentes": [{"id_componente": 1, "quantidade": 200.0}],
            })

        assert response.status_code == 200


class TestEditReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_receita = MagicMock(id=1)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.edit_receita = AsyncMock(return_value=mock_receita)
            MockService.return_value.recompute_recipe_cost = AsyncMock(return_value=None)

            response = client.patch("/api/receitas/1", json={"nome": "Novo Nome"})

        assert response.status_code == 200
        assert response.json()["message"] == "Receita atualizada com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.edit_receita = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Receita não encontrada.")
            )

            response = client.patch("/api/receitas/999", json={"nome": "X"})

        assert response.status_code == 404

    def test_invalidUnidade(self, client):
        response = client.patch("/api/receitas/1", json={"unidade": "parsec"})

        assert response.status_code == 422

    def test_updateComponentes(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_receita = MagicMock(id=1)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.edit_receita = AsyncMock(return_value=mock_receita)
            MockService.return_value.recompute_recipe_cost = AsyncMock(return_value=None)

            response = client.patch("/api/receitas/1", json={
                "componentes": [{"id_componente": 2, "quantidade": 100.0}],
            })

        assert response.status_code == 200


class TestDeleteReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.delete_receita = AsyncMock(return_value=None)

            response = client.delete("/api/receitas/1")

        assert response.status_code == 200
        assert response.json()["message"] == "Receita deletada com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockService:
            MockService.return_value.delete_receita = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Receita não encontrada.")
            )

            response = client.delete("/api/receitas/999")

        assert response.status_code == 404


class TestReceitaAnaliseVendas:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_receita = MagicMock(id=1)
        mock_analysis = {
            "produto": {"id": 1, "nome": "Pizza", "tipo": "receita", "id_produto_externo": "PIZZA-001", "custo_unitario_ideal": 10.0},
            "possui_vinculo_externo": True,
            "linhas": [],
        }

        with patch("backend.app.routers.api.receitas.db_session.session_factory", factory), \
             patch("backend.app.routers.api.receitas.ProdutoService") as MockProdutoService, \
             patch("backend.app.routers.api.receitas.VendaService") as MockVendaService:
            MockProdutoService.return_value.get_receita = AsyncMock(return_value=mock_receita)
            MockVendaService.return_value.get_product_monthly_analysis = AsyncMock(return_value=mock_analysis)

            response = client.get("/api/receitas/1/analise-vendas")

        assert response.status_code == 200
        assert response.json()["possui_vinculo_externo"] is True
