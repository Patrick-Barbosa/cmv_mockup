# Learning: Evidências são sempre obrigatórias

**Data:** 2026-05-15
**Contexto:** Issue 01 — Refatorar SimulatorPage
**Tag:** #workflow #qa #evidence

## Observação

O usuário explicitou que **sempre** quer evidências visuais + testes passando para avaliar o trabalho. Nunca pular a etapa de geração de evidências.

## Checklist para próximas issues

- [ ] Rodar `pytest -v` e capturar output
- [ ] Gerar `diff-stat` entre branch e main
- [ ] Subir backend + testar endpoints com `curl`
- [ ] Subir frontend + navegar com `playwright-cli` (screenshots)
- [ ] Salvar tudo em `brain/issue-{id}-{slug}/evidence/`
- [ ] Gerar `qa-report.md` completo
