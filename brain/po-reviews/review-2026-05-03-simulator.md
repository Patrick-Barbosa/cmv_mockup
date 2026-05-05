# PO Review: Validação APIs Simulador

**Task ID:** review-2026-05-03-simulator  
**Data:** 2026-05-03  
**Reviewer:** Product Owner (PO)

---

## 📝 Payload/Logic Reviewed

### API 1: Evolution (`/api/simulator/evolution`)
- **Endpoint:** `GET /api/simulator/evolution?month=2026-04&type=recipe_change&change_type=absoluto&change_value=0.70&recipe_id=4`
- **Campos validados:** `daily_data`, `current_cost_total`, `new_cost_total`, `impacted_only`

### API 2: Simulate (`/api/simulator/simulate`)
- **Endpoint:** `POST /api/simulator/simulate`
- **Payload:** `{"type":"recipe_change","change_type":"absoluto","change_value":15.00,"recipe_id":4,"novos_componentes":[{"id_componente":24,"quantidade":0.1}]}`
- **Campos validados:** `monthly_revenue_current`, `monthly_revenue_new`

---

## ✅ Business Alignment

### API Evolution:
- ✅ Objetivo de negócio: mostrar evolução diária de custos com simulação
- ✅ Campos retornados makes sense para gráfico de linha
- ⚠️ `impacted_only` não faz diferença - não entrega valor esperado

### API Simulate (recipe_change):
- ❌ ** NÃO ALINHADO: ** O campo `monthly_revenue` representa **faturamento** (vendas × preço), mas na simulação de mudança de receita, o impacto é no **custo de produção**, não no faturamento!
- Nome do campo é enganoso: deveria ser `monthly_cost` ou `monthly_production_cost`

---

## ❌ Logic Validation

### Bug 1: `impacted_only` não funciona
```python
#get_daily_evolution() -_linhas 590-595
if impacted_only:
    recipes = await self._get_recipes_using_ingredient_direct(ingredient_id)
else:
    recipes = await self._get_recipes_using_ingredient(ingredient_id)
```
- O problema: **após essa filtragem**, o código ainda busca TODAS as receitas (linhas 614-622) e calcula custos para TODAS:
```python
all_recipes_result = await self.session.execute(
    select(Produto).where(Produto.tipo == 'receita')
)
```
- O resultado: `impacted_only` só afeta a lista `recipe_external_ids` usada para identificar "afetadas", mas o cálculofinal considera TODAS as receitas!

### Bug 2: `monthly_revenue_*` usa preço de venda
```python
#_simulate_recipe_change() -_linhas 159-163
monthly_sales = await self._get_monthly_sales_for_recipe(...)
current_sale_price = await self._get_product_sale_price(recipe)
new_sale_price = input_data.change_value

# BUG: usa preco de VENDA, nao custo de produziao!
monthly_revenue_current = monthly_sales * current_sale_price
monthly_revenue_new = monthly_sales * new_sale_price
```

Em simulação de `recipe_change`, o que muda é:
- ✅ `current_cost` e `new_cost` (custo de produção) = CORRETO
- ❌ `monthly_revenue_*` (usa preço de venda) = ERRADO

Para simulação de receita, **o impacto é no custo de produção**, não no preço de venda!

---

## 🚫 Approval Status

**REJECTED** - Requer correções antes de passar para o frontend.

### Reason for Rejection:
1. `impacted_only` parameter não funciona - não filtra dados conforme esperado
2. `monthly_revenue_*` está calculado com preço de venda em vez de custo de produção (para recipe_change)

---

## 🔧 Feedback for BE

###Correção 1: `impacted_only` parameter
Quando `impacted_only=true`, o cálculo daily deve considerar **apenas** as vendas das receitas afetadas:

```python
#get_daily_evolution() - modificar lógica de cálculo

if impacted_only:
    # Filtrar vendas para APENAS receitas afetadas
    query = query.where(Venda.id_produto.in_(affected_external_ids))
```

### Correção 2: `monthly_revenue_*` para recipe_change
Na simulação de `recipe_change`, cambiar componentes afeta o **custo de produção**, não o preço de venda. Opções:

**Opção A (Recomendada):** Renomear campos
- `monthly_revenue_current` → `monthly_production_cost_current`
- `monthly_revenue_new` → `monthly_production_cost_new`
- `revenue_impact` → `cost_impact`

**Opção B:** Separar lógica por tipo
- Para `price_change`: manter `monthly_revenue` = vendas × preço de venda (margem)
- Para `recipe_change`: usar `monthly_cost` = vendas × custo de produção

---

## 📊 Success Metrics

Para API de evolução considerar funcionando:
- [ ] `impacted_only=true` retorna dados diferentes de `impacted_only=false`
- [ ] Dados refletem apenas vendas das receitas afetadas quando `true`

Para API de simulação de receita considerar funcionando:
- [ ] Campos de custo usam nomes claros (`monthly_cost_*` não `monthly_revenue_*`)
- [ ] Cálculo usa custo de produção para `recipe_change`

---

## 📋 Sample Payloads

### Evolution API (working):
```json
{
  "month": "2026-04",
  "type": "recipe_change",
  "ingredient_name": null,
  "recipe_name": "Bolo de pote de chocolate",
  "daily_data": [
    {
      "date": "2026-04-02",
      "store_id": null,
      "day_of_week": "quinta",
      "current_cost_total": 168.41,
      "new_cost_total": 168.41,
      "current_cost_avg_per_recipe": 10.53,
      "new_cost_avg_per_recipe": 10.53,
      "sales_quantity": 16.0,
      "sales_revenue": 704.0
    }
  ],
  "summary": {
    "total_days": 30,
    "total_current_cost": 401.61,
    "total_new_cost": 404.49,
    "total_impact": 2.88,
    "total_impact_percent": 0.7,
    "avg_daily_sales": 3.6,
    "avg_daily_revenue": 71.1
  }
}
```

### Simulate API (with bug):
```json
{
  "simulation_type": "recipe_change",
  "recipe_name": "Bolo de pote de chocolate",
  "change_applied": "Nova formulacao: 1 componentes",
  "total_network_impact": 38.5,
  "results": [
    {
      "recipe_id": 4,
      "recipe_name": "Bolo de pote de chocolate",
      "current_cost": 0.57,
      "new_cost": 0.0,
      "monthly_revenue_current": 291.5,  // BUG: deveria ser 12.54 (custo)
      "monthly_revenue_new": 330.0        // BUG: deveria ser 0.0 (custo)
    }
  ]
}
```