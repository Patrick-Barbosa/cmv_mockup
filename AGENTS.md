# 🤖 Guia dos Agentes de IA - CMV Mockup (Prato)

Bem-vindo ao repositório **CMV Mockup (Prato)**. Este documento é o **ponto de entrada principal** para qualquer agente de IA que atue neste projeto. Ele mapeia a arquitetura, o banco de dados, o fluxo de comunicação entre o Frontend e o Backend, e define boas práticas para o desenvolvimento.

---

## 🥗 Sobre o Projeto (Prato)

O **Prato** é um sistema de inteligência de margem para restaurantes e redes de franquias. Seu foco principal é calcular e simular o **CMV (Custo de Mercadoria Vendida)** real e ideal, permitindo simulações de impacto financeiro causados por:
- Alterações nos preços de insumos (ingredientes).
- Mudanças nas composições de receitas (fichas técnicas).

---

## 🗺️ Mapeamento de Arquivos e Estrutura do Monorepo

O projeto está estruturado em um monorepo contendo um backend em Python (FastAPI), um banco Postgres e um frontend em React (Vite + TS + Tailwind).

```bash
cmv_mockup/
├── backend/                    # Core do Backend (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── database/           # Conexão, Modelos e Seed do Banco
│   │   │   ├── models.py       # Definição das tabelas do banco de dados
│   │   │   ├── session.py      # Configuração de sessão assíncrona do SQLAlchemy
│   │   │   └── seed.py         # Massa de dados de teste (insumos, receitas, vendas)
│   │   ├── routers/            # Rotas e controladores da API FastAPI
│   │   ├── schemas/            # Schemas de validação Pydantic
│   │   ├── services/           # Lógica de negócio e calculadoras de CMV
│   │   └── main.py             # Inicialização do FastAPI e CORS
│   └── tests/                  # Testes automatizados do backend
├── frontend/                   # Core do Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # Componentes React reutilizáveis e layouts
│   │   ├── hooks/              # Custom hooks para requisições e estado
│   │   ├── lib/                # Configuração de API (Axios/fetch) e utilitários
│   │   └── pages/              # Telas da aplicação (Dashboard, Insumos, Receitas, etc.)
├── migrations/                 # Migrações manuais do banco via SQL
│   └── versions/               # Scripts versionados (.sql) executados em ambientes de prod
├── docker-compose.yml          # Definição do ambiente local multi-container (db, backend, frontend)
└── opencode.json               # Configurações de permissões e MCPs de agentes OpenCode
```

---

## 📊 Tabela de Mapeamento: Funcionalidades, Rotas e Banco

Para entender como as telas se comunicam com a API e com o banco de dados, utilize o mapa abaixo:

| Funcionalidade / Tela | Endpoint Backend | Arquivo Backend (Router/Service) | Página/Componente Frontend | Tabelas do BD Envolvidas |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Geral** | `/api/vendas` | `routers/api/vendas.py` | `pages/Dashboard.tsx` | `vendas`, `produtos` |
| **Insumos (Cadastro/Edição)** | `GET /api/insumos` <br> `POST /api/insumos/create` <br> `PATCH /api/insumos/{id}` <br> `DELETE /api/insumos/{id}` | `routers/api/insumos.py` <br> `services/produto_service.py` | `pages/Insumos.tsx` | `produtos` (tipo='insumo') |
| **Receitas & Fichas Técnicas** | `GET /api/receitas` <br> `POST /api/receitas/create` <br> `PATCH /api/receitas/{id}` <br> `DELETE /api/receitas/{id}` | `routers/api/receitas.py` <br> `services/produto_service.py` | `pages/Receitas.tsx` <br> `pages/ReceitaDetalhe.tsx` | `produtos` (tipo='receita'), `componente_receita` |
| **Simulador de Insumos** | `POST /api/simulator/simulate` <br> `POST /api/simulator/evolution` | `routers/api/simulator.py` <br> `services/simulator_service.py` | `pages/SimulatorInsumosPage.tsx` | `produtos`, `componente_receita`, `vendas` |
| **Simulador de Receitas** | `POST /api/simulator/simulate` <br> `POST /api/simulator/calculate-cost` | `routers/api/simulator.py` <br> `services/simulator_service.py` | `pages/SimulatorReceitasPage.tsx` | `produtos`, `componente_receita`, `vendas` |
| **Configuração de Lojas** | `GET /api/simulator/stores` | `routers/api/simulator.py` | `pages/Lojas.tsx` | `vendas`, `loja_imposto` |

