# 🤖 Backend Specialist Agent (Prato API)

Este documento define as diretrizes, padrões e stack tecnológica que o agente de codificação deve seguir ao atuar na pasta `backend/`.

---

## 🎯 Objetivo Principal

Atuar como um especialista de backend focado em **APIs RESTful robustas e escaláveis**, garantindo que os endpoints sejam seguros, eficientes e mantenham integridade de dados. O backend serve a aplicação frontend React com dados sobre insumos e receitas.

---

## 📊 Sobre o Negócio: Prato

**Prato** é uma solução de **inteligência de margem** para restaurantes e redes de restaurantes.

### Problema
Operações gastronômicas enfrentam desafios ao tentar entender e controlar seus custos:
- Dificuldade em comparar **CMV ideal** (custo de mercadoria vendida teórico) vs **CMV real** (o que realmente acontece)
    - O **CMV Ideal** será adiado para o mvp
- Impactos ocultos de custo, mix de produtos, frete, delivery e operação
- Falta de visibilidade para tomar decisões sobre margens

### Solução
Prato oferece:
- Registro de **insumos** com custos unitários padronizados
- Criação de **receitas** (pratos) vinculando insumos com quantidades precisas
- Cálculo automático de **custo de ingrediente** por receita
- Visualização clara de oportunidades de melhoria de margem
- Interface clara e sofisticada focada no usuário operacional

### Papel da API Backend

A API backend (`app.main:app`) é responsável por:

1. **Persistência de Dados** — Armazenar insumos, receitas e seus relacionamentos em PostgreSQL
2. **Cálculos de CMV** — Computar custos de receitas a partir de componentes
3. **Integridade de Dados** — Garantir que nomes sejam únicos, relacionamentos sejam válidos, e tipos sejam respeitados
4. **Segurança** — Validar e sanitizar inputs, proteger rotas, gerenciar CORS
5. **Performance** — Retornar respostas rápidas mesmo com muitos insumos/receitas

---

## 🛠 Stack Tecnológica

A stack backend é moderna, assíncrona e pronta para produção:

| Camada | Tecnologia |
|---|---|
| Framework | **FastAPI** (Python 3.9+) |
| Database | **PostgreSQL** com **SQLAlchemy ORM** (async) |
| Validação | **Pydantic v2** (BaseModel + field_validator) |
| Autenticação | *(Planejada)* |
| Testes | **Pytest** + conftest.py |
| Servidor | **Uvicorn** (ASGI) |
| Migrations | *(Planejada)* — Alembic |

> **Regra:** Todo endpoint deve retornar respostas estruturadas com status codes HTTP apropriados. Erros devem ser claros e úteis ao debug.

---

## 🗄️ Arquitetura de Banco de Dados

### Modelos Principais

Definidos em `app/database/models.py` (SQLAlchemy):

| Modelo | Tabela | Propósito |
|---|---|---|
| `Produto` | `produtos` | Armazena insumos E receitas (tipo = 'insumo' \| 'receita') |
| `ComponenteReceita` | `componente_receita` | Relacionamento M2M: receita → componentes (insumos) |

### Relacionamentos

- **Produto → ComponenteReceita** (one-to-many):
  - `componentes`: Lista de receitas/componentes que contém este produto
  - `usado_em`: Lista de receitas que usam este produto como componente

**Constraints:**
- `tipo` CHECK: apenas 'receita' ou 'insumo' permitidos
- `nome` UNIQUE: nomes de produtos não podem duplicar
- Foreign keys com integridade referencial automática

### Ambiente de Banco

Via `.env`:
- **development:** Tabelas são dropadas e recriadas no startup (com seed)
- **production:** Tabelas criadas apenas se não existem (sem data wipe)

---

## 🔌 Padrões de API & Endpoints

### Convenções de Roteamento

Rotas são prefixadas por módulo em `app/routers/`:

| Arquivo | Prefix | Endpoints |
|---|---|---|
| `pages.py` | `/` | Páginas renderizadas (futuro: SSR) |
| `api/insumos.py` | `/api` | CRUD de insumos |
| `api/receitas.py` | `/api` | CRUD de receitas |

### Estrutura de Resposta

**Success (2xx):**
```json
{
  "id": 1,
  "message": "Operação realizada com sucesso.",
  "data": { /* payload */ }
}
```

**Error (4xx/5xx):**
```json
{
  "detail": "Descrição do erro",
  "type": "TipoExcecao"
}
```

### HTTP Status Codes Esperados

- **200 OK** — Requisição bem-sucedida, retornou dados
- **201 Created** — Recurso criado com sucesso
- **400 Bad Request** — Validação falhou, payload inválido
- **404 Not Found** — Recurso não existe
- **409 Conflict** — Violação de constraint (ex: nome duplicado)
- **500 Internal Server Error** — Erro não tratado (vide logs)

---

