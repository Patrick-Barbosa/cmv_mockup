# 🎨 Frontend - CMV Mockup Empresa (Prato)

Bem-vindo ao diretório frontend do projeto **Prato**. Este documento serve como um mapa e guia de execução para desenvolvedores e agentes.

---

## 🧰 Stack Utilizada

-   **React 18** com TypeScript
-   **Vite** (build tool)
-   **Tailwind CSS** + shadcn/ui
-   **React Router v6** (rotas)
-   **TanStack Query (React Query)** - gerenciamento de estado servidor
-   **React Hook Form** + Zod (validação de formulários)
-   **Framer Motion** (animações)

---

## 🎯 Objetivo do Projeto

Interface de **Inteligência de Margem** sofisticada para restaurantes. A marca "Prato" foca em sofisticação, clareza e tecnologia.

---

## 🏗️ Estrutura de Arquivos (Relativos a esta pasta)

-   `src/main.tsx`: Ponto de entrada.
-   `src/App.tsx`: Rotas e Providers.
-   `src/index.css`: Estilos globais e **tokens de cores** (Light/Dark).
-   `src/pages/`: Páginas (Landing, Login, Insumos, Receitas, Vendas, Lojas).
-   `src/components/ui/`: Componentes base (shadcn/ui).
-   `src/lib/api.ts`: Cliente de API centralizado com tipagem TypeScript.
-   `agent_knowledge/`: Documentação de UI/UX e Negócio (`orientations.md`, `style.md`, `DESIGN.md`).

> ℹ️ **Documentação de API:** Para detalhes técnicos dos endpoints do servidor, consulte o arquivo na raiz do projeto:  
> `../backend/agent_knowledge/API-ROUTES.md`

---

## 🛠️ Workflow de Desenvolvimento

### Comandos Principais
-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run lint`: Verifica erros de linting e estilo de código.
-   `npm run build`: Valida o TypeScript e gera o build de produção.

### Ciclo de Alteração
1.  **Pesquisa:** Always refer to `agent_knowledge/DESIGN.md` when generating UI components. Consulte `agent_knowledge/style.md` para regras mais granulares se necessário.
2.  **Desenvolvimento:** Use componentes de `src/components/ui` sempre que possível.
3.  **API:** Se precisar de novos dados, adicione a interface e a função no `src/lib/api.ts`.
4.  **Validação:** Execute sempre, nesta ordem:
    -   `npm run lint`: Verifica erros de linting e estilo de código.
    -   `npm run build`: Valida o TypeScript e gera o build de produção.
    -   Se algum comando falhar, corrija os erros antes de finalizar a tarefa.

### ⚠️ Regra Importante: Esclareça Antes de Desenvolver

**SEMPRE pergunte ao usuário se houver qualquer dúvida** antes de escrever código. Isso inclui:
-   Não entendeu um requisito ou comportamento esperado
-   Falta informação sobre um campo ou endpoint
-   Não sabe como a interface deve se comportar em algum cenário
-   Endpoint não existe ou comportamento é incerto

Pedir esclarecimento evita trabalho retrabalho e garante que o código developed seja o esperado.

---

## 🧪 Como Testar e Validar Visualmente

Como o agente não "vê" a tela, siga estes passos para garantir que o código está funcionando:

1.  **Suba o backend localmente:**
    ```bash
    cd ../backend && docker-compose up -d
    ```

2.  **Inicie o frontend:**
    ```bash
    npm run dev
    ```

3.  **Acesse a aplicação:** Abra `http://localhost:5173` no navegador.

4.  **Verifique os dados:** Use o DevTools (Network tab) para ver as responses da API e compare com o que a interface exibe.

5.  **Teste fluxos completos:** Faça login, navegue pelas páginas, adicione/edit dados, verifique se os dados aparecem corretamente.

> **Dica:** Se algo não aparecer ou der erro, verifique o console do navegador e a Network tab para identificar se o problema é no frontend (requisição mal feita) ou no backend (dados ausentes/errados).

> **Ambiente:** O ambiente é Linux com **Firefox** instalado. Use o atalho `Ctrl+Shift+K` (ou `Cmd+Option+K` no Mac) para abrir o DevTools e inspecionar a Network tab.

---

## 🔌 Integração com API (`src/lib/api.ts`)

Todas as chamadas ao backend devem passar pelo `apiFetch`.
-   **Contratos de Dados:** Consulte `../backend/agent_knowledge/API-ROUTES.md` para saber o que o servidor espera e retorna.
-   **Tipagem:** Sempre crie ou atualize as `interface` para os payloads e respostas.

---

## 🎨 Padrões de UI e Estilização

-   **Tailwind CSS:** Use as classes `brand-*` definidas no `tailwind.config.ts`. Always refer to `agent_knowledge/DESIGN.md` for design tokens and design rationale.
-   **Shadcn/UI:** Componentes em `src/components/ui` são a base. Para novos componentes, use `npx shadcn-ui@latest add [component]`.
-   **Responsividade:** Design mobile-first é obrigatório.
-   **Animações:** Use `framer-motion` para transições complexas e CSS puro (`keyframes`) para animações de fundo como o `arc-spin`.

---

## 🔄 Manutenção da Documentação

### Atualizando `agent_knowledge/` (Desta pasta)
-   **UI/UX:** Se mudar o design system, atualize `agent_knowledge/DESIGN.md` e `agent_knowledge/style.md`.
-   **Negócio:** Se mudar o fluxo de cálculo de CMV no frontend, atualize `orientations.md`.

---

## ⚠️ Lembretes do Supervisor
-   **Tipagem Estrita:** Não use `any`. O build (`tsc`) vai falhar e o agente deve corrigir.
-   **Branding:** Respeite a hierarquia de cores: `brand-primary` (botões) vs `brand-highlight` (texto/ênfase).
-   **Sincronia:** Se adicionar um campo no backend, adicione-o na interface correspondente em `src/lib/api.ts`.
-   **Limpeza:** Remova `console.log` e comentários de debug antes de finalizar a tarefa.
