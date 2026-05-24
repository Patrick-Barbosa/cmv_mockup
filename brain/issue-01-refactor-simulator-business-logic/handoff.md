# Handoff: Refatorar SimulatorPage — mover lógica de negócio para o backend

## Business Context

A SimulatorPage (~1470 linhas) fazia cálculos de custo de composição e transformações de dados no frontend. Agora o backend expõe esses dados prontos para consumo direto via novos campos na `SimulationResponse` e um novo endpoint `POST /api/simulator/calculate-cost`. O frontend deve remover TODOS os cálculos e usar os dados como retornados pela API.

## Endpoints

### POST /api/simulator/calculate-cost

- **Purpose**: Calcula o custo total + detalhamento por componente de uma árvore de componentes (recursiva). Substitui `calculateComposicaoCost` do frontend.
- **Auth**: Nenhuma (pública)
- **Request**:
  ```json
  {
    "componentes": [
      {
        "id_componente": 1,
        "quantidade": 2.5,
        "tipo": "insumo",
        "sub_componentes": null
      },
      {
        "id_componente": 6,
        "quantidade": 1,
        "tipo": "receita",
        "sub_componentes": [
          {
            "id_componente": 2,
            "quantidade": 0.5,
            "tipo": "insumo",
            "sub_componentes": null
          }
        ]
      }
    ]
  }
  ```
- **Response (success)**:
  ```json
  {
    "total_cost": 45.80,
    "componentes": [
      {
        "id_componente": 1,
        "nome": "Alface",
        "quantidade": 2.5,
        "unit_cost": 15.00,
        "total_cost": 37.50,
        "unidade": "kg",
        "componentes": null
      },
      {
        "id_componente": 6,
        "nome": "Hambúrguer Artesanal",
        "quantidade": 1,
        "unit_cost": 8.30,
        "total_cost": 8.30,
        "unidade": "un",
        "componentes": [
          {
            "id_componente": 2,
            "nome": "Pão Brioche",
            "quantidade": 0.5,
            "unit_cost": 2.50,
            "total_cost": 1.25,
            "unidade": "un",
            "componentes": null
          }
        ]
      }
    ]
  }
  ```
- **Response (error)**: 400 se componente não encontrado, 422 se payload inválido
- **Notes**: Endpoint independente — não precisa de session de simulação ativa. O cálculo é recursivo: para receitas com `sub_componentes`, o `unit_cost` é a soma dos filhos.

### POST /api/simulator/simulate

- **Purpose**: Simula impacto de mudança de preço de insumo ou composição de receita. Agora retorna dados prontos para gráficos e tabelas.
- **Auth**: Nenhuma (pública)
- **Request** *(price_change)*:
  ```json
  {
    "type": "price_change",
    "ingredient_id": 1,
    "change_type": "absoluto",
    "change_value": 18.0,
    "store_ids": ["RJ-COPA", "RJ-BARRA"]
  }
  ```
- **Request** *(recipe_change)*:
  ```json
  {
    "type": "recipe_change",
    "recipe_id": 6,
    "change_type": "percentual",
    "change_value": 10,
    "novos_componentes": [
      { "id_componente": 1, "quantidade": 2.5, "tipo": "insumo" }
    ]
  }
  ```
