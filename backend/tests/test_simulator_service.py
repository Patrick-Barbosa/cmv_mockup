import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from datetime import date
from decimal import Decimal

from backend.app.database.session import db_session
from backend.app.schemas.simulator import (
    SimulationInput, SimulationResponse, ProductInfoResponse, DailyEvolutionData
)
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
                avg_impact_per_store=25.0,
                avg_impact_per_store_percent=10.0,
                avg_impact_per_recipe=50.0,
                avg_impact_per_recipe_percent=10.0,
                ingredient_impact=0.5,
                ingredient_impact_percent=10.0,
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
        assert "avg_impact_per_store" in data
        assert "ingredient_impact" in data
        assert "ingredient_impact_percent" in data

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


class TestProductInfoEndpoint:
    def test_returns_custo_for_insumo(self):
        from backend.app.database.models import Produto
        
        session = AsyncMock()
        mock_query = MagicMock()
        
        mock_produto = MagicMock()
        mock_produto.id = 1
        mock_produto.nome = "Farinha de trigo"
        mock_produto.tipo = "insumo"
        mock_produto.custo = 5.90
        mock_produto.unidade = "kg"
        mock_produto.preco_venda = None
        mock_produto.id_produto_externo = None
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_produto)
        mock_query.where = MagicMock(return_value=mock_result)
        session.execute = AsyncMock(return_value=mock_result)
        
        service = SimulatorService(session)
        
        async def run_test():
            return await service.get_product_info(1)
        
        import asyncio
        result = asyncio.run(run_test())
        
        assert result.custo_atual == 5.90
        assert result.unidade_medida == "kg"
        assert result.product_type == "insumo"
    
    def test_returns_null_custo_for_receita(self):
        mock_produto = MagicMock()
        mock_produto.id = 2
        mock_produto.nome = "Bolo de cenoura"
        mock_produto.tipo = "receita"
        mock_produto.custo = 1.50
        mock_produto.unidade = "kg"
        mock_produto.preco_venda = None
        mock_produto.id_produto_externo = None
        
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_produto)
        session.execute = AsyncMock(return_value=mock_result)
        
        service = SimulatorService(session)
        
        import asyncio
        result = asyncio.run(service.get_product_info(2))
        
        assert result.custo_atual is None
        assert result.unidade_medida is None
        assert result.product_type == "receita"


class TestDailyEvolutionEndpoint:
    def test_daily_evolution_data_has_store_id_field(self):
        data = DailyEvolutionData(
            date="2026-04-01",
            store_id="RJ-COPA",
            day_of_week="quarta",
            current_cost_total=100.0,
            new_cost_total=110.0,
            current_cost_avg_per_recipe=1.0,
            new_cost_avg_per_recipe=1.1,
            sales_quantity=10,
            sales_revenue=150.0
        )
        
        assert data.store_id == "RJ-COPA"
        assert data.date == "2026-04-01"
    
    def test_daily_evolution_data_allows_null_store_id(self):
        data = DailyEvolutionData(
            date="2026-04-01",
            store_id=None,
            day_of_week="quarta",
            current_cost_total=100.0,
            new_cost_total=110.0,
            current_cost_avg_per_recipe=1.0,
            new_cost_avg_per_recipe=1.1,
            sales_quantity=10,
            sales_revenue=150.0
        )
        
        assert data.store_id is None
    
    def test_product_info_has_custo_fields(self):
        info = ProductInfoResponse(
            product_id=1,
            product_name="Farinha de trigo",
            product_type="insumo",
            preco_venda=None,
            custo_atual=5.90,
            unidade_medida="kg",
            source="indisponivel",
            is_vendido=False
        )
        
        assert info.custo_atual == 5.90
        assert info.unidade_medida == "kg"
        assert info.product_type == "insumo"
    
    def test_product_info_custo_null_for_receita(self):
        info = ProductInfoResponse(
            product_id=2,
            product_name="Bolo de cenoura",
            product_type="receita",
            preco_venda=25.0,
            custo_atual=None,
            unidade_medida=None,
            source="preco_cadastrado",
            is_vendido=True
        )
        
        assert info.custo_atual is None
        assert info.unidade_medida is None


