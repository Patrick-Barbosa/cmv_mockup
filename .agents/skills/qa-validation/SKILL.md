---
name: qa-validation
description: Valida a implementação completa contra os critérios de aceite usando playwright-cli para integração frontend+backend e curl para API. Ative APÓS todas as tasks estarem concluídas e antes do review humano.
tools:
  - read
  - write
  - run_command
---

# QA Validation — Validação de Critérios de Aceite

> **📌 Aprendizados vinculados**: `brain/learnings/qa-simulacao-padrao.md`
>
> Ao testar o Simulador, SEMPRE use os parâmetros agressivos definidos no aprendizado
> (Farinha de trigo → R$ 600, Pizza Marguerita → R$ 300) para garantir impacto visível.
> Simulações com valores baixos ou insumos sem vínculo não validam o cálculo.

Esta skill executa validações contra a implementação completa, separando claramente dois cenários:

| Cenário | Sobe | Testa via | Objetivo |
|---------|------|-----------|----------|
| **Backend-only** | SGBD + backend | curl | Endpoints, respostas, validações, status |
| **Frontend + Backend** | SGBD + backend + frontend | playwright-cli | UI + comunicação real com backend |

⚠️ **Nunca teste frontend sem backend.** O frontend precisa do backend real para validar integração. Não use mocks.

## Pré-condições

- Todas as tasks concluídas (status: review ou done)
- Worktree em `brain/worktrees/issue-{id}-{slug}/`
- `playwright-cli` instalado (`npm install -g @playwright/cli@latest`)
- Ticket parent em `brain/issue-{id}-{slug}/ticket.md`
- Acceptance criteria em `brain/issue-{id}-{slug}/00-criterios-de-aceite.md`
- Handoff (opcional) em `brain/issue-{id}-{slug}/handoff.md`
- `AGENTS.md` lido — seção **Ambiente** para comandos de setup

## Fluxo

### 1. Extrair Critérios

Leia o ticket parent e extraia a lista de acceptance criteria. Para cada critério, classifique em um dos cenários:

| Cenário | Tipo de critério | Exemplo |
|---------|-----------------|---------|
| **Backend-only** | "API retorna 200", "endpoint X cria recurso", "validação rejeita campo inválido" | `curl` |
| **Frontend + Backend** | "usuário vê tela de login", "formulário submete e mostra erro", "botão X leva para página Y" | `playwright-cli` + backend real rodando |

### 2. Setup do Ambiente

Leia `AGENTS.md` → seção **Ambiente** para comandos exatos de setup.

#### 2.1 Se houver critérios Backend-only

```bash
cd brain/worktrees/issue-{id}-{slug}

# SGBD (se docker)
docker compose up -d db 2>/dev/null || true

# Backend
npm run dev 2>/dev/null || python manage.py runserver 2>/dev/null || true &
BACKEND_PID=$!

sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || \
  echo "⚠️ Backend não respondeu"
```

Valide endpoints com `curl`. Após terminar, mantenha o backend no ar se houver também critérios de frontend.

#### 2.2 Se houver critérios Frontend + Backend

```bash
cd brain/worktrees/issue-{id}-{slug}

# SGBD (se docker)
docker compose up -d db 2>/dev/null || true

# Backend (obrigatório — frontend precisa dele)
npm run dev 2>/dev/null || python manage.py runserver 2>/dev/null || true &
BACKEND_PID=$!

sleep 3

# Frontend
npm run dev 2>/dev/null || npx vite 2>/dev/null || npx next dev 2>/dev/null || true &
FRONTEND_PID=$!

sleep 5

# Verificar ambos
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health && echo "✅ Backend OK" || echo "⚠️ Backend não respondeu"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 && echo "✅ Frontend OK" || echo "⚠️ Frontend não respondeu"
```

### 3. Validar Critérios Backend-only

Sobe apenas SGBD + backend. Testa exclusivamente via `curl`.

```bash
# GET — verificar status e body
curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/endpoint

# POST — criar recurso
curl -s -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}' \
  -w "\nHTTP_CODE:%{http_code}"

# Validar shape do response
curl -s http://localhost:3000/api/endpoint | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert 'id' in data, 'Campo id ausente'
assert 'name' in data, 'Campo name ausente'
print('✅ Shape válido')
"

# Validar erro (ex: 422 validation)
curl -s -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"campo_invalido": ""}' \
  -w "\nHTTP_CODE:%{http_code}"
```

### 4. Validar Critérios Frontend + Backend

