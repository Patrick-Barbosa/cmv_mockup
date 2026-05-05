# Graph Report - cmv_mockup  (2026-05-03)

## Corpus Check
- 76 files · ~74,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 554 nodes · 684 edges · 92 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]

## God Nodes (most connected - your core abstractions)
1. `SimulatorService` - 42 edges
2. `ProdutoService` - 33 edges
3. `VendaService` - 27 edges
4. `cn()` - 18 edges
5. `Produto` - 16 edges
6. `FadeUp()` - 10 edges
7. `ComponenteReceita` - 9 edges
8. `SimulationResponse` - 9 edges
9. `TestSimulateEndpoint` - 9 edges
10. `main.py - FastAPI Application Entry Point` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Contrato de Dados - Simulator API` --rationale_for--> `SimulationResponse`  [INFERRED]
  brain/backend/data-contract.md → backend/app/schemas/simulator.py
- `Regras de Negócio - Simulador de Custos` --rationale_for--> `SimulatorService`  [INFERRED]
  brain/frontend/regras-negocio-simulador.md → backend/app/services/simulator_service.py
- `Simulator API Router` --implements--> `Simulator of Impact Concept`  [INFERRED]
  backend/app/routers/api/simulator.py → RoadmapMVP.md
- `Vendas API Router` --conceptually_related_to--> `CMV Ideal Concept`  [INFERRED]
  backend/app/routers/api/vendas.py → RoadmapMVP.md
- `Plano de Implementação: SimulatorPage.tsx` --references--> `SimulationResponse`  [EXTRACTED]
  brain/frontend/plano-implementacao-simulador.md → backend/app/schemas/simulator.py

## Hyperedges (group relationships)
- **CMV Core Business Entities** — produto_model, componente_receita_model, venda_model [INFERRED 0.85]
- **Simulator Domain Models** — simulator_simulationinput, simulator_simulationresponse, simulator_simulationresult, simulator_storeimpact [INFERRED 0.85]
- **Frontend Core Architecture** — main_tsx, app_tsx, themeprovider_tsx, mainlayout_tsx, applayout_tsx [INFERRED 0.95]
- **API Service Layer** — api_insumosapi, api_receitasapi, api_vendasapi, api_commonapi, api_simulatorapi [INFERRED 0.95]
- **Backend Technology Stack** — backend_fastapi, database_postgresql, main_app [INFERRED 0.95]
- **Frontend Design System Knowledge** — design_md, style_md, orientations_md, dashboard_analysis [INFERRED 0.85]
- **Simulation Results Dashboard** — simulacao_insumo_kpi_summary, simulacao_insumo_impacted_recipes_table, simulacao_insumo_store_impact_charts [INFERRED 0.95]
- **FastAPI App Initialization** — main.py, db_session, init_db, APP_ENV [EXTRACTED 1.00]
- **Database Session Management** — DatabaseSession, fetch_one, fetch_all, db_session [EXTRACTED 1.00]
- **Test Router Setup** — conftest.py, insumos, receitas, vendas [EXTRACTED 1.00]
- **Data Models** — Produto, ComponenteReceita, Venda, LojaImposto [EXTRACTED 1.00]
- **Simulator API Full Stack** — API_ROUTES, Simulator_API [EXTRACTED 1.00]
- **Frontend Tech Stack** — Frontend_Agents, React_18, TypeScript, Vite, Tailwind_CSS, TanStack_Query, React_Router [EXTRACTED 1.00]
- **Testing Infrastructure** — docker_compose_test, db_test_service, PostgreSQL, Integration_Tests [EXTRACTED 1.00]

## Communities (107 total, 65 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (28): bulk_import_vendas(), get_dashboard_cmv(), get_skus_ausentes(), getAnaliseLoja(), getVendasFiltros(), upload_vendas(), Base, init_db() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (17): AffectedRecipePreview, ComponenteSimulacao, DailyEvolutionData, EvolutionSummary, ProductInfoResponse, SimulationEvolutionResponse, SimulationInput, SimulationResponse (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (17): create_produto(), deleteInsumo(), editInsumo(), get_produtos_select2(), update_custo(), create_recipe(), deleteReceita(), editReceita() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): BaseModel, Enum, CreateProductModel, EditInsumoModel, UpdateCustoModel, ComponenteCreateRecipeModel, CreateRecipeModel, EditReceitaModel (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (6): TestCreateInsumo, TestDeleteInsumo, TestEditInsumo, TestGetProdutosSelect2, TestGetUnidades, TestUpdateCusto

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (3): cn(), handleSearchChange(), loadProducts()

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (15): create_simulation(), get_affected_recipes(), get_evolution(), get_product_info(), get_stores(), Retorna informações de preço de venda de um produto/receita.     - Se tem preco_, Cria uma simulação de impacto      - **type**: price_change ou recipe_change, Lista todas as receitas que seriam afetadas por mudança neste insumo     Útil pa (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (4): TestCreateReceita, TestDeleteReceita, TestEditReceita, TestReceitaAnaliseVendas

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (6): ThemeProvider(), useTheme(), AppLayout(), Footer(), MainLayout(), Navbar()

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (14): apiFetch, commonApi, insumosApi, receitasApi, simulatorApi, vendasApi, Dashboard Page, Insumos Page (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (14): DatabaseSession - Database Manager Class, buildMockSession - Mock Session Builder for Tests, conftest.py - Pytest Configuration, db_session - Global Database Session Instance, fetch_all - Helper for Multiple Result DB Reads, fetch_one - Helper for Single Result DB Reads, init_db - Database Initialization Function, insumos - Ingredient API Router (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (13): API Routes Documentation, Frontend Agents Guide, Frontend Tech Stack, Insumos API, React 18, React Router v6, Receitas API, Simulator API (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (9): DatabaseSession, fetch_all(), fetch_one(), Executa um read avulso e retorna um único resultado ou None., Executa um read avulso e retorna todos os resultados., Gerenciador de sessão do banco de dados para FastAPI., Inicializa o engine e o session factory.          We use schema_translate_map in, Fecha a conexão com o banco de dados. (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (3): handleClear(), handleSalvar(), onOpenNew()

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (3): aggregateAnalysis(), loadData(), Badge()

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (4): TestAnaliseLoja, TestSkusAusentes, TestUploadVendas, TestVendasFiltros

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (11): Contrato de Dados - Simulator API, Plano de Implementação: SimulatorPage.tsx, Regras de Negócio - Simulador de Custos, DailyEvolutionData, EvolutionSummary, SimulatorService, SimulationEvolutionResponse, SimulationInput (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (8): CMV Ideal Concept, ComponenteReceita Model, Database Initialization Logic, FastAPI App instance, Produto Model, Simulator of Impact Concept, Simulator API Router, Vendas API Router

### Community 21 - "Community 21"
Cohesion: 0.38
Nodes (7): App Component, App Layout, Footer Component, Main Entry Point, Main Layout, Navbar Component, Theme Provider

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): BlueSky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Icon, X Icon

### Community 23 - "Community 23"
Cohesion: 0.47
Nodes (3): handleClear(), handleSalvar(), onOpenNew()

### Community 24 - "Community 24"
Cohesion: 0.47
Nodes (3): aggregateData(), handleUpload(), parseFile()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (6): Impacted Recipes Table, Simulation Input Summary, Impact KPI Cards, Insumo Simulation Dashboard Mockup, Store Impact Charts, Simulation Type Selector

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (4): UNIDADES_PADRAO, CreateProductModel, ComponenteCreateRecipeModel, CreateRecipeModel

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (4): Migration: Create Loja Imposto Table, Manual SQL Migration System, Migration Template Example, Table: loja_imposto

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (3): BulkImportVendasModel, VendaService, VendaImportRowModel

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): ComponenteReceita - Recipe Component Model, Produto - Product Data Model, Venda - Sales Data Model

## Knowledge Gaps
- **136 isolated node(s):** `Lifespan context manager para inicialização e shutdown do app.`, `Atualiza insumo com uma única operação SQL usando UPDATE ... RETURNING.`, `Retorna componentes diretos (1 nível) de uma receita com dados do insumo.`, `Calcula o custo da receita a partir dos componentes diretos e salva em Produto.c`, `Encontra todas as receitas que usam este insumo (direta ou indiretamente) e reca` (+131 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SimulatorService` connect `Community 1` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `ProdutoService` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `VendaService` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `SimulatorService` (e.g. with `Produto` and `ComponenteReceita`) actually correct?**
  _`SimulatorService` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `ProdutoService` (e.g. with `Produto` and `ComponenteReceita`) actually correct?**
  _`ProdutoService` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `VendaService` (e.g. with `Produto` and `Venda`) actually correct?**
  _`VendaService` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Lifespan context manager para inicialização e shutdown do app.`, `Atualiza insumo com uma única operação SQL usando UPDATE ... RETURNING.`, `Retorna componentes diretos (1 nível) de uma receita com dados do insumo.` to the rest of the system?**
  _136 weakly-connected nodes found - possible documentation gaps or missing edges._