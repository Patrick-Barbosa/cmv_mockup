---
name: evidence-gen
description: Gera artefatos visuais para review humano usando playwright-cli. Ative quando a implementação estiver concluída e pronta para review. Respeita expected_evidence do ticket.
tools:
  - read
  - write
  - run_command
---

# Evidence Gen — Geração de Evidências Visuais com Playwright CLI

Esta skill gera artefatos visuais para auxiliar o review humano, usando `playwright-cli` (da Microsoft) para automação de navegador. Respeita as evidências esperadas definidas no ticket (`expected_evidence` no frontmatter).

## Pré-condições

- Implementação concluída na worktree de código
- Diretório `artifacts/evidence/` já criado em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/`
- Worktree de código em `.ai-tickets/worktrees/issue-{id}-{slug}/`
- Worktree de storage em `.ai-tickets/storage/.ai-tickets/`

## Setup Playwright CLI

```bash
# Instalar playwright-cli (uma vez)
npm install -g @playwright/cli@latest

# Instalar skills do playwright (uma vez, opcional)
playwright-cli install --skills 2>/dev/null || true
```

Se global não funcionar, use `npx @playwright/cli` como fallback.

## Passo 0: Ler Evidências Esperadas

Leia o campo `expected_evidence` do frontmatter do `ticket.md` (parent). Gere APENAS os tipos solicitados. Se vazio, gere todos aplicáveis.

## Artefatos a Gerar

### 1. Diff Renderizado (sempre)

```bash
cd .ai-tickets/worktrees/issue-{id}-{slug}
git diff main --stat > .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/diff-stat.txt
git diff main > .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/diff.txt
```

```bash
git diff main -- '*.ts' '*.tsx' '*.js' '*.py' '*.go'
```

### 2. Screenshot (se expected_evidence incluir "screenshot" ou domínio for frontend)

```bash
# Iniciar o servidor dev se necessário
cd .ai-tickets/worktrees/issue-{id}-{slug}
npm run dev &
DEV_PID=$!
sleep 5

# Usar playwright-cli para navegar e capturar
playwright-cli open http://localhost:3000
playwright-cli snapshot --filename=.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/page-snapshot.md
playwright-cli screenshot --filename=.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/screenshot.png

# Se houver um elemento específico para capturar (formulário, modal, etc.):
# playwright-cli snapshot para obter refs dos elementos
# Depois capture o elemento específico

# Fechar navegador e servidor
playwright-cli close
kill $DEV_PID 2>/dev/null || true
```

Se o servidor não subir em 5s, ajuste o sleep. Se playwright-cli não estiver instalado:
```bash
npx playwright-cli open http://localhost:3000
```

### 3. Gravação de Vídeo (se expected_evidence incluir "vídeo", "gif" ou "recording")

```bash
# playwright-cli suporta tracing para gravação de interações
playwright-cli open http://localhost:3000 --headed
# Execute os cliques e navegações do fluxo desejado
# playwright-cli click e15
# playwright-cli type "text"
# playwright-cli press Enter
# Capture screenshot de cada passo
playwright-cli screenshot --filename=.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/step1.png
```

Para um fluxo guiado, use:
```bash
# 1. Snapshot da página inicial
playwright-cli snapshot
# 2. Clique no elemento X
playwright-cli click e5
# 3. Snapshot após clique
playwright-cli screenshot --filename=.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/after-click.png
# Repita para cada passo do fluxo
```

### 4. Resultados dos Testes (sempre)

```bash
cd .ai-tickets/worktrees/issue-{id}-{slug}
npm test 2>&1 | tee .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/test-results.txt
```

### 5. QA Report (quando expected_evidence incluir "qa" ou "validação")

Valide cada acceptance criterion do ticket:

```bash
# Para cada endpoint alterado, teste com curl
curl -X GET http://localhost:3000/api/endpoint -H "Authorization: Bearer test" \
  -o .ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/api-response.json 2>/dev/null

# playwright-cli para validar fluxo de UI
playwright-cli open http://localhost:3000/login
playwright-cli fill --selector="input[name=email]" "test@test.com"
playwright-cli fill --selector="input[name=password]" "password123"
playwright-cli click "button[type=submit]"
playwright-cli screenshot --filename=.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/login-flow.png
playwright-cli close
```

## Saída Esperada

```
.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/artifacts/evidence/
├── diff.txt                # Diff completo
├── diff-stat.txt           # Estatísticas do diff
├── page-snapshot.md        # Snapshot da página (refs para elementos)
├── screenshot.png          # Screenshot da página
├── step1.png               # Screenshots de fluxo
├── step2.png
├── test-results.txt        # Output dos testes
├── api-response.json       # Resposta de API (se aplicável)
└── qa-report.md            # Relatório de validação (se aplicável)
```
artifacts/evidence/
├── diff.txt                # Diff completo
├── diff-stat.txt           # Estatísticas do diff
├── page-snapshot.md        # Snapshot da página (refs para elementos)
├── screenshot.png          # Screenshot da página
├── step1.png               # Screenshots de fluxo
├── step2.png
├── test-results.txt        # Output dos testes
├── api-response.json       # Resposta de API (se aplicável)
└── qa-report.md            # Relatório de validação (se aplicável)
```

## Finalização

Após gerar, atualize `meta.json` do parent: adicione cada arquivo gerado em `evidences[]`.
