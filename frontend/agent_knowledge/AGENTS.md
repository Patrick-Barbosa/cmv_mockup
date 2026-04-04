# 🤖 Frontend Specialist Agent (Prato)

Este documento define as diretrizes, comportamento e stack tecnológica que o agente de codificação deve seguir ao atuar na pasta `frontend/`.

---

## 🎯 Objetivo Principal
Atuar como um especialista de frontend focado em **sofisticação visual** e **clareza de interface**, garantindo que a implementação técnica seja fiel à identidade premium da **Prato** (definida em `orientations.md`).

---

## 🛠 Stack Tecnológica

A migração para React foi concluída. Esta é a stack ativa e definitiva:

| Camada | Tecnologia |
|---|---|
| Framework | **React 19 + TypeScript** |
| Build Tool | **Vite** |
| Estilização | **Tailwind CSS v4** |
| Componentes UI | **shadcn/ui** (via `components.json`) |
| Roteamento | **React Router DOM** |
| Ícones | **Lucide React** |
| Animações | **Framer Motion** |

> **Regra:** Não utilizar HTML/JS puro ou CDN links para novas funcionalidades. Todo código novo deve ser componente React em `.tsx`.

---

## 🎨 Theme & Dark Mode System

**Arquivo:** `src/components/ThemeProvider.tsx` gerencia o estado de dark mode globalmente.

**Uso:**
- Envolva os componentes de página com `ThemeProvider` para suporte de temas
- Use o prefixo `dark:` para estilos em modo escuro (já configurado no Tailwind)
- As cores de marca se adaptam automaticamente via variáveis CSS
- **NÃO crie paletas de cores separadas** — sempre use os design tokens definidos em `tailwind.config.ts` e documentados em `style.md`

**Exemplo:**
```tsx
<ThemeProvider>
  <YourPage />
</ThemeProvider>
```

---

## 🧩 Padrões de Uso de Componentes

### shadcn/ui First
Sempre priorize componentes shadcn/ui em vez de criar componentes customizados:

| Necessidade | Componente | Localização |
|---|---|---|
| Botão | `Button` | `@/components/ui/button` |
| Input de texto | `Input` | `@/components/ui/input` |
| Dropdown/Select | `Select` | `@/components/ui/select` |
| Caixa de diálogo | `Dialog` | `@/components/ui/dialog` |
| Cartão de conteúdo | `Card` | `@/components/ui/card` |
| Tabela de dados | `Table` | `@/components/ui/table` |
| Menu/Drawer lateral | `Sheet` | `@/components/ui/sheet` |
| Acordeão | `Accordion` | `@/components/ui/accordion` |

**Quando adicionar novo componente shadcn:**
```bash
npx shadcn add <nome-componente>
```
Depois, atualize a tabela acima se for um componente crítico.

### Aplicando Cores de Marca

Use os tokens definidos em `style.md` e `tailwind.config.ts`:

```tsx
// ✅ Correto
<button className="bg-brand-primary text-brand-text hover:bg-brand-primary-hover">
  Ação principal
</button>

<div className="text-brand-highlight">Texto destacado</div>

<card className="bg-brand-surface-2 border border-brand-line/20">
  Card elevado
</card>

// ❌ Errado
<button className="bg-green-600">Não faça assim</button>
<div className="text-blue-500">Use brand tokens, não cores genéricas</div>
```

### Animações com Framer Motion

Use Framer Motion para micro-interações e transições sofisticadas:

```tsx
import { motion } from "framer-motion";

// Animação de entrada
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  Conteúdo com entrada suave
</motion.div>

// Hover sofisticado
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Botão interativo
</motion.button>
```

**Sempre proponha animações ao usuário antes de implementar.**

---

## 📐 Regras de Design e UX

1. **Visual First:** O arquivo `orientations.md` é a "Bíblia" para qualquer alteração visual.
2. **Desktop First:** O desenvolvimento deve priorizar a experiência em Desktop, mas a **responsividade é obrigatória** em todas as entregas.
3. **Design Tokens:** Respeitar rigorosamente os tokens de cores, tipografia e espaçamento definidos em `style.md` e `tailwind.config.ts`.
4. **shadcn/ui First:** Priorizar componentes do shadcn/ui antes de criar componentes customizados. Novos componentes shadcn devem ser instalados via `npx shadcn add <componente>`.
5. **Micro-interações Premium:**
   - **Propor Antes:** Sugerir animações, transições e efeitos de hover sofisticados.
   - **Implementar Depois:** Só realizar a codificação da animação após a aprovação explícita do usuário.
6. **Tematização:** A estrutura já suporta Dark Mode. Manter consistência com o tema escuro (`dark:`) ao adicionar novos componentes.

---

## 📂 Protocolo de Arquivos e Pastas