class TestSimulatorPriceChangeLogic:
    """
    Testes para validar a lógica de cálculo de impacto de preço.
    Cenário da mussarela: preço atual R$ 45,00 -> novo preço R$ 1,00
    O impacto deve ser NEGATIVO (redução de custo).
    """
    
    def test_calculate_new_price_absoluto(self):
        """Testa se _calculate_new_price retorna o valor absoluto corretamente."""
        from backend.app.services.simulator_service import SimulatorService
        
        service = SimulatorService(None)
        
        # Teste: change_type=absoluto deve retornar o change_value diretamente
        new_price = service._calculate_new_price(45.00, "absoluto", 1.00)
        assert new_price == 1.00, f"Esperado 1.00, obtido {new_price}"
        
        # Teste: change_type=percentual deve calcular corretamente
        new_price = service._calculate_new_price(45.00, "percentual", -97.78)
        expected = 45.00 * (1 + (-97.78) / 100)
        assert abs(new_price - expected) < 0.01, f"Esperado ~{expected}, obtido {new_price}"
    
    def test_calculate_new_price_percentual(self):
        """Testa se _calculate_new_price retorna o valor percentual corretamente."""
        from backend.app.services.simulator_service import SimulatorService
        
        service = SimulatorService(None)
        
        # Aumento de 10%
        new_price = service._calculate_new_price(10.00, "percentual", 10.0)
        assert new_price == 11.00, f"Esperado 11.00, obtido {new_price}"
        
        # Redução de 10%
        new_price = service._calculate_new_price(10.00, "percentual", -10.0)
        assert new_price == 9.00, f"Esperado 9.00, obtido {new_price}"
    
    def test_format_change_applied_negative(self):
        """Testa se _format_change_applied formata corretamente uma redução de preço."""
        from backend.app.services.simulator_service import SimulatorService
        
        service = SimulatorService(None)
        
        # Redução de R$ 45,00 para R$ 1,00
        result = service._format_change_applied(45.00, 1.00, "absoluto")
        assert "-" in result, f"Deveria conter sinal negativo: {result}"
        assert "R$ -44.00" in result or "R$ -44,00" in result, f"Deveria mostrar a diferença negativa: {result}"
        
        # Redução percentual de 97.78%
        result = service._format_change_applied(45.00, 1.00, "percentual")
        assert "-" in result, f"Deveria conter sinal negativo: {result}"
        assert "-97.8%" in result or "-97,8%" in result, f"Deveria mostrar redução percentual: {result}"
    
    def test_format_change_applied_positive(self):
        """Testa se _format_change_applied formata corretamente um aumento de preço."""
        from backend.app.services.simulator_service import SimulatorService
        
        service = SimulatorService(None)
        
        # Aumento de R$ 5,00 para R$ 10,00
        result = service._format_change_applied(5.00, 10.00, "absoluto")
        assert "+" in result, f"Deveria conter sinal positivo: {result}"
        
        # Aumento de 10%
        result = service._format_change_applied(10.00, 11.00, "percentual")
        assert "+" in result, f"Deveria conter sinal positivo: {result}"
    
    def test_simulate_price_change_impact_sign(self):
        """
        Testa se o impacto da simulação tem o sinal correto.
        Redução de preço deve gerar impacto NEGATIVO.
        """
        from backend.app.services.simulator_service import SimulatorService
        from backend.app.schemas.simulator import SimulationInput
        from unittest.mock import MagicMock, AsyncMock
        
        # Vamos testar diretamente a lógica matemática
        service = SimulatorService(None)
        
        # Teste 1: Verificar _calculate_new_price
        new_price = service._calculate_new_price(45.00, "absoluto", 1.00)
        assert new_price == 1.00
        
        # Teste 2: Verificar o sinal da diferença
        price_diff = new_price - 45.00
        assert price_diff < 0
        assert price_diff == -44.00
        
        # Teste 3: Verificar ingredient_impact_percent
        ingredient_impact_percent = (price_diff / 45.00 * 100)
        assert ingredient_impact_percent < 0
        assert abs(ingredient_impact_percent - (-97.78)) < 0.01
        
        # Teste 4: Verificar _format_change_applied para redução
        result = service._format_change_applied(45.00, 1.00, "absoluto")
        assert "-" in result
        print(f"\n[TEST] _format_change_applied(45.00, 1.00, 'absoluto') = {result}")
        
        # Teste 5: Simulação completa com mocks
        session = MagicMock()
        
        class FakeIngredient:
            id = 1
            nome = "Mussarela"
            custo = 45.00
            quantidade_referencia = 1.0
            tipo = "insumo"
        
        class FakeRecipe:
            id = 10
            nome = "Pizza de Mussarela"
            custo = 50.00
            id_produto_externo = "SKU-PIZZA-001"
            tipo = "receita"
            quantidade_base = 1.0
        
        ingredient = FakeIngredient()
        recipe = FakeRecipe()
        
        service = SimulatorService(session)
        service._get_ingredient = AsyncMock(return_value=ingredient)
        service._get_recipes_using_ingredient = AsyncMock(return_value=[recipe])
        service._recalculate_recipe_cost_with_new_ingredient_price = AsyncMock(return_value=6.00)
        service._get_monthly_sales_for_recipe = AsyncMock(return_value=100)  # 100 vendas
        service._calculate_store_ranking = AsyncMock(return_value=[])
        service._get_componentes_diretos = AsyncMock(return_value=[])
        
        import asyncio
        
        async def run_test():
            input_data = SimulationInput(
                type="price_change",
                ingredient_id=1,
                change_type="absoluto",
                change_value=1.00
            )
            return await service._simulate_price_change(input_data)
        
        result = asyncio.run(run_test())
        
        print(f"\n[TEST] Resultados para Mussarela R$ 45,00 -> R$ 1,00:")
        print(f"  total_network_impact: {result.total_network_impact}")
        print(f"  ingredient_impact: {result.ingredient_impact}")
        print(f"  ingredient_impact_percent: {result.ingredient_impact_percent}")
        print(f"  change_applied: {result.change_applied}")
        
        # Com 100 vendas e redução de custo, o impacto deve ser negativo
        assert result.total_network_impact < 0, \
            f"Com vendas, total_network_impact deve ser negativo: {result.total_network_impact}"
        assert result.ingredient_impact < 0
        assert result.ingredient_impact_percent < 0
        assert "-" in result.change_applied