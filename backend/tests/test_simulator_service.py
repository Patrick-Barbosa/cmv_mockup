import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from backend.app.database.session import db_session
from backend.app.schemas.simulator import SimulationInput, SimulationResponse
from backend.app.services.simulator_service import SimulatorService


@pytest.fixture
def client():
    from backend.app.routers.api import simulator

    test_app = FastAPI()
    test_app.include_router(simulator.router)

    async def override_get_session():
        yield buildMockSession()

    test_app.dependency_overrides[db_session.get_session] = override_get_session
    return TestClient(test_app)


def buildMockSession():
    session = AsyncMock()
    session.add = MagicMock()

    begin_cm = AsyncMock()
    begin_cm.__aenter__ = AsyncMock(return_value=None)
    begin_cm.__aexit__ = AsyncMock(return_value=False)
    session.begin = MagicMock(return_value=begin_cm)

    return session


@contextmanager
def overrideSession(client, session):
    async def override_get_session():
        yield session

    app = client.app
    previous = app.dependency_overrides.get(db_session.get_session)
    app.dependency_overrides[db_session.get_session] = override_get_session
    try:
        yield
    finally:
        if previous is None:
            app.dependency_overrides.pop(db_session.get_session, None)
        else:
            app.dependency_overrides[db_session.get_session] = previous


class TestSimulateEndpoint:
    def test_price_change_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.simulator.SimulatorService") as MockService:
            mock_service = MagicMock()
            mock_result = SimulationResponse(
                simulation_type="price_change",
                ingredient_name="Farinha de Trigo",
                change_applied="+10.0% (5.00 -> 5.50)",
                total_network_impact=50.0,
                total_network_impact_percent=10.0,
                results=[],
                store_ranking=[],
                projection_month="2025-01",
                projection_type="last_complete"
            )
            mock_service.calculate_simulation = AsyncMock(return_value=mock_result)
            MockService.return_value = mock_service

            response = client.post("/api/simulator/simulate", json={
                "type": "price_change",
                "ingredient_id": 1,
                "change_type": "percentual",
                "change_value": 10.0
            })

        assert response.status_code == 200
        data = response.json()
        assert data["simulation_type"] == "price_change"
        assert data["ingredient_name"] == "Farinha de Trigo"

    def test_price_change_missing_ingredient_id(self, client):
        response = client.post("/api/simulator/simulate", json={
            "type": "price_change",
            "change_type": "percentual",
            "change_value": 10.0
        })

        assert response.status_code == 400

    def test_recipe_change_missing_recipe_id(self, client):
        response = client.post("/api/simulator/simulate", json={
            "type": "recipe_change",
            "change_type": "percentual",
            "change_value": 10.0,
            "novos_componentes": []
        })

        assert response.status_code == 400

    def test_recipe_change_missing_componentes(self, client):
        response = client.post("/api/simulator/simulate", json={
            "type": "recipe_change",
            "recipe_id": 1,
            "change_type": "percentual",
            "change_value": 10.0
        })

        assert response.status_code == 400


class TestAffectedRecipesEndpoint:
    def test_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.simulator.SimulatorService") as MockService:
            mock_service = MagicMock()
            from backend.app.schemas.simulator import AffectedRecipePreview
            mock_result = [
                AffectedRecipePreview(recipe_id=1, recipe_name="Pão Francês", current_cost=0.5)
            ]
            mock_service.get_affected_recipes = AsyncMock(return_value=mock_result)
            MockService.return_value = mock_service

            response = client.get("/api/simulator/ingredients/1/affected-recipes")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["recipe_name"] == "Pão Francês"

    def test_not_found(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.simulator.SimulatorService") as MockService:
            mock_service = MagicMock()
            mock_service.get_affected_recipes = AsyncMock(
                side_effect=HTTPException(status_code=404, detail="Insumo não encontrado")
            )
            MockService.return_value = mock_service

            response = client.get("/api/simulator/ingredients/999/affected-recipes")

        assert response.status_code == 404


class TestStoresEndpoint:
    def test_success(self, client):
        session = buildMockSession()

        with overrideSession(client, session), \
             patch("backend.app.routers.api.simulator.SimulatorService") as MockService:
            mock_service = MagicMock()
            mock_service.get_stores = AsyncMock(return_value=[{"store_id": "store1"}, {"store_id": "store2"}])
            MockService.return_value = mock_service

            response = client.get("/api/simulator/stores")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["store_id"] == "store1"