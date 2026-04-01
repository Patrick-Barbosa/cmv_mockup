from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.tests.conftest import buildMockSession, buildMockFactory


# ---------------------------------------------------------------------------
# GET /api/unidades
# ---------------------------------------------------------------------------

class TestGetUnidades:
    def test_returnsAllUnidades(self, client):
        response = client.get('/api/unidades')
        assert response.status_code == 200
        data = response.json()
        assert "unidades" in data
        for expected in ["g", "kg", "ml", "l", "un"]:
            assert expected in data["unidades"]


# ---------------------------------------------------------------------------
# POST /api/insumos/create
# ---------------------------------------------------------------------------

class TestCreateInsumo:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory):
            response = client.post('/api/insumos/create', json={
                "nome": "Farinha de Trigo",
                "custo": 5.50,
                "unidade": "kg"
            })

        assert response.status_code == 200
        assert response.json()["message"] == "Insumo criado com sucesso."

    def test_invalidUnidade(self, client):
        response = client.post('/api/insumos/create', json={
            "nome": "Farinha de Trigo",
            "custo": 5.50,
            "unidade": "xablau"
        })
        assert response.status_code == 422

    def test_missingFields(self, client):
        response = client.post('/api/insumos/create', json={"nome": "Farinha"})
        assert response.status_code == 422

    def test_conflict(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        # Patch IntegrityError in the module to use a local exception
        class _FakeIntegrityError(Exception):
            pass

        session.flush.side_effect = _FakeIntegrityError()

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.IntegrityError', _FakeIntegrityError):
            response = client.post('/api/insumos/create', json={
                "nome": "Farinha de Trigo",
                "custo": 5.50,
                "unidade": "kg"
            })

        assert response.status_code == 400
        assert response.json()["detail"] == "Conflict"


# ---------------------------------------------------------------------------
# POST /api/insumos/update_custo
# ---------------------------------------------------------------------------

class TestUpdateCusto:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_insumo = MagicMock(id=1)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.edit_insumo = AsyncMock(return_value=mock_insumo)

            response = client.post('/api/insumos/update_custo', json={
                "id": 1,
                "custo": 8.0,
                "unidade": "kg"
            })

        assert response.status_code == 200
        assert response.json()["id"] == 1
        assert response.json()["message"] == "Custo atualizado com sucesso."

    def test_invalidUnidade(self, client):
        response = client.post('/api/insumos/update_custo', json={
            "id": 1,
            "custo": 8.0,
            "unidade": "arroba"
        })
        assert response.status_code == 422

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.edit_insumo = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Insumo não encontrado.")
            )

            response = client.post('/api/insumos/update_custo', json={
                "id": 999,
                "custo": 8.0,
                "unidade": "kg"
            })

        assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /api/insumos/{id}
# ---------------------------------------------------------------------------

class TestEditInsumo:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_insumo = MagicMock(id=1)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.edit_insumo = AsyncMock(return_value=mock_insumo)

            response = client.patch('/api/insumos/1', json={"nome": "Novo Nome"})

        assert response.status_code == 200
        assert response.json()["message"] == "Insumo atualizado com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.edit_insumo = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Insumo não encontrado.")
            )

            response = client.patch('/api/insumos/999', json={"nome": "X"})

        assert response.status_code == 404

    def test_invalidUnidade(self, client):
        response = client.patch('/api/insumos/1', json={"unidade": "milhas"})
        assert response.status_code == 422

    def test_partialUpdate(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_insumo = MagicMock(id=1)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.edit_insumo = AsyncMock(return_value=mock_insumo)

            response = client.patch('/api/insumos/1', json={"custo": 12.5})

        assert response.status_code == 200


# ---------------------------------------------------------------------------
# DELETE /api/insumos/{id}
# ---------------------------------------------------------------------------

class TestDeleteInsumo:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.delete_insumo = AsyncMock(return_value=None)

            response = client.delete('/api/insumos/1')

        assert response.status_code == 200
        assert response.json()["message"] == "Insumo deletado com sucesso."

    def test_notFound(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.delete_insumo = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Insumo não encontrado.")
            )

            response = client.delete('/api/insumos/999')

        assert response.status_code == 404

    def test_inUseConflict(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.delete_insumo = AsyncMock(
                side_effect=HTTPException(status_code=409, detail="Insumo está sendo usado em receitas.")
            )

            response = client.delete('/api/insumos/1')

        assert response.status_code == 409


# ---------------------------------------------------------------------------
# GET /api/get_produtos_select2
# ---------------------------------------------------------------------------

class TestGetProdutosSelect2:
    def test_success(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_data = {
            "items": [{"id": 1, "text": "Farinha", "tipo": "Insumo", "custo": 5.0, "unidade": "kg"}],
            "pagination": {"more": False}
        }

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.get_produtos_paginated_select2 = AsyncMock(return_value=mock_data)

            response = client.get('/api/get_produtos_select2')

        assert response.status_code == 200
        assert "items" in response.json()
        assert "pagination" in response.json()

    def test_withSearch(self, client):
        session = buildMockSession()
        factory = buildMockFactory(session)
        mock_data = {"items": [], "pagination": {"more": False}}

        with patch('app.routers.api.insumos.db_session.session_factory', factory), \
             patch('app.routers.api.insumos.ProdutoService') as MockService:
            MockService.return_value.get_produtos_paginated_select2 = AsyncMock(return_value=mock_data)

            response = client.get('/api/get_produtos_select2?q=far&page=1&per_page=10')

        assert response.status_code == 200
