---
name: retro
description: Gera retrospectiva pós-implementação analisando diff, QA report e feedback do review. Ative quando um ticket for concluído (done) para extrair aprendizado.
tools:
  - read
  - write
  - run_command
---

# Retro — Retrospectiva e Aprendizado

Esta skill gera uma retrospectiva da implementação após o merge, analisando diff, QA report, handoff e feedback do review. O objetivo é acumular aprendizado no projeto.

## Quando Ativar

- Ticket concluído (status: `done`)
- Merge realizado
- Antes de arquivar o ticket

## Entrada

- `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/ticket.md` — descrição, critérios, plano
- `artifacts/implementation-plan.md` — o que foi planejado
- `artifacts/evidence/qa-report.md` — o que passou/falhou no QA
- `artifacts/handoff.md` — o que foi documentado
- `artifacts/evidence/diff.txt` — o que realmente mudou
- `meta.json` — `correction_cycles`, `review_cycles`

## Fluxo

### 1. Coletar Dados

Leia todos os artefatos da issue para entender o ciclo completo.

### 2. Analisar

Para cada dimensão, extraia:

| Dimensão | O que analisar |
|----------|---------------|
| **Plano vs Realidade** | O plano original bateu com o que foi implementado? Algo ficou de fora? |
| **QA** | Quantos ciclos de correção? O que falhou? Padrões de erro? |
| **Review** | Quantos ciclos de review? O revisor pediu o quê? |
| **Handoff** | O handoff foi útil? Algo ficou de fora? |
| **Surpresas** | O que não estava no plano mas precisou ser feito? |

### 3. Gerar Retrospectiva

Crie `.ai-tickets/storage/.ai-tickets/learnings/issue-{id}-{slug}/retro.md`:

```markdown
# Retrospectiva — {TICKET_TITLE}

**Issue**: issue-{id}-{slug}
**Data**: {data}

## Sumário

- **Plano**: {X} passos planejados
- **QA**: {Y} ciclos de correção
- **Review**: {Z} ciclos de revisão
- **Duração**: {início} → {fim}

## O Que Funcionou Bem

- {ponto 1}
- {ponto 2}

## O Que Poderia Ser Melhor

- {ponto 1}
- {ponto 2}

## Surpresas / Descobertas

- {algo que não estava no plano mas foi necessário}
- {edge case descoberto durante implementação}

## Aprendizados para Próximos Tickets

- {lição 1}
- {lição 2}

## Sugestões de Melhoria no Processo

- {sugestão para o kit de agentes}
- {sugestão para o AGENTS.md}
```

### 4. Atualizar Ticket

Adicione ao `ticket.md` do parent:
```yaml
retro_summary: "{1 linha com o principal aprendizado}"
```

### 5. Reportar

```
✅ Retrospectiva gerada em .ai-tickets/storage/.ai-tickets/learnings/issue-{id}-{slug}/retro.md
💡 Principal aprendizado: {resumo}
```