Sobe SGBD + backend + frontend. O frontend CONSUME o backend real. Testa via `playwright-cli`.

```bash
# 4.1 Abrir navegador na página alvo
playwright-cli open http://localhost:5173

# 4.2 Navegar para rota específica
playwright-cli goto http://localhost:5173/login

# 4.3 Obter snapshot para entender elementos disponíveis
playwright-cli snapshot

# 4.4 Interagir (o frontend chama o backend real)
playwright-cli fill --selector="input[name=email]" "test@test.com"
playwright-cli fill --selector="input[name=password]" "password123"
playwright-cli click "button[type=submit]"

# 4.5 Verificar resultado — o que o frontend mostra após a resposta do backend
playwright-cli snapshot

# 4.6 Capturar screenshot como evidência
playwright-cli screenshot --filename=brain/issue-{id}-{slug}/evidence/qa-criterion-frontend-1.png

# 4.7 Fechar navegador
playwright-cli close
```

**Validação de comunicação frontend↔backend**: após interagir com a UI, verifique se o backend recebeu e processou a requisição corretamente:

```bash
# Verificar logs do backend (se disponível)
curl -s http://localhost:3000/api/audit 2>/dev/null || \
  curl -s http://localhost:3000/api/recent-requests 2>/dev/null || \
  echo "Endpoint de auditoria não disponível — verificar manualmente"
```

### 5. Validação de Build (independente)

```bash
cd brain/worktrees/issue-{id}-{slug}
npm run build 2>&1 | tail -20
```

### 6. Tratamento de Erro por Critério

| Situação | Ação |
|----------|------|
| Backend não sobe | Tentar novamente. Se falhar → **FAIL** em TODOS os critérios |
| Frontend não sobe (mas backend sim) | Tentar novamente. Se falhar → **FAIL** nos critérios de frontend |
| curl retorna erro inesperado | Mostrar request + response no relatório → **FAIL** |
| playwright-cli não encontra elemento | Tentar 2 seletores alternativos. Se falhar → **FAIL** |
| UI mostra erro de rede (frontend não alcança backend) | **FAIL** — comunicação frontend↔backend quebrada |
| Critério depende de ambiente externo (API de terceiros) | Marcar como **SKIP** com justificativa |
| Tudo funciona como esperado | **PASS** |

### 7. Gerar Relatório

Crie `brain/issue-{id}-{slug}/qa-report.md`:

```markdown
# QA Report — {TICKET_TITLE}

**Issue**: issue-{id}-{slug}
**Data**: {data}
**Agente**: qa-validator
**Ciclo de correção**: {N}/3

## Resumo

| Total | ✅ PASS | ❌ FAIL | ⚠️ SKIP |
|-------|---------|---------|----------|
| {N}   | {X}     | {Y}     | {Z}      |

## Ambiente

- **Backend**: http://localhost:3000 (✅ / ❌)
- **Frontend**: http://localhost:5173 (✅ / ❌ / N/A)
- **SGBD**: {tipo} (✅ / ❌)

## Critérios

### 1. {Título do critério}

**Cenário**: backend-only | frontend+backend

**Veredito**: ✅ PASS / ❌ FAIL / ⚠️ SKIP

**Comando**:
```bash
{comando executado}
```

**Resultado**:
```
{output relevante}
```

**Evidência**: `brain/issue-{id}-{slug}/evidence/qa-criterion-1.png`

---

### 2. {Próximo critério}
```

### 8. Finalizar

- Salve `qa-report.md` em `brain/issue-{id}-{slug}/`
- Salve screenshots de cada critério em `brain/issue-{id}-{slug}/evidence/qa-criterion-{id}.png`
- (Opcional) Atualize `ticket.md` frontmatter: adicione `qa_report: brain/issue-{id}-{slug}/qa-report.md`
- Pare os servidores:
  ```bash
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  docker compose down 2>/dev/null || true
  ```

### 9. Reportar ao Tech Lead

```
✅ QA concluído: {X}/{Y} critérios aprovados
📄 Relatório: brain/issue-{id}-{slug}/qa-report.md
🌐 Frontend testado com backend real: sim
❌ Falhas: {lista de critérios FAIL}
⚠️  Skipped: {lista de critérios SKIP}
🔄 Ciclo de correção: {N}/3
```

**⚠️ Sobre ciclos de correção**: Se este não for o primeiro QA (ciclo > 1), foque APENAS nos critérios que falharam no ciclo anterior. Não re-teste tudo — apenas o que mudou. O relatório deve incluir o diff dos critérios do ciclo anterior vs atual.
