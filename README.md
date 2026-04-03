# CMV Mockup Empresa

API web para gerenciamento de insumos e receitas com suporte a receitas compostas por outras receitas.

O projeto foi construído com `FastAPI`, `SQLAlchemy async` e `PostgreSQL`, e inclui uma visualização recursiva da composição completa de cada receita.

## Funcionalidades

- ✅ Cadastro de insumos com custos de referência
- ✅ Cadastro de receitas com um ou mais componentes
- ✅ Componentes de uma receita podem ser insumos ou outras receitas
- ✅ Listagem de insumos
- ✅ Listagem de receitas
- ✅ Visualização detalhada de receita com estrutura recursiva
- ✅ Busca paginada de produtos
- ✅ Validação de payloads com `Pydantic`
- ✅ Cálculo automático de custos de receitas
- ✅ Suporte a diferentes unidades de medida
- ✅ Operações CRUD completas (create, read, update, delete)
- ✅ CORS configurável via variáveis de ambiente

## Estrutura do projeto

### Backend

- `backend/app/main.py`: ponto de entrada da aplicação FastAPI e definição das rotas principais
- `backend/app/database/models.py`: modelos `Produto` e `ComponenteReceita` com SQLAlchemy
- `backend/app/database/session.py`: gerenciador de sessão assíncrona com PostgreSQL
- `backend/app/database/initiliaze_db.py`: inicialização e população do banco com dados de exemplo
- `backend/app/services/produto_service.py`: lógica de negócio para receitas, insumos e busca paginada
- `backend/app/schemas/`: definições Pydantic para validação de payloads (insumo.py, receita.py, common.py)
- `backend/app/routers/`: roteadores da aplicação
  - `pages.py`: rotas das páginas principais
  - `api/insumos.py`: API para operações com insumos
  - `api/receitas.py`: API para operações com receitas

### Frontend

- `frontend/index.html`: landing page com design minimalista e responsivo
- `frontend/style.md`: guia completo da paleta de cores e sistema de design
- `frontend/orientations.md`: diretrizes e objetivos visuais da marca "Prato"
- `frontend/build.js`: script Vercel que gera configuração de backend URL dinamicamente
- `frontend/screens/`: templates HTML das páginas de funcionalidade
  - `insumos.html`: tela de gestão de insumos
  - `receitas.html`: tela de gestão de receitas
  - `receita_detalhe.html`: visualização detalhada de uma receita
- `frontend/static/`: arquivos estáticos
  - `config.js`: configuração gerada automaticamente com URL do backend

## Tecnologias

- Python 3.11+
- FastAPI
- SQLAlchemy async
- asyncpg
- PostgreSQL
- Pydantic
- python-dotenv
- pytest
- httpx

## Requisitos

- Python 3.11+
- PostgreSQL 12+ rodando localmente ou remotamente
- Extensão `uuid-ossp` habilitada no PostgreSQL (para a consulta recursiva)

## Instalação

### 1. Clone ou configure o repositório

```bash
cd cmv_mockup_empresa
```

### 2. Crie e ative um ambiente virtual

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Instale as dependências

```powershell
pip install -r requirements.txt
```

## Configuração

### Variáveis de Ambiente

O projeto utiliza um arquivo `.env` para configuração. Crie um arquivo `.env` na raiz do projeto:

```env
# Modo da aplicação: "development" ou "production"
APP_ENV=development

# URL de conexão com PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:123@localhost/cmv_00

# CORS - Origins permitidas (separadas por vírgula)
# Em desenvolvimento, se não especificado, permite "*"
# Em produção, especifique os domínios explicitamente
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Configuração do Banco de Dados

Garanta que:

1. O PostgreSQL esteja ativo
2. Exista um banco chamado `cmv_00` (ou use outro nome na variável `DATABASE_URL`)
3. O usuário e a senha correspondam aos valores em `DATABASE_URL`
4. A extensão `uuid-ossp` esteja disponível

Exemplo de criação do banco:

```sql
CREATE DATABASE cmv_00;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Nota: O arquivo `.env` não deve ser commitado. Use `.env.example` como referência:

```env
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:123@localhost/cmv_00
ALLOWED_ORIGINS=http://localhost:3000
```

## Executando o projeto

Com o ambiente virtual ativo, rode:

```powershell
python -m uvicorn app.main:app --reload
```

A aplicação ficará disponível em:

```
http://localhost:8000
```

A documentação interativa estará em:

```
http://localhost:8000/docs
```

## Frontend

### Visão Geral

O frontend é uma aplicação estática com landing page responsiva construída com:

- **Tailwind CSS** (via CDN)
- **HTML5** semântico
- **JavaScript vanilla** para interatividade
- **Design Sistema** documentado (cores, tipografia, componentes)

A marca do produto **Prato** transmite sofisticação, clareza e controle de margem de forma minimalista e elegante.

### Desenvolvimento Local

O frontend não requer node_modules ou build step para desenvolvimento local:

1. Abra `frontend/index.html` diretamente em um navegador
2. Para testar com a API, configure a variável `BACKEND_URL` no navegador ou edite `frontend/static/config.js`

