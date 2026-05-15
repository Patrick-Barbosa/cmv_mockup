from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date
from calendar import monthrange, day_abbr
from typing import Optional, List, Dict, Any
from backend.app.database.models import Produto, ComponenteReceita, Venda
from backend.app.database.session import DB_SCHEMA
from backend.app.schemas.simulator import (
    SimulationInput, SimulationResponse, SimulationResult,
    StoreImpact, AffectedRecipePreview, ComponenteSimulacao,
    DailyEvolutionData, EvolutionSummary, SimulationEvolutionResponse,
    ProductInfoResponse, CalculateCostOutput, ComponentCostDetail
)
from backend.app.services.simulator_calculator import round_value, calculate_new_price, format_change_applied
from backend.app.services.simulator_evolution import (
    get_projection_months, build_chart_data, build_store_chart_data,
    build_store_table_data, build_recipe_table_data
)
from fastapi import HTTPException


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
        new_price = calculate_new_price(current_price, input_data.change_type, input_data.change_value)

        affected_recipes = await self._get_recipes_using_ingredient(input_data.ingredient_id)

        results = []
        projection_month, projection_type = get_projection_months()

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

            # Calcular faturamento usando PREÇO DE VENDA (not custo de produção)
            # Para simulação de insumo, o preço de venda NÃO muda, apenas o custo de produção muda
            current_sale_price = await self._get_product_sale_price(recipe)
            new_sale_price = current_sale_price  # Preço de venda permanece o mesmo

            monthly_revenue_current = monthly_sales * current_sale_price
            monthly_revenue_new = monthly_sales * new_sale_price
            revenue_impact = monthly_revenue_new - monthly_revenue_current  # Será 0 para price_change
            revenue_impact_percent = (revenue_impact / monthly_revenue_current * 100) if monthly_revenue_current > 0 else 0

            # Cálculos de CMV (Custo / Faturamento * 100)
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

        # Ordenar: quem tem venda (impacto real) primeiro, depois por cmv_diff decrescente
        results.sort(key=lambda r: (
            0 if r.monthly_sales_quantity > 0 else 1,
            -abs(r.cmv_diff)
        ))

        # Ranking de lojas para calcular impactos reais
        store_ranking = await self._calculate_store_ranking(results, input_data.store_ids)

        # O impacto total da rede é a soma dos impactos das lojas (Net Impact: Rev - Cost)
        total_impact = sum(s.total_impact for s in store_ranking)
        total_current_revenue = sum(r.monthly_revenue_current for r in results)
        total_current_cost = sum(r.monthly_sales_quantity * r.current_cost for r in results)
        total_new_cost = sum(r.monthly_sales_quantity * r.new_cost for r in results)
        total_new_revenue = sum(r.monthly_revenue_new for r in results)
        
        total_impact_percent = (total_impact / total_current_revenue * 100) if total_current_revenue > 0 else 0
        
        # CMV da rede (para as receitas afetadas)
        network_current_cmv = (total_current_cost / total_current_revenue * 100) if total_current_revenue > 0 else 0
        network_new_cmv = (total_new_cost / total_new_revenue * 100) if total_new_revenue > 0 else 0
        network_cmv_diff = network_new_cmv - network_current_cmv

        change_applied = format_change_applied(current_price, new_price, input_data.change_type)

        num_stores = len(store_ranking) if store_ranking else 1
        num_recipes = len(results) if results else 1
        avg_impact_per_store = total_impact / num_stores
        avg_impact_per_store_percent = total_impact_percent
        avg_impact_per_recipe = total_impact / num_recipes
        avg_impact_per_recipe_percent = total_impact_percent

        price_diff = new_price - current_price
        quantidade_ref = ingredient.quantidade_referencia or 1
        ingredient_impact = price_diff * quantidade_ref
        ingredient_impact_percent = (price_diff / current_price * 100) if current_price > 0 else 0

        return SimulationResponse(
            simulation_type="price_change",
            ingredient_name=ingredient.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            avg_impact_per_store=round_value(avg_impact_per_store),
            avg_impact_per_store_percent=round_value(avg_impact_per_store_percent, 1),
            avg_impact_per_recipe=round_value(avg_impact_per_recipe),
            avg_impact_per_recipe_percent=round_value(avg_impact_per_recipe_percent, 1),
            ingredient_impact=round_value(ingredient_impact),
            ingredient_impact_percent=round_value(ingredient_impact_percent, 1),
            results=results,
            store_ranking=store_ranking,
            chart_data=build_chart_data([]),
            store_chart_data=build_store_chart_data(store_ranking),
            store_table_data=build_store_table_data(store_ranking),
            recipe_table_data=build_recipe_table_data(results),
            projection_month=projection_month,
            projection_type=projection_type,
            current_cmv=round_value(network_current_cmv, 1),
            new_cmv=round_value(network_new_cmv, 1),
            cmv_diff=round_value(network_cmv_diff, 1)
        )

    async def _simulate_recipe_change(self, input_data: SimulationInput) -> SimulationResponse:
        if not input_data.recipe_id:
            raise HTTPException(status_code=400, detail="recipe_id is required for recipe_change")

        # Se novos_componentes está vazio, é apenas mudança de preço de venda
        # Se tem componentes, é mudança de composição
        has_components = input_data.novos_componentes is not None and len(input_data.novos_componentes) > 0

        recipe = await self._get_recipe(input_data.recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail=f"Receita com id={input_data.recipe_id} não encontrada")

        current_cost = recipe.custo or 0

        # Se há componentes, calcula novo custo. 
        # Para evitar impacto fantasma, calculamos o delta entre composição nova e composição atual no DB
        if has_components:
            # Buscar componentes atuais no DB para comparação
            current_components_db = await self._get_componentes_diretos(recipe.id)
            
            if self._check_if_composition_is_same(input_data.novos_componentes, current_components_db):
                # Se a composição é a mesma, forçamos o delta de custo para zero para evitar flutuações de centavos
                # ou discrepâncias entre a coluna 'custo' e o somatório dos componentes
                cost_difference = 0.0
                new_cost = current_cost
            else:
                new_calculated_cost = await self._calculate_recipe_cost_from_components(input_data.novos_componentes)
                current_calculated_cost = await self._calculate_recipe_cost_from_db(recipe.id)
                
                cost_difference = new_calculated_cost - current_calculated_cost
                new_cost = current_cost + cost_difference
        else:
            new_cost = current_cost
            cost_difference = 0

        cost_percent = (cost_difference / current_cost * 100) if current_cost > 0 else 0

        projection_month, projection_type = get_projection_months()

        monthly_sales = await self._get_monthly_sales_for_recipe(
            recipe.id_produto_externo, input_data.store_ids, projection_month
        )

        # Buscar preço de venda atual da receita
        current_sale_price = await self._get_product_sale_price(recipe)
        
        # O change_value para recipe_change é aplicado ao preço de venda
        new_sale_price = calculate_new_price(current_sale_price, input_data.change_type, input_data.change_value)

        # Calcular faturamento usando PREÇO DE VENDA (não custo de produção)
        monthly_revenue_current = monthly_sales * current_sale_price
        monthly_revenue_new = monthly_sales * new_sale_price
        revenue_impact = monthly_revenue_new - monthly_revenue_current
        revenue_impact_percent = (revenue_impact / monthly_revenue_current * 100) if monthly_revenue_current > 0 else 0

        # Cálculos de CMV (Custo / Faturamento * 100)
        current_cmv = (current_cost / current_sale_price * 100) if current_sale_price > 0 else 0
        new_cmv = (new_cost / new_sale_price * 100) if new_sale_price > 0 else 0
        cmv_diff = new_cmv - current_cmv

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
            revenue_impact_percent=round_value(revenue_impact_percent),
            current_cmv=round_value(current_cmv, 1),
            new_cmv=round_value(new_cmv, 1),
            cmv_diff=round_value(cmv_diff, 1)
        )

        # Ranking de lojas para calcular impactos reais (Net Impact: Rev - Cost)
        store_ranking = await self._calculate_store_ranking([result], input_data.store_ids)
        
        # Impacto Total da rede é a soma dos impactos das lojas
        total_impact = sum(s.total_impact for s in store_ranking)
        total_current_revenue = monthly_revenue_current
        total_new_revenue = monthly_revenue_new
        
        total_impact_percent = (total_impact / total_current_revenue * 100) if total_current_revenue > 0 else 0

        # CMV da rede
        network_current_cmv = current_cmv
        network_new_cmv = new_cmv
        network_cmv_diff = cmv_diff

        if has_components:
            num_componentes = len(input_data.novos_componentes) if input_data.novos_componentes else 0
            change_applied = f"Nova formulacao ({num_componentes} itens)"
            # Se o preço também mudou significativamente, adicionar à descrição
            if abs(new_sale_price - current_sale_price) > 0.01:
                price_desc = format_change_applied(current_sale_price, new_sale_price, input_data.change_type)
                change_applied += f" + Preço: {price_desc}"
        else:
            change_applied = format_change_applied(current_sale_price, new_sale_price, input_data.change_type)

        num_stores = len(store_ranking) if store_ranking else 1
        num_recipes = 1
        avg_impact_per_store = total_impact / num_stores
        avg_impact_per_store_percent = total_impact_percent
        avg_impact_per_recipe = total_impact
        avg_impact_per_recipe_percent = total_impact_percent
        ingredient_impact = cost_difference
        ingredient_impact_percent = cost_percent

        result.ingredient_quantity = 0.0

        return SimulationResponse(
            simulation_type="recipe_change",
            recipe_name=recipe.nome,
            change_applied=change_applied,
            total_network_impact=round_value(total_impact),
            total_network_impact_percent=round_value(total_impact_percent),
            avg_impact_per_store=round_value(avg_impact_per_store),
            avg_impact_per_store_percent=round_value(avg_impact_per_store_percent, 1),
            avg_impact_per_recipe=round_value(avg_impact_per_recipe),
            avg_impact_per_recipe_percent=round_value(avg_impact_per_recipe_percent, 1),
            ingredient_impact=round_value(ingredient_impact),
            ingredient_impact_percent=round_value(ingredient_impact_percent, 1),
            results=[result],
            store_ranking=store_ranking,
            chart_data=build_chart_data([]),
            store_chart_data=build_store_chart_data(store_ranking),
            store_table_data=build_store_table_data(store_ranking),
            recipe_table_data=build_recipe_table_data([result]),
            projection_month=projection_month,
            projection_type=projection_type,
            current_cmv=round_value(network_current_cmv, 1),
            new_cmv=round_value(network_new_cmv, 1),
            cmv_diff=round_value(network_cmv_diff, 1)
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



    async def _get_recipes_using_ingredient(self, ingredient_id: int) -> List[Produto]:
        return await self._get_all_recipes_using_component(ingredient_id)

    async def _get_recipes_using_ingredient_direct(self, ingredient_id: int) -> List[Produto]:
        """Retorna apenas receitas que usam o ingrediente diretamente (sem cascade)."""
        result = await self.session.execute(
            select(Produto)
            .join(ComponenteReceita, ComponenteReceita.id_receita == Produto.id)
            .where(ComponenteReceita.id_componente == ingredient_id)
            .where(Produto.tipo == 'receita')
            .distinct()
        )
        return list(result.scalars().all())

    async def _get_all_recipes_using_component(self, component_id: int) -> List[Produto]:
        """Encontra todas as receitas que usam um componente (direta ou indiretamente via sub-receitas)."""
        visited: set[int] = set()
        to_process: list[int] = [component_id]
        
        while to_process:
            current_id = to_process.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)
            
            result = await self.session.execute(
                select(Produto)
                .join(ComponenteReceita, ComponenteReceita.id_receita == Produto.id)
                .where(ComponenteReceita.id_componente == current_id)
                .where(Produto.tipo == 'receita')
                .distinct()
            )
            recipes = list(result.scalars().all())
            
            for recipe in recipes:
                if recipe.id not in visited:
                    to_process.append(recipe.id)
        
        final_result = await self.session.execute(
            select(Produto).where(Produto.id.in_(visited), Produto.tipo == 'receita')
        )
        return list(final_result.scalars().all())

    async def _recalculate_recipe_cost_with_new_ingredient_price(
        self, recipe_id: int, ingredient_id: int, new_price: float, recalculated_costs: Dict[int, float] = None
    ) -> float:
        """
        Calcula o custo de uma receita considerando o novo preço de um insumo.
        OBS: Prefira usar o cálculo via DELTA para evitar impactos fantasmas.
        """
        # Inicializar dicionário de custos recalculados na primeira chamada
        if recalculated_costs is None:
            recalculated_costs = {}
        
        try:
            # Primeiro, buscar todos os componentes diretos da receita
            componentes = await self._get_componentes_diretos(recipe_id)
            
            # Calcular custo total baseado nos componentes
            # Primeiro, calcular custos de todas as sub-receitas recursivamente
            for comp in componentes:
                comp_id = comp['id_componente']
                comp_tipo_result = await self.session.execute(
                    select(Produto.tipo).where(Produto.id == comp_id)
                )
                comp_tipo = comp_tipo_result.scalar_one_or_none()
                
                # Se for uma sub-receita e ainda não foi calculada, calcular recursivamente
                if comp_tipo == 'receita' and comp_id not in recalculated_costs:
                    await self._recalculate_recipe_cost_with_new_ingredient_price(
                        comp_id, ingredient_id, new_price, recalculated_costs
                    )
            
            # Agora calcular o custo total usando os custos recalculados das sub-receitas
            total_cost = 0.0
            for comp in componentes:
                comp_id = comp['id_componente']
                quantidade = comp['quantidade']
                
                if comp_id == ingredient_id:
                    # Usar o novo preço para o insumo modificado
                    total_cost += new_price * quantidade
                else:
                    # Verificar se é uma sub-receita com custo recalculado
                    comp_tipo_result = await self.session.execute(
                        select(Produto.tipo).where(Produto.id == comp_id)
                    )
                    comp_tipo = comp_tipo_result.scalar_one_or_none()
                    
                    if comp_tipo == 'receita' and comp_id in recalculated_costs:
                        # Usar o custo recalculado da sub-receita
                        total_cost += recalculated_costs[comp_id] * quantidade
                    else:
                        # Usar o custo atual do banco (para insumos ou sub-receitas não afetadas)
                        total_cost += (comp['custo'] or 0) * quantidade
            
            # Armazenar o custo recalculado desta receita
            recalculated_costs[recipe_id] = total_cost
            
            return total_cost
        except Exception as e:
            print(f"[DEBUG] Error in recursive recalc: {e}, falling back to direct components")
            componentes = await self._get_componentes_diretos(recipe_id)
            total_cost = 0
            for comp in componentes:
                if comp['id_componente'] == ingredient_id:
                    total_cost += new_price * comp['quantidade']
                else:
                    total_cost += (comp['custo'] or 0) * comp['quantidade']
            recalculated_costs[recipe_id] = total_cost
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

    async def _get_ingredient_total_quantity(
        self, recipe_id: int, ingredient_id: int, visited: Optional[set] = None
    ) -> float:
        """
        Busca a quantidade TOTAL de um insumo na árvore completa da receita (recursivamente).
        Inclui insumos que estão em sub-receitas.
        """
        if visited is None:
            visited = set()

        if recipe_id in visited:
            return 0.0

        visited.add(recipe_id)

        # Buscar componentes diretos desta receita
        componentes = await self._get_componentes_diretos(recipe_id)

        total_quantity = 0.0

        for comp in componentes:
            comp_id = comp['id_componente']
            comp_quantity = comp['quantidade']

            # Se o componente for o insumo procurado, adicionar sua quantidade
            if comp_id == ingredient_id:
                total_quantity += comp_quantity
            else:
                # Verificar se é uma sub-receita e buscar recursivamente
                result = await self.session.execute(
                    select(Produto.tipo).where(Produto.id == comp_id)
                )
                comp_tipo = result.scalar_one_or_none()

                if comp_tipo == 'receita':
                    # É uma sub-receita - buscar recursivamente
                    sub_quantity = await self._get_ingredient_total_quantity(
                        comp_id, ingredient_id, visited.copy()
                    )
                    total_quantity += sub_quantity * comp_quantity

        return total_quantity

    async def _calculate_recipe_cost_from_components(
        self, componentes: List[ComponenteSimulacao], level: int = 0
    ) -> float:
        total_cost = 0.0
        for comp in componentes:
            comp_cost = 0.0
            
            if comp.sub_componentes:
                comp_cost = await self._calculate_recipe_cost_from_components(
                    comp.sub_componentes, level + 1
                )
            else:
                result = await self.session.execute(
                    select(Produto.custo).where(Produto.id == comp.id_componente)
                )
                comp_cost = result.scalar_one_or_none() or 0.0
            
            total_cost += round(comp_cost * comp.quantidade, 4)
        return round(total_cost, 4)

    async def _calculate_recipe_cost_from_db(self, recipe_id: int) -> float:
        """Calcula o custo total de uma receita baseando-se nos componentes diretos atuais no banco."""
        componentes = await self._get_componentes_diretos(recipe_id)
        total_cost = 0.0
        for comp in componentes:
            # Usar o custo que está na coluna 'custo' do produto (evita discrepâncias de sub-receitas não alteradas)
            comp_cost = comp['custo'] or 0.0
            total_cost += round(comp_cost * comp['quantidade'], 4)
        return round(total_cost, 4)

    def _check_if_composition_is_same(self, novos: List[ComponenteSimulacao], atuais: List[Dict[str, Any]]) -> bool:
        """Verifica se os componentes e quantidades são idênticos (com tolerância para float)."""
        if len(novos) != len(atuais):
            return False
            
        map_novos = {c.id_componente: c.quantidade for c in novos}
        map_atuais = {c['id_componente']: c['quantidade'] for c in atuais}
        
        if set(map_novos.keys()) != set(map_atuais.keys()):
            return False
            
        for comp_id, qty_nova in map_novos.items():
            qty_atual = map_atuais[comp_id]
            if abs(qty_nova - qty_atual) > 1e-6:
                return False
                
        return True

    async def _get_monthly_sales_for_recipe(self, id_produto_externo: Optional[str], store_ids: Optional[List[str]], month: str) -> float:
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
            store_id_strings = store_ids
            query = query.where(Venda.id_loja.in_(store_id_strings))

        result = await self.session.execute(query)
        total = result.scalar()
        return float(total or 0)

    async def _calculate_store_ranking(self, results: List[SimulationResult], filter_store_ids: Optional[List[str]]) -> List[StoreImpact]:
        if not results:
            return []

        projection_month, _ = get_projection_months()
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
            func.sum(Venda.quantidade_produto).label('total_quantity'),
            func.sum(Venda.valor_total).label('total_revenue')
        ).where(
            Venda.id_produto.in_(list(recipe_external_ids.values())),
            Venda.data >= start_date,
            Venda.data <= end_date
        )

        if filter_store_ids:
            store_id_strings = filter_store_ids
            store_sales_query = store_sales_query.where(Venda.id_loja.in_(store_id_strings))

        store_sales_query = store_sales_query.group_by(Venda.id_loja, Venda.id_produto)
        result = await self.session.execute(store_sales_query)
        rows = result.all()

        store_data = {}
        for row in rows:
            store_id = str(row.id_loja)
            if store_id not in store_data:
                store_data[store_id] = {
                    'current_cost': 0, 
                    'new_cost': 0, 
                    'current_revenue': 0,
                    'new_revenue': 0,
                    'recipes': set(),
                    'total_sales_quantity': 0,
                    'total_ingredient_quantity': 0
                }

            ext_id_to_recipe = {v: k for k, v in recipe_external_ids.items()}
            if row.id_produto in ext_id_to_recipe:
                recipe_id = ext_id_to_recipe[row.id_produto]
                recipe_result = next((r for r in results if r.recipe_id == recipe_id), None)
                if recipe_result:
                    quantity = float(row.total_quantity or 0)
                    current_rev = float(row.total_revenue or 0)
                    
                    store_data[store_id]['current_cost'] += quantity * recipe_result.current_cost
                    store_data[store_id]['new_cost'] += quantity * recipe_result.new_cost
                    store_data[store_id]['current_revenue'] += current_rev
                    
                    # Calcular novo faturamento baseado no novo preço de venda médio
                    if recipe_result.monthly_sales_quantity > 0:
                        new_sale_price = recipe_result.monthly_revenue_new / recipe_result.monthly_sales_quantity
                        store_data[store_id]['new_revenue'] += quantity * new_sale_price
                    else:
                        store_data[store_id]['new_revenue'] += current_rev
                        
                    store_data[store_id]['recipes'].add(recipe_id)
                    store_data[store_id]['total_sales_quantity'] += quantity
                    store_data[store_id]['total_ingredient_quantity'] += quantity * recipe_result.ingredient_quantity

        store_ranking = []
        for store_id, data in store_data.items():
            # Impacto Total = Delta(Faturamento) - Delta(Custo)
            total_current_cost = data['current_cost']
            total_new_cost = data['new_cost']
            total_current_revenue = data['current_revenue']
            total_new_revenue = data['new_revenue']
            
            # Impacto Total = Delta(Faturamento) - Delta(Custo)
            total_impact = (total_new_revenue - total_current_revenue) - (total_new_cost - total_current_cost)
            total_impact_percent = (total_impact / total_current_revenue * 100) if total_current_revenue > 0 else 0

            # CMV e Margem
            current_cmv = (total_current_cost / total_current_revenue * 100) if total_current_revenue > 0 else 0
            new_cmv = (total_new_cost / total_new_revenue * 100) if total_new_revenue > 0 else 0
            cmv_diff = new_cmv - current_cmv
            
            gross_margin = 100 - current_cmv
            gross_margin_new = 100 - new_cmv

            store_ranking.append(StoreImpact(
                store_id=store_id,
                total_current_cost=round_value(total_current_cost),
                total_new_cost=round_value(total_new_cost),
                total_impact=round_value(total_impact),
                total_impact_percent=round_value(total_impact_percent),
                affected_recipes_count=len(data['recipes']),
                gross_margin=round_value(gross_margin, 1),
                gross_margin_new=round_value(gross_margin_new, 1),
                current_cmv=round_value(current_cmv, 1),
                new_cmv=round_value(new_cmv, 1),
                cmv_diff=round_value(cmv_diff, 1),
                monthly_sales_quantity=data['total_sales_quantity'],
                ingredient_quantity=round_value(data['total_ingredient_quantity'], 3)
            ))

        store_ranking.sort(key=lambda x: x.total_impact, reverse=True)
        return store_ranking

    async def calculate_composicao_cost(self, componentes: List[ComponenteSimulacao]) -> CalculateCostOutput:
        details = await self._build_cost_details(componentes)
        total = sum(d.total_cost for d in details)
        return CalculateCostOutput(
            total_cost=round_value(total),
            componentes=details
        )

    async def _build_cost_details(self, componentes: List[ComponenteSimulacao]) -> List[ComponentCostDetail]:
        details = []
        for comp in componentes:
            produto = await self._get_product(comp.id_componente)
            if not produto:
                continue

            nome = produto.nome
            unidade = produto.unidade

            if comp.sub_componentes:
                sub_details = await self._build_cost_details(comp.sub_componentes)
                unit_cost = sum(sd.total_cost for sd in sub_details)
                total_cost = round_value(unit_cost * comp.quantidade, 4)
                details.append(ComponentCostDetail(
                    id_componente=comp.id_componente,
                    nome=nome,
                    quantidade=comp.quantidade,
                    unit_cost=round_value(unit_cost),
                    total_cost=round_value(total_cost),
                    unidade=unidade,
                    componentes=sub_details
                ))
            else:
                unit_cost = produto.custo or 0
                total_cost = round_value(unit_cost * comp.quantidade, 4)
                details.append(ComponentCostDetail(
                    id_componente=comp.id_componente,
                    nome=nome,
                    quantidade=comp.quantidade,
                    unit_cost=round_value(unit_cost),
                    total_cost=round_value(total_cost),
                    unidade=unidade
                ))
        return details

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

    async def get_daily_evolution(
        self,
        month: str,
        type: str,
        ingredient_id: Optional[int] = None,
        recipe_id: Optional[int] = None,
        change_type: str = "percentual",
        change_value: float = 0,
        store_ids: Optional[List[str]] = None,
        impacted_only: bool = False,
        new_cost: Optional[float] = None  # Novo parâmetro para separar custo de preço de venda
    ) -> SimulationEvolutionResponse:
        year, month_num = map(int, month.split('-'))
        _, last_day = monthrange(year, month_num)
        
        today = date.today()
        if year == today.year and month_num == today.month:
            max_day = today.day
        else:
            max_day = last_day
        
        ingredient_name = None
        recipe_name = None
        price_change_ratio = 1.0
        recipes: List[Produto] = []
        recipe_external_ids: Dict[int, str] = {}
        
        # Armazenar o novo custo da receita modificada (para recipe_change)
        new_recipe_cost: Optional[float] = None
        # Armazenar o novo preço de venda (para recipe_change)
        new_recipe_sale_price: Optional[float] = None
        
        if type == "price_change" and ingredient_id:
            ingredient = await self._get_ingredient(ingredient_id)
            if ingredient:
                ingredient_name = ingredient.nome
            current_price = ingredient.custo if ingredient and ingredient.custo else 0
            new_price = calculate_new_price(current_price, change_type, change_value)
            price_change_ratio = new_price / current_price if current_price > 0 else 1
            
            # affected_recipes são as receitas que serão impactadas pela mudança
            if impacted_only:
                recipes = await self._get_recipes_using_ingredient_direct(ingredient_id)
            else:
                recipes = await self._get_recipes_using_ingredient(ingredient_id)
            recipe_external_ids = {r.id: r.id_produto_externo for r in recipes if r.id_produto_externo}
            
        elif type == "recipe_change" and recipe_id:
            recipe = await self._get_recipe(recipe_id)
            if recipe:
                recipe_name = recipe.nome
                recipes = [recipe]
                if recipe.id_produto_externo:
                    recipe_external_ids = {recipe.id: recipe.id_produto_externo}
                
                # BUG FIX: Separar preço de venda de custo.
                # O change_value em recipe_change no simulador refere-se ao PREÇO DE VENDA.
                # O new_cost deve vir explicitamente ou ser mantido o atual se for apenas mudança de preço.
                new_recipe_cost = new_cost if new_cost is not None else (recipe.custo or 0)
                
                # O faturamento futuro pode usar o novo preço de venda (change_value)
                current_sale_price = await self._get_product_sale_price(recipe)
                new_recipe_sale_price = calculate_new_price(current_sale_price, change_type, change_value)
                
            price_change_ratio = 1.0
        else:
            raise HTTPException(status_code=400, detail="Parâmetros inválidos para simulação")
        
        # Se não encontrou receitas com id_produto_externo, tenta buscar todas as receitas do tipo receita
        # Isso garante que pelo menos tenhamos dados para exibir no gráfico
        if not recipe_external_ids:
            # Busca todas as receitas do banco
            all_recipes_result = await self.session.execute(
                select(Produto).where(Produto.tipo == 'receita')
            )
            all_recipes = list(all_recipes_result.scalars().all())
            recipe_external_ids = {r.id: r.id_produto_externo for r in all_recipes if r.id_produto_externo}
        
        # Cria conjunto de IDs externos das receitas afetadas
        affected_external_ids = set(recipe_external_ids.values())
        
        # Busca TODAS as receitas para calcular o custo TOTAL (usado quando impacted_only=false)
        all_recipes_result = await self.session.execute(
            select(Produto).where(Produto.tipo == 'receita')
        )
        all_recipes = list(all_recipes_result.scalars().all())
        
        # Cria dicionário: id_produto_externo -> receita
        all_recipes_by_external_id: Dict[str, Produto] = {
            r.id_produto_externo: r for r in all_recipes if r.id_produto_externo
        }
        
        daily_data = []
        total_current_cost = 0
        total_new_cost = 0
        total_sales = 0
        total_revenue = 0
        
        day_names = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
        
        for day in range(1, max_day + 1):
            day_date = date(year, month_num, day)
            start_date = day_date
            end_date = day_date
            
            # Busca vendas do período
            # Se impacted_only=true, filtra APENAS para receitas afetadas
            if impacted_only:
                # Query filtrada para apenas receitas afetadas
                query = select(
                    Venda.id_produto,
                    Venda.id_loja,
                    func.sum(Venda.quantidade_produto).label('quantity'),
                    func.sum(Venda.valor_total).label('revenue')
                ).where(
                    Venda.id_produto.in_(affected_external_ids),
                    Venda.data >= start_date,
                    Venda.data <= end_date
                )
            else:
                # Query com TODAS as receitas (padrão)
                query = select(
                    Venda.id_produto,
                    Venda.id_loja,
                    func.sum(Venda.quantidade_produto).label('quantity'),
                    func.sum(Venda.valor_total).label('revenue')
                ).where(
                    Venda.data >= start_date,
                    Venda.data <= end_date
                )
            
            if store_ids:
                query = query.where(Venda.id_loja.in_(store_ids))
            
            query = query.group_by(Venda.id_produto, Venda.id_loja)
            result = await self.session.execute(query)
            rows = result.all()
            
            day_current_cost = 0
            day_new_cost = 0
            day_sales = 0
            day_revenue = 0
            
            for row in rows:
                product_id = str(row.id_produto)
                quantity = float(row.quantity or 0)
                revenue = float(row.revenue or 0)
                
                day_sales += quantity
                day_revenue += revenue
                
                # Encontrar a receita correspondente a esta venda
                recipe = all_recipes_by_external_id.get(product_id)
                
                if recipe:
                    current_cost = recipe.custo or 0
                    new_cost = current_cost
                    
                    # Calcular novo custo apenas para receitas afetadas
                    if product_id in affected_external_ids:
                        # Esta receita é afetada pela simulação
                        if type == "price_change":
                            # Simulação de insumo: aplicar price_change_ratio
                            new_cost = current_cost * price_change_ratio
                        elif type == "recipe_change" and new_recipe_cost is not None:
                            # Simulação de receita: usar o novo custo fornecido (ou atual se não mudou)
                            new_cost = new_recipe_cost
                    
                    # Se impacted_only=true, incluir APENAS receitas afetadas (mesmo as que não mudaram de custo)
                    # O objetivo é ver o custo total das receitas afetadas, não só as que mudaram de custo
                    if impacted_only and product_id not in affected_external_ids:
                        continue
                    
                    day_current_cost += current_cost * quantity
                    day_new_cost += new_cost * quantity
            
            current_cost_avg = day_current_cost / day_sales if day_sales > 0 else 0
            new_cost_avg = day_new_cost / day_sales if day_sales > 0 else 0
            
            # Se há múltiplas lojas selecionadas e há dados para o dia, adicionar dados por loja
            if store_ids and len(store_ids) > 1 and (day_current_cost > 0 or day_new_cost > 0):
                # Re-executar query sem GROUP BY para obter dados por loja
                if impacted_only:
                    store_query = select(
                        Venda.id_produto,
                        Venda.id_loja,
                        Venda.quantidade_produto,
                        Venda.valor_total
                    ).where(
                        Venda.id_produto.in_(affected_external_ids),
                        Venda.data >= start_date,
                        Venda.data <= end_date
                    )
                else:
                    store_query = select(
                        Venda.id_produto,
                        Venda.id_loja,
                        Venda.quantidade_produto,
                        Venda.valor_total
                    ).where(
                        Venda.data >= start_date,
                        Venda.data <= end_date
                    )
                
                if store_ids:
                    store_query = store_query.where(Venda.id_loja.in_(store_ids))
                
                store_result = await self.session.execute(store_query)
                store_rows = store_result.all()
                
                for srow in store_rows:
                    s_product_id = str(srow.id_produto)
                    s_quantity = float(srow.quantidade_produto or 0)
                    
                    s_recipe = all_recipes_by_external_id.get(s_product_id)
                    
                    if s_recipe:
                        s_current_cost = s_recipe.custo or 0
                        s_new_cost = s_current_cost
                        
                        if s_product_id in affected_external_ids:
                            if type == "price_change":
                                s_new_cost = s_current_cost * price_change_ratio
                            elif type == "recipe_change" and new_recipe_cost is not None:
                                s_new_cost = new_recipe_cost
                        
                        # Se impacted_only=true, PULAR receitas sem impacto
                        if impacted_only and s_new_cost == s_current_cost:
                            continue
                        
                        store_current = s_current_cost * s_quantity
                        store_new = s_new_cost * s_quantity
                        
                        daily_data.append(DailyEvolutionData(
                            date=day_date.isoformat(),
                            store_id=str(srow.id_loja),
                            day_of_week=day_names[day_date.weekday()],
                            current_cost_total=round_value(store_current),
                            new_cost_total=round_value(store_new),
                            current_cost_avg_per_recipe=round_value(s_current_cost),
                            new_cost_avg_per_recipe=round_value(s_new_cost),
                            sales_quantity=s_quantity,
                            sales_revenue=round_value(float(srow.valor_total or 0))
                        ))
            
            # Adicionar dados agregados do dia SEMPRE (mesmo sem vendas)
            # Isso garante que o gráfico mostre todos os dias do mês
            daily_data.append(DailyEvolutionData(
                    date=day_date.isoformat(),
                    store_id=None,
                    day_of_week=day_names[day_date.weekday()],
                    current_cost_total=round_value(day_current_cost),
                    new_cost_total=round_value(day_new_cost),
                    current_cost_avg_per_recipe=round_value(current_cost_avg),
                    new_cost_avg_per_recipe=round_value(new_cost_avg),
                    sales_quantity=day_sales,
                    sales_revenue=round_value(day_revenue)
                ))
            
            total_current_cost += day_current_cost
            total_new_cost += day_new_cost
            total_sales += day_sales
            total_revenue += day_revenue
        
        total_impact = total_new_cost - total_current_cost
        total_impact_percent = (total_impact / total_current_cost * 100) if total_current_cost > 0 else 0
        avg_daily_sales = total_sales / max_day if max_day > 0 else 0
        avg_daily_revenue = total_revenue / max_day if max_day > 0 else 0
        
        summary = EvolutionSummary(
            total_days=max_day,
            total_current_cost=round_value(total_current_cost),
            total_new_cost=round_value(total_new_cost),
            total_impact=round_value(total_impact),
            total_impact_percent=round_value(total_impact_percent, 1),
            avg_daily_sales=round_value(avg_daily_sales, 1),
            avg_daily_revenue=round_value(avg_daily_revenue)
        )
        
        return SimulationEvolutionResponse(
            month=month,
            type=type,
            ingredient_name=ingredient_name,
            recipe_name=recipe_name,
            daily_data=daily_data,
            summary=summary
        )

    async def get_product_info(self, product_id: int) -> ProductInfoResponse:
        produto = await self._get_product(product_id)
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto com id={product_id} não encontrado")
        
        custo_atual = None
        unidade_medida = None
        
        if produto.tipo == 'insumo':
            custo_atual = produto.custo
            unidade_medida = produto.unidade
        
        # 1. Verificar se tem preco_venda cadastrado
        if produto.preco_venda is not None:
            return ProductInfoResponse(
                product_id=produto.id,
                product_name=produto.nome,
                product_type=produto.tipo,
                preco_venda=produto.preco_venda,
                custo_atual=custo_atual,
                unidade_medida=unidade_medida,
                source="preco_cadastrado",
                is_vendido=True
            )
        
        # 2. Fallback: buscar preco_medio das vendas
        if produto.id_produto_externo:
            result = await self.session.execute(
                select(
                    func.avg(Venda.valor_total / Venda.quantidade_produto).label('preco_medio')
                ).where(
                    Venda.id_produto == produto.id_produto_externo
                )
            )
            row = result.scalar()
            if row is not None:
                return ProductInfoResponse(
                    product_id=produto.id,
                    product_name=produto.nome,
                    product_type=produto.tipo,
                    preco_venda=round_value(float(row)),
                    custo_atual=custo_atual,
                    unidade_medida=unidade_medida,
                    source="preco_medio_vendas",
                    is_vendido=True
                )
        
        # 3. Não tem preço disponível
        return ProductInfoResponse(
            product_id=produto.id,
            product_name=produto.nome,
            product_type=produto.tipo,
            preco_venda=None,
            custo_atual=custo_atual,
            unidade_medida=unidade_medida,
            source="indisponivel",
            is_vendido=False
        )

    async def _get_product(self, product_id: int) -> Optional[Produto]:
        result = await self.session.execute(
            select(Produto).where(Produto.id == product_id)
        )
        return result.scalar_one_or_none()

    async def _get_product_sale_price(self, produto: Produto) -> float:
        """
        Busca o preço de venda de um produto (receita ou insumo).
        """
        # 1. Verificar se tem preco_venda cadastrado
        if produto.preco_venda is not None:
            return produto.preco_venda
        
        # 2. Fallback: buscar preco_medio das vendas
        if produto.id_produto_externo:
            result = await self.session.execute(
                select(
                    func.avg(Venda.valor_total / Venda.quantidade_produto).label('preco_medio')
                ).where(
                    Venda.id_produto == produto.id_produto_externo
                )
            )
            row = result.scalar()
            if row is not None:
                return round_value(float(row))
        
        # 3. Não tem preço disponível
        return 0.0
