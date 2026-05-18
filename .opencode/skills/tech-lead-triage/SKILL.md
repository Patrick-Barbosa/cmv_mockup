---
name: tech-lead-triage
description: Tria tickets, cria tasks por domínio e delega execução síncrona. Ative quando o ticket estiver em "synced" e precisar de triagem.
tools:
  - read
  - write
  - run_command
---

# Tech Lead Triage — Triagem e Delegação

Esta skill analisa um ticket, gera o plano técnico, cria tasks por domínio e orquestra a execução síncrona na mesma worktree.

⚠️ **Regra fundamental**: Tickets multi-domínio executam na MESMA worktree, de forma SÍNCRONA. Backend SEMPRE primeiro.

⚠️ **Storage de Tickets**: TODOS os arquivos de ticket (`.ai-tickets/issues/`, `.ai-tickets/templates/`, `.ai-tickets/learnings/`) são armazenados EXCLUSIVAMENTE na worktree de storage em `.ai-tickets/storage/.ai-tickets/`. Esta worktree é persistente e nunca é deletada. As worktrees de código são efêmeras e contêm APENAS código.

## Entrada

- Ticket em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/ticket.md`
- Meta em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/meta.json`
- Contexto do projeto em `AGENTS.md`

## Fluxo

### 1. Análise Inicial

Leia o frontmatter e o body do ticket. Entenda:
- **Descrição** do problema
- **Critérios de aceite**
- **Domínio** declarado (`frontend`, `backend`, `infra`)
- **Evidências esperadas** (`expected_evidence`)

### 2. Gerar Plano Técnico

**Ative a skill `plan-implementation`** para escanear o repositório e gerar o plano detalhado.

Após a execução da skill, releia o plano gerado em `artifacts/implementation-plan.md`.

### 3. Atualizar Status do Parent

Atualize `ticket.md` frontmatter: `status: planned`

### 4. Criar Tasks por Domínio

Baseado no plano gerado, crie uma task para cada domínio identificado:

```bash
mkdir -p .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/tasks/{domain}
```

Cada task contém:
- `tasks/{domain}/ticket.md` — subconjunto do plano técnico específico do domínio (descrição, arquivos impactados, passos)
- `tasks/{domain}/meta.json` — metadados da task:
  ```json
  {
    "ticket_id": "{id}-{domain}",
    "parent_id": "{id}",
    "domain": "{domain}",
    "status": "planned",
    "agent_assigned": null,
    "code_worktree_path": ".ai-tickets/worktrees/issue-{id}-{slug}",
    "agent_steps_completed": [],
    "completed_at": null,
    "created_at": "{data}",
    "updated_at": "{data}"
  }
  ```

Atualize `meta.json` do parent: adicione o domínio em `children_ids`.

| Domínio no plano | Criar task em |
|-----------------|-------------|
| `frontend` | `tasks/frontend/` |
| `backend` | `tasks/backend/` |
| `infra` | `tasks/infra/` |
| Múltiplos | Uma task por domínio |

### 5. Criar Worktree de Código (efêmera)

```bash
BRANCH="ai-tickets/${TICKET_ID}-${SLUG}"
git worktree add ".ai-tickets/worktrees/issue-${TICKET_ID}-${SLUG}" "$BRANCH" 2>/dev/null || \
  (git branch "$BRANCH" main && git worktree add ".ai-tickets/worktrees/issue-${TICKET_ID}-${SLUG}" "$BRANCH")
```

️ **Tratamento de erro**: Se a worktree não puder ser criada (conflito de branch, permissão), reporte o erro e não prossiga.

Atualize `code_worktree_path` no `meta.json` do parent e de cada task.

### 6. Executar Tasks — Síncrono com Handoff

**Ordem obrigatória:**
1. `infra` (se existir) → primeiro
2. `backend` (se existir) → segundo
3. `frontend` (se existir) → terceiro

Para cada task:

a) Atualize `tasks/{domain}/ticket.md` frontmatter: `status: in_progress`
b) Atualize `tasks/{domain}/meta.json`: `status: in_progress`
c) Invoque o especialista:
   - `frontend` → agente `frontend-specialist` com caminho `tasks/frontend/`
   - `backend` → agente `backend-specialist` com caminho `tasks/backend/`
   - `infra` → agente `infra-specialist` com caminho `tasks/infra/`
d) Passe para o especialista:
   - Caminho completo da task: `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/tasks/{domain}/`
   - Caminho da worktree de código: `.ai-tickets/worktrees/issue-{id}-{slug}/`
   - AGENTS.md como contexto
e) **Aguarde** o retorno do especialista (status deve ser `review`)
f) Se o especialista reportar erro, pare a execução e reporte ao usuário

**Handoff entre tasks**: Após a task de backend concluir (antes de iniciar frontend):
- Ative a skill `handoff` para gerar `artifacts/handoff.md` com endpoints, schemas e regras
- Passe o handoff como contexto adicional para o especialista frontend

### 7. Validar (QA)

Quando todas as tasks estiverem `review`:

