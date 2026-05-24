from sqlalchemy import select, func, text, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date
from calendar import monthrange, day_abbr
from typing import Optional, List, Dict, Any
from backend.app.database.models import Produto, ComponenteReceita, Venda
from backend.app.schemas.simulator import (
    SimulationInput, SimulationResponse, SimulationResult, StoreImpact,
    StoreInfo, DailyEvolutionData, EvolutionSummary, SimulationEvolutionResponse,
    ComponenteSimulacao, AffectedRecipePreview, ProductInfoResponse
)
from backend.app.services.simulator_evolution import (
    build_store_chart_data, build_store_table_data, build_recipe_table_data
)
from backend.app.services.simulator_calculator import calculate_new_price, format_change_applied
from fastapi import HTTPException

def round_value(val: float, precision: int = 2) -> float:
    if val is None: return 0.0
    return round(float(val), precision)

def build_chart_data(results: List[SimulationResult]) -> List[Dict[str, Any]]:
    # Mock or simplified chart data if needed
    return []

def get_projection_months() -> tuple[str, str]:
    # Retorna o mês atual e o próximo para projeção
    now = datetime.now()
    curr = now.strftime("%Y-%m")
    
    if now.month == 12:
        nxt = f"{now.year + 1}-01"
    else:
        nxt = f"{now.year}-{now.month + 1:02d}"
    
    return curr, nxt

class SimulatorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_ingredient(self, ingredient_id: int) -> Optional[Produto]:
        result = await self.session.execute(select(Produto).where(Produto.id == ingredient_id, Produto.tipo == 'insumo'))
        return result.scalar_one_or_none()

    async def _get_recipe(self, recipe_id: int) -> Optional[Produto]:
        result = await self.session.execute(select(Produto).where(Produto.id == recipe_id, Produto.tipo == 'receita'))
        return result.scalar_one_or_none()

    async def _get_recipes_using_ingredient_direct(self, ingredient_id: int) -> List[Produto]:
        result = await self.session.execute(
            select(Produto)
            .join(ComponenteReceita, Produto.id == ComponenteReceita.id_receita)
            .where(ComponenteReceita.id_componente == ingredient_id, Produto.tipo == 'receita')
        )
        return list(result.scalars().all())

    async def _get_recipes_using_ingredient(self, ingredient_id: int) -> List[Produto]:
        """Busca todas as receitas que usam o insumo, direta ou indiretamente."""
        # 1. Buscar receitas diretas
        direct_recipes = await self._get_recipes_using_ingredient_direct(ingredient_id)
        all_affected = {r.id: r for r in direct_recipes}
        
        # 2. Buscar recursivamente receitas que usam as receitas já encontradas
        queue = [r.id for r in direct_recipes]
        while queue:
            current_id = queue.pop(0)
            parents = await self._get_all_recipes_using_component(current_id)
            for p in parents:
                if p.id not in all_affected:
                    all_affected[p.id] = p
                    queue.append(p.id)
                    
        return list(all_affected.values())

    async def _get_all_recipes_using_component(self, component_id: int) -> List[Produto]:
        result = await self.session.execute(
            select(Produto)
            .join(ComponenteReceita, Produto.id == ComponenteReceita.id_receita)
            .where(ComponenteReceita.id_componente == component_id)
        )
        return list(result.scalars().all())

    async def calculate_simulation(self, input_data: SimulationInput) -> SimulationResponse:
        projection_month, _ = get_projection_months()
        projection_type = "projetado" # ou "histórico"
        
        results = []
        
        if input_data.type == "price_change" and input_data.ingredient_id:
            return await self._simulate_price_change(input_data, projection_month, projection_type)
        elif input_data.type == "recipe_change" and input_data.recipe_id:
            return await self._simulate_recipe_change(input_data, projection_month, projection_type)
        else:
            raise HTTPException(status_code=400, detail="Tipo de simulação inválido ou IDs ausentes")

    async def _simulate_price_change(self, input_data: SimulationInput, projection_month: str, projection_type: str) -> SimulationResponse:
        ingredient = await self._get_ingredient(input_data.ingredient_id)
        if not ingredient:
            raise HTTPException(status_code=404, detail="Insumo não encontrado")

        current_price = ingredient.custo or 0
        new_price = calculate_new_price(current_price, input_data.change_type, input_data.change_value)
        
        # Receitas afetadas (direta e indiretamente)
        affected_recipes = await self._get_recipes_using_ingredient(input_data.ingredient_id)
        
        results = []
        for recipe in affected_recipes:
            current_cost = recipe.custo or 0
            
            # Buscar quantidade TOTAL de insumo (recursivamente em sub-receitas)
            ingredient_qty = await self._get_ingredient_total_quantity(
                recipe.id, input_data.ingredient_id
            )

            # Usar DELTA para evitar impactos fantasmas decorrentes de dessincronia no cache do banco
            cost_difference = (new_price - current_price) * ingredient_qty
            new_cost = current_cost + cost_difference
            
            cost_percent = (cost_difference / current_cost * 100) if current_cost > 0 else 0

            monthly_sales = await self._get_monthly_sales_for_recipe(
                recipe.id_produto_externo, input_data.store_ids, projection_month
            )

            current_sale_price = await self._get_product_sale_price(recipe)
            new_sale_price = current_sale_price

            monthly_revenue_current = monthly_sales * current_sale_price
            monthly_revenue_new = monthly_sales * new_sale_price
            revenue_impact = monthly_revenue_new - monthly_revenue_current
            revenue_impact_percent = (revenue_impact / monthly_revenue_current * 100) if monthly_revenue_current > 0 else 0

            current_cmv = (current_cost / current_sale_price * 100) if current_sale_price > 0 else 0
            new_cmv = (new_cost / new_sale_price * 100) if new_sale_price > 0 else 0
            cmv_diff = new_cmv - current_cmv

            results.append(SimulationResult(
                recipe_id=recipe.id,
                recipe_name=recipe.nome,
                current_cost=round_value(current_cost),
                new_cost=round_value(new_cost),
                cost_difference=round_value(cost_difference),
                cost_percent_change=round_value(cost_percent),
                ingredient_quantity=round_value(ingredient_qty, 3),
                monthly_sales_quantity=monthly_sales,
                monthly_revenue_current=round_value(monthly_revenue_current),
                monthly_revenue_new=round_value(monthly_revenue_new),
                revenue_impact=round_value(revenue_impact),
                revenue_impact_percent=round_value(revenue_impact_percent),
                current_cmv=round_value(current_cmv, 1),
                new_cmv=round_value(new_cmv, 1),
                cmv_diff=round_value(cmv_diff, 1)
            ))

        results.sort(key=lambda r: (0 if r.monthly_sales_quantity > 0 else 1, -abs(r.cmv_diff)))
        store_ranking = await self._calculate_store_ranking(results, input_data.store_ids)
        
        total_impact = sum(s.total_impact for s in store_ranking)
        total_current_revenue = sum(r.monthly_revenue_current for r in results)
        total_current_cost_of_sales = sum(r.monthly_sales_quantity * r.current_cost for r in results)
        total_new_cost_of_sales = sum(r.monthly_sales_quantity * r.new_cost for r in results)
        total_impact_percent = (total_impact / total_current_revenue * 100) if total_current_revenue > 0 else 0
        
        network_current_cmv = (total_current_cost_of_sales / total_current_revenue * 100) if total_current_revenue > 0 else 0
        network_new_cmv = (total_new_cost_of_sales / total_current_revenue * 100) if total_current_revenue > 0 else 0
        network_cmv_diff = network_new_cmv - network_current_cmv

        change_applied = format_change_applied(current_price, new_price, input_data.change_type)
        num_stores = len(store_ranking) if store_ranking else 1
        num_recipes = len(results) if results else 1
        
        price_diff = new_price - current_price
        quantidade_ref = ingredient.quantidade_referencia or 1

        # Impacto unitário: variação de custo médio por receita afetada (delta de custo total / nº de receitas)
        total_cost_delta = sum(r.cost_difference * r.monthly_sales_quantity for r in results)
        total_sales_qty = sum(r.monthly_sales_quantity for r in results)
        avg_cost_delta_per_unit = (total_cost_delta / total_sales_qty) if total_sales_qty > 0 else 0
        avg_cost_percent = (
            sum(r.cost_percent_change for r in results) / num_recipes
        ) if num_recipes > 0 else 0

        return SimulationResponse(
            simulation_type="price_change",
            ingredient_name=ingredient.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            avg_impact_per_store=round_value(total_impact / num_stores),
            avg_impact_per_store_percent=round_value(total_impact / num_stores / (sum(s.total_current_cost for s in store_ranking) / num_stores) * 100 if store_ranking else 0, 1),
            avg_impact_per_recipe=round_value(avg_cost_delta_per_unit),
            avg_impact_per_recipe_percent=round_value(avg_cost_percent, 1),
            ingredient_impact=round_value(price_diff * quantidade_ref),
            ingredient_impact_percent=round_value((price_diff / current_price * 100) if current_price > 0 else 0, 1),
            results=results,
            store_ranking=store_ranking,
            chart_data=None,
            store_chart_data=build_store_chart_data(store_ranking),
            store_table_data=build_store_table_data(store_ranking),
            recipe_table_data=build_recipe_table_data(results),
            projection_month=projection_month,
            projection_type=projection_type,
            current_cmv=round_value(network_current_cmv, 1),
            new_cmv=round_value(network_new_cmv, 1),
            cmv_diff=round_value(network_cmv_diff, 1)
        )

    async def _simulate_recipe_change(self, input_data: SimulationInput, projection_month: str, projection_type: str) -> SimulationResponse:
        recipe = await self._get_recipe(input_data.recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Receita não encontrada")

        has_components = input_data.novos_componentes is not None
        current_cost = await self._calculate_recipe_cost_from_db(recipe.id)
        new_cost = current_cost
        
        if has_components:
            new_cost = await self._calculate_recipe_cost_from_components(input_data.novos_componentes)
        
        cost_difference = new_cost - current_cost
        cost_percent = (cost_difference / current_cost * 100) if current_cost > 0 else 0

        monthly_sales = await self._get_monthly_sales_for_recipe(
            recipe.id_produto_externo, input_data.store_ids, projection_month
        )

        current_sale_price = await self._get_product_sale_price(recipe)
        new_sale_price = calculate_new_price(current_sale_price, input_data.change_type, input_data.change_value)
        
        monthly_revenue_current = monthly_sales * current_sale_price
        monthly_revenue_new = monthly_sales * new_sale_price
        revenue_impact = monthly_revenue_new - monthly_revenue_current
        revenue_impact_percent = (revenue_impact / monthly_revenue_current * 100) if monthly_revenue_current > 0 else 0

        current_cmv = (current_cost / current_sale_price * 100) if current_sale_price > 0 else 0
        new_cmv = (new_cost / new_sale_price * 100) if new_sale_price > 0 else 0
        cmv_diff = new_cmv - current_cmv

        main_result = SimulationResult(
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
            revenue_impact_percent=round_value(revenue_impact_percent),
            current_cmv=round_value(current_cmv, 1),
            new_cmv=round_value(new_cmv, 1),
            cmv_diff=round_value(cmv_diff, 1)
        )

        results = [main_result]

        # RECURSIVE IMPACT: Propagar para receitas PAI
        parent_recipes = await self._get_all_recipes_using_component(recipe.id)
        for parent in parent_recipes:
            if parent.id == recipe.id: continue
            
            p_current_cost = parent.custo or 0
            recipe_qty_in_parent = await self._get_ingredient_total_quantity(parent.id, recipe.id)
            
            p_cost_difference = cost_difference * recipe_qty_in_parent
            p_new_cost = p_current_cost + p_cost_difference
            p_cost_percent = (p_cost_difference / p_current_cost * 100) if p_current_cost > 0 else 0
            
            p_monthly_sales = await self._get_monthly_sales_for_recipe(
                parent.id_produto_externo, input_data.store_ids, projection_month
            )
            
            p_current_sale_price = await self._get_product_sale_price(parent)
            p_monthly_revenue_current = p_monthly_sales * p_current_sale_price
            p_monthly_revenue_new = p_monthly_sales * p_current_sale_price # Preço do pai não muda
            
            p_current_cmv = (p_current_cost / p_current_sale_price * 100) if p_current_sale_price > 0 else 0
            p_new_cmv = (p_new_cost / p_current_sale_price * 100) if p_current_sale_price > 0 else 0
            
            results.append(SimulationResult(
                recipe_id=parent.id,
                recipe_name=parent.nome,
                current_cost=round_value(p_current_cost),
                new_cost=round_value(p_new_cost),
                cost_difference=round_value(p_cost_difference),
                cost_percent_change=round_value(p_cost_percent),
                monthly_sales_quantity=p_monthly_sales,
                monthly_revenue_current=round_value(p_monthly_revenue_current),
                monthly_revenue_new=round_value(p_monthly_revenue_new),
                revenue_impact=0.0,
                revenue_impact_percent=0.0,
                current_cmv=round_value(p_current_cmv, 1),
                new_cmv=round_value(p_new_cmv, 1),
                cmv_diff=round_value(p_new_cmv - p_current_cmv, 1)
            ))

        store_ranking = await self._calculate_store_ranking(results, input_data.store_ids)
        total_impact = sum(s.total_impact for s in store_ranking)
        
        total_current_revenue = sum(r.monthly_revenue_current for r in results)
        total_current_cost_of_sales = sum(r.monthly_sales_quantity * r.current_cost for r in results)
        total_new_cost_of_sales = sum(r.monthly_sales_quantity * r.new_cost for r in results)
        total_impact_percent = (total_impact / total_current_revenue * 100) if total_current_revenue > 0 else 0

        network_current_cmv = (total_current_cost_of_sales / total_current_revenue * 100) if total_current_revenue > 0 else 0
        network_new_cmv = (total_new_cost_of_sales / (sum(r.monthly_revenue_new for r in results) or 1) * 100)
        
        change_applied = f"Nova formulacao" if has_components else format_change_applied(current_sale_price, new_sale_price, input_data.change_type)

        # Impacto unitário: variação de custo/preço da receita simulada por unidade vendida
        # Para recipe_change: cost_difference é o delta no custo unitário da receita principal
        # Para price_change de venda: revenue_impact / monthly_sales é o delta de receita por unidade
        recipe_cost_delta = cost_difference  # delta de custo unitário da receita principal
        recipe_price_delta = new_sale_price - current_sale_price  # delta de preço de venda unitário
        avg_unit_impact = recipe_cost_delta + recipe_price_delta
        # percentual: variação no custo unitário da receita (cost_percent)
        avg_unit_impact_percent = cost_percent

        return SimulationResponse(
            simulation_type="recipe_change",
            recipe_name=recipe.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            avg_impact_per_store=round_value(total_impact / (len(store_ranking) or 1)),
            avg_impact_per_store_percent=round_value(total_impact / (len(store_ranking) or 1) / (sum(s.total_current_cost for s in store_ranking) / (len(store_ranking) or 1)) * 100 if store_ranking else 0, 1),
            avg_impact_per_recipe=round_value(avg_unit_impact),
            avg_impact_per_recipe_percent=round_value(avg_unit_impact_percent, 1),
            ingredient_impact=round_value(cost_difference),
            ingredient_impact_percent=round_value(cost_percent, 1),
            results=results,
            store_ranking=store_ranking,
            chart_data=None,
            store_chart_data=build_store_chart_data(store_ranking),
            store_table_data=build_store_table_data(store_ranking),
            recipe_table_data=build_recipe_table_data(results),
            projection_month=projection_month,
            projection_type=projection_type,
            current_cmv=round_value(network_current_cmv, 1),
            new_cmv=round_value(network_new_cmv, 1),
            cmv_diff=round_value(network_new_cmv - network_current_cmv, 1)
        )

    async def get_simulated_costs_map(self, input_data: SimulationInput) -> Dict[int, Dict[str, float]]:
        costs_map = {}
        if input_data.type == "price_change":
            ingredient = await self._get_ingredient(input_data.ingredient_id)
            if not ingredient: return {}
            c_p = ingredient.custo or 0
            n_p = calculate_new_price(c_p, input_data.change_type, input_data.change_value)
            affected = await self._get_recipes_using_ingredient(input_data.ingredient_id)
            for r in affected:
                qty = await self._get_ingredient_total_quantity(r.id, input_data.ingredient_id)
                costs_map[r.id] = {
                    "current_cost": r.custo or 0,
                    "new_cost": (r.custo or 0) + (n_p - c_p) * qty,
                    "current_price": await self._get_product_sale_price(r),
                    "new_price": await self._get_product_sale_price(r)
                }
        elif input_data.type == "recipe_change":
            recipe = await self._get_recipe(input_data.recipe_id)
            if not recipe: return {}
            c_c = await self._calculate_recipe_cost_from_db(recipe.id)
            n_c = await self._calculate_recipe_cost_from_components(input_data.novos_componentes or [])
            c_s = await self._get_product_sale_price(recipe)
            n_s = calculate_new_price(c_s, input_data.change_type, input_data.change_value)
            costs_map[recipe.id] = {"current_cost": c_c, "new_cost": n_c, "current_price": c_s, "new_price": n_s}
            parents = await self._get_all_recipes_using_component(recipe.id)
            for p in parents:
                if p.id == recipe.id: continue
                qty = await self._get_ingredient_total_quantity(p.id, recipe.id)
                costs_map[p.id] = {
                    "current_cost": p.custo or 0,
                    "new_cost": (p.custo or 0) + (n_c - c_c) * qty,
                    "current_price": await self._get_product_sale_price(p),
                    "new_price": await self._get_product_sale_price(p)
                }
        return costs_map

    async def get_daily_evolution(self, input_data: SimulationInput, month: str, impacted_only: bool) -> SimulationEvolutionResponse:
        year, month_num = map(int, month.split('-'))
        _, last_day = monthrange(year, month_num)
        costs_map = await self.get_simulated_costs_map(input_data)
        affected_rids = set(costs_map.keys())
        
        # Obter IDs externos das afetadas
        recipe_ext_ids = {}
        if affected_rids:
            res = await self.session.execute(select(Produto.id, Produto.id_produto_externo).where(Produto.id.in_(list(affected_rids))))
            recipe_ext_ids = {row.id_produto_externo: row.id for row in res.all() if row.id_produto_externo}

        # Obter custos de TODAS as receitas se impacted_only=false
        all_costs = {}
        if not impacted_only:
            res = await self.session.execute(select(Produto.id_produto_externo, Produto.custo).where(Produto.tipo == 'receita'))
            all_costs = {row.id_produto_externo: (row.custo or 0.0) for row in res.all() if row.id_produto_externo}

        start_date, end_date = date(year, month_num, 1), date(year, month_num, last_day)
        sales_query = select(Venda.data, Venda.id_produto, func.sum(Venda.quantidade_produto).label('q'), func.sum(Venda.valor_total).label('r')).where(Venda.data >= start_date, Venda.data <= end_date)
        if input_data.store_ids: sales_query = sales_query.where(Venda.id_loja.in_(input_data.store_ids))
        if impacted_only: sales_query = sales_query.where(Venda.id_produto.in_(list(recipe_ext_ids.keys())))
        sales_query = sales_query.group_by(Venda.data, Venda.id_produto)
        
        result = await self.session.execute(sales_query)
        daily_agg = {}
        for row in result.all():
            d = row.data.day
            if d not in daily_agg: daily_agg[d] = {"cc": 0, "nc": 0, "cr": 0, "nr": 0, "q": 0}
            qty, rev, ext_id = float(row.q or 0), float(row.r or 0), row.id_produto
            daily_agg[d]["cr"] += rev
            daily_agg[d]["q"] += qty
            if ext_id in recipe_ext_ids:
                sim = costs_map[recipe_ext_ids[ext_id]]
                daily_agg[d]["cc"] += qty * sim["current_cost"]
                daily_agg[d]["nc"] += qty * sim["new_cost"]
                daily_agg[d]["nr"] += rev * (sim["new_price"] / sim["current_price"]) if sim["current_price"] > 0 else rev
            elif not impacted_only and ext_id in all_costs:
                c = all_costs[ext_id]
                daily_agg[d]["cc"] += qty * c
                daily_agg[d]["nc"] += qty * c
                daily_agg[d]["nr"] += rev

        ingredient_name = None
        recipe_name = None
        if input_data.type == "price_change" and input_data.ingredient_id:
            ingredient = await self._get_ingredient(input_data.ingredient_id)
            if ingredient:
                ingredient_name = ingredient.nome
        elif input_data.type == "recipe_change" and input_data.recipe_id:
            recipe = await self._get_recipe(input_data.recipe_id)
            if recipe:
                recipe_name = recipe.nome

        WEEKDAYS_PT = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
        daily_data = []
        for d in range(1, last_day + 1):
            agg = daily_agg.get(d, {"cc": 0, "nc": 0, "cr": 0, "nr": 0, "q": 0})
            dt = date(year, month_num, d)
            day_of_week = WEEKDAYS_PT[dt.weekday()]
            
            q_val = agg["q"]
            c_c_tot = round_value(agg["cc"])
            n_c_tot = round_value(agg["nc"])
            
            daily_data.append(DailyEvolutionData(
                date=f"{year}-{month_num:02d}-{d:02d}",
                store_id=None,
                day_of_week=day_of_week,
                current_cost_total=c_c_tot,
                new_cost_total=n_c_tot,
                current_cost_avg_per_recipe=round_value(c_c_tot / q_val) if q_val > 0 else 0.0,
                new_cost_avg_per_recipe=round_value(n_c_tot / q_val) if q_val > 0 else 0.0,
                sales_quantity=round_value(q_val),
                sales_revenue=round_value(agg["cr"])
            ))

        total_current_cost = sum(x.current_cost_total for x in daily_data)
        total_new_cost = sum(x.new_cost_total for x in daily_data)
        total_impact = total_new_cost - total_current_cost
        total_revenue = sum(x.sales_revenue for x in daily_data)
        total_impact_percent = (total_impact / total_revenue * 100) if total_revenue > 0 else 0.0
        total_sales = sum(x.sales_quantity for x in daily_data)
        
        summary = EvolutionSummary(
            total_days=last_day,
            total_current_cost=round_value(total_current_cost),
            total_new_cost=round_value(total_new_cost),
            total_impact=round_value(total_impact),
            total_impact_percent=round_value(total_impact_percent, 2),
            avg_daily_sales=round_value(total_sales / last_day),
            avg_daily_revenue=round_value(total_revenue / last_day)
        )
            
        return SimulationEvolutionResponse(
            month=month,
            type=input_data.type,
            ingredient_name=ingredient_name,
            recipe_name=recipe_name,
            daily_data=daily_data,
            summary=summary
        )

    async def _calculate_store_ranking(self, results: List[SimulationResult], filter_store_ids: Optional[List[str]]) -> List[StoreImpact]:
        if not results: return []
        projection_month, _ = get_projection_months()
        year, month_num = map(int, projection_month.split('-'))
        _, last_day = monthrange(year, month_num)
        start_date, end_date = date(year, month_num, 1), date(year, month_num, last_day)

        recipe_ext_ids = {}
        for r in results:
            res = await self.session.execute(select(Produto.id_produto_externo).where(Produto.id == r.recipe_id))
            ext_id = res.scalar_one_or_none()
            if ext_id: recipe_ext_ids[r.recipe_id] = ext_id

        query = select(Venda.id_loja, Venda.id_produto, func.sum(Venda.quantidade_produto).label('q'), func.sum(Venda.valor_total).label('r')).where(Venda.id_produto.in_(list(recipe_ext_ids.values())), Venda.data >= start_date, Venda.data <= end_date)
        if filter_store_ids: query = query.where(Venda.id_loja.in_(filter_store_ids))
        query = query.group_by(Venda.id_loja, Venda.id_produto)
        result = await self.session.execute(query)
        
        store_data = {}
        ext_to_rid = {v: k for k, v in recipe_ext_ids.items()}
        for row in result.all():
            sid = str(row.id_loja)
            if sid not in store_data: store_data[sid] = {'cc': 0, 'nc': 0, 'cr': 0, 'nr': 0, 'recipes': set(), 'qty': 0}
            rid = ext_to_rid.get(row.id_produto)
            r_res = next((r for r in results if r.recipe_id == rid), None)
            if r_res:
                q, r_val = float(row.q or 0), float(row.r or 0)
                store_data[sid]['cc'] += q * r_res.current_cost
                store_data[sid]['nc'] += q * r_res.new_cost
                store_data[sid]['cr'] += r_val
                store_data[sid]['nr'] += q * (r_res.monthly_revenue_new / r_res.monthly_sales_quantity) if r_res.monthly_sales_quantity > 0 else r_val
                store_data[sid]['recipes'].add(rid)
                store_data[sid]['qty'] += q

        ranking = []
        for sid, d in store_data.items():
            impact = (d['nr'] - d['cr']) - (d['nc'] - d['cc'])
            c_cmv = (d['cc'] / d['cr'] * 100) if d['cr'] > 0 else 0
            n_cmv = (d['nc'] / d['nr'] * 100) if d['nr'] > 0 else 0
            ranking.append(StoreImpact(store_id=sid, total_current_cost=round_value(d['cc']), total_new_cost=round_value(d['nc']), total_impact=round_value(impact), total_impact_percent=round_value(impact / d['cr'] * 100 if d['cr'] > 0 else 0), affected_recipes_count=len(d['recipes']), monthly_sales_quantity=int(d['qty']), current_cmv=round_value(c_cmv, 1), new_cmv=round_value(n_cmv, 1), cmv_diff=round_value(n_cmv - c_cmv, 1)))
        return sorted(ranking, key=lambda x: x.total_impact)

    async def _get_ingredient_total_quantity(self, recipe_id: int, ingredient_id: int, visited: Optional[set] = None) -> float:
        if visited is None: visited = set()
        if recipe_id in visited: return 0.0
        visited.add(recipe_id)
        comps = await self._get_componentes_diretos(recipe_id)
        total = 0.0
        for c in comps:
            if c['id_componente'] == ingredient_id: total += c['quantidade']
            else:
                res = await self.session.execute(select(Produto.tipo).where(Produto.id == c['id_componente']))
                if res.scalar_one_or_none() == 'receita':
                    total += (await self._get_ingredient_total_quantity(c['id_componente'], ingredient_id, visited.copy())) * c['quantidade']
        return total

    async def _get_componentes_diretos(self, recipe_id: int) -> List[Dict[str, Any]]:
        res = await self.session.execute(select(ComponenteReceita.id_componente, ComponenteReceita.quantidade, Produto.custo).join(Produto, Produto.id == ComponenteReceita.id_componente).where(ComponenteReceita.id_receita == recipe_id))
        return [{'id_componente': r.id_componente, 'quantidade': r.quantidade, 'custo': r.custo} for r in res.all()]

    async def _calculate_recipe_cost_from_components(self, componentes: List[ComponenteSimulacao]) -> float:
        total = 0.0
        for c in componentes:
            cost = 0.0
            if c.sub_componentes: cost = await self._calculate_recipe_cost_from_components(c.sub_componentes)
            else: cost = (await self.session.execute(select(Produto.custo).where(Produto.id == c.id_componente))).scalar_one_or_none() or 0.0
            total += round(cost * c.quantidade, 4)
        return round(total, 4)

    async def _calculate_recipe_cost_from_db(self, recipe_id: int) -> float:
        comps = await self._get_componentes_diretos(recipe_id)
        return round(sum(round((c['custo'] or 0.0) * c['quantidade'], 4) for c in comps), 4)

    async def _get_monthly_sales_for_recipe(self, ext_id: Optional[str], store_ids: Optional[List[str]], month: str) -> float:
        if not ext_id: return 0
        y, m = map(int, month.split('-'))
        _, last = monthrange(y, m)
        q = select(func.sum(Venda.quantidade_produto)).where(Venda.id_produto == ext_id, Venda.data >= date(y, m, 1), Venda.data <= date(y, m, last))
        if store_ids: q = q.where(Venda.id_loja.in_(store_ids))
        return float((await self.session.execute(q)).scalar() or 0)

    async def _get_product_sale_price(self, p: Produto) -> float:
        if p.preco_venda and p.preco_venda > 0: return float(p.preco_venda)
        res = await self.session.execute(select(func.avg(Venda.valor_total / Venda.quantidade_produto)).where(Venda.id_produto == p.id_produto_externo, Venda.quantidade_produto > 0))
        return float(res.scalar() or 0)

    async def get_product_info(self, product_id: int) -> ProductInfoResponse:
        p = await self.session.get(Produto, product_id)
        if not p:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
        # Determine price and source
        if p.preco_venda and p.preco_venda > 0:
            price = float(p.preco_venda)
            source = "preco_cadastrado"
        else:
            res = await self.session.execute(
                select(func.avg(Venda.valor_total / Venda.quantidade_produto))
                .where(Venda.id_produto == p.id_produto_externo, Venda.quantidade_produto > 0)
            )
            price_val = res.scalar()
            if price_val is not None and price_val > 0:
                price = float(price_val)
                source = "preco_medio_vendas"
            else:
                price = None
                source = "indisponivel"
        
        return ProductInfoResponse(
            product_id=p.id,
            product_name=p.nome,
            product_type=p.tipo,
            preco_venda=price,
            custo_atual=p.custo or 0.0,
            unidade_medida=p.unidade,
            source=source,
            is_vendido=price is not None and price > 0
        )

    async def get_stores(self) -> List[StoreInfo]:
        res = await self.session.execute(select(Venda.id_loja).distinct())
        return [StoreInfo(store_id=row.id_loja) for row in res.all()]

    async def get_affected_recipes(self, ingredient_id: int) -> List[AffectedRecipePreview]:
        recipes = await self._get_recipes_using_ingredient(ingredient_id)
        return [AffectedRecipePreview(recipe_id=r.id, recipe_name=r.nome, current_cost=r.custo or 0.0) for r in recipes]
