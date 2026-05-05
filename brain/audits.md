# PO Audit Log

## 2026-05-03 - Review de APIs Simulador

### Task Review: review-2026-05-03-simulator

**Status:** REJECTED (requer correções)

#### Bugs Identificados:

| # | Bug | Severidade | Status |
|---|-----|------------|--------|
| 1 | `impacted_only` não funciona | Alta | A corrigir |
| 2 | `monthly_revenue_*` usa preço de venda em vez de custo | Alta | A corrigir |

#### Feedback Enviado ao BE:
- Arquivo: `brain/po-reviews/review-2026-05-03-simulator.md`
- Ações requeridas:
  1. Corrigir lógica de `impacted_only` em `get_daily_evolution()`
  2. Renomear ou corrigir cálculo de `monthly_revenue_*` em `_simulate_recipe_change()`

#### Tracking:
- [ ] Pendente correção do BE
- [ ] Novo review após correções