- **Response (success)**: Mesma estrutura de antes + 4 novos campos:
  ```json
  {
    "...": "... (campos existentes: simulation_type, results, store_ranking, etc.)",

    "chart_data": {
      "daily": [
        { "day": "2026-05-01", "current": 1500.00, "new": 1650.00 },
        { "day": "2026-05-02", "current": 1400.00, "new": 1540.00 }
      ]
    },

    "store_chart_data": [
      {
        "store_id": "RJ-COPA",
        "cmv_atual": 35.2,
        "cmv_simulado": 38.1,
        "impacto_r$": 1200.50,
        "impacto_%": 2.5,
        "variacao_pp": 2.9
      }
    ],

    "store_table_data": [
      {
        "store_id": "RJ-COPA",
        "total_current_cost": 1000.0,
        "total_new_cost": 1100.0,
        "total_impact": 1200.50,
        "total_impact_percent": 2.5,
        "affected_recipes_count": 5,
        "monthly_sales_quantity": 500,
        "ingredient_quantity": 12.5,
        "gross_margin": 64.8,
        "gross_margin_new": 61.9,
        "current_cmv": 35.2,
        "new_cmv": 38.1,
        "cmv_diff": 2.9,
        "revenue_current": 2840.91,
        "revenue_simulated": 2887.14
      }
    ],

    "recipe_table_data": [
      {
        "recipe_id": 1,
        "recipe_name": "Hambúrguer",
        "current_cost": 8.30,
        "new_cost": 9.50,
        "cost_difference": 1.20,
        "cost_percent_change": 14.46,
        "monthly_sales_quantity": 200,
        "monthly_revenue_current": 5000.0,
        "monthly_revenue_new": 5000.0,
        "revenue_impact": 0,
        "revenue_impact_percent": 0,
        "current_cmv": 33.2,
        "new_cmv": 38.0,
        "cmv_diff": 4.8,
        "cmv_atual_rs": 1660.0,
        "cmv_simulado_rs": 1900.0,
        "dif_custo_rs": 240.0
      }
    ]
  }
  ```

## Data Models / DTOs

### Campos novos em SimulationResponse

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `chart_data` | `ChartData` | Dados para gráfico de linha (evolução diária) |
| `store_chart_data` | `StoreChartItem[]` | Dados para gráfico de barras por loja |
| `store_table_data` | `StoreTableItem[]` | Dados prontos para tabela de lojas |
| `recipe_table_data` | `RecipeTableItem[]` | Dados prontos para tabela de receitas |

### ChartData

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `daily` | `DayData[]` | Lista de dados diários |

### DayData

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `day` | string | Data ISO (YYYY-MM-DD) |
| `current` | float | Custo total atual do dia |
| `new` | float | Custo total simulado do dia |

### StoreChartItem (para gráfico de barras)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `store_id` | string | ID da loja |
| `cmv_atual` | float | CMV% atual |
| `cmv_simulado` | float | CMV% simulado |
| `impacto_r$` | float | Impacto em R$ |
| `impacto_%` | float | Impacto em percentual |
| `variacao_pp` | float | Variação em pontos percentuais de CMV |

### StoreTableItem (para tabela de lojas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `store_id` | string | ID da loja |
| `total_current_cost` | float | Custo total atual |
| `total_new_cost` | float | Custo total simulado |
| `total_impact` | float | Impacto total em R$ |
| `total_impact_percent` | float | Impacto total % |
| `affected_recipes_count` | int | Qtd de receitas afetadas |
| `monthly_sales_quantity` | float | Qtd de vendas no mês |
| `ingredient_quantity` | float | Qtd total do insumo (se price_change) |
| `gross_margin` | float | Margem bruta atual % |
| `gross_margin_new` | float | Margem bruta simulada % |
| `current_cmv` | float | CMV% atual |
| `new_cmv` | float | CMV% simulado |
| `cmv_diff` | float | Diferença em pp de CMV |
| `revenue_current` | float | Faturamento atual (derivado: custo / cmv * 100) |
| `revenue_simulated` | float | Faturamento simulado |

### RecipeTableItem (para tabela de receitas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `recipe_id` | int | ID da receita |
| `recipe_name` | string | Nome |
| `current_cost` | float | Custo atual |
| `new_cost` | float | Novo custo |
| `cost_difference` | float | Diferença de custo |
| `cost_percent_change` | float | Variação % do custo |
| `monthly_sales_quantity` | float | Qtd vendida no mês |
| `monthly_revenue_current` | float | Receita atual |
| `monthly_revenue_new` | float | Receita simulada |
| `revenue_impact` | float | Impacto na receita |
| `revenue_impact_percent` | float | Impacto % na receita |
| `current_cmv` | float | CMV% atual |
| `new_cmv` | float | CMV% simulado |
| `cmv_diff` | float | Diferença em pp de CMV |
| `cmv_atual_rs` | float | Custo CMV atual em R$ (qtd * custo_atual) |
| `cmv_simulado_rs` | float | Custo CMV simulado em R$ (qtd * novo_custo) |
| `dif_custo_rs` | float | Diferença de custo em R$ (qtd * diff) |

