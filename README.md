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
- Base de migrations com Alembic para ambientes persistentes

## Estrutura

- `backend/app/main.py`: inicialização do FastAPI, CORS e registro de rotas
- `backend/app/database/session.py`: engine assíncrono, sessão e leitura de variáveis de ambiente
- `backend/app/database/models.py`: modelos `Produto` e `ComponenteReceita`
- `backend/app/database/initiliaze_db.py`: bootstrap do schema e seed de desenvolvimento
- `backend/app/database/migrations.py`: execução programática das migrations do Alembic
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
- Alembic
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

Serviços:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

Notas importantes:

- O backend sobe com `APP_ENV=development`
- Em `development`, o app recria as tabelas e reinsere seed a cada inicialização
- Em ambientes persistentes, o app aplica migrations do Alembic no startup
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

Gerar ou aplicar migrations manualmente:

```bash
alembic upgrade head
```

Criar uma nova migration:

```bash
alembic revision -m "describe your change"
```

Fluxo recomendado para evoluir o schema:

1. altere os modelos em `backend/app/database/models.py`
2. crie uma migration nova com `alembic revision -m "..."`
3. implemente o `upgrade()` e o `downgrade()` no arquivo gerado em `alembic/versions/`
4. aplique localmente com `alembic upgrade head`
5. suba a aplicação no ambiente persistente para deixar o startup aplicar migrations automaticamente

Comportamento por ambiente:

- `APP_ENV=development`: não usa Alembic no startup; o app recria tabelas e reinsere seed
- `APP_ENV=production`: o app garante o schema e roda `alembic upgrade head` automaticamente no startup

Observações:

- `APP_ENV=development` continua usando recriação de tabelas + seed
- `APP_ENV=production` não usa mais `create_all`; o schema é garantido no startup e a evolução estrutural fica a cargo do Alembic
- o Alembic usa a mesma `DATABASE_URL` configurada no ambiente

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
