---
name: qa-validation
description: Valida a implementação completa contra os critérios de aceite usando playwright-cli para integração frontend+backend e curl para API. Ative APÓS todas as tasks estarem concluídas e antes do review humano.
tools:
  - read
  - write
  - run_command
---

# QA Validation — Validação de Critérios de Aceite

Esta skill executa validações contra a implementação completa, separando claramente dois cenários:

| Cenário | Sobe | Testa via | Objetivo |
|---------|------|-----------|----------|
| **Backend-only** | SGBD + backend | curl | Endpoints, respostas, validações, status |
| **Frontend + Backend** | SGBD + backend + frontend | playwright-cli | UI + comunicação real com backend |

⚠️ **Nunca teste frontend sem backend.** O frontend precisa do backend real para validar integração. Não use mocks.

## Pré-condições

- Todas as tasks concluídas (status: review ou done)
- Worktree de código em `.ai-tickets/worktrees/issue-{id}-{slug}/`
- Worktree de storage em `.ai-tickets/storage/.ai-tickets/`
- `playwright-cli` instalado (`npm install -g @playwright/cli@latest`)
- Ticket parent em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/ticket.md`
- Handoff (opcional) em `artifacts/handoff.md`
- `AGENTS.md` lido — seção **Ambiente** para comandos de setup
- **Evidência obrigatória**: vídeo 1080p da feature funcionando (sempre gerado)

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
cd .ai-tickets/worktrees/issue-{id}-{slug}

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
cd .ai-tickets/worktrees/issue-{id}-{slug}

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

️ **EVIDÊNCIA OBRIGATÓRIA — VÍDEO 1080p**:
- SEMPRE gere um vídeo como evidência final, independentemente de `expected_evidence`
- NÃO gere screenshots ou outras evidências a menos que explicitamente solicitado
- O vídeo deve ser gravado em 1920x1080 (1080p)
- Mostre a feature implementada funcionando:
  1. Navegue até a página da feature
  2. Interaja com os elementos (clique, preencha formulários, etc.)
  3. Role a página lentamente de cima a baixo para mostrar todo o conteúdo
  4. Feche o navegador após a gravação

```bash
# 4.1 Definir caminho do vídeo
EVIDENCE_DIR=".ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence"
VIDEO_FILE="$EVIDENCE_DIR/qa-validation-$(date +%Y%m%d-%H%M).webm"

# 4.2 Abrir navegador em 1080p e iniciar gravação
playwright-cli open --headed
playwright-cli resize 1920 1080
playwright-cli video-start "$VIDEO_FILE" --size="1920x1080"

# 4.3 Navegar para a página da feature
playwright-cli goto http://localhost:5173/{rota-da-feature}

# 4.4 Aguardar carregamento
sleep 2

# 4.5 Interagir com a feature (clique, preencha, etc.)
playwright-cli click "{seletor-do-elemento}"
# ... outras interações conforme a feature

# 4.6 Rolar a página lentamente de cima a baixo
playwright-cli press "End"
sleep 1
playwright-cli press "Home"
sleep 1

# 4.7 Parar gravação e fechar navegador
playwright-cli video-stop
playwright-cli close
```

**Validação de comunicação frontend↔backend**: após interagir com a UI, verifique se o backend recebeu e processou a requisição corretamente:

```bash
# Verificar logs do backend (se disponível)
curl -s http://localhost:3000/api/audit 2>/dev/null || \
  curl -s http://localhost:3000/api/recent-requests 2>/dev/null || \
  echo "Endpoint de auditoria não disponível — verificar manualmente"
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
cd .ai-tickets/worktrees/issue-{id}-{slug}
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

Crie `artifacts/evidence/qa-report.md` em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/`:

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

**Evidência**: `artifacts/evidence/qa-validation-*.webm`

---

### 2. {Próximo critério}
```

### 8. Finalizar

- Salve `qa-report.md` em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/`
- **Única evidência**: o vídeo gravado em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/qa-validation-*.webm`
- NÃO gere screenshots ou outras evidências a menos que explicitamente solicitado no ticket
- Atualize `meta.json` do parent: adicione `qa-report.md` e o caminho do vídeo em `evidences[]`
- Pare os servidores:
  ```bash
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  docker compose down 2>/dev/null || true
  ```

### 9. Reportar ao Tech Lead

```
✅ QA concluído: {X}/{Y} critérios aprovados
📄 Relatório: artifacts/evidence/qa-report.md
🎥 Vídeo: artifacts/evidence/qa-validation-*.webm (1080p)
🌐 Frontend testado com backend real: sim
❌ Falhas: {lista de critérios FAIL}
⚠️  Skipped: {lista de critérios SKIP}
🔄 Ciclo de correção: {N}/3
```
```
✅ QA concluído: {X}/{Y} critérios aprovados
📄 Relatório: artifacts/evidence/qa-report.md
🌐 Frontend testado com backend real: sim
❌ Falhas: {lista de critérios FAIL}
⚠️  Skipped: {lista de critérios SKIP}
🔄 Ciclo de correção: {N}/3
```

**⚠️ Sobre ciclos de correção**: Se este não for o primeiro QA (ciclo > 1), foque APENAS nos critérios que falharam no ciclo anterior. Não re-teste tudo — apenas o que mudou. O relatório deve incluir o diff dos critérios do ciclo anterior vs atual.
