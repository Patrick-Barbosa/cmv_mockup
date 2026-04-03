from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from tests.conftest import buildMockSession, buildMockFactory


# ---------------------------------------------------------------------------
# POST /api/receitas/create
# ---------------------------------------------------------------------------

class TestCreateReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.create_recipe = AsyncMock(return_value=42)

            response = client.post('/api/receitas/create', json={
                "nome": "Pao de Queijo",
                "quantidade_base": 10.0,
                "unidade": "un",
                "componentes": [{"id_componente": 1, "quantidade": 200.0}]
            })

        assert response.status_code == 200
        assert response.json()["id"] == 42
        assert response.json()["message"] == "Receita criada com sucesso."

    def test_invalidUnidade(self, client):
        response = client.post('/api/receitas/create', json={
            "nome": "Pao de Queijo",
            "quantidade_base": 10.0,
            "unidade": "tonelada",
            "componentes": [{"id_componente": 1, "quantidade": 200.0}]
        })
        assert response.status_code == 422

    def test_emptyComponentes(self, client):
        response = client.post('/api/receitas/create', json={
            "nome": "Pao de Queijo",
            "quantidade_base": 10.0,
            "componentes": []
        })
        assert response.status_code == 422

    def test_missingFields(self, client):
        response = client.post('/api/receitas/create', json={"nome": "Pao de Queijo"})
        assert response.status_code == 422

    def test_withoutUnidade(self, client):
        """Unidade é opcional em receitas."""
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.create_recipe = AsyncMock(return_value=1)

            response = client.post('/api/receitas/create', json={
                "nome": "Pao de Queijo",
                "quantidade_base": 10.0,
                "componentes": [{"id_componente": 1, "quantidade": 200.0}]
            })

        assert response.status_code == 200


# ---------------------------------------------------------------------------
# PATCH /api/receitas/{id}
# ---------------------------------------------------------------------------

class TestEditReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_receita = MagicMock(id=1)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.edit_receita = AsyncMock(return_value=mock_receita)

            response = client.patch('/api/receitas/1', json={"nome": "Novo Nome"})

        assert response.status_code == 200
        assert response.json()["message"] == "Receita atualizada com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.edit_receita = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Receita não encontrada.")
            )

            response = client.patch('/api/receitas/999', json={"nome": "X"})

        assert response.status_code == 404

    def test_invalidUnidade(self, client):
        response = client.patch('/api/receitas/1', json={"unidade": "parsec"})
        assert response.status_code == 422

    def test_updateComponentes(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_receita = MagicMock(id=1)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.edit_receita = AsyncMock(return_value=mock_receita)

            response = client.patch('/api/receitas/1', json={
                "componentes": [{"id_componente": 2, "quantidade": 100.0}]
            })

        assert response.status_code == 200


# ---------------------------------------------------------------------------
# DELETE /api/receitas/{id}
# ---------------------------------------------------------------------------

class TestDeleteReceita:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.delete_receita = AsyncMock(return_value=None)

            response = client.delete('/api/receitas/1')

        assert response.status_code == 200
        assert response.json()["message"] == "Receita deletada com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.receitas.db_session.session_factory', factory), \
             patch('app.routers.api.receitas.ProdutoService') as MockService:
            MockService.return_value.delete_receita = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Receita não encontrada.")
            )

            response = client.delete('/api/receitas/999')

        assert response.status_code == 404
