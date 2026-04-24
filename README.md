# CMV Mockup Empresa

Aplicação web para gestão de insumos e receitas, com foco em servir de base para cálculo de custo e evolução do produto de CMV.

Hoje o projeto está dividido em:

- backend em `FastAPI`
- banco `PostgreSQL`
- frontend estático em HTML + Tailwind + JavaScript vanilla

## O que já existe

- Cadastro de insumos com custos de referência
- Cadastro de receitas com um ou mais componentes
- Suporte a receitas compostas por outras receitas
- Edição e exclusão de insumos
- Edição e exclusão de receitas
- Visualização detalhada da composição de uma receita
- Busca paginada de produtos
- Cálculo automático de custos de receitas
- Suporte a diferentes unidades de medida
- Seed automático em ambiente de desenvolvimento
- Pasta de migrations SQL manuais para ambientes persistentes

## Estrutura

- `backend/app/main.py`: inicialização do FastAPI, CORS e registro de rotas
- `backend/app/database/session.py`: engine assíncrono, sessão e leitura de variáveis de ambiente
- `backend/app/database/models.py`: modelos `Produto` e `ComponenteReceita`
- `backend/app/database/initiliaze_db.py`: bootstrap do schema e seed de desenvolvimento
- `migrations/versions/`: scripts SQL versionados para mudanças manuais de schema e dados
- `backend/app/services/produto_service.py`: regras de negócio de insumos e receitas
- `backend/app/routers/api/`: endpoints de insumos e receitas
- `backend/app/routers/pages.py`: endpoints simples de status e leitura
- `backend/tests/`: testes do backend
- `frontend/`: landing page e telas estáticas consumindo a API
- `docker-compose.yml`: stack local com banco, backend e frontend

## Stack

- Python 3.12
- FastAPI
- SQLAlchemy async
- asyncpg
- PostgreSQL
- Pydantic
- python-dotenv
- pytest
- httpx
- Nginx
- Tailwind via CDN

## Rodando com Docker Compose

Pré-requisito:

- Docker
- Docker Compose

Suba o ambiente:

```bash
docker compose up --build
```

Para sobrescrever variáveis do Compose sem editar o arquivo principal:

```bash
cp .env.compose.example .env.compose.local
docker compose --env-file .env.compose.local up --build
```

Exemplo de uso para apontar o backend ao banco remoto:

```bash
APP_ENV=production
DATABASE_URL=postgresql+asyncpg://postgres.[host]:[password]@[pooler-host]:5432/postgres
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
VITE_BACKEND_URL=https://sua-api.example.com
```

Serviços:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

Notas importantes:

- O backend sobe com `APP_ENV=development`
- Em `development`, o app recria as tabelas e reinsere seed a cada inicialização
- Em ambientes persistentes, mudanças de schema e dados são aplicadas manualmente com SQL
- O banco no Compose já inicializa a extensão `uuid-ossp`

Para derrubar os containers:

```bash
docker compose down
```

Para derrubar também o volume do banco:

```bash
docker compose down -v
```

## Rodando sem Docker

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload
```

## Migrations

Carregar o `.env.compose.local` na sessão atual:

```bash
set -a
source .env.compose.local
set +a
```

Executar um script SQL manual:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" -f migrations/versions/20260423_01_clone_public_to_prd.sql
```

Criar um novo script:

```bash
touch migrations/versions/20260424_01_describe_change.sql
```

Fluxo recomendado para evoluir o schema:

1. altere os modelos em `backend/app/database/models.py`
2. crie um novo arquivo SQL em `migrations/versions/`
3. escreva o SQL manualmente, preferindo scripts idempotentes quando possível
4. carregue o ambiente com `set -a`, `source .env.compose.local`, `set +a`
5. execute manualmente o script no banco alvo
6. valide os resultados diretamente no banco

Comportamento por ambiente:

- `APP_ENV=development`: o app recria tabelas e reinsere seed no startup
- `APP_ENV=production`: o app garante o schema; migrations devem ser rodadas manualmente com SQL

Observações:

- `APP_ENV=development` continua usando recriação de tabelas + seed
- `APP_ENV=production` não executa migrations automaticamente
- o projeto deixou de usar Alembic devido a comportamento inconsistente observado ao trafegar por pooler do Supabase
- os scripts SQL ficam versionados em `migrations/versions/`
- a `DATABASE_URL` da aplicação usa formato do SQLAlchemy (`postgresql+asyncpg://...`) e pode não ser reutilizada diretamente em ferramentas como `psql`

## Variáveis de ambiente

As principais variáveis estão documentadas em `.env-example`:

- `APP_ENV`: `development` ou `production`
- `DATABASE_URL`: conexão do PostgreSQL
- `ALLOWED_ORIGINS`: origins liberadas no CORS

No frontend em container, `BACKEND_URL` é usada para gerar `frontend/static/config.js` no startup.

## Endpoints principais

Páginas/status:

- `GET /`
- `GET /home`
- `GET /insumos`
- `GET /receitas`
- `GET /receitas/{id}`

API:

- `GET /api/unidades`
- `GET /api/get_produtos_select2`
- `POST /api/insumos/create`
- `PATCH /api/insumos/{id}`
- `DELETE /api/insumos/{id}`
- `GET /api/receitas/{id}`
- `POST /api/receitas/create`
- `PATCH /api/receitas/{id}`
- `DELETE /api/receitas/{id}`

## Estado atual

Alguns pontos importantes do projeto neste momento:

- o frontend é estático e conversa direto com a API
- o ambiente de desenvolvimento apaga e recria as tabelas ao iniciar
- o roadmap do MVP ainda inclui as etapas de vendas, CMV ideal e simulador de impacto
