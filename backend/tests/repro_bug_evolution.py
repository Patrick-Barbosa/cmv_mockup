
import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.app.services.simulator_service import SimulatorService
from backend.app.database.models import Produto

@pytest.mark.asyncio
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
    
    service._get_recipe = AsyncMock(return_value=recipe)
    
    # Mocking database calls within get_daily_evolution
    # 1. all_recipes_result
    all_recipes_mock = MagicMock()
    all_recipes_mock.scalars.return_value.all.return_value = [recipe]
    session.execute = AsyncMock(side_effect=[
        MagicMock(scalar_one_or_none=lambda: 'receita'), # comp_tipo result if needed, but here we mock higher level
        all_recipes_mock, # all_recipes_result (line 688)
        all_recipes_mock, # all_recipes_result (line 697)
    ] + [MagicMock(all=lambda: []) for _ in range(31)]) # Mocking daily sales query for 31 days
    
    # Se chamarmos get_daily_evolution com type="recipe_change" e change_value=50.0 (novo preço de venda)
    # Atualmente o código usa change_value como novo custo!
    
    month = "2026-04"
    result = await service.get_daily_evolution(
        month=month,
        type="recipe_change",
        recipe_id=1,
        change_type="absoluto",
        change_value=50.0 # Alterando preço de venda para 50.0
    )
    
    # O custo atual é 10.0. 
    # Se o bug persistir, o new_cost_total ou new_cost_avg_per_recipe será baseado em 50.0.
    # Mas deveria permanecer baseado em 10.0.
    
    print(f"Current cost in summary: {result.summary.total_current_cost}")
    print(f"New cost in summary: {result.summary.total_new_cost}")
    
    # No bug atual, se houver vendas, o total_new_cost seria diferente.
    # Como mockamos vendas como vazio, vamos olhar para o `new_recipe_cost` interno.
    
    # Para testar realmente, precisamos de vendas.
    sales_mock = MagicMock()
    sales_mock.all.return_value = [
        MagicMock(id_produto="EXT1", id_loja="L1", quantity=1, revenue=50.0)
    ]
    
    session.execute = AsyncMock(side_effect=[
        all_recipes_mock, # line 688
        all_recipes_mock, # line 697
        sales_mock,       # day 1 sales
    ] + [MagicMock(all=lambda: []) for _ in range(30)])
    
    result_with_sales = await service.get_daily_evolution(
        month=month,
        type="recipe_change",
        recipe_id=1,
        change_type="absoluto",
        change_value=50.0
    )
    
    # Day 1 has 1 sale. 
    # Current cost: 10.0 * 1 = 10.0
    # Expected New cost: 10.0 * 1 = 10.0 (since only sale price changed)
    # Actual (buggy) New cost: 50.0 * 1 = 50.0
    
    day1_data = [d for d in result_with_sales.daily_data if d.date == "2026-04-01" and d.store_id is None][0]
    print(f"Day 1 Current Cost: {day1_data.current_cost_total}")
    print(f"Day 1 New Cost: {day1_data.new_cost_total}")
    
    assert day1_data.current_cost_total == 10.0
    assert day1_data.new_cost_total == 10.0, f"Bug: New cost ({day1_data.new_cost_total}) changed when only sale price was updated!"

if __name__ == "__main__":
    import asyncio
    try:
        asyncio.run(test_evolution_cost_not_affected_by_sale_price_change())
        print("Test PASSED (No bug detected or already fixed)")
    except AssertionError as e:
        print(f"Test FAILED: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
