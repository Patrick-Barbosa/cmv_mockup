# ⚙️ Backend - CMV Mockup Empresa (Prato)

Bem-vindo ao diretório backend do projeto **Prato**. Este documento serve como um mapa para desenvolvedores e agentes entenderem a estrutura, objetivos e convenções deste backend.

---

## 📏 Convenções de Código

Siga estas convenções para manter consistência no código:

### Nomenclatura
- **Variáveis/Funções:** `snake_case` (ex: `calcular_cmv`, `insumo_id`)
- **Classes/Models:** `PascalCase` (ex: `InsumoModel`, `ReceitaService`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_PRECISAO_DECIMAL`)
- **Arquivos:** `snake_case.py` (ex: `produto_service.py`, `vendas_router.py`)

### Estrutura de Arquivos Python
```python
# 1. Imports internos do projeto
from app.database import get_db

# 2. Imports de bibliotecas externas
from fastapi import APIRouter

# 3. Imports de bibliotecas padrão
from typing import Optional

# 4. Imports de esquemas e modelos
from app.schemas import ReceitaSimples

# 5. Definições (constantes, tipos, funções)
router = APIRouter(prefix="/receitas")

@router.get("/")
async def listar_receitas(db: AsyncSession = Depends(get_db)):
    """Lista todas as receitas com paginação."""
    pass
```

### Padrões de Commits
Utilize [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração sem mudança de comportamento
- `docs:` documentação
- `test:` adição/modificação de testes
- `chore:` tarefas de manutenção

Exemplo: `feat: adiciona endpoint de simulação de impacto de preços`

### Boas Práticas
- Docstrings em todas as funções públicas (use Google style)
- Type hints em todas as funções e retornos
- Evite `Any` - seja específico nos tipos
- Use `async/await` para operações de I/O (DB, HTTP)
- Prefira `pydantic` para validação de dados de entrada

---

## ⚠️ Códigos de Erro e HTTP Status

O backend utiliza os seguintes códigos de resposta. Sempre documente novos endpoints com seus possívels erros:

| Status Code | Uso |
| :--- | :--- |
| **200** | Sucesso padrão (GET, PUT, PATCH) |
| **201** | Recurso criado com sucesso (POST) |
| **204** | Sucesso sem conteúdo (DELETE) |
| **400** | Erro de validação de dados (payload inválido) |
| **401** | Não autenticado |
| **403** | Não autorizado (permissão negada) |
| **404** | Recurso não encontrado |
| **422** | Erro de validação de negócio (ex: receita sem insumos) |
| **500** | Erro interno do servidor |

### Padrão de Resposta de Erro
```json
{
  "detail": "Mensagem descritiva do erro",
  "code": "ERRO_CODIGO",
  "field": "campo_que_causou_o_erro" // opcional
}
```

Ao criar novos endpoints, documente:
1. Quais códigos de erro podem retornar
2. Em quais condições cada um ocorre
3. Se há validações customizadas no `service` que geram erros específicos

---

## 🎯 Objetivo do Backend

O backend é uma API RESTful construída com **FastAPI** para fornecer a lógica de inteligência de margem da aplicação Prato.

- **Processamento de CMV:** Cálculos complexos de custos de receitas, agregando insumos e sub-receitas.
- **Análise de Vendas:** Integração de dados de vendas reais para comparação com o CMV ideal.
- **Gestão de Dados:** Persistência em PostgreSQL para insumos, receitas, componentes e vendas.

---

## 🏗️ Estrutura de Arquivos

Abaixo está o mapeamento dos principais diretórios e arquivos:

### `/app` - Núcleo da Aplicação
- `main.py`: Inicialização do FastAPI, middlewares (CORS) e inclusão de rotas.
- `database/`: Configuração de conexão (SQLAlchemy), modelos do banco de dados e migrações.
- `routers/`: Definição de endpoints da API divididos por recurso (`api/insumos.py`, `api/receitas.py`, `api/vendas.py`, `api/simulator.py`).
- `schemas/`: Modelos Pydantic para validação de entrada/saída de dados (`simulator.py`).
- `services/`: Camada de lógica de negócio (Ex: `produto_service.py`, `venda_service.py` e `simulator_service.py`).

### `/tests` - Testes Automatizados
- Testes de integração e unitários utilizando `pytest`.
- Estrutura de diretórios espelha `app/` para organização.

---

## 🧪 Workflow de Testes

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `pytest` | Executa todos os testes |
| `pytest -v` | Executa com output detalhado |
| `pytest -m unit` | Executa apenas testes unitários |
| `pytest -m integration` | Executa apenas testes de integração |
| `pytest --cov=app` | Executa com coverage report |

### Estrutura de Testes

```
tests/
├── unit/
│   ├── services/
│   │   └── test_produto_service.py
│   └── utils/
│       └── test_helpers.py
└── integration/
    ├── routers/
    │   └── test_receitas.py
    └── test_db.py
```

### Convenções de Testes
- Arquivos: `test_<modulo>.py`
- Funções: `test_<cenario>_deve_<resultado>`
-标记: Use `@pytest.mark.unit` ou `@pytest.mark.integration`
- Mocks: Use `pytest-mock` para isolar dependências externas (DB, APIs)

### Coverage Mínimo
- **Obrigatório:** 70% de coverage para novos arquivos
- **Objetivo:** 85% de coverage para arquivos críticos (`services/`)

### Boas Práticas
- Teste o comportamento, não a implementação
- Evite testar getters/setters automaticamente gerados
- Use fixtures para dados recorrentes
- Mantenha testes independentes (sem ordem de execução)

---

## 🚀 Testes em 3 Passos (Linux)

Ambiente: **Linux** | Python 3.12+

### Passo 1: Linter (Python)

Verifica estilo e erros de código sem executar.

```bash
# Ruff (recomendado - rápido e moderno)
ruff check .

# Ou com auto-correção
ruff check --fix .

# flake8 (alternativa)
flake8 .
```

### Passo 2: Compilar e Executar (Python)

Compile e inicie o servidor de desenvolvimento.

```bash
# Ativar virtual environment (se existir)
source .venv/bin/activate

# Executar com Uvicorn (recomendado)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Ou verificar apenas a compilação/sintaxe
python -m py_compile app/main.py
```

### Passo 3: Container + Curl (Testar Endpoints)

Suba o container e teste os endpoints **que você modificou/criou** com curl.

> **Importante:** Os exemplos abaixo são genéricos. **Você DEVE adaptar** os comandos para os endpoints reais que alterou na sessão. Use o `agent_knowledge/API-ROUTES.md` para verificar os endpoints corretos, métodos HTTP e payloads esperados.

```bash
# 1. Build e subida do container
docker compose up --build -d

# 2. Aguardar startup (opcional)
sleep 5

# 3. Teste os endpoints que você modificou (EXEMPLOS GENÉRICOS):
# GET - Liste os endpoints disponíveis ou um recurso específico
curl -X GET "http://localhost:8000/api/<recurso>" -H "Content-Type: application/json"

# POST - Crie um recurso (verifique o schema em app/schemas/)
curl -X POST "http://localhost:8000/api/<recurso>" \
  -H "Content-Type: application/json" \
  -d '{"campo": "valor"}'

# Verifique os payloads corretos em app/schemas/ e agent_knowledge/API-ROUTES.md

# 4. Ver logs do container (para debug)
docker compose logs -f

# 5. Parar container
docker compose down
```

**Lembrete:** Após modificar endpoints, atualize `agent_knowledge/API-ROUTES.md` com os novos testes realizados.

---

## 🔐 Variáveis de Ambiente

Consulte `backend/.env-example` para todos os valores padrão.

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql+async://user:pass@host:5432/db` |
| `APP_ENV` | Ambiente de execução (`dev`, `prod`) | `dev` |
| `CORS_ORIGINS` | URLs permitidas para CORS (separadas por vírgula) | `http://localhost:3000,https://prato.app` |
| `LOG_LEVEL` | Nível de logging (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `SECRET_KEY` | Chave para autenticação/jwt | `sua-chave-secreta-aqui` |

###切换Ambientes
- **Desenvolvimento:** `APP_ENV=dev` - Migrações automáticas ativadas, CORS aberto
- **Produção:** `APP_ENV=prod` - Sem migrações automáticas, CORS restrito

---

## 📚 Onde encontrar informações?

### `/agent_knowledge` - Documentação Especializada
Este diretório contém guias detalhados que devem ser lidos por agentes antes de qualquer alteração:
- `API-ROUTES.md`: Guia detalhado de todos os endpoints disponíveis e seus funcionamentos.

---

## 🧩 Utilizando Graphify para Navegação

Este projeto possui uma knowledge graph gerada pelo **Graphify**. Antes de explorar o código ou fazer alterações, utilize a skill graphify para entender a estrutura e relações entre módulos.

### Como usar:
1. Execute `/graphify` como prompt para ativar a skill
2. Use `graphify query "<pergunta>"` para buscar conceitos no grafo
3. Use `graphify path "<módulo A>" "<módulo B>"` para ver relações entre componentes
4. Use `graphify explain "<conceito>"` para entender abstrações do domínio

### Quando usar:
- Quando precisar entender como diferentes módulos se comunicam
- Ao implementar novas features que afetam múltiplos serviços
- Para descobrir onde uma funcionalidade similar já existe
- Ao responder perguntas de arquitetura ou codebase

> **Nota:** Após modificar arquivos, execute `graphify update .` para manter o grafo atualizado.

---

## 🛠️ Stack Tecnológica

- **Framework:** FastAPI (Python 3.12+)
- **Banco de Dados:** PostgreSQL (Supabase em produção)
- **ORM:** SQLAlchemy (Assíncrono)
- **Migrações:** SQL manual versionado em `migrations/versions/`
- **Análise de Dados:** Pandas / XlsxWriter (para relatórios de vendas)
- **Validação:** Pydantic v2

---

## 📚 Onde encontrar informações?

| Se você precisa de... | Consulte este arquivo |
| :--- | :--- |
| **Modelos de Dados (ORM)** | `app/database/models.py` |
| **Schemas Pydantic** | `app/schemas/` (validacao de input/output) |
| **Lógica de CMV** | `app/services/produto_service.py` |
| **Simulador de Impactos** | `app/services/simulator_service.py` |
| **Rotas da API** | `app/routers/api/` ou `agent_knowledge/API-ROUTES.md` |
| **Migrações DB** | `migrations/versions/` |
| **Configuração de Env** | `backend/.env-example` |
| **Dependências Python** | `backend/pyproject.toml` ou `backend/requirements.txt` |
| **Testes** | `tests/` (espelha estrutura de `app/`) |
| **Middlewares** | `app/middleware/` (CORS, Error handling) |
| **Configuração FastAPI** | `app/main.py` (app instance, includes) |
| **Logging** | `app/logging_config.py` |

---

## 🔄 Manutenção da Documentação

Para manter este repositório organizado e útil para agentes de IA e desenvolvedores, siga estas diretrizes de atualização:

### Atualizando `agent_knowledge/API-ROUTES.md`
Sempre que um endpoint for criado, alterado ou removido, o arquivo `API-ROUTES.md` **deve** ser atualizado imediatamente. Para garantir uma atualização completa, verifique:
1.  **Novas Rotas:** Inspecione `app/routers/api/` para identificar novos caminhos e métodos (GET, POST, PATCH, etc.).
2.  **Schemas de Dados:** Consulte `app/schemas/` para listar argumentos **obrigatórios** vs. **opcionais**.
3.  **Comportamento:** Verifique nos `app/services/` se há regras de negócio que resultam em códigos de erro específicos (ex: 400, 404, 422).
4.  **Exemplos:** Forneça payloads de exemplo reais (Request e Response) para facilitar a integração do frontend.

### Consistência do `AGENTS.md`
Este arquivo (`AGENTS.md`) atua como o índice principal. Se novos diretórios de documentação ou arquivos de conhecimento foram criados dentro de `agent_knowledge/`, eles devem ser listados na seção "Estrutura de Arquivos" e na tabela "Onde encontrar informações?".

---

## ⚠️ Lembretes Importantes
- **Sincronização:** Documentação e código devem andar juntos. **Não considere uma tarefa de backend completa sem atualizar o `API-ROUTES.md`.**
- **Migrations:** Use SQL manual versionado em `migrations/versions/` para qualquer alteração de schema ou migração de dados.
- **Async:** O backend é quase inteiramente assíncrono. Use `await` corretamente em chamadas de DB e IO.
- **Ambientes:** O `APP_ENV` controla comportamentos de migração automática e CORS.
