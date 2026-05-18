---
name: handoff
description: Gera documentação de handoff entre backend e frontend. Ative quando uma task de backend for concluída e precisar comunicar endpoints, schemas e regras para o frontend. Frases gatilho: "create handoff", "document API", "frontend handoff".
tools:
  - read
  - write
  - run_command
---

# Handoff — Documentação de Integração Backend → Frontend

Esta skill gera um documento estruturado de handoff quando uma task de backend é concluída, para que o frontend (ou seu agente) tenha todo o contexto necessário sem precisar perguntar.

**Modo de operação**: Sem saída em chat. Produza APENAS o documento markdown salvo no arquivo — sem discussão, sem explicação extra.

## Quando Ativar

- Task de backend concluída (status: review)
- Antes de iniciar a task de frontend correspondente
- Quando o usuário disser: "create handoff", "document API", "frontend handoff"
- Quando a API for simples (CRUD) → use o shortcut: apenas endpoint, método e exemplo JSON

## Fluxo

### 1. Coletar Contexto

Leia:
- `tasks/backend/ticket.md` — descrição, critérios, plano executado
- `tasks/backend/meta.json` — steps completos, arquivos alterados
- Código backend implementado (controllers, services, routes, DTOs, schemas)
- `artifacts/implementation-plan.md` — plano original para referência

### 2. Escanear o Código Implementado

```bash
# Encontrar arquivos novos/modificados no backend
cd .ai-tickets/worktrees/issue-{id}-{slug}
git diff main --name-only -- '*.ts' '*.tsx' '*.js' '*.py' '*.go'

# Listar rotas/endpoints criados
find . -path '*/routes/*' -o -path '*/controllers/*' -o -path '*/api/*' 2>/dev/null | grep -v node_modules | head -20

# Listar schemas/DTOs
find . -name '*.schema.*' -o -name '*.dto.*' -o -name '*.model.*' 2>/dev/null | grep -v node_modules | head -10
```

Leia os arquivos alterados para extrair:
- Endpoints (método, path, request/response shape)
- DTOs e schemas (campos, tipos, nullable, enums)
- Regras de validação
- Autenticação e permissões
- Edge cases descobertos durante implementação

### 3. Gerar o Documento de Handoff

Crie `artifacts/handoff.md` em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/` com o seguinte formato:

```markdown
# Handoff: {FEATURE_NAME}

## Business Context

{2-4 frases: O que este endpoint resolve? Quem usa? Por que importa?}

## Endpoints

### {METHOD} /path/to/endpoint

- **Purpose**: {1 linha: o que faz}
- **Auth**: {role/permissão necessária, ou "public"}
- **Request**:
  ```json
  {
    "field": "tipo — descrição, constraints"
  }
  ```
- **Response (success)**:
  ```json
  {
    "field": "tipo — descrição"
  }
  ```
- **Response (error)**: {HTTP codes e shapes, ex: 422 validation, 404 not found}
- **Notes**: {edge cases, rate limits, paginação, não-óbvios}

## Data Models / DTOs

| Campo | Tipo | Nullable | Descrição |
|-------|------|----------|-----------|
| id | string | no | UUID |
| name | string | no | Nome do usuário |

## Enums & Constants

| Nome | Valores | Display |
|------|---------|---------|
| Status | pending, approved, rejected | Pendente, Aprovado, Rejeitado |

## Validação (Regras que o Frontend Deve Espelhar)

- `email`: obrigatório, formato email, máx 255 chars
- `amount`: obrigatório, min 0.01, máx 999999.99

## Business Logic & Edge Cases

- {Comportamento não-óbvio, constraint, ou gotcha}
- Ex: "Usuário só pode aprovar uma vez", "Itens soft-deleted são excluídos por padrão"

## Integration Notes

- **Fluxo recomendado**: Fetch list → select item → submit form → poll status
- **Optimistic UI**: {safe ou não, e por que}
- **Caching**: {cache headers, invalidation triggers}
- **Real-time**: {websocket events, polling intervals}

## Test Scenarios

- Happy path: {descrição}
- Error: {descrição do caso de erro}
- Edge case: {descrição}

## Open Questions / TODOs

{Se houver. Se não, omitir seção.}
```

### 4. Shortcut para APIs Simples (CRUD)

Se a API for CRUD sem lógica de negócio complexa, pode gerar versão simplificada:

```markdown
## Endpoints

### GET /api/items
→ `{ items: Item[] }`

### POST /api/items
← `{ name: string, price: number }`
→ `{ id: string, name: string, price: number, created_at: string }`

### GET /api/items/:id
→ `Item`

### DELETE /api/items/:id
→ `204 No Content`
```

### 5. Finalizar

- Salve o documento em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/handoff.md`
- NÃO imprima o documento no chat — apenas referencie o path
- Informe: "✅ Handoff gerado em artifacts/handoff.md — pronto para o frontend consumir"
