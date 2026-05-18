---
name: project-context
description: Escaneia o repositório e gera AGENTS.md com stack, comandos e setup de ambiente. Parte do rito de inicialização do projeto, executado APÓS setup.sh.
tools:
  - read
  - write
  - run_command
---

# Project Context — Rito de Inicialização do Projeto

Esta skill escaneia o repositório e gera `AGENTS.md` na raiz, contendo stack, comandos, setup de ambiente e convenções. Faz parte do rito de inicialização junto com `setup.sh`.

**Ordem dos ritos:**
1. `setup.sh` — instala agents, skills, templates, estrutura de diretórios
2. `project-context` (esta skill) — detecta stack e gera AGENTS.md
3. `AGENTS.md` — usado por TODOS os agentes para entender o projeto (incluindo como subir o ambiente)

## Fluxo de Execução

### 1. Escanear a Estrutura

```bash
# Estrutura de diretórios (2 níveis)
find . -maxdepth 2 -not -path './.git/*' -not -path './node_modules/*' -not -path './.ai-tickets/*' | sort

# Arquivos de configuração
ls -la package.json pyproject.toml Cargo.toml go.mod composer.json 2>/dev/null

# Docker/compose
ls -la Dockerfile docker-compose.yml docker-compose.yaml 2>/dev/null
```

### 2. Detectar Stack (lendo arquivos de verdade)

**Leia** o conteúdo dos arquivos de configuração:

```bash
cat package.json 2>/dev/null | head -100
```

Analise o conteúdo para determinar:
- **Linguagens**: qual linguagem principal
- **Frameworks**: React, Vue, Django, Express, etc. (baseado nas dependências)
- **Banco de Dados**: PostgreSQL, MySQL, SQLite, etc.
- **Testes**: Jest, Vitest, Pytest, RSpec, etc.
- **CI/CD**: GitHub Actions, GitLab CI, etc.

```bash
cat pyproject.toml 2>/dev/null | head -50
cat Cargo.toml 2>/dev/null | head -50
cat go.mod 2>/dev/null | head -50
cat composer.json 2>/dev/null | head -50
```

### 3. Extrair Comandos

```bash
cat package.json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    scripts = d.get('scripts', {})
    for k, v in scripts.items():
        print(f'- {k}: {v}')
except: pass
" 2>/dev/null || cat package.json 2>/dev/null | head -80
```

Also check:
```bash
cat Makefile 2>/dev/null | head -30
cat Justfile 2>/dev/null | head -30
```

### 4. Detectar Setup de Ambiente

Esta etapa detecta como subir cada parte do ambiente e documenta no AGENTS.md.

```bash
# Docker?
ls docker-compose.yml docker-compose.yaml Dockerfile 2>/dev/null

# Backend detectado? (express, django, fastapi, flask, rails, etc.)
cat package.json 2>/dev/null | python3 -c "
import sys, json; d=json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
backend = [k for k in deps if k in ('express','fastify','nestjs','django','flask','fastapi','rails','spring')]
frontend = [k for k in deps if k in ('react','vue','next','nuxt','svelte','angular','vite')]
db = [k for k in deps if k in ('pg','mysql2','sqlite3','prisma','typeorm','mongoose')]
print('backend:', ', '.join(backend) if backend else 'none')
print('frontend:', ', '.join(frontend) if frontend else 'none')
print('database:', ', '.join(db) if db else 'none')
" 2>/dev/null || true

# Portas comuns
grep -r 'PORT\|port' .env .env.example .env.local 2>/dev/null | head -10
grep -r '3000\|5173\|5432\|8000' docker-compose.yml 2>/dev/null | head -10
```

Com base na detecção, documente:
- **SGBD**: qual banco, porta, como iniciar (docker compose up -d db, ou local)
- **Backend**: comando para iniciar (npm run dev, python manage.py runserver)
- **Frontend**: comando para iniciar (npm run dev, npx vite)
- **Portas**: backend (ex: 3000), frontend (ex: 5173), banco (ex: 5432)

### 5. Identificar Convenções

- Padrão de nomenclatura (camelCase, snake_case, kebab-case)
- Estrutura de componentes/páginas
- Style guide (ESLint, Prettier, Ruff, etc.) — verifique `.eslintrc*`, `.prettierrc*`, `ruff.toml`

### 6. Gerar AGENTS.md (Preencher TODAS as Seções)

Escreva `AGENTS.md` seguindo o template. Preencha **cada seção explicitamente**:

#### Stack
- **Linguagens**: baseado em `package.json` (Node, Python, Go, etc.)
- **Frameworks**: dependências detectadas (React, Express, Django, etc.)
- **Banco de Dados**: qual SGBD e ORM (PostgreSQL + Prisma, MySQL + TypeORM, SQLite)
- **Testes**: Jest, Vitest, Pytest, etc.
- **CI/CD**: GitHub Actions, GitLab CI (baseado em `.github/` ou `.gitlab-ci.yml`)

#### Estrutura do Repositório
- Cole a saída do `find . -maxdepth 2` (omitindo `.git`, `node_modules`, `.ai-tickets`)

#### Ambiente (CRÍTICO — agentes usam para subir serviços)

```markdown
### SGBD
- **Banco**: PostgreSQL
- **Porta**: 5432
- **Iniciar**: `docker compose up -d db`

### Backend
- **Framework**: Express
- **Porta**: 3000
- **Iniciar**: `npm run dev`

### Frontend
- **Framework**: React + Vite
- **Porta**: 5173
- **Iniciar**: `npm run dev`

### Stack Completa
docker compose up -d
npm run dev
```

Se algo não for detectado, escreva "Não detectado — configurar manualmente" em vez de omitir.

#### Convenções
- Estilo de código: baseado em config files (`.eslintrc`, `.prettierrc`, `ruff.toml`)
- Commits: analise `git log --oneline -5` para detectar padrão
- Nomenclatura de branches: veja branches existentes com `git branch`
- Padrão de testes: veja `*.test.*` ou `*.spec.*` nos diretórios

#### Comandos Importantes
- Extraia scripts do `package.json` e preencha cada subseção:
  ```bash
  # Build: npm run build
  # Testes: npm test
  # Lint: npm run lint
  # Dev server: npm run dev
  ```

#### Arquivos Principais
- Liste 5-10 arquivos mais relevantes (entrypoints, routes, models, components)

#### Preferências de Implementação
- Baseado em configurações de estilo e imports existentes

Regras:
- Seja conciso e factual
- **NÃO omita seções** — se algo não foi detectado, escreva "Não detectado — configurar manualmente"
- A seção **Ambiente** é a mais importante — agentes a usam para subir servidores
- Sempre informe ao usuário que o AGENTS.md foi gerado e onde encontrar a seção Ambiente
