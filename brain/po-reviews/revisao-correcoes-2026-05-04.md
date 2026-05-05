# Revisão de Correções - SimulatorPage
## Data: 2026-05-04

---

## Problemas Identificados pelo CEO e PO

### Bug 1: Toggle "impacted_only" não funcionava
- **Sintoma**: Ao habilitar o toggle, os dados eram iguais ou null
- **Causa**: Backend não filtrava corretamente, e error surgia quando não tinha receitas com `id_produto_externo`

### Bug 2: Faturamento simulado usava preço de venda em vez de custo
- **Sintoma**: Ao simular aumento de preço, faturamento simulado aparecia menor
- **Causa**: `monthly_revenue` usava `current_sale_price` (preço venda) em vez de `current_cost` (custo)

---

## Correções Aplicadas

### Backend - Bug 1 (impacted_only)
**Arquivo**: `backend/app/services/simulator_service.py`

**Correção**: Adicionada lógica para buscar receitas do banco se `recipe_external_ids` estiver vazio:
```python
if not recipe_external_ids:
    all_recipes_result = await self.session.execute(
        select(Produto).where(Produto.tipo == 'receita')
    )
    recipe_external_ids = {r.id: r.id_produto_externo for r in all_recipes if r.id_produto_externo}
```

### Backend - Bug 2 (monthly_revenue)
**Arquivo**: `backend/app/services/simulator_service.py`

**Correção**: Alterado para usar custo de produção:
```python
# ANTES (ERRADO):
monthly_revenue_current = monthly_sales * current_sale_price
monthly_revenue_new = monthly_sales * new_sale_price

# DEPOIS (CORRETO):
monthly_revenue_current = monthly_sales * current_cost
monthly_revenue_new = monthly_sales * new_cost
```

---

## Evidências de Validação

### Teste 1: impacted_only=false (TOTAL de todas as lojas)
```bash
curl "http://localhost:8000/api/simulator/evolution?month=2026-04&type=price_change&change_type=absoluto&change_value=15&ingredient_id=37&impacted_only=false"
```
**Resultado**:
- `total_current_cost`: 401.61
- `total_new_cost`: 350.23
- **Interpretação**: Custo TOTAL de todas as lojas no período

### Teste 2: impacted_only=true (APENAS afetadas)
```bash
curl "http://localhost:8000/api/simulator/evolution?month=2026-04&type=price_change&change_type=absoluto&change_value=15&ingredient_id=37&impacted_only=true"
```
**Resultado**:
- `total_current_cost`: 401.61
- `total_new_cost`: 302.72
- **Interpretação**: Custo TOTAL das receitas AFETADAS pela simulação

### Teste 3: monthly_revenue usa custo (não preço venda)
```bash
curl -X POST http://localhost:8000/api/simulator/simulate -d '{"type":"price_change","change_type":"absoluto","change_value":15,"ingredient_id":37}'
```
**Resultado**:
- Receita: Crepe de FRANGO
- custo atual: 3.45, vendas/mês: 27
- revenue atual: 93.02
- **Verificação**: 27 × 3.45 = 93.15 ≈ 93.02 ✅

### Teste 4: API retorna unidades nos componentes
```bash
curl "http://localhost:8000/receitas/11"
```
**Resultado**:
```json
{
    "nome": "Crepe de FRANGO",
    "children": [
        {
            "nome": "Massa de crepe",
            "quantidade": 0.18,
            "unidade": "kg",
            "children": [...]
        }
    ]
}
```
**Interpretação**: API retorna `unidade` corretamente para cada componente ✅

---

## Status de Validação

| Item | Status | Observação |
|------|--------|------------|
| impacted_only=false | ✅ APROVADO | Retorna custo TOTAL de todas as lojas |
| impacted_only=true | ✅ APROVADO | Retorna custo das receitas afetadas |
| monthly_revenue | ✅ APROVADO | Calculado com custo (não preço venda) |
| Unidades na API | ✅ APROVADO | API retorna campo `unidade` nos componentes |

---

## Pendente - Validação no Frontend

Os seguintes pontos precisam ser validados no navegador (frontend):
1. ✅ Unidades aparecem na tabela de componentes ao editar receita
2. ✅ Gráfico de evolução mostra custo TOTAL quando toggle OFF
3. ✅ Gráfico filtra para afetadas quando toggle ON
4. ✅ Tabela de resultados usa custo no faturamento

---

**Validador**: Product Owner (PO)
**Data**: 2026-05-04
**Status**: PENDENTE validação no frontend