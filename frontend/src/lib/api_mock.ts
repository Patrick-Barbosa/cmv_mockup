import type { SimulationInput, SimulationResponse, EvolutionResponse, StoreInfo, ProductInfoResponse, AffectedRecipe, ReceitaTreeDetalhe } from "./api";

const mockStores: StoreInfo[] = [
  { store_id: "RJ-COPA" },
  { store_id: "RJ-BARRA" },
  { store_id: "SP-PAULISTA" },
  { store_id: "SP-IRAJA" },
  { store_id: "BH-SAVASSI" },
  { store_id: "RS-POA" },
  { store_id: "MG-SAVASSI" },
  { store_id: "DF-ASA_SUL" },
  { store_id: "SC-FLORIPA" },
  { store_id: "PR-CURITIBA" },
  { store_id: "PE-RECIFE" },
  { store_id: "CE-FORTALEZA" },
];

export const simulatorApiMock = {
  simulate: async (input: SimulationInput): Promise<SimulationResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let isIncrease = false;
    if (input.type === "price_change") {
        isIncrease = (input.change_value || 0) > 12.50;
    } else {
        isIncrease = (input.change_value || 0) > 45.00;
    }

    const filteredStores = mockStores.filter(s => !input.store_ids || input.store_ids.length === 0 || input.store_ids.includes(s.store_id));

    const store_ranking = filteredStores.map((s, index) => {
      const baseCost = 45000 + index * 1000;
      const baseCmv = 32.5 + (index % 3);
      const impactCost = isIncrease ? 1000 + index * 100 : -(500 + index * 50);
      const impactCmv = isIncrease ? 1.5 : -1.0;

      return {
        store_id: s.store_id,
        total_current_cost: baseCost,
        total_new_cost: baseCost + impactCost,
        total_impact: impactCost,
        total_impact_percent: (impactCost / baseCost) * 100,
        affected_recipes_count: 5,
        gross_margin: 65,
        gross_margin_new: isIncrease ? 63.5 : 66.2,
        current_cmv: baseCmv,
        new_cmv: baseCmv + impactCmv,
        cmv_diff: impactCmv,
        monthly_sales_quantity: 850 + index * 50,
        ingredient_quantity: (850 + index * 50) * 0.2
      };
    });

    const totalCurrentCost = store_ranking.reduce((sum, s) => sum + s.total_current_cost, 0);
    const totalNewCost = store_ranking.reduce((sum, s) => sum + s.total_new_cost, 0);
    const totalImpact = totalNewCost - totalCurrentCost;

    const totalCurrentRevenue = store_ranking.reduce((sum, s) => sum + (s.total_current_cost / (s.current_cmv / 100)), 0);
    const totalNewRevenue = store_ranking.reduce((sum, s) => sum + (s.total_new_cost / (s.new_cmv / 100)), 0);

    const overallCurrentCmv = totalCurrentRevenue > 0 ? (totalCurrentCost / totalCurrentRevenue) * 100 : 0;
    const overallNewCmv = totalNewRevenue > 0 ? (totalNewCost / totalNewRevenue) * 100 : 0;
    
    const totalSalesQuantity = store_ranking.reduce((sum, s) => sum + s.monthly_sales_quantity, 0);
    const totalIngredientQuantity = store_ranking.reduce((sum, s) => sum + s.ingredient_quantity, 0);

    return {
      simulation_type: input.type,
      ingredient_name: "Tomate",
      recipe_name: null,
      change_applied: "absoluto",
      total_network_impact: totalImpact,
      total_network_impact_percent: totalCurrentCost > 0 ? (totalImpact / totalCurrentCost) * 100 : 0,
      avg_impact_per_store: store_ranking.length > 0 ? totalImpact / store_ranking.length : 0,
      avg_impact_per_store_percent: store_ranking.length > 0 ? store_ranking.reduce((sum, s) => sum + s.total_impact_percent, 0) / store_ranking.length : 0,
      avg_impact_per_recipe: store_ranking.length > 0 ? (totalImpact / store_ranking.length) * 0.2 : 0,
      avg_impact_per_recipe_percent: totalCurrentCost > 0 ? (totalImpact / totalCurrentCost) * 100 : 0,
      ingredient_impact: isIncrease ? 2.5 : -1.5,
      ingredient_impact_percent: isIncrease ? 20 : -12,
      results: [
        {
          recipe_id: 6,
          recipe_name: "Hambúrguer de Wagyu",
          current_cost: 15.50,
          new_cost: isIncrease ? 18.00 : 14.00,
          cost_difference: isIncrease ? 2.50 : -1.50,
          cost_percent_change: isIncrease ? 16.1 : -9.6,
          ingredient_quantity: totalIngredientQuantity,
          monthly_sales_quantity: totalSalesQuantity,
          monthly_revenue_current: totalCurrentRevenue,
          monthly_revenue_new: totalNewRevenue,
          revenue_impact: totalNewRevenue - totalCurrentRevenue,
          revenue_impact_percent: totalCurrentRevenue > 0 ? ((totalNewRevenue - totalCurrentRevenue) / totalCurrentRevenue) * 100 : 0,
          current_cmv: overallCurrentCmv,
          new_cmv: overallNewCmv,
          cmv_diff: overallNewCmv - overallCurrentCmv
        }
      ],
      store_ranking: store_ranking,
      projection_month: "2026-04",
      projection_type: input.type,
      current_cmv: overallCurrentCmv,
      new_cmv: overallNewCmv,
      cmv_diff: overallNewCmv - overallCurrentCmv
    };
  },

  getAffectedRecipes: async (_ingredientId: number): Promise<AffectedRecipe[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      { recipe_id: 6, recipe_name: "Hambúrguer de Wagyu", current_cost: 15.50 },
      { recipe_id: 7, recipe_name: "Sanduíche Natural", current_cost: 22.0 }
    ];
  },

  getStores: async (): Promise<StoreInfo[]> => {
    return mockStores;
  },

  getEvolution: async (params: SimulationInput & { month: string; impacted_only?: boolean; new_cost?: number }): Promise<EvolutionResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      month: params.month,
      type: params.type,
      daily_data: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-04-${(i + 1).toString().padStart(2, '0')}`,
        store_id: null,
        day_of_week: "Seg",
        current_cost_total: 5000 + Math.random() * 500,
        new_cost_total: 5200 + Math.random() * 600,
        sales_quantity: 100,
        sales_revenue: 15000
      })),
      summary: {
        total_days: 30,
        total_current_cost: 150000,
        total_new_cost: 156000,
        total_impact: 6000,
        total_impact_percent: 4,
        avg_daily_sales: 100,
        avg_daily_revenue: 15000
      }
    };
  },

  getProductInfo: async (productId: number): Promise<ProductInfoResponse> => {
    return {
      product_id: productId,
      product_name: productId === 6 ? "Hambúrguer de Wagyu" : "Tomate",
      product_type: productId === 6 ? "receita" : "insumo",
      preco_venda: productId === 6 ? 45.00 : null,
      custo_atual: productId === 6 ? 15.50 : 12.50,
      unidade_medida: productId === 6 ? "un" : "kg",
      source: "mock",
      is_vendido: productId === 6
    };
  }
};

export const receitasApiMock = {
    getTree: async (id: number | string): Promise<ReceitaTreeDetalhe> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            id: id,
            nome: "Hambúrguer de Wagyu",
            tipo: "receita",
            children: [
                { id: 5, nome: "Pão de brioche", tipo: "insumo", quantidade: 1, unidade: "un", custo: 2.50 },
                { id: 2, nome: "Tomate", tipo: "insumo", quantidade: 0.05, unidade: "kg", custo: 12.50 },
                { id: 3, nome: "Queijo mussarela", tipo: "insumo", quantidade: 0.03, unidade: "kg", custo: 45.00 }
            ]
        };
    }
};