Exemplo em `config.js`:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "http://localhost:8000"
};
```

### Design System

Todos os tokens de design estão documentados em `frontend/style.md`:

- **Paleta de cores**: brand-bg, brand-surface, brand-primary, brand-highlight, etc.
- **Tipografia**: Inter (via Google Fonts)
- **Componentes**: botões, cards, forms, com exemplos de aplicação

Consulte `frontend/style.md` para especificações exatas de cores, contraste e uso.

### Orientações da Marca

Para manter consistência visual e alinhamento com a proposta de valor da "Prato", consulte `frontend/orientations.md`. Este arquivo define:

- Objetivos visuais
- O que a marca deve/não deve parecer
- Direção visual geral
- Princípios de design

### Build para Vercel

O projeto inclui um script `frontend/build.js` que é executado automaticamente no Vercel:

```bash
node frontend/build.js
```

**O que faz:**

1. Lê a variável de ambiente `BACKEND_URL` (configurada no dashboard do Vercel)
2. Escreve `frontend/static/config.js` com a URL do backend
3. Não requer `npm install` — usa apenas Node.js vanilla

**Configuração no Vercel:**

1. No dashboard do Vercel, vá para **Settings** → **Environment Variables**
2. Adicione: `BACKEND_URL=https://seu-backend.com`
3. Configure a raiz do projeto como `./frontend` (ou `root: frontend` em `vercel.json`)
4. Define o build command como: `node build.js`

### Estrutura de Telas

As telas de funcionalidade estão em `frontend/screens/`:

- **insumos.html**: Gestão de insumos (listagem, criação, edição, deleção)
- **receitas.html**: Gestão de receitas (listagem, seleção de componentes)
- **receita_detalhe.html**: Visualização recursiva de componentes da receita

Cada tela é um HTML independente que pode ser servido como página estática ou integrado em um SPA.

### Próximos Passos

Migração futura recomendada:

- Migrar para **Vite** ou **Next.js** para melhor modularização
- Integrar **shadcn/ui** para componentes UI profissionais
- Centralizar gerenciamento de estado com **TanStack Query** ou **Zustand**
- Adicionar testes com **Vitest** ou **Jest**

## Rotas principais

### Rotas de Páginas

- `GET /` — página inicial
- `GET /home` — página inicial (alternativa)
- `GET /receitas` — listagem de receitas
- `GET /receitas/{id}` — detalhamento de uma receita
- `GET /insumos` — listagem de insumos

### Rotas de API

#### Insumos

- `POST /api/insumos/create` — criar um novo insumo
  - Body: `{ "nome": "string", "unidade": "string", "quantidade_referencia": number, "preco_referencia": number }`
  
- `PATCH /api/insumos/{insumo_id}` — editar um insumo
  - Body: `{ "nome": "string", "unidade": "string", "quantidade_referencia": number, "preco_referencia": number }`
  
- `POST /api/insumos/update_custo` — atualizar o custo de um insumo
  - Body: `{ "id": number, "custo": number, "unidade": "string" }`
  
- `DELETE /api/insumos/{insumo_id}` — deletar um insumo

#### Receitas

- `GET /api/receitas/{receita_id}` — obter detalhes de uma receita com seus componentes diretos
  
- `POST /api/receitas/create` — criar uma nova receita
  - Body: `{ "nome": "string", "quantidade_base": number, "unidade": "string", "componentes": [{"id_componente": number, "quantidade": number}] }`
  
- `PATCH /api/receitas/{receita_id}` — editar uma receita
  - Body: `{ "nome": "string", "quantidade_base": number, "unidade": "string", "componentes": [...] }`
  
- `DELETE /api/receitas/{receita_id}` — deletar uma receita

#### Utilitários

- `GET /api/unidades` — listar unidades de medida disponíveis
  
- `GET /api/get_produtos_select2` — busca paginada de produtos
  - Parâmetros: `q` (termo de busca), `page` (número da página), `per_page` (items por página)

## Modelo de dados

### `Produto`

Representa um item do sistema e pode ser:

- `insumo`: matéria-prima ou ingrediente
- `receita`: combinação de insumos e/ou outras receitas

Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer | Identificador único (PK) |
| `nome` | String | Nome do produto (único) |
| `tipo` | String | 'insumo' ou 'receita' |
| `quantidade_base` | Float | Quantidade base (null para insumos) |
| `custo` | Float | Custo unitário |
| `unidade` | String | Unidade de medida (ex: 'g', 'ml', 'un') |
| `quantidade_referencia` | Float | Quantidade usada para precificar |
| `preco_referencia` | Float | Preço para a quantidade de referência |

### `ComponenteReceita`

Tabela de relacionamento entre uma receita e seus componentes (insumos ou outras receitas).

Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_receita` | Integer | FK para receita (PK) |
| `id_componente` | Integer | FK para componente (insumo ou receita) (PK) |
| `quantidade` | Float | Quantidade necessária do componente |

## Validação de dados

O projeto utiliza **Pydantic** para validação robusta de payloads:

- **CreateProductModel**: validação ao criar insumo
  - Valida unidades contra lista pré-definida
  - Garante quantidade_referencia > 0
  - Garante preco_referencia >= 0

- **CreateRecipeModel**: validação ao criar receita
  - Requer lista de componentes não-vazia
  - Valida unidades opcionais
  - Quantidade_base deve ser > 0

- **EditReceitaModel**: validação para edição (todos os campos opcionais)

## Dados iniciais

Ao iniciar a aplicação, a função `init_db()` (configurada em APP_ENV):

- Em **development**: apaga as tabelas existentes e as recria com dados de exemplo
- Em **production**: não faz reset automático (usa as tabelas existentes)

Exemplos incluem:
- `Bolo de cenoura`
- `Massa de bolo`
- `Preparado de chocolate`
- `Nutella`
- `Farinha de trigo`
- `Leite condensado`

Você pode modificar os dados iniciais em `app/database/initiliaze_db.py`.
