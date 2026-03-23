# Receitas App PostgreSQL

Aplicação web para gerenciamento de insumos e receitas com suporte a receitas compostas por outras receitas.

O projeto foi construído com `aiohttp`, `Jinja2`, `SQLAlchemy async` e `PostgreSQL`, e inclui uma visualização recursiva da composição completa de cada receita.

## Estrutura

O código principal da aplicação está em:

`cmv_mockup_empresa/`

Arquivos importantes:

- `cmv_mockup_empresa/main.py`: ponto de entrada da aplicação e definição das rotas
- `cmv_mockup_empresa/app/database/models.py`: modelos `Produto` e `ComponenteReceita`
- `cmv_mockup_empresa/app/database/session.py`: conexão assíncrona com PostgreSQL
- `cmv_mockup_empresa/app/database/initiliaze_db.py`: recria e popula o banco com dados de exemplo na inicialização
- `cmv_mockup_empresa/app/services/produto_service.py`: regras de negócio para receitas e busca paginada
- `cmv_mockup_empresa/templates/`: telas HTML renderizadas com `Jinja2`

## Funcionalidades

- Cadastro de insumos
- Cadastro de receitas com um ou mais componentes
- Componentes de uma receita podem ser insumos ou outras receitas
- Listagem de insumos
- Listagem de receitas
- Visualização detalhada de receita com estrutura recursiva
- Busca paginada de produtos para `Select2`
- Validação de payloads com `Pydantic`

## Tecnologias

- Python
- aiohttp
- aiohttp-jinja2
- SQLAlchemy async
- asyncpg
- PostgreSQL
- Pydantic
- Bootstrap
- jQuery + Select2

## Requisitos

- Python 3.11+ recomendado
- PostgreSQL rodando localmente
- Extensão `uuid-ossp` disponível no PostgreSQL caso a consulta recursiva use `uuid_generate_v4()`

## Instalação

Entre na pasta da aplicação:

```powershell
cd .\cmv_mockup_empresa
```

Crie e ative um ambiente virtual:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Instale as dependências:

```powershell
pip install -r requirements.txt
```

## Configuração do banco

Hoje a conexão está fixa no código:

```python
postgresql+asyncpg://postgres:123@localhost:5432/cmv_00
```

Esse valor aparece em:

- `cmv_mockup_empresa/app/database/session.py`
- `cmv_mockup_empresa/app/database/models.py`

Antes de rodar, garanta que:

1. O PostgreSQL esteja ativo
2. Exista um banco chamado `cmv_00`
3. O usuário/senha batam com o que está configurado no projeto

Exemplo de criação no PostgreSQL:

```sql
CREATE DATABASE cmv_00;
```

Se necessário, habilite a extensão:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Executando o projeto

Com o ambiente virtual ativo, rode:

```powershell
python .\main.py
```

A aplicação sobe em:

`http://localhost:8080`

## Rotas principais

Páginas:

- `GET /` e `GET /home`: página inicial
- `GET /insumos`: listagem e formulário de criação de insumos
- `GET /receitas`: listagem e formulário de criação de receitas
- `GET /receitas/{id}`: detalhamento de uma receita

APIs:

- `POST /api/insumos/create`: cria um insumo
- `POST /api/receitas/create`: cria uma receita com componentes
- `GET /api/get_produtos_select2`: busca paginada para o campo de seleção de produtos

## Modelo de dados

### `Produto`

Representa um item do sistema e pode ser:

- `insumo`
- `receita`

Campos principais:

- `id`
- `nome`
- `tipo`
- `quantidade_base`

### `ComponenteReceita`

Tabela de relacionamento entre uma receita e seus componentes.

Campos:

- `id_receita`
- `id_componente`
- `quantidade`

## Dados iniciais

Ao iniciar a aplicação, a rotina `init_db`:

- apaga as tabelas existentes
- recria a estrutura do banco
- insere dados de exemplo

Entre os exemplos cadastrados estão:

- `Bolo de cenoura`
- `Massa de bolo`
- `Preparado de chocolate`
- `Nutella`
- `Farinha de trigo`
- `Leite condensado`

## Atenção

O projeto atualmente tem algumas características importantes para desenvolvimento:

- a inicialização do app recria o banco a cada execução
- a string de conexão está hardcoded
- a interface já possui botões de editar e excluir, mas esses fluxos ainda não estão implementados no backend

Se a ideia for evoluir o projeto, um próximo passo natural é mover a configuração do banco para variáveis de ambiente e evitar `drop_all`/`create_all` em toda subida da aplicação.
