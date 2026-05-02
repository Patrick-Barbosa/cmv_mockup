from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date
from calendar import monthrange
from typing import Optional, List, Dict, Any
from backend.app.database.models import Produto, ComponenteReceita, Venda
from backend.app.schemas.simulator import (
    SimulationInput, SimulationResponse, SimulationResult,
    StoreImpact, AffectedRecipePreview, ComponenteSimulacao
)
from fastapi import HTTPException


def round_value(value: float, decimals: int = 2) -> float:
    return round(value, decimals)


class SimulatorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_simulation(self, input_data: SimulationInput) -> SimulationResponse:
        if input_data.type == "price_change":
            return await self._simulate_price_change(input_data)
        elif input_data.type == "recipe_change":
            return await self._simulate_recipe_change(input_data)
        else:
            raise HTTPException(status_code=400, detail="Invalid simulation type")

    async def _simulate_price_change(self, input_data: SimulationInput) -> SimulationResponse:
        if not input_data.ingredient_id:
            raise HTTPException(status_code=400, detail="ingredient_id is required for price_change")

        ingredient = await self._get_ingredient(input_data.ingredient_id)
        if not ingredient:
            raise HTTPException(status_code=404, detail=f"Insumo com id={input_data.ingredient_id} não encontrado")

        current_price = ingredient.custo or 0
        new_price = self._calculate_new_price(current_price, input_data.change_type, input_data.change_value)

        affected_recipes = await self._get_recipes_using_ingredient(input_data.ingredient_id)

        results = []
        projection_month, projection_type = self._get_projection_months()

        for recipe in affected_recipes:
            current_cost = recipe.custo or 0
            new_cost = await self._recalculate_recipe_cost_with_new_ingredient_price(
                recipe.id, input_data.ingredient_id, new_price
            )

            cost_difference = new_cost - current_cost
            cost_percent = (cost_difference / current_cost * 100) if current_cost > 0 else 0

            monthly_sales = await self._get_monthly_sales_for_recipe(
                recipe.id_produto_externo, input_data.store_ids, projection_month
            )

            monthly_revenue_current = monthly_sales * current_cost
            monthly_revenue_new = monthly_sales * new_cost
            revenue_impact = monthly_revenue_new - monthly_revenue_current
            revenue_impact_percent = cost_percent

            results.append(SimulationResult(
                recipe_id=recipe.id,
                recipe_name=recipe.nome,
                current_cost=round_value(current_cost),
                new_cost=round_value(new_cost),
                cost_difference=round_value(cost_difference),
                cost_percent_change=round_value(cost_percent),
                monthly_sales_quantity=monthly_sales,
                monthly_revenue_current=round_value(monthly_revenue_current),
                monthly_revenue_new=round_value(monthly_revenue_new),
                revenue_impact=round_value(revenue_impact),
                revenue_impact_percent=round_value(revenue_impact_percent)
            ))

        total_impact = sum(r.revenue_impact for r in results)
        total_current = sum(r.monthly_revenue_current for r in results)
        total_new = sum(r.monthly_revenue_new for r in results)
        total_impact_percent = (total_impact / total_current * 100) if total_current > 0 else 0

        store_ranking = await self._calculate_store_ranking(results, input_data.store_ids)

        change_applied = self._format_change_applied(current_price, new_price, input_data.change_type)

        return SimulationResponse(
            simulation_type="price_change",
            ingredient_name=ingredient.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            results=results,
            store_ranking=store_ranking,
            projection_month=projection_month,
            projection_type=projection_type
        )

    async def _simulate_recipe_change(self, input_data: SimulationInput) -> SimulationResponse:
        if not input_data.recipe_id:
            raise HTTPException(status_code=400, detail="recipe_id is required for recipe_change")

        if not input_data.novos_componentes:
            raise HTTPException(status_code=400, detail="novos_componentes é obrigatório para recipe_change")

        recipe = await self._get_recipe(input_data.recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail=f"Receita com id={input_data.recipe_id} não encontrada")

        current_cost = recipe.custo or 0

        new_cost = await self._calculate_recipe_cost_from_components(input_data.novos_componentes)

        cost_difference = new_cost - current_cost
        cost_percent = (cost_difference / current_cost * 100) if current_cost > 0 else 0

        projection_month, projection_type = self._get_projection_months()

        monthly_sales = await self._get_monthly_sales_for_recipe(
            recipe.id_produto_externo, input_data.store_ids, projection_month
        )

        monthly_revenue_current = monthly_sales * current_cost
        monthly_revenue_new = monthly_sales * new_cost
        revenue_impact = monthly_revenue_new - monthly_revenue_current
        revenue_impact_percent = cost_percent

        result = SimulationResult(
            recipe_id=recipe.id,
            recipe_name=recipe.nome,
            current_cost=round_value(current_cost),
            new_cost=round_value(new_cost),
            cost_difference=round_value(cost_difference),
            cost_percent_change=round_value(cost_percent),
            monthly_sales_quantity=monthly_sales,
            monthly_revenue_current=round_value(monthly_revenue_current),
            monthly_revenue_new=round_value(monthly_revenue_new),
            revenue_impact=round_value(revenue_impact),
            revenue_impact_percent=round_value(revenue_impact_percent)
        )

        total_impact = revenue_impact
        total_current = monthly_revenue_current
        total_new = monthly_revenue_new
        total_impact_percent = cost_percent

        store_ranking = await self._calculate_store_ranking([result], input_data.store_ids)

        change_applied = f"Nova formulacao: {len(input_data.novos_componentes)} componentes"

        return SimulationResponse(
            simulation_type="recipe_change",
            recipe_name=recipe.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            results=[result],
            store_ranking=store_ranking,
            projection_month=projection_month,
            projection_type=projection_type
        )

    async def _get_ingredient(self, ingredient_id: int) -> Optional[Produto]:
        result = await self.session.execute(
            select(Produto).where(Produto.id == ingredient_id, Produto.tipo == 'insumo')
        )
        return result.scalar_one_or_none()

    async def _get_recipe(self, recipe_id: int) -> Optional[Produto]:
        result = await self.session.execute(
            select(Produto).where(Produto.id == recipe_id, Produto.tipo == 'receita')
        )
        return result.scalar_one_or_none()

    def _calculate_new_price(self, current_price: float, change_type: str, change_value: float) -> float:
        if change_type == "percentual":
            return current_price * (1 + change_value / 100)
        else:
            return change_value

    async def _get_recipes_using_ingredient(self, ingredient_id: int) -> List[Produto]:
        result = await self.session.execute(
            select(Produto)
            .join(ComponenteReceita, ComponenteReceita.id_receita == Produto.id)
            .where(ComponenteReceita.id_componente == ingredient_id)
            .where(Produto.tipo == 'receita')
            .distinct()
        )
        return list(result.scalars().all())

    async def _recalculate_recipe_cost_with_new_ingredient_price(self, recipe_id: int, ingredient_id: int, new_price: float) -> float:
        componentes = await self._get_componentes_diretos(recipe_id)
        total_cost = 0

        for comp in componentes:
            if comp['id_componente'] == ingredient_id:
                total_cost += new_price * comp['quantidade']
            else:
                total_cost += (comp['custo'] or 0) * comp['quantidade']

        return total_cost

    async def _get_componentes_diretos(self, receita_id: int) -> List[Dict[str, Any]]:
        result = await self.session.execute(
            select(
                ComponenteReceita.id_componente,
                ComponenteReceita.quantidade,
                Produto.custo
            )
            .join(Produto, Produto.id == ComponenteReceita.id_componente)
            .where(ComponenteReceita.id_receita == receita_id)
        )
        rows = result.all()
        return [
            {
                'id_componente': row.id_componente,
                'quantidade': row.quantidade,
                'custo': row.custo
            }
            for row in rows
        ]

    async def _calculate_recipe_cost_from_components(self, componentes: List[ComponenteSimulacao]) -> float:
        total_cost = 0
        for comp in componentes:
            result = await self.session.execute(
                select(Produto.custo).where(Produto.id == comp.id_componente)
            )
            custo = result.scalar_one_or_none() or 0
            total_cost += custo * comp.quantidade
        return total_cost

    def _get_projection_months(self) -> tuple:
        today = datetime.now()
        last_month = today.month - 1 if today.month > 1 else 12
        last_year = today.year if today.month > 1 else today.year - 1

        if today.day >= 15:
            return f"{today.year}-{today.month:02d}", "current_and_partial"
        else:
            return f"{last_year}-{last_month:02d}", "last_complete"

    async def _get_monthly_sales_for_recipe(self, id_produto_externo: Optional[str], store_ids: Optional[List[int]], month: str) -> float:
        if not id_produto_externo:
            return 0

        year, month_num = map(int, month.split('-'))
        _, last_day = monthrange(year, month_num)
        start_date = date(year, month_num, 1)
        end_date = date(year, month_num, last_day)

        query = select(func.sum(Venda.quantidade_produto)).where(
            Venda.id_produto == id_produto_externo,
            Venda.data >= start_date,
            Venda.data <= end_date
        )

        if store_ids:
            store_id_strings = [str(sid) for sid in store_ids]
            query = query.where(Venda.id_loja.in_(store_id_strings))

        result = await self.session.execute(query)
        total = result.scalar()
        return float(total or 0)

    async def _calculate_store_ranking(self, results: List[SimulationResult], filter_store_ids: Optional[List[int]]) -> List[StoreImpact]:
        if not results:
            return []

        projection_month, _ = self._get_projection_months()
        year, month_num = map(int, projection_month.split('-'))
        _, last_day = monthrange(year, month_num)
        start_date = date(year, month_num, 1)
        end_date = date(year, month_num, last_day)

        recipe_external_ids = {}
        for r in results:
            result = await self.session.execute(
                select(Produto.id_produto_externo).where(Produto.id == r.recipe_id)
            )
            ext_id = result.scalar_one_or_none()
            if ext_id:
                recipe_external_ids[r.recipe_id] = ext_id

        store_sales_query = select(
            Venda.id_loja,
            Venda.id_produto,
            func.sum(Venda.quantidade_produto).label('total_quantity')
        ).where(
            Venda.id_produto.in_(list(recipe_external_ids.values())),
            Venda.data >= start_date,
            Venda.data <= end_date
        )

        if filter_store_ids:
            store_id_strings = [str(sid) for sid in filter_store_ids]
            store_sales_query = store_sales_query.where(Venda.id_loja.in_(store_id_strings))

        store_sales_query = store_sales_query.group_by(Venda.id_loja, Venda.id_produto)
        result = await self.session.execute(store_sales_query)
        rows = result.all()

        store_data = {}
        for row in rows:
            store_id = str(row.id_loja)
            if store_id not in store_data:
                store_data[store_id] = {'current': 0, 'new': 0, 'recipes': set()}

            ext_id_to_recipe = {v: k for k, v in recipe_external_ids.items()}
            if row.id_produto in ext_id_to_recipe:
                recipe_id = ext_id_to_recipe[row.id_produto]
                recipe_result = next((r for r in results if r.recipe_id == recipe_id), None)
                if recipe_result:
                    store_data[store_id]['current'] += row.total_quantity * recipe_result.current_cost
                    store_data[store_id]['new'] += row.total_quantity * recipe_result.new_cost
                    store_data[store_id]['recipes'].add(recipe_id)

        store_ranking = []
        for store_id, data in store_data.items():
            total_impact = data['new'] - data['current']
            total_impact_percent = (total_impact / data['current'] * 100) if data['current'] > 0 else 0

            store_ranking.append(StoreImpact(
                store_id=store_id,
                total_current_cost=round_value(data['current']),
                total_new_cost=round_value(data['new']),
                total_impact=round_value(total_impact),
                total_impact_percent=round_value(total_impact_percent),
                affected_recipes_count=len(data['recipes'])
            ))

        store_ranking.sort(key=lambda x: x.total_impact, reverse=True)
        return store_ranking

    def _format_change_applied(self, old_price: float, new_price: float, change_type: str) -> str:
        diff = new_price - old_price
        diff_percent = (diff / old_price * 100) if old_price > 0 else 0

        if change_type == "percentual":
            sign = "+" if diff >= 0 else ""
            return f"{sign}{diff_percent:.1f}% ({old_price:.2f} -> {new_price:.2f})"
        else:
            sign = "+" if diff >= 0 else ""
            return f"{sign}R$ {abs(diff):.2f} ({old_price:.2f} -> {new_price:.2f})"

    async def get_affected_recipes(self, ingredient_id: int) -> List[AffectedRecipePreview]:
        ingredient = await self._get_ingredient(ingredient_id)
        if not ingredient:
            raise HTTPException(status_code=404, detail=f"Insumo com id={ingredient_id} não encontrado")

        recipes = await self._get_recipes_using_ingredient(ingredient_id)

        return [
            AffectedRecipePreview(
                recipe_id=r.id,
                recipe_name=r.nome,
                current_cost=r.custo or 0
            )
            for r in recipes
        ]

    async def get_stores(self) -> List[Dict[str, Any]]:
        result = await self.session.execute(
            select(Venda.id_loja).distinct()
        )
        return [{"store_id": str(row)} for row in result.scalars().all()]