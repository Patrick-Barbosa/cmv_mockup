
import asyncio
from unittest.mock import AsyncMock, MagicMock
import sys
import os

# Adicionar o diretório raiz ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.services.simulator_service import SimulatorService
from backend.app.database.models import Produto

async def test_evolution_cost_not_affected_by_sale_price_change():
    session = AsyncMock()
    service = SimulatorService(session)
    
    # Mocking _get_recipe
    recipe = MagicMock(spec=Produto)
    recipe.id = 1
    recipe.nome = "Receita Teste"
    recipe.custo = 10.0
    recipe.id_produto_externo = "EXT1"
    recipe.tipo = "receita"
    recipe.preco_venda = 20.0
    
    service._get_recipe = AsyncMock(return_value=recipe)
    service._get_product_sale_price = AsyncMock(return_value=20.0)
    
    # Mocking database calls within get_daily_evolution
    all_recipes_mock = MagicMock()
    all_recipes_mock.scalars.return_value.all.return_value = [recipe]
    
    # Para testar realmente, precisamos de vendas.
    sales_mock = MagicMock()
    sales_mock.all.return_value = [
        MagicMock(id_produto="EXT1", id_loja="L1", quantity=1, revenue=20.0)
    ]
    
    # Mocking the database session execute calls
    # Call 1: all_recipes_result (line 702 in original, now shifted)
    # Call 2: all_recipes_result (line 711 in original, now shifted)
    # Call 3+: daily sales query for 31 days
    session.execute = AsyncMock(side_effect=[
        all_recipes_mock, # all_recipes_result (affected)
        all_recipes_mock, # all_recipes_result (all)
        sales_mock,       # day 1 sales
    ] + [MagicMock(all=lambda: []) for _ in range(30)])
    
    month = "2026-04"
    
    print("Testing recipe_change with sale price change (change_value=50)...")
    result = await service.get_daily_evolution(
        month=month,
        type="recipe_change",
        recipe_id=1,
        change_type="absoluto",
        change_value=50.0 # Alterando preço de venda para 50.0
    )
    
    # Day 1 has 1 sale. 
    # Current cost: 10.0 * 1 = 10.0
    # Expected New cost: 10.0 * 1 = 10.0 (since new_cost was NOT provided)
    
    day1_data = [d for d in result.daily_data if d.date == "2026-04-01" and d.store_id is None][0]
    print(f"Day 1 Current Cost: {day1_data.current_cost_total}")
    print(f"Day 1 New Cost: {day1_data.new_cost_total}")
    
    assert day1_data.current_cost_total == 10.0
    assert day1_data.new_cost_total == 10.0, f"FAILED: New cost ({day1_data.new_cost_total}) changed when only sale price was updated!"
    print("SUCCESS: New cost remained stable.")

    # Test Case 2: recipe_change with EXPLICIT new_cost
    print("\nTesting recipe_change with explicit new_cost=15.0...")
    session.execute = AsyncMock(side_effect=[
        all_recipes_mock,
        all_recipes_mock,
        sales_mock,
    ] + [MagicMock(all=lambda: []) for _ in range(30)])
    
    result_with_new_cost = await service.get_daily_evolution(
        month=month,
        type="recipe_change",
        recipe_id=1,
        change_type="absoluto",
        change_value=50.0,
        new_cost=15.0 # Novo custo explicitamente fornecido
    )
    
    day1_data_nc = [d for d in result_with_new_cost.daily_data if d.date == "2026-04-01" and d.store_id is None][0]
    print(f"Day 1 Current Cost: {day1_data_nc.current_cost_total}")
    print(f"Day 1 New Cost: {day1_data_nc.new_cost_total}")
    
    assert day1_data_nc.current_cost_total == 10.0
    assert day1_data_nc.new_cost_total == 15.0, f"FAILED: New cost ({day1_data_nc.new_cost_total}) did not reflect explicit new_cost!"
    print("SUCCESS: New cost reflected explicit new_cost.")

if __name__ == "__main__":
    try:
        asyncio.run(test_evolution_cost_not_affected_by_sale_price_change())
        print("\nAll tests PASSED.")
    except AssertionError as e:
        print(f"\nTest FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