---

## 🗄️ Esquema do Banco de Dados (Postgres)

- **`produtos`**: Armazena tanto insumos quanto receitas (diferenciados pelo campo `tipo`).
- **`componente_receita`**: Tabela associativa de muitos para muitos que vincula receitas aos seus componentes (que podem ser insumos básicos ou outras sub-receitas).
- **`vendas`**: Registro diário de quantidade e faturamento vendido por produto por loja.
- **`loja_imposto`**: Percentual de impostos cadastrados por loja para cálculos de margem.

---

## 🚀 Ambiente de Desenvolvimento e Docker

### Inicializando a Stack
Para rodar a aplicação localmente com todas as dependências, utilize:
```bash
docker compose up --build -d
```

### URLs de Acesso Local
- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend (API):** [http://localhost:8000](http://localhost:8000)
- **Docs da API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL:** `localhost:5432` (Credenciais no arquivo `.env`)

### Comportamento do Banco
- **`APP_ENV=development` ou `test`:** O banco de dados é **dropado e recriado** com uma massa de dados de teste (seeding) automática a cada reinicialização dos containers.
- **`APP_ENV=production`:** A estrutura do banco é garantida no startup, mas dados e schemas existentes **não são alterados**. Alterações de estrutura devem ser realizadas aplicando os scripts contidos em `migrations/versions/`.

---

## 📖 Leituras Recomendadas para Agentes

Antes de fazer alterações em uma stack específica, leia seus respectivos documentos de orientação:

- **Backend:**
  - Consulte [backend/agent_knowledge/API-ROUTES.md](file:///home/pk/Documentos/codebase/cmv_mockup/backend/agent_knowledge/API-ROUTES.md) para detalhes de cada endpoint.
- **Frontend:**
  - Consulte [frontend/agent_knowledge/orientations.md](file:///home/pk/Documentos/codebase/cmv_mockup/frontend/agent_knowledge/orientations.md) para tom e regras de negócio.
  - Consulte [frontend/agent_knowledge/style.md](file:///home/pk/Documentos/codebase/cmv_mockup/frontend/agent_knowledge/style.md) e [frontend/agent_knowledge/DESIGN.md](file:///home/pk/Documentos/codebase/cmv_mockup/frontend/agent_knowledge/DESIGN.md) para especificações estéticas e de cores.
  - Consulte [frontend/src/pages/AGENTS.md](file:///home/pk/Documentos/codebase/cmv_mockup/frontend/src/pages/AGENTS.md) para ver a lista de componentes React reutilizáveis compartilhados.

---

## 🛠️ Boas Práticas e Regras de Ouro

1. **Idioma das Comunicações:** Todas as mensagens do chat, descrições de commit e comentários de PR devem ser escritas em **Português do Brasil (pt-br)**.
2. **Estilo de Commits:** Siga rigorosamente a convenção do [Conventional Commits](https://www.conventionalcommits.org/) (ex: `feat: add simulator screen`, `fix: correct database connection url`).
3. **Não presuma requisitos:** Em caso de ambiguidade nas tarefas, **sempre pergunte e confirme com o usuário** antes de iniciar a implementação.
4. **Preservação de Código:** Mantenha comentários existentes e estruturas que não estejam envolvidas diretamente no escopo de alteração solicitado.