a) Invoque o agente `qa-validator` com a skill `qa-validation`
b) Passe para o QA:
   - Caminho do ticket parent: `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/`
   - Caminho da worktree de código: `.ai-tickets/worktrees/issue-{id}-{slug}/`
   - AGENTS.md como contexto
c) O QA executa a skill `qa-validation` que:
   - Extrai acceptance criteria do parent
   - Sobe servidores (backend + frontend)
   - Valida cada critério com playwright-cli (UI) e curl (API)
   - Gera `artifacts/evidence/qa-report.md`
d) **Se QA PASS (todos ✅)**: prossiga para consolidar.
e) **Se QA FAIL (algum ❌)**: entre no **loop de correção** (seção 7.1).

#### 7.1 Loop de Correção (QA FAIL)

Quando QA falha, o fluxo não morre — ele entra em um loop controlado de correção:

```
QA FAIL → Tech Lead analisa → reabre task → especialista corrige → QA re-executa
  ↑                                                                         |
  └─────────────────────── até 3 ciclos ────────────────────────────────────┘
```

**Passo a passo:**

1. **Analise** o `qa-report.md` — entenda exatamente o que falhou e por quê
2. **Identifique** qual domínio causou a falha (frontend, backend, infra)
3. **Reabra a task**: atualize `tasks/{domain}/ticket.md` → `status: in_progress`
4. **Incremente** `correction_cycles` no `meta.json` do parent
5. **Adicione contexto de falha** no ticket da task:
   ```markdown
   ## Correção — Ciclo {N}/3

   ### O que falhou
   {transcrição do erro do qa-report.md}

   ### O que precisa ser corrigido
   {instrução específica baseada no relatório de QA}

   ### Evidências
   {caminho para screenshots/logs que comprovam a falha}
   ```
5. **Re-invoque o especialista** do domínio afetado com o contexto extra
6. Especialista corrige, commita atomicamente, retorna `status: review`
7. **Re-execute QA** (volta ao passo 7)
8. **Máximo de 3 ciclos**. Se na 3ª tentativa ainda falhar, reporte ao usuário:
   ```
   ❌ Não foi possível corrigir após 3 tentativas.
   📄 Último QA Report: artifacts/evidence/qa-report.md
   🔍 Domínio com falha: {domain}
   🛑 Ação necessária: revisão manual do usuário
   ```

### 8. Feedback Humano (Review no Linear)

Após QA passar, o ticket vai para review humano no Linear. O humano pode:

#### 8.1 Aprovar ✅
- Linear: `In Review → Done`
- Tech Lead: prossegue para consolidar e merge

#### 8.2 Solicitar Mudanças ❌
- Linear: `In Review → In Progress` com comentário
- Webhook ativa Tech Lead novamente
- Tech Lead lê o comentário de revisão e cria uma **correction task**:

```bash
mkdir -p .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/tasks/correction
```

- Incremente `review_cycles` no `meta.json` do parent
- `tasks/correction/ticket.md` contém:
  ```markdown
  ---
  status: in_progress
  domain: correction
  parent_id: "{id}"
  ---

  ## Revisão Humana

  {comentário completo do revisor no Linear}

  ## O que precisa ser ajustado

  {extraído do comentário pelo Tech Lead}
  ```
- Invoque o especialista relevante para corrigir na worktree existente
- Após correção → re-execute QA → re-envie para review
- **Máximo de 3 ciclos de review**. Se na 3ª ainda houver solicitações, escalate para o usuário.

### 9. Retrospectiva

Antes de consolidar, ative a skill `retro` para gerar retrospectiva em `.ai-tickets/storage/.ai-tickets/learnings/issue-{id}-{slug}/retro.md`. Isso acumula aprendizado para tickets futuros.

### 10. Consolidar

Quando QA validar tudo:
- **Valide build antes de merge** — NÃO faça merge sem `npm run build` passing:
  ```bash
  cd .ai-tickets/worktrees/issue-{id}-{slug}
  npm run build
  ```
  Se o build falhar, reabra a task do domínio afetado e corrija antes de prosseguir.
- Atualize `ticket.md` frontmatter: `status: done`
- Atualize `meta.json` do parent: `completed_at`
- Ative a skill `evidence-gen` para gerar artefatos visuais adicionais no parent

### 11. Limpar Worktree de Código (Opcional)

Após o merge, a worktree de código pode ser removida para liberar espaço:

```bash
git worktree remove .ai-tickets/worktrees/issue-{id}-{slug}
git branch -d ai-tickets/${TICKET_ID}-${SLUG}
```

⚠️ **IMPORTANTE**: A worktree de storage (`.ai-tickets/storage/`) NUNCA é removida. Ela contém todo o histórico de tickets.

### 12. Reportar

Informe no CLI:
- "✅ Plano técnico gerado em artifacts/implementation-plan.md"
- "📋 Tasks criadas: {domínios}"
- "🔄 Execução síncrona concluída (backend → frontend)"
- " Worktree de código: .ai-tickets/worktrees/issue-{id}-{slug}"
- " Worktree de storage: .ai-tickets/storage/.ai-tickets/"
- "✅ QA: {X}/{Y} critérios aprovados"
- " QA Report: artifacts/evidence/qa-report.md"
- "📎 Evidências geradas em artifacts/evidence/"
