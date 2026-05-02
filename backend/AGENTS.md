# ⚙️ Backend - CMV Mockup Empresa (Prato)

Bem-vindo ao diretório backend do projeto **Prato**. Este documento serve como um mapa para desenvolvedores e agentes entenderem a estrutura, objetivos e convenções deste backend.

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

### `/agent_knowledge` - Documentação Especializada
Este diretório contém guias detalhados que devem ser lidos por agentes antes de qualquer alteração:
- `API-ROUTES.md`: Guia detalhado de todos os endpoints disponíveis e seus funcionamentos.

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
| **Modelos de Dados** | `app/database/models.py` |
| **Lógica de CMV** | `app/services/produto_service.py` |
| **Simulador de Impactos** | `app/services/simulator_service.py` |
| **Rotas da API** | `agent_knowledge/API-ROUTES.md` |
| **Migrações DB** | `migrations/versions/` |
| **Configuração de Env** | `backend/.env-example` |

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
