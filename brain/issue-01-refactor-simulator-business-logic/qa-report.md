# QA Report — Refatorar SimulatorPage: mover lógica de negócio para o backend

**Issue**: issue-01-refactor-simulator-business-logic
**Data**: 2026-05-15
**Agente**: qa-validator
**Ciclo de correção**: 1/3

## Resumo

| Total | ✅ PASS | ❌ FAIL | ⚠️ SKIP |
|-------|---------|---------|----------|
| 8     | 8       | 0       | 0        |

## Ambiente

- **Backend**: http://localhost:8000 (✅ )
- **Frontend**: N/A (testado via curl)
- **SGBD**: PostgreSQL / Docker (✅ )

## Critérios

### 1. AC-1: Endpoint calculate-cost (insumo)

**Cenário**: backend-only
**Veredito**: ✅ PASS

**Comando**:
```bash
curl -s -X POST http://localhost:8000/api/simulator/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{"componentes":[{"id_componente":1,"quantidade":2.5,"tipo":"insumo"}]}'
```

**Resultado**:
```json
{"total_cost":3.55,"componentes":[{"id_componente":1,"nome":"Bolo de cenoura","quantidade":2.5,"unit_cost":1.42,"total_cost":3.55}]}
```

### 2. AC-1: Endpoint calculate-cost (receita + sub-componentes)

**Cenário**: backend-only
**Veredito**: ✅ PASS

**Comando**:
```bash
curl -s -X POST http://localhost:8000/api/simulator/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{"componentes":[{"id_componente":6,"quantidade":1,"tipo":"receita","sub_componentes":[{"id_componente":2,"quantidade":0.5,"tipo":"insumo"}]}]}'
```

**Resultado**:
```json
{"total_cost":2.36,"componentes":[{"id_componente":6,"nome":"Brownie base","quantidade":1.0,"unit_cost":2.36,"total_cost":2.36,"componentes":[{"id_componente":2,"nome":"Massa de bolo","quantidade":0.5,"unit_cost":4.72,"total_cost":2.36}]}]}
```

### 3. AC-2: SimulationResponse com chart_data, store_chart_data, store_table_data, recipe_table_data

**Cenário**: backend-only
**Veredito**: ✅ PASS

**Comando**:
```bash
curl -s -X POST http://localhost:8000/api/simulator/simulate \
  -H "Content-Type: application/json" \
  -d '{"type":"price_change","ingredient_id":19,"change_type":"absoluto","change_value":18.0,"store_ids":["RJ-COPA"]}'
```

**Resultado**:
- `chart_data`: ✅ `{"daily": []}` (presente, vazio por falta de sales data)
- `store_chart_data`: ✅ 0 items (sem store_ranking, campo presente)
- `store_table_data`: ✅ 0 items (campo presente)
- `recipe_table_data`: ✅ 1 item (receita afetada encontrada)

### 4. AC-3: Frontend sem cálculos de negócio

**Cenário**: backend-only (verificação de código)
**Veredito**: ✅ PASS

**Verificação**:
- `calculateComposicaoCost` removido do `SimulatorPage.tsx` (substituído por chamada API)
- `evolutionChartData` useMemo removido (dados vêm inline do evolutionData)
- `storeRankingData` useMemo removido (usa `store_chart_data`)
- Recálculos de `revenueCurrent`/`revenueSimulated` substituídos por `store_table_data`
- Recálculos de `cmvAtualRS`/`cmvSimuladoRS` substituídos por `recipe_table_data`

### 5. AC-4: Componente de árvore editável extraído

**Cenário**: backend-only (verificação de código)
**Veredito**: ✅ PASS

**Verificação**:
- Novo componente: `frontend/src/components/simulator/EditableTreeViewer.tsx` (366 linhas)
- Props: `componentes`, `onChange`, `insumos`, `receitas`, `loading`, `selectedProductName`
- CRUD recursivo de componentes com chamada à API `calculateCost`
- Importado e usado em `SimulatorPage.tsx`

### 6. AC-5: simulator_service refatorado em módulos

**Cenário**: backend-only (verificação de código)
**Veredito**: ✅ PASS

**Verificação**:
- `backend/app/services/simulator_calculator.py` (16 linhas) — funções puras
- `backend/app/services/simulator_evolution.py` (92 linhas) — formatação de dados
- `backend/app/services/simulator_service.py` (1110 linhas) — orquestrador

### 7. AC-6: Funcionalidade existente preservada

**Cenário**: backend-only
**Veredito**: ✅ PASS

**Verificação**:
- Testes de lógica de cálculo (calculate_new_price, format_change_applied) passam
- Testes de simulação (price_change, recipe_change) passam
- 19/19 testes passando

### 8. AC-7: Testes de API passando

**Cenário**: backend-only
**Veredito**: ✅ PASS

**Comando**:
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/test_simulator_service.py -v
```

**Resultado**:
```
19 passed in 0.44s
```

## Evidências

- `evidence/diff-stat.txt` — Diff stat de todos os arquivos alterados
- `evidence/diff-backend.txt` — Diff completo do backend
- Testes: `cd backend && source .venv/bin/activate && python -m pytest tests/ -v`
- Endpoint calculate-cost: `curl` tests acima
