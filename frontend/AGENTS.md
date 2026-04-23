# 🎨 Frontend - CMV Mockup Empresa (Prato)

Bem-vindo ao diretório frontend do projeto **Prato**. Este documento serve como um mapa e guia de execução para desenvolvedores e agentes.

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
-   `agent_knowledge/`: Documentação de UI/UX e Negócio (`orientations.md`, `style.md`).

> ℹ️ **Documentação de API:** Para detalhes técnicos dos endpoints do servidor, consulte o arquivo na raiz do projeto:  
> `../backend/agent_knowledge/API-ROUTES.md`

---

## 🛠️ Workflow de Desenvolvimento

### Comandos Principais
-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Valida o TypeScript e gera o build de produção.
-   `npm run lint`: Verifica erros de linting.

### Ciclo de Alteração
1.  **Pesquisa:** Consulte `agent_knowledge/style.md` antes de alterar UI.
2.  **Desenvolvimento:** Use componentes de `src/components/ui` sempre que possível.
3.  **API:** Se precisar de novos dados, adicione a interface e a função no `src/lib/api.ts`.
4.  **Validação:** Execute `npm run build` para garantir que não quebrou tipos em outras páginas.

---

## 🔌 Integração com API (`src/lib/api.ts`)

Todas as chamadas ao backend devem passar pelo `apiFetch`.
-   **Contratos de Dados:** Consulte `../backend/agent_knowledge/API-ROUTES.md` para saber o que o servidor espera e retorna.
-   **Tipagem:** Sempre crie ou atualize as `interface` para os payloads e respostas.

---

## 🎨 Padrões de UI e Estilização

-   **Tailwind CSS:** Use as classes `brand-*` definidas no `tailwind.config.ts`.
-   **Shadcn/UI:** Componentes em `src/components/ui` são a base. Para novos componentes, use `npx shadcn-ui@latest add [component]`.
-   **Responsividade:** Design mobile-first é obrigatório.
-   **Animações:** Use `framer-motion` para transições complexas e CSS puro (`keyframes`) para animações de fundo como o `arc-spin`.

---

## 🔄 Manutenção da Documentação

### Atualizando `agent_knowledge/` (Desta pasta)
-   **UI/UX:** Se mudar o design system, atualize `style.md`.
-   **Negócio:** Se mudar o fluxo de cálculo de CMV no frontend, atualize `orientations.md`.

---

## ⚠️ Lembretes do Supervisor
-   **Tipagem Estrita:** Não use `any`. O build (`tsc`) vai falhar e o agente deve corrigir.
-   **Branding:** Respeite a hierarquia de cores: `brand-primary` (botões) vs `brand-highlight` (texto/ênfase).
-   **Sincronia:** Se adicionar um campo no backend, adicione-o na interface correspondente em `src/lib/api.ts`.
-   **Limpeza:** Remova `console.log` e comentários de debug antes de finalizar a tarefa.