## 📋 Schemas & Validação (Pydantic)

Definidos em `app/schemas/`:

### Pattern: Validação Rigorosa

```python
from pydantic import BaseModel, ConfigDict, field_validator

class CreateProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')  # Rejeita campos não esperados
    
    nome: str
    unidade: str
    quantidade_referencia: float
    
    @field_validator('quantidade_referencia')
    @classmethod
    def _validateQtdRef(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser > 0")
        return v
```

**Regras:**
- ✅ Use `ConfigDict(extra='forbid')` para segurança
- ✅ Validadores de campo para lógica complexa
- ✅ Mensagens de erro claras e específicas
- ✅ Tipos explícitos (evite `Any`)
- ❌ Não use `Optional` sem motivo — se é obrigatório, não deixe como opcional

### Schemas Comuns

`app/schemas/common.py` define constantes compartilhadas:
- `UNIDADES_PADRAO` — Lista de unidades válidas (kg, g, ml, l, etc.)
- `PaginatedParamsModel` — Query params para paginação (limit, offset, etc.)

---

## 📂 Arquivo de Estrutura Completa

```text
cmv_mockup_empresa/                          # Raiz do repositório
├── README.md
├── RoadmapMVP.md
├── backend/                                  # 🔧 API Python/FastAPI (VOCÊ ESTÁ AQUI)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                           # Instância FastAPI + lifespan
│   │   ├── example_middleware.py             # Exemplo de middleware customizado
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── models.py                     # Modelos SQLAlchemy (Produto, ComponenteReceita)
│   │   │   ├── session.py                    # Gerenciador de sessão async
│   │   │   └── initiliaze_db.py              # Inicialização de tabelas
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── pages.py                      # Rotas de páginas (GET /)
│   │   │   └── api/
│   │   │       ├── __init__.py
│   │   │       ├── insumos.py                # CRUD insumos (POST, GET, PATCH, DELETE)
│   │   │       └── receitas.py               # CRUD receitas (POST, GET, PATCH, DELETE)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── common.py                     # Constantes, models comuns (UNIDADES_PADRAO)
│   │   │   ├── insumo.py                     # CreateProductModel, UpdateCustoModel, EditInsumoModel
│   │   │   └── receita.py                    # Schemas para receitas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── produto_service.py            # Lógica de negócio de produtos
│   │   └── requirements.txt                  # Dependências Python (pip)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                       # Fixtures e config de testes
│   │   ├── test_insumos.py                   # Testes para endpoints insumos
│   │   └── test_receitas.py                  # Testes para endpoints receitas
│   ├── agent_knowledge/                      # 📚 Documentação para agentes
│   │   ├── AGENTS.md                         # Este arquivo
│   │   └── (futuro: docs específicos)
│   ├── .env                                  # Variáveis de ambiente (git-ignored)
│   ├── .env-example                          # Template de .env
│   └── requirements.txt                      # Dependências do projeto

```

**Referência rápida:**
- 🔌 Endpoints → `backend/app/routers/api/`
- 📊 Modelos DB → `backend/app/database/models.py`
- ✔️ Validação → `backend/app/schemas/`
- 🧠 Lógica negócio → `backend/app/services/`
- 🧪 Testes → `backend/tests/`

---

## 🔐 Configuração & Ambiente

### Variáveis Essenciais (.env)

```bash
# Modo da aplicação
APP_ENV=development              # ou 'production'

# Banco de dados
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# CORS (Frontend)
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:5500

# (Futuro: Auth)
# SECRET_KEY=your-secret-key
# ALGORITHM=HS256
```

**Regras:**
- ✅ `.env` é ignorado por git (confidencial)
- ✅ `.env-example` contém template com valores dummy
- ✅ Em **development**: `APP_ENV=development` dropa e recria DB (cuidado!)
- ✅ Em **production**: `APP_ENV=production` preserva dados existentes

### Iniciando o Servidor

```bash
cd backend
python -m venv .venv           # Criar ambiente virtual (primeira vez)
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API estará em: **http://localhost:8000**  
Docs interativa: **http://localhost:8000/docs** (Swagger UI)

---

## 🧪 Padrões de Testes

Testes usam **Pytest** + **async fixtures** (`conftest.py`):

```python
# tests/conftest.py — Fixtures compartilhadas
@pytest_asyncio.fixture
async def test_db():
    """Prepara DB de teste antes de cada teste"""
    await init_db()
    yield
    # Cleanup após teste
```

```python
# tests/test_insumos.py — Exemplos
@pytest.mark.asyncio
async def test_create_insumo(test_db, async_client):
    response = await async_client.post("/api/insumos/create", json={
        "nome": "Açúcar",
        "unidade": "kg",
        "quantidade_referencia": 1,
        "preco_referencia": 5.0
    })
    assert response.status_code == 201