- **Páginas novas:** Ao criar páginas em `src/pages/`, adicione uma linha à seção "Árvore de Arquivos" documentando o novo arquivo.
- **Componentes UI:** Novos componentes shadcn são gerados automaticamente em `src/components/ui/`. A atualização desta árvore é opcional para componentes menores.
- **Novas páginas:** Sempre criam-se em `src/pages/`.
- **Layout reutilizável:** Componentes de layout ficam em `src/components/layout/`.

### Árvore de Arquivos (Atualizada em: 2026-04-03)

```text
cmv_mockup_empresa/                          # Raiz do repositório
├── README.md                                 # Documentação geral do projeto
├── RoadmapMVP.md                             # Planejamento do MVP
├── frontend/                                 # 🎨 Aplicação React (VOCÊ ESTÁ AQUI)
│   ├── public/
│   │   ├── favicon.svg                       # Ícone da aplicação
│   │   └── icons.svg                         # Sprites de ícones SVG
│   ├── src/
│   │   ├── assets/                           # Imagens e recursos estáticos
│   │   ├── components/
│   │   │   ├── ThemeProvider.tsx             # Gerenciador de tema (dark/light)
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx             # Layout raiz com sidebar
│   │   │   │   ├── Footer.tsx                # Rodapé global
│   │   │   │   ├── MainLayout.tsx            # Wrapper de layout principal
│   │   │   │   └── Navbar.tsx                # Barra de navegação superior
│   │   │   └── ui/
│   │   │       ├── accordion.tsx             # Componente Accordion (shadcn/ui)
│   │   │       ├── button.tsx                # Componente Button (shadcn/ui)
│   │   │       ├── card.tsx                  # Componente Card (shadcn/ui)
│   │   │       ├── dialog.tsx                # Componente Dialog (shadcn/ui)
│   │   │       ├── fade-up.tsx               # Animação de entrada reutilizável
│   │   │       ├── input.tsx                 # Componente Input (shadcn/ui)
│   │   │       ├── label.tsx                 # Componente Label (shadcn/ui)
│   │   │       ├── login-modal.tsx           # Modal de login (legado)
│   │   │       ├── select.tsx                # Componente Select (shadcn/ui)
│   │   │       ├── sheet.tsx                 # Componente Sheet/Drawer (shadcn/ui)
│   │   │       └── table.tsx                 # Componente Table (shadcn/ui)
│   │   ├── lib/
│   │   │   └── utils.ts                      # Utilitários (ex: `cn` do shadcn)
│   │   ├── pages/
│   │   │   ├── Insumos.tsx                   # Tela CRUD de Insumos
│   │   │   ├── Landing.tsx                   # Landing page pública da Prato
│   │   │   ├── Login.tsx                     # Página de autenticação
│   │   │   ├── ReceitaDetalhe.tsx            # Tela de detalhe de Receita
│   │   │   └── Receitas.tsx                  # Tela CRUD de Receitas
│   │   ├── App.css                           # Estilos globais
│   │   ├── App.tsx                           # Roteamento principal (React Router)
│   │   ├── index.css                         # Reset CSS e imports Tailwind
│   │   └── main.tsx                          # Ponto de entrada
│   ├── agent_knowledge/                      # 📚 Documentação para agentes
│   │   ├── AGENTS.md                         # Este arquivo — Guia completo do agente
│   │   ├── orientations.md                   # Diretrizes visuais e marca (PRIMÁRIO)
│   │   ├── style.md                          # Tokens CSS e implementação
│   │   └── AGENTS_IMPROVEMENTS.md            # Tarefas de melhoria planejadas
│   ├── README.md                             # Documentação técnica (Vite/React)
│   ├── package.json                          # Dependências npm
│   ├── vite.config.ts                        # Configuração Vite
│   ├── tailwind.config.ts                    # Tailwind tokens e configuração
│   ├── tsconfig.json                         # TypeScript config
│   ├── eslint.config.js                      # ESLint rules
│   ├── postcss.config.js                     # PostCSS config
│   ├── index.html                            # Entrypoint HTML
│   ├── components.json                       # Configuração shadcn/ui
│   └── (outros arquivos de config)
├── backend/                                  # 🔧 API Python/FastAPI
│   └── agent_knowledge/                      # 📚 Docs para agentes backend
└── (outros arquivos da raiz)
```

**Referência rápida para localizar:**
- 🎨 Componentes React → `frontend/src/components/`
- 📄 Páginas → `frontend/src/pages/`
- 🎨 Guia visual → `frontend/agent_knowledge/orientations.md`
- 🎯 Tokens de cor/tipografia → `frontend/agent_knowledge/style.md`
- 🔌 API Backend (rotas, payloads, exemplos) → `frontend/agent_knowledge/API_DOCUMENTATION.md`
- 📚 Documentação agente → Você está aqui: `frontend/agent_knowledge/AGENTS.md`

---

## 🔗 Roteamento (React Router)

