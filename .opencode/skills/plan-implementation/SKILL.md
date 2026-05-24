---
name: plan-implementation
description: Gera plano técnico detalhado de implementação escaneando o repositório. Ative ANTES de delegar para especialistas, durante a triagem do Tech Lead.
tools:
  - read
  - write
  - run_command
---

# Plan Implementation — Geração de Plano Técnico

Esta skill escaneia o repositório, lê o ticket e o `AGENTS.md`, e gera um plano técnico detalhado de implementação com tarefas por domínio (frontend, backend, infra).

## Entrada

- Ticket refinado em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/ticket.md` (contém descrição, critérios, NÃO contém plano técnico)
- Contexto do projeto em `AGENTS.md`
- Código fonte do repositório

## Fluxo

### 1. Entender o Contexto

Leia:
- `AGENTS.md` — stack, estrutura, convenções
- `ticket.md` — descrição, critérios de aceite, domínio, expected_evidence

### 2. Criar Estrutura de Artefatos

```bash
mkdir -p .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence
```

### 3. Escanear a Estrutura do Repositório

```bash
# Estrutura geral
find . -maxdepth 3 -not -path './.git/*' -not -path './node_modules/*' -not -path './.ai-tickets/*' -not -path './dist/*' -not -path './build/*' | sort

# Arquivos de rota/endpoint (para backend)
find . -type f -name "*route*" -o -name "*controller*" -o -name "*endpoint*" -o -name "*api*" -o -name "*view*" 2>/dev/null | grep -v node_modules | head -20

# Arquivos de componente/página (para frontend)
find . -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" 2>/dev/null | grep -v node_modules | head -20

# Arquivos de modelo/schema
find . -type f -name "*.model.*" -o -name "*.schema.*" -o -name "schema.prisma" 2>/dev/null | grep -v node_modules | head -10
```

### 4. Extrair Funções e Classes Relevantes

Use o script `scripts/scan-functions.py` para extrair assinaturas de funções e classes dos arquivos mais relevantes:

```bash
python3 .agents/skills/plan-implementation/scripts/scan-functions.py \
  --dir . \
  --patterns "*.ts" "*.tsx" "*.js" "*.jsx" "*.py" "*.go" "*.rb" \
  --exclude-dirs ".git,node_modules,.ai-tickets,dist,build" \
  --output .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/function-map.md
```

⚠️ **Tratamento de erro**: Se `python3` não estiver disponível ou o script falhar, gere o function-map manualmente analisando os arquivos mais relevantes com `read`. Reporte ao Tech Lead que o scan automático não foi possível.

Analise o output para entender:
- Quais funções/classes existem nos arquivos relevantes
- Onde cada função está (arquivo + linha)
- Assinaturas e parâmetros

### 5. Mapear o Impacto

Baseado na descrição do ticket e no código escaneado:

- Quais arquivos precisam ser **criados**?
- Quais arquivos precisam ser **modificados**?
- Quais funções precisam ser **alteradas** ou **criadas**?
- Testes existentes que podem **quebrar**?
- Testes novos que precisam ser **criados**?

### 6. Gerar o Plano Técnico

Crie `artifacts/implementation-plan.md` em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/`:

```markdown
# Plano de Implementação — {TICKET_TITLE}

## Visão Geral

{Sumário do que precisa ser feito}

## Tarefas por Domínio

### Frontend
- [ ] task 1 (arquivo: path) — descrição técnica
- [ ] task 2 (arquivo: path) — descrição técnica

### Backend
- [ ] task 1 (arquivo: path + função) — descrição técnica

## Arquivos Impactados

| Arquivo | Ação | Funções Relacionadas |
|---------|------|----------------------|
| path/to/file.ts | modify | `functionName` (linha 42) |
| path/to/new.ts | create | — |

## Testes

- Testes existentes que verificam as funções alteradas:
  - `tests/file.test.ts`
- Novos testes necessários:
  - `tests/new-feature.test.ts`
```

### 7. Atualizar o Ticket

Adicione a seção `## Plano de Implementação` no `ticket.md` com um resumo do plano, referenciando o arquivo completo em `artifacts/implementation-plan.md`.

### 8. Reportar

Informe ao Tech Lead:
- Plano gerado em `artifacts/implementation-plan.md`
- Domínios identificados e tarefas quebradas
- Sugestão de delegação e ordem de execução (backend primeiro se houver tasks de backend)