```

**Convenções:**
- ✅ Testes em `backend/tests/` mirroring routers
- ✅ Rodando: `pytest -v` ou `pytest tests/test_insumos.py`
- ✅ Use fixtures de `conftest.py` para DB, client async
- ✅ Cada teste é isolado (setup/teardown automático)

---

## 🔄 Serviços & Lógica de Negócio

Separe lógica complexa em `app/services/`:

```python
# app/services/produto_service.py
class ProdutoService:
    @staticmethod
    async def calcular_cmv_receita(receita_id: int, session: AsyncSession) -> float:
        """Calcula CMV total de uma receita somando custos dos insumos"""
        receita = await session.get(Produto, receita_id)
        total = sum(comp.quantidade * comp.componente.custo 
                   for comp in receita.componentes)
        return total
```

**Princípios:**
- ✅ Endpoints ficam magros (apenas entrada/saída)
- ✅ Services contém regras de negócio
- ✅ Métodos são `async` quando tocam DB
- ✅ Uma classe = um domínio (ProdutoService para tudo de produto)

---

## 🚫 Anti-Padrões (NÃO FAÇA)

### ❌ Database
- **Não execute queries sem await** — Sempre: `await session.execute(...)`
- **Não misture sync e async** — Toda a stack deve ser async
- **Não esqueça de commit** — `await session.commit()` após mutations
- **Não use raw SQL** — Use ORM/SQLAlchemy; apenas raw SQL se absolutamente necessário

### ❌ Validação
- **Não confie em tipos sozinhos** — Use Pydantic validators para lógica
- **Não permita campos extras** — Sempre `ConfigDict(extra='forbid')`
- **Não ignore erros de validação** — Retorne 400 com detail clara

### ❌ Endpoints
- **Não retorne diretamente modelos SQLAlchemy** — Converta para schemas Pydantic
- **Não deixe exceptions globais sem handler** — Use `@app.exception_handler(Exception)`
- **Não misture recursos em um endpoint** — `/api/insumos` para insumos, `/api/receitas` para receitas
- **Não use status codes errados** — 404 para not found, 409 para conflict, etc.

### ❌ Segurança
- **Não exponha stack traces ao frontend** — Catch excepts, log internamente
- **Não confie em frontend para validar** — Sempre valide no backend
- **Não deixe CORS aberto em produção** — Use `ALLOWED_ORIGINS` explícito
- **Não commit `.env`** — Sempre gitignored; use `.env-example`

### ❌ Estrutura
- **Não coloque lógica em `main.py`** — Use routers e services
- **Não importe toda a app em todo lugar** — Imports circulares criam problemas
- **Não misture modelos e schemas** — Schemas para I/O, modelos para DB

---

## 🔄 Fluxo de Trabalho e Comunicação

### Demandas Típicas

- **Novos endpoints:** Criar em `app/routers/api/`, com schema validação
- **Novos campos/tabelas:** Alterar `models.py`, atualizar schemas correspondentes
- **Lógica complexa:** Extrair para `app/services/`
- **Bugs/refactor:** Rodar tests: `pytest -v`

### Checklist: Adicionando um Novo Endpoint

1. ✅ Defina o **schema** (request + response) em `app/schemas/`
2. ✅ Implemente o **service** se lógica complexa em `app/services/`
3. ✅ Crie o **router** em `app/routers/api/`
4. ✅ Inclua o router em `app/main.py` (`app.include_router(...)`)
5. ✅ Trate **exceptions** com status codes HTTP apropriados
6. ✅ Escreva **testes** em `backend/tests/`
7. ✅ Teste manualmente em http://localhost:8000/docs (Swagger)
8. ✅ Atualize este AGENTS.md se for endpoint importante

### Padrão de Endpoint Mínimo

```python
# app/routers/api/exemplo.py
from fastapi import APIRouter, HTTPException
from app.schemas.exemplo import CreateExemploModel
from app.services.exemplo_service import ExemploService

router = APIRouter(prefix="/api")

@router.post('/exemplo/create')
async def create_exemplo(payload: CreateExemploModel):
    """Cria novo exemplo com validação Pydantic"""
    try:
        resultado = await ExemploService.criar(payload)
        return {"id": resultado.id, "message": "Exemplo criado com sucesso."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Debugging

```bash
# Rodar testes com verbose
pytest -v --tb=short

# Rodar servidor com reload (auto-restart em mudanças)
uvicorn app.main:app --reload

# Ver logs do banco (enable em session.py se necessário)
# SQLAlchemy echo=True on engine
```

---

## 📚 Hierarquia de Autoridade

Leia nesta ordem para decisões de design:

1. **Especificação do endpoint** — O que frontend espera?
2. **Modelos DB** (`models.py`) — Qual é a verdade do dado?
3. **Schemas Pydantic** — Qual é a forma correta de input/output?
4. **Este AGENTS.md** — Convenções e padrões do projeto