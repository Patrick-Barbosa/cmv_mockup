# 🤖 Instruções de Agentes para CMV Mockup Empresa

Bem-vindo ao monorepo `cmv_mockup_empresa`. Este documento é um **ponto de entrada** que te direciona para as instruções corretas.

---

## 📁 Estrutura do Monorepo

```
cmv_mockup/
├── frontend/          # Aplicação React (Vercel)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── AGENTS.md     # Instruções específicas do Frontend
│   └── package.json
│
├── backend/           # API FastAPI (Koyeb)
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── database/
│   ├── tests/
│   ├── migrations/
│   ├── agent_knowledge/
│   └── AGENTS.md     # Instruções específicas do Backend
│
└── graphify-out/     # Knowledge graph (não versionar)
```

---

## 🛠️ Stack Completa do Projeto

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | FastAPI, Python 3.12+, SQLAlchemy (async) |
| **Database** | PostgreSQL (Supabase) |
| **Infra Backend** | Koyeb (Docker) |
| **Infra Frontend** | Vercel |
| **Doc/Utils** | Graphify, pytest, Pydantic v2 |

---

## 🎯 Como Começar

### 1. Você está trabalhando no **FRONTEND**?
👉 Leia: `frontend/AGENTS.md`

**Descrição:** Componentes React, páginas, estilização, roteamento, conexão com API.

### 2. Você está trabalhando no **BACKEND**?
👉 Leia: `backend/AGENTS.md`

**Descrição:** Endpoints de API, modelos de banco de dados, validação, lógica de negócio, testes.

---

## ☁️ Serviços em Produção

O projeto usa os seguintes serviços:

- **PostgreSQL Database** → Supabase (Postgres)
- **Backend API** → Koyeb (usando Docker)
- **Frontend App** → Vercel (React)

---

## 🚀 Commits e Pull Requests

- **Idioma:** Sempre em Português (pt-br).
- **Commits:** Curtos, objetivos e no padrão [Conventional Commits](https://www.conventionalcommits.org/) (ex: `feat:`, `fix:`, `docs:`).
- **PRs:** Descrição clara do *que* e *por que*. Mencione mudanças visuais se houver.
- **Mensagens:** Evite termos genéricos como "ajustes". Seja específico.

---

## 🔧 Debugging e Troubleshooting

### Problemas Comuns

| Problema | Solução |
| :--- | :--- |
| **Frontend não conecta na API** | Verificar `VITE_API_URL` no `.env` e CORS no backend |
| **Erro de migration no backend** | Execute `alembic upgrade head` manualmente |
| **Performance lenta no frontend** | Verifique useEffect cleanup e queries redundantes |
| **Erro de build produção** | Execute `npm run build` localmente para verificar erros |

### Como Debugar

1. **Backend:** Logs no painel Koyeb; use `LOG_LEVEL=DEBUG` no `.env`
2. **Frontend:** Chrome DevTools > Network e Console; use React DevTools
3. **Database:** Consulta direta via Supabase dashboard

---

## 💬 Pedindo Ajuda

**Importante:** Sempre que tiver dúvida sobre uma tarefa, **pergunte ao usuário antes de fazer algo**.

**Fluxo correto:**
1. ✅ Entenda a tarefa completamente
2. ✅ Leia as instruções relevantes (frontend ou backend)
3. ❓ Se ainda tiver dúvida, **pergunte**
4. ✅ Depois de clarificado, **execute a tarefa**

**Nunca faça uma tarefa se não tiver certeza sobre o que é esperado.**

---

## 🔍 Utilizando Graphify para Navegação

Este projeto possui uma knowledge graph gerada pelo **Graphify**. Use-a para entender a estrutura e relações entre módulos antes de responder perguntas de arquitetura.

### Regras do Graphify:
- Antes de responder perguntas de arquitetura ou codebase, leia `graphify-out/GRAPH_REPORT.md` para ver god nodes e estrutura de comunidades
- Se `graphify-out/wiki/index.md` existir, navegue por ele ao invés de ler arquivos raw
- Para perguntas cross-module (ex: "como X se relaciona com Y"), prefira `graphify query`, `graphify path`, ou `graphify explain` ao invés de grep

### Como usar:
1. Execute `/graphify` como prompt para ativar a skill
2. Use `graphify query "<pergunta>"` para buscar conceitos no grafo
3. Use `graphify path "<módulo A>" "<módulo B>"` para ver relações entre componentes
4. Use `graphify explain "<conceito>"` para entender abstrações do domínio
5. Após modificar arquivos, execute `graphify update .` para manter o grafo atualizado
