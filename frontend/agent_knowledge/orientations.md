# orientations.md

## Objetivo

Este documento orienta a criação e manutenção do frontend da landing page da **Prato**.

A página deve transmitir uma percepção de:
- sofisticação;
- clareza;
- inteligência operacional;
- controle de margem;
- tecnologia aplicada ao contexto de restaurantes.

O frontend é construído com **Tailwind CSS** (via CDN com tema customizado).

---

## Sobre o negócio

**Prato** é uma solução de inteligência de margem para restaurantes e redes de restaurantes.

A proposta do produto é ajudar operações gastronômicas a:
- comparar **CMV ideal** e **CMV real**;
- entender impactos de custo, mix, frete, delivery e operação;
- visualizar oportunidades de melhoria;
- tomar decisões com mais clareza.

A marca não deve parecer:
- app de delivery;
- ERP antigo;
- software genérico de gestão;
- consultoria institucional tradicional.

A marca deve parecer:
- premium;
- estratégica;
- confiável;
- tecnológica;
- objetiva.

---

## Direção visual geral

A landing page tem visual:
- escuro;
- elegante;
- minimalista;
- com bastante respiro;
- com poucas distrações;
- com foco forte em tipografia, composição e contraste.

O hero section contém uma composição visual baseada em **arcos SVG concêntricos**, remetendo visualmente a um **prato**, em referência direta ao nome da marca.

Esses arcos são:
- grandes;
- finos;
- discretos;
- sofisticados;
- integrados ao fundo;
- não ilustrativos demais;
- não caricatos.

A linguagem gráfica usa:
- círculos concêntricos com opacidade reduzida;
- marcadores de escala (pequenas linhas horizontais nas extremidades de cada arco);
- um ponto central como "âncora" visual;
- rotação lenta e contínua no arco externo (`arcSpin`, 40s linear infinite);
- glows ambientais difusos em verde e magenta.

---

## Stack e implementação

- **Tailwind CSS** via CDN com tema estendido inline (`tailwind.config`)
- **Inter** (Google Fonts) como typeface base — pesos 300, 400, 500, 600, 700
- Animações em CSS puro (`@keyframes arcSpin`) e fade-in por `IntersectionObserver`
- Layout responsivo, mobile-first
- Sem navbar com links para páginas inexistentes
- Header apenas com branding (logo textual "Prato") e botão de acesso (`/app/login`)

---

## Paleta de cores

### Tokens definidos no tema Tailwind

| Token | Valor | Uso |
|---|---|---|
| `brand-bg` | `#111307` | Fundo principal (hero, solução, CTA, footer) |
| `brand-surface` | `#16190B` | Fundo de seções alternadas (problema, benefícios) |
| `brand-surface-2` | `#1B1F0F` | Cards da seção solução |
| `brand-primary` | `#5E6F37` | Botões principais |
| `brand-highlight` | `#8CB84F` | Texto em destaque, ícones SVG, bullets — maior contraste (~5.5:1) |
| `brand-secondary` | `#C94CB6` | Glow secundário, acento magenta |
| `brand-text` | `#F5F4EE` | Texto principal (headings, CTAs) |
| `brand-soft` | `#C9C7BA` | Texto secundário (subtítulos, descrições) |
| `brand-muted` | `#9B9888` | Texto fraco (labels, legendas, rodapé) |
| `brand-line` | `#6E725E` | Bordas, arcos SVG, divisórias |

> **Nota importante:** `brand-highlight` (`#8CB84F`) é o verde claro usado em texto de destaque e ícones. `brand-primary` (`#5E6F37`) é o verde mais escuro reservado para botões. Não inverter essa relação.

---

## Estrutura da landing page

Seções na ordem atual:

1. **Hero** — headline, subheadline, CTA duplo, arcos animados
2. **Problema** — 3 cards horizontais com pain points
3. **Solução** (`#solucao`) — 4 cards de features com ícones SVG
4. **Benefícios** — grid 2 colunas, 6 itens numerados (01–06)
5. **CTA final** (`#cta`) — formulário de e-mail para lista de espera
6. **Footer** — branding e copyright

Não há navegação superior para outras páginas além de `/app/login`.

---

## Hero section

### Conteúdo

- Header fixo: logo textual "Prato" + botão "Acessar plataforma →" (visível em sm+)
- Eyebrow: `"Inteligência de Margem para Restaurantes"` (tracking largo, uppercase, brand-soft)
- H1: `"Clareza sobre a margem / do seu restaurante."` — com `<span class="text-brand-highlight">margem</span>` e `.hl-under` em "restaurante."
- Subheadline curta: `"Sua operação começa a ficar mais clara aqui."` (brand-soft, xl/2xl, font-light)
- Apoio: `"Compare CMV ideal e real, entenda impactos da operação e encontre oportunidades com mais clareza."` (brand-muted)
- CTAs: `"Solicitar acesso antecipado"` (`.btn-primary`, ancora `#cta`) + `"Ver como funciona"` (botão outline, ancora `#solucao`)

### Arcos SVG

SVG com `viewBox="0 0 800 800"`, centrado no ponto `(400, 460)`:
- 5 círculos concêntricos com raios: 375, 295, 215, 135, 58 — opacidades decrescentes
- Cada círculo tem marcadores de escala (linhas horizontais nas extremidades)
- Arco externo (r=375) pertence a um `<g class="arc-spin">` que gira 360° em 40s
- Ponto central: `<circle r="3" fill="rgba(94,111,55,0.4)">`
- Faixa de glow no arco externo: `<circle r="375" stroke="rgba(94,111,55,0.04)" stroke-width="28">`
- 2 glows ambientais via `<div>` com `radial-gradient` e `filter: blur`: verde em 45%/centro, magenta à direita