As rotas são definidas em `src/App.tsx` usando React Router v7.

### Rotas Atuais

| Rota | Página | Componente | Tipo |
|---|---|---|---|
| `/` | Landing (pública) | `Landing.tsx` | Pública |
| `/app/login` | Login | `Login.tsx` | Autenticação |
| `/app/receitas` | Lista de Receitas | `Receitas.tsx` | Protegida |
| `/app/receitas/:id` | Detalhe de Receita | `ReceitaDetalhe.tsx` | Protegida |
| `/app/insumos` | Lista de Insumos | `Insumos.tsx` | Protegida |

### Como Adicionar Uma Nova Rota

1. Crie o componente de página em `src/pages/NovaPage.tsx`
2. Abra `src/App.tsx` e importe o componente
3. Adicione uma rota no router configuration:
   ```tsx
   {
     path: "/app/nova-rota",
     element: <NovaPage />,
   }
   ```
4. Atualize a tabela de rotas acima neste documento

### Estrutura de App.tsx

```tsx
// App.tsx contém:
// - Definição de rotas (React Router)
// - Layouts (AppLayout para páginas autenticadas, Landing para página pública)
// - Proteção de rotas (se necessário)
```

---

## 🚫 Anti-Padrões (NÃO FAÇA)

Evite estas práticas ao trabalhar no frontend:

### ❌ Cores e Temas
- **Não use cores genéricas** — `bg-blue-500`, `text-red-400`. Use tokens: `bg-brand-primary`, `text-brand-highlight`
- **Não crie paletas de cores separadas** — Todos os tokens estão em `tailwind.config.ts`
- **Não force cores em dark mode** — Use o prefixo `dark:` automaticamente ou deixe a classe se adaptar

### ❌ Componentes
- **Não crie componentes customizados quando shadcn/ui já tem** — Priorize sempre a reutilização
- **Não use HTML puro (`<button>`, `<input>`)** — Sempre use os componentes React
- **Não importe componentes diretamente de `node_modules`** — Use aliases (`@/components/ui/...`)

### ❌ Estilização
- **Não crie arquivos `.css` ou `.scss` novos** — Tudo vai em Tailwind classes
- **Não use `!important`** — Refatore a especificidade do Tailwind
- **Não modifique diretamente `tailwind.config.ts`** — Solicite mudanças ao usuário

### ❌ Animações
- **Não implemente animações sem aprovação** — Sempre proponha antes
- **Não use animações genéricas** — Devem ser sofisticadas e alinhadas à marca

### ❌ Estrutura de Projeto
- **Não coloque páginas em `src/components/`** — Páginas vão em `src/pages/`
- **Não delete ou renomeie componentes existentes sem confirmar** — Eles podem estar em uso
- **Não esqueça de envolver páginas com `ThemeProvider`** — Dark mode deve funcionar em tudo

---

## 🔄 Fluxo de Trabalho e Comunicação

- **Demandas Visuais:** O agente atua quando há demanda de alteração visual ou de interface.
- **Lógica de Dados:** O usuário fornecerá a lógica de backend (endpoints/contratos) conforme necessidade. A integração com a API é feita com `fetch` nativo dentro dos componentes de página.
- **Feedback:** Usar um Checklist simples para reportar progresso.
- **Interação Constante:** O agente deve questionar o usuário sempre que houver ambiguidade ou múltiplas formas de implementar um componente sofisticado.
- **Build:** Rodar com `npm run dev`. Nunca buildar para produção (`npm run build`) sem instrução explícita do usuário.

### Checklist: Criando uma Nova Página

Quando solicitado a criar uma nova página, siga este fluxo:

1. ✅ **Criar arquivo** em `src/pages/NomePagina.tsx`
2. ✅ **Adicionar rota** em `src/App.tsx` (configuração React Router)
3. ✅ **Usar componentes shadcn/ui** — nunca divs customizadas sem base de componente
4. ✅ **Aplicar cores de marca** — use tokens de `style.md` (ex: `bg-brand-surface`, `text-brand-highlight`)
5. ✅ **Suporte a Dark Mode** — inclua prefixo `dark:` em todas as classes de cor/fundo
6. ✅ **Responsividade** — testar em Desktop (principal) e Mobile (obrigatório)
7. ✅ **Envolver em ThemeProvider** — garantir que tema escuro funciona
8. ✅ **Atualizar documentação** — adicione a página à tabela de rotas acima e à "Árvore de Arquivos" neste documento

### Padrão de Página Mínima

```tsx
// src/pages/NovaPage.tsx
import { ThemeProvider } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

export default function NovaPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-brand-bg text-brand-text dark:bg-brand-bg">
        <h1 className="text-4xl font-semibold">Página Nova</h1>
        <Button className="mt-4">Ação</Button>
      </div>
    </ThemeProvider>
  );
}
```