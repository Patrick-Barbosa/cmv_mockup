from datetime import datetime
from typing import Optional, List

from backend.app.services.simulator_calculator import round_value
from backend.app.schemas.simulator import (
    DailyEvolutionData, SimulationResult, StoreImpact,
    ChartData, DayData, StoreChartItem, StoreTableItem, RecipeTableItem
)


def get_projection_months() -> tuple:
    today = datetime.now()
    last_month = today.month - 1 if today.month > 1 else 12
    last_year = today.year if today.month > 1 else today.year - 1

    if today.day >= 15:
        return f"{today.year}-{today.month:02d}", "current_and_partial"
    return f"{last_year}-{last_month:02d}", "last_complete"


def build_chart_data(daily_data: List[DailyEvolutionData]) -> ChartData:
    days = []
    for dd in daily_data:
        if dd.store_id is None:
            days.append(DayData(
                day=dd.date,
                current=round_value(dd.current_cost_total),
                new=round_value(dd.new_cost_total)
            ))
    return ChartData(daily=days)


def build_store_chart_data(store_ranking: List[StoreImpact]) -> List[StoreChartItem]:
    return [
        StoreChartItem(
            store_id=s.store_id,
            cmv_atual=round_value(s.current_cmv, 1),
            cmv_simulado=round_value(s.new_cmv, 1),
            impacto_r$=round_value(s.total_impact),
            impacto_%=round_value(s.total_impact_percent),
            variacao_pp=round_value(s.cmv_diff, 1)
        )
        for s in store_ranking
    ]


def build_store_table_data(store_ranking: List[StoreImpact]) -> List[StoreTableItem]:
    return [
        StoreTableItem(
            store_id=s.store_id,
            total_current_cost=s.total_current_cost,
            total_new_cost=s.total_new_cost,
            total_impact=s.total_impact,
            total_impact_percent=s.total_impact_percent,
            affected_recipes_count=s.affected_recipes_count,
            monthly_sales_quantity=s.monthly_sales_quantity,
            ingredient_quantity=s.ingredient_quantity,
            gross_margin=s.gross_margin,
            gross_margin_new=s.gross_margin_new,
            current_cmv=s.current_cmv,
            new_cmv=s.new_cmv,
            cmv_diff=s.cmv_diff,
            revenue_current=round_value(s.total_current_cost / (s.current_cmv / 100)) if s.current_cmv > 0 else 0,
            revenue_simulated=round_value(s.total_new_cost / (s.new_cmv / 100)) if s.new_cmv > 0 else 0
        )
        for s in store_ranking
    ]


def build_recipe_table_data(results: List[SimulationResult]) -> List[RecipeTableItem]:
    return [
        RecipeTableItem(
            recipe_id=r.recipe_id,
            recipe_name=r.recipe_name,
            current_cost=r.current_cost,
            new_cost=r.new_cost,
            cost_difference=r.cost_difference,
            cost_percent_change=r.cost_percent_change,
            monthly_sales_quantity=r.monthly_sales_quantity,
            monthly_revenue_current=r.monthly_revenue_current,
            monthly_revenue_new=r.monthly_revenue_new,
            revenue_impact=r.revenue_impact,
            revenue_impact_percent=r.revenue_impact_percent,
            current_cmv=r.current_cmv,
            new_cmv=r.new_cmv,
            cmv_diff=r.cmv_diff,
            cmv_atual_rs=round_value(r.monthly_sales_quantity * r.current_cost),
            cmv_simulado_rs=round_value(r.monthly_sales_quantity * r.new_cost),
            dif_custo_rs=round_value(r.monthly_sales_quantity * r.cost_difference)
        )
        for r in results
    ]