### Classe `.hl-under`

Sublinhado decorativo em `#7BA83F` com `text-decoration-thickness: 3px` e `text-underline-offset: 6px`.

---

## Seção Problema

- Eyebrow: `"O problema"`
- H2: `"Você sabe quanto deveria custar cada prato. / Mas raramente sabe quanto está custando."` — `"está custando"` em `text-brand-highlight`
- 3 cards em grid (sm:2, md:3), separados por `border-t border-brand-line/30`:
  - **CMV invisível** — insumos, fornecedores, receitas
  - **Decisões no escuro** — precificação por feeling
  - **Vazamento silencioso** — frete, delivery, operação
- Bullets: `<span class="w-1.5 h-1.5 rounded-full bg-brand-highlight">`

---

## Seção Solução

- ID: `solucao`
- Eyebrow: `"A solução"`
- H2: `"Prato conecta o que você planejou com o que está acontecendo."`
- Subtexto: `"Inteligência de margem para operações gastronômicas reais — sem ERP pesado, sem planilha manual."`
- 4 cards em grid (sm:2), fundo `brand-surface-2`, borda `brand-line/20`, `rounded-sm`
  - Cada card tem um ícone SVG inline stroke `#8CB84F` (20×20)
  - **CMV ideal vs. real** — icone: cross/plus
  - **Análise de impacto** — ícone: linha ascendente
  - **Visibilidade em tempo real** — ícone: relógio
  - **Oportunidades identificadas** — ícone: estrela

---

## Seção Benefícios

- Eyebrow: `"Benefícios"`
- H2: `"O que muda quando você tem clareza sobre a margem."` — `"clareza sobre a margem"` em `text-brand-highlight`
- Grid 2 colunas (sm:2), 6 itens com numeração `01`–`06` em `text-brand-highlight font-light`
  1. Precificação mais segura
  2. Mix mais inteligente
  3. Controle sobre delivery
  4. Menos vazamento operacional
  5. Decisões com mais contexto
  6. Visão consolidada para redes

---

## CTA Final

- ID: `cta`
- Background: `brand-bg` com arcos SVG estáticos e glow verde difuso
- Eyebrow: `"Acesso antecipado"`
- H2: `"Pronto para ver a margem real do seu restaurante?"`
- Subtexto: `"Prato está em fase de acesso antecipado. Deixe seu e-mail e entre na lista."`
- Formulário: input de e-mail (`#email-input`) + botão `"Quero acesso"`
- Após submit: anima opacidade para 0, exibe `#form-success` com checkmark em `brand-highlight`
- Hint: `"Sem spam. Sem compromisso."` (brand-muted)

---

## Componentes CSS customizados

### `.btn-primary`
- `background: #5E6F37`, `color: #F5F4EE`, `font-weight: 500`
- `border-radius: 2px`, `padding: 0.9rem 1.75rem`
- Hover: `background: #6b7f41` + box-shadow com toque de magenta e verde

### `.btn-access`
- Border `rgba(110,114,94,0.4)`, texto `#C9C7BA`, `font-size: 0.75rem`
- Arrow `→` em `#5E6F37` com micro-animação `translateX(2px)` no hover

### `.fade-up`
- `opacity: 0`, `translateY(22px)` → `.visible`: `opacity: 1`, `translateY(0)`
- Ativado por `IntersectionObserver` com `threshold: 0.12` e `transitionDelay` escalonado

---

## Tipografia

- Fonte: **Inter** (Google Fonts)
- H1: `text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4.5rem]`, `font-semibold`, `leading-[1.08]`, `tracking-tight`
- H2 das seções: `text-2xl sm:text-3xl md:text-4xl`, `font-semibold`, `leading-snug`
- Eyebrows: `text-xs`, `tracking-[0.35em]`, `uppercase`, `font-medium`
- Body text: `text-base` ou `text-lg`, `leading-relaxed`
- Logo: `tracking-[0.2em]`, `uppercase`, `font-semibold`

---

## Responsividade

- `overflow-x-hidden` no body
- Hero: `min-h-screen`, arcos com `w-[min(128vw,128vh)]` — adaptam naturalmente
- Headline pode quebrar em mais linhas no mobile
- CTAs empilhados em mobile (`flex-col sm:flex-row`)
- Botão de acesso no header oculto em xs (`hidden sm:inline-flex`)

---

## Restrições

Não fazer:
- navbar de múltiplas páginas
- header cheio de links
- visual genérico de startup azul
- excesso de seções
- carrosséis
- ilustrações clichês de restaurante
- ícones de chef, garfo e faca como elemento principal
- excesso de gradientes
- excesso de animações
- excesso de informação acima da dobra
- usar `brand-highlight` em botões (reservado para texto e ícones)
- usar `brand-primary` em texto corrido (reservado para botões)

---

## Sensação final esperada

A landing da Prato deve parecer:
- uma marca séria;
- moderna;
- focada em margem e operação;
- mais premium do que popular;
- autoral;
- visualmente memorável;
- enxuta;
- pronta para captar interesse e leads.