### ComponentCostDetail (resposta do calculate-cost)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_componente` | int | ID do produto |
| `nome` | string | Nome do produto |
| `quantidade` | float | Quantidade usada |
| `unit_cost` | float | Custo unitário |
| `total_cost` | float | Custo total (qtd * unit_cost) |
| `unidade` | string? | Unidade de medida (kg, un, l) |
| `componentes` | `ComponentCostDetail[]`? | Sub-componentes (se for receita) |

### CalculateCostInput

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `componentes` | `ComponenteSimulacao[]` | Árvore de componentes |

`ComponenteSimulacao`: `{ id_componente: int, quantidade: float, tipo?: "insumo"|"receita", sub_componentes?: ComponenteSimulacao[] }`

## Business Logic & Edge Cases

- **chart_data atualmente retorna vazio** (`daily: []`) na response do simulate. O chart_data completo vêm do endpoint GET /evolution. FUTURO: pode-se integrar evolution no simulate. Por enquanto, o frontend deve continuar chamando GET /evolution para o gráfico de linha.
- **calculate-cost não requer sessão**: endpoint independente, apenas calcula custo de uma árvore de componentes. Ideal para chamadas frequentes (ex: a cada alteração na árvore).
- **calculate-cost é recursivo**: se um componente é do tipo "receita" e tem `sub_componentes`, o custo unitário da receita é a soma dos custos totais dos sub-componentes.
- **Mesmo layout, mesmos dados**: a refatoração não muda nenhum número — os cálculos do backend devem produzir exatamente os mesmos resultados que o frontend calculava antes.

## Changes Required in Frontend

### api.ts — Add
```typescript
export interface CalculateCostInput { componentes: ComponenteSimulacao[] }
export interface ComponentCostDetail { id_componente, nome, quantidade, unit_cost, total_cost, unidade?, componentes? }
export interface CalculateCostResponse { total_cost: number, componentes: ComponentCostDetail[] }

// Em simulatorApi:
calculateCost: (input: CalculateCostInput) =>
  apiFetch<CalculateCostResponse>("/api/simulator/calculate-cost", { method: "POST", body: input })
```

### api.ts — Add TypeScript types for new response fields
```typescript
// Adicionar em SimulationResponse:
chart_data?: { daily: { day: string, current: number, new: number }[] }
store_chart_data?: { store_id: string, cmv_atual: number, cmv_simulado: number, impacto_r$: number, impacto_%: number, variacao_pp: number }[]
store_table_data?: { store_id: string, total_current_cost: number, ... revenue_current: number, revenue_simulated: number }[]
recipe_table_data?: { recipe_id: number, ... cmv_atual_rs: number, cmv_simulado_rs: number, dif_custo_rs: number }[]
```

### SimulatorPage.tsx — Remove
- `calculateComposicaoCost` → substituir por chamada `simulatorApi.calculateCost`
- `sortedSimulationResults` useMemo → não precisa (backend já ordena)
- `evolutionChartData` useMemo → usar `simulationResult.chart_data?.daily`
- `storeRankingData` useMemo → usar `simulationResult.store_chart_data`
- Recálculos nas tabelas (revenueCurrent, cmvAtualRS, etc.) → usar `store_table_data` e `recipe_table_data`
- `findAndAdd`, `removeDeep`, `calculateDeep` → mover para EditableTreeViewer
- `renderComponents`, `handleAddComponent`, `handleRemoveComponent`, `handleComponentIdChange` → mover para EditableTreeViewer

## Integration Notes

- **Ordem de implementação**: T-5 (substituir calculateComposicaoCost) → T-4 (extrair árvore) → T-6 (remover transformações) → T-7 (limpeza)
- **Debounce**: Ao chamar calculate-cost, usar debounce de ~300ms para não floodar a API a cada digitação
- **Loading state**: calcular custo é async — mostrar loader enquanto calcula
- **Compatibilidade**: campos existentes (`results`, `store_ranking`) permanecem na response para não quebrar nada durante migração

## Test Scenarios

- Simular price_change → gráfico de barras mostra dados corretos
- Simular recipe_change com alteração de composição → total_cost exibido corretamente
- Adicionar/remover componente → custo recalculado via API
- Tabela de lojas mostra revenue_current e revenue_simulated idênticos ao cálculo antigo
