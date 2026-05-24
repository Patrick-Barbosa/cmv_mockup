---
name: implement
description: Implementa tickets seguindo o plano técnico. Use com domain=frontend|backend|infra. Ativado pelo Tech Lead ou especialistas.
tools:
  - read
  - write
  - run_command
---

# Implement — Workflow de Implementação

Esta skill implementa tasks de forma autônoma na worktree isolada. Unifica os fluxos de frontend e backend em uma skill parametrizada por `domain`.

## Pré-condições

- Worktree de código já criada em `.ai-tickets/worktrees/issue-{id}-{slug}/`
- Worktree de storage em `.ai-tickets/storage/.ai-tickets/`
- Task em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/tasks/{domain}/ticket.md`
- Task meta em `.ai-tickets/storage/.ai-tickets/issues/issue-{id}-{slug}/tasks/{domain}/meta.json`
- AGENTS.md lido para contexto

## Fluxo

### 1. Setup

Leia `AGENTS.md` → seção **Ambiente** para comandos de setup (SGBD, backend, frontend, portas).

```bash
cd .ai-tickets/worktrees/issue-{id}-{slug}/
# Instalar dependências se necessário (npm install, pip install, etc.)
# Subir SGBD se necessário: docker compose up -d db
# Iniciar servidor: npm run dev (ou comando do AGENTS.md)
```

### 2. Implementação com Commits Atômicos

Cada passo do plano deve ser uma unidade atômica que pode ser commitada e desfeita isoladamente. Isso permite rollback sem afetar outros passos.

Para cada passo do plano:

1. Leia os arquivos relevantes na worktree de código
2. Faça as alterações necessárias (apenas o escopo deste passo)
3. Execute testes relevantes:
   ```bash
   npm test -- --related  # Node/React
   pytest -k "test_name"  # Python
   go test ./...          # Go
   ```
4. Se os testes falharem, corrija antes de prosseguir
5. **Commit atômico** após cada passo bem-sucedido:
   ```bash
   git add {arquivos modificados}
   git commit -m "{domain}: {descrição concisa do passo}"
   ```
   Exemplo: `backend: add POST /api/login endpoint with JWT validation`
6. Máximo de 3 tentativas por passo. Se persistir, pare e reporte.

### 3. Verificação (por domínio)

**Frontend:**
- **Valide imports antes de commitar** — garanta que todos os imports referenciam arquivos existentes:
  ```bash
  # Extrair imports de arquivos .tsx/.ts
  grep -rh "from ['\"]@/" src/ --include="*.tsx" --include="*.ts" | sort -u
  # Verificar se os arquivos importados existem
  ```
- Execute a suite completa de testes:
  ```bash
  npm test
  ```
- **Build obrigatório** — NÃO marque `review` sem build passing:
  ```bash
  npm run build
  ```
  Se o build falhar, corrija antes de prosseguir.
- Gere screenshot da UI (se aplicável) via `evidence-gen`

**Backend:**
- Execute a suite completa de testes
- Verifique lint:
  ```bash
  npm run lint  # ou ruff, golangci-lint, etc.
  ```
- **Build obrigatório** — NÃO marque `review` sem build passing:
  ```bash
  npm run build  # ou comando equivalente do backend
  ```

**Infra:**
- Verifique sintaxe de config (Dockerfile, compose, etc.):
  ```bash
  docker compose config  # se aplicável
  docker compose pull 2>/dev/null  # verificar imagens disponíveis
  ```
- Valide scripts de CI/CD:
  ```bash
  # GitHub Actions — verificar sintaxe YAML
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" 2>/dev/null || true
  ```

### 4. Finalização

- Atualize `tasks/{domain}/ticket.md` na worktree de storage: `status: review`
- Atualize `tasks/{domain}/meta.json` na worktree de storage: steps completos, arquivos alterados, resultados dos testes/lint
- Informe ao Tech Lead ou agente orquestrador que a task está concluída
