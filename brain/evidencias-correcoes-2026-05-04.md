# Evidências de Correção - 2026-05-04

---

## ✅ PROBLEMA 1: Faturamento Simulado ERRADO

### Cenário
- Simulação de RECEITA (não insumo)
- Alteração: preço de venda de R$ 13,25 para R$ 45,00
- Receita: Bolo de pote de chocolate
- Vendas: 22/mês

### Payload da Requisição
```json
{
  "type": "recipe_change",
  "change_type": "absoluto",
  "change_value": 45,
  "recipe_id": 4,
  "novos_componentes": []
}
```

### Payload da Resposta (CORRETO!)
```json
{
  "recipe_name": "Bolo de pote de chocolate",
  "current_cost": 0.57,
  "new_cost": 0.57,
  "monthly_sales_quantity": 22.0,
  "monthly_revenue_current": 291.5,
  "monthly_revenue_new": 990.0,
  "revenue_impact": 698.5
}
```

### Verificação
- Faturamento atual: 22 × R$ 13.25 (preço venda) = R$ 291.50 ✅
- Faturamento simulado: 22 × R$ 45.00 (novo preço) = R$ 990.00 ✅
- Impacto: R$ 990.00 - R$ 291.50 = +R$ 698.50 (AUMENTOU!) ✅

---

## ✅ PROBLEMA 2: Gráfico - Todos os Dias

### Cenário
- API de evolução com month=2026-04
- Sem filtro impacted_only

### Payload da Resposta (CORRETO!)
```json
{
  "daily_data": [
    {"date": "2026-04-01", "current_cost_total": 0.0, "new_cost_total": 0.0},
    {"date": "2026-04-02", "current_cost_total": 168.41, "new_cost_total": 168.41},
    {"date": "2026-04-03", "current_cost_total": 0.0, "new_cost_total": 0.0},
    {"date": "2026-04-04", "current_cost_total": 12.02, "new_cost_total": 12.02},
    ...
    {"date": "2026-04-30", "current_cost_total": 0.0, "new_cost_total": 0.0}
  ]
}
```

### Verificação
- Total de dias retornados: 30 ✅
- Primeiro dia: 2026-04-01 ✅
- Último dia: 2026-04-30 ✅
- Dias sem vendas têm valor 0.0 ✅

---

## ✅ PROBLEMA 3: Unidades nos Componentes

### Cenário
- API de receita com componentes

### Payload da Resposta (unidades presentes)
```json
{
  "nome": "Torta cremosa de frango",
  "children": [
    {
      "nome": "Massa de torta amanteigada",
      "tipo": "receita",
      "quantidade": 0.45,
      "unidade": "kg",
      "children": [
        {"nome": "Farinha de trigo", "tipo": "insumo", "unidade": "kg"},
        {"nome": "Manteiga", "tipo": "insumo", "unidade": "g"},
        {"nome": "Ovos", "tipo": "insumo", "unidade": "un"}
      ]
    },
    {
      "nome": "Recheio cremoso de frango",
      "tipo": "receita",
      "quantidade": 0.65,
      "unidade": "kg"
    }
  ]
}
```

### Verificação
- API retorna campo `unidade` para cada componente ✅
- Frontend mapeia `unidade` → `unidadeMedida` ✅
- Frontend exibe unidade após input de quantidade ✅

---

## 📁 Arquivos Modificados

- `backend/app/services/simulator_service.py`
  - Linha ~161-181: Faturamento usa preço de venda (não custo)
  - Linha ~132-133: Permite recipe_change sem novos_componentes
  - Linha ~807-809: Adiciona todos os dias ao gráfico (não só dias com vendas)