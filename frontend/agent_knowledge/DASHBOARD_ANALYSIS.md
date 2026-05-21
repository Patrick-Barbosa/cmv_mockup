# Dashboard.tsx — Análise de Design Sistemático

Este documento apresenta uma análise detalhada de todas as decisões de design empregadas no componente `Dashboard.tsx`, incluindo paleta de cores, sistema de layout, composição de componentes, tipografia, sistema de espaçamento e padrões visuais.

---

## 1. Paleta de Cores

### 1.1 Tokens de Marca (HSL)

O projeto utiliza um sistema de tokens semânticos baseados em HSL (Hue, Saturation, Lightness). Os valores abaixo referem-se ao **modo escuro (dark mode)** — que é o padrão do Dashboard.

| Token | HSL | Hex Aproximado | Uso Principal |
|-------|-----|----------------|---------------|
| `--brand-bg` | 70° 48% 6% | `#111307` | Fundo principal da página |
| `--brand-surface` | 74° 38% 8% | `#16190B` | Fundos de inputs, selects, alternância |
| `--brand-surface-2` | 75° 35% 11% | `#1B1F0F` | Fundo de cards, containers de filtros |
| `--brand-text` | 50° 25% 95% | `#F5F4EE` | Texto principal (raramente usado diretamente) |
| `--brand-soft` | 48° 18% 79% | `#C9C7BA` | Subtítulos, texto secundário, labels |
| `--brand-muted` | 50° 11% 57% | `#9B9888` | Captions, descrições de cards,辅助文字 |
| `--brand-line` | 66° 9% 40% | `#6E725E` | Bordas, divisores |
| `--brand-primary` | 80° 34% 33% | `#5E6F37` | Botões principais |
| `--brand-highlight` | 85° 43% 51% | `#8CB84F` | Ênfase em texto, ícones, métricas principais |
| `--brand-secondary` | 308° 53% 55% | `#C94CB6` | Acento magenta (usado em elementos decorativos) |

### 1.2 Aplicação Semântica de Cores

**Hierarquia de Cores para Dados e Métricas:**

| Contexto | Cor | Token | Justificativa |
|----------|-----|-------|---------------|
| Valores principais (KPIs, total revenue) | Verde oliva vibrante | `text-brand-highlight` | Contraste alto contra fundo escuro, comunicação de dados críticos |
| Subtítulos, labels secundários | Bege acinzentado | `text-brand-muted` | Redução de peso visual, hierarquia secundária |
| Texto de corpo, descrições | Bege claro | `text-brand-soft` | Leitura confortável,介于highlight e muted |
| Bordas de cards | Verde acinzentado 20% | `border-brand-line/20` | Bordas sutis, definidas mas não invasivas |
| Bordas de inputs/selects | Verde acinzentado 35% | `border-brand-line/35` | Maior contraste para elementos interativos |
| Estado de alerta (CMV > 35%) | Vermelho | `#ef4444` | Código de cor universal para warning |
| Estado de erro | Vermelho 10%/20% | `bg-red-500/10 border-red-500/20` | Fundo sutil com borda definida |

### 1.3 Gradientes e Efeitos Decorativos

O Dashboard apresenta um padrão de **glow effect** no card "Lojas em Alerta":

```tsx
// Linha 286
<div className="absolute top-0 right-0 w-32 h-32 bg-brand-highlight/5 blur-3xl -mr-16 -mt-16 rounded-full" />
```

Este padrão cria um efeito de luz difusa (blur 3xl) com a cor highlight a 5% de opacidade, posicionado no canto superior direito do card. O resultado é uma aparência premium e moderna sem distrair o usuário.

---

## 2. Sistema de Layout

### 2.1 Estrutura de Grid

O Dashboard utiliza um **grid responsivo stratified**:

| Seção | Grid | Breakpoint | Comportamento |
|-------|------|------------|----------------|
| KPIs | `grid md:grid-cols-2 xl:grid-cols-4 gap-4` | md≥768 (2 cols), xl≥1280 (4 cols) | Cards KPI ocupam 1/2 em tablet, 1/4 em desktop |
| Histórico | Full-width | — | Área de gráfico ocupa 100% da largura |
| Gráficos inferiores | `grid xl:grid-cols-2 gap-6` | xl≥1280 (2 cols) | Cascata + Ranking lado a lado |
| Filtros | `grid md:grid-cols-2 gap-6` | md≥768 (2 cols) | Selects lado a lado |

### 2.2 Estrutura de Espaçamento (Gap)

| Contexto | Gap | Justificativa |
|----------|-----|----------------|
| Container principal | `gap-6` | Separação clara entre seções de diferentes naturezas |
| Entre KPIs | `gap-4` | Relacionamento próximo, grupo visual coeso |
| Entre gráficos | `gap-6` | Separação moderada entre componentes independentes |
| Interno ao card (header/content) | `pb-2` / `pb-6` | Depende da densidade de informação |

### 2.3 Responsividade

Padrões responsivos observados:

- **Header**: `flex-col md:flex-row` — Empilha vertical no mobile, alinha horizontal no desktop
- **Filtros**: 1 coluna mobile → 2 colunas tablet+
- **KPIs**: 1 coluna mobile → 2 colunas tablet → 4 colunas desktop
- **Gráficos inferiores**: Empilha vertical (mobile/tablet) → Lado a lado (xl)
- **Main content**: `max-w-6xl` (padrão) vs `max-w-[1600px]` (dashboardLojas)

---

## 3. Composição de Componentes

### 3.1 Card (shadcn/ui)

**Padrão Base:**
```tsx
<Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
  <CardHeader className="pb-2">...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Variações:**

| Tipo | Header Padding | Conteúdo |
|------|---------------|----------|
| KPI (4 cards superiores) | `pb-2` | Métrica grande + caption |
| Gráficos (Evolução, Cascata, Ranking) | `pb-6` (flex) | Header com título + ícone + conteúdo |

**Padrão de Ícones no Header:**
```tsx
<CardHeader className="flex flex-row items-center justify-between pb-6">
  <div className="space-y-1">
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </div>
  <Icone className="size-6 text-brand-muted" />
</CardHeader>
```

### 3.2 Select (shadcn/ui)

**Padrão:**
```tsx
<Select>
  <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
    <SelectValue placeholder="..." />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

| Propriedade | Valor | Função |
|-------------|-------|--------|
| `h-11` | Altura 44px | Equivalente ao padrão de botões (h-10) + folga |
| `text-base` | 16px | Evita parecem "shrinking" em relação ao label |
| `bg-brand-surface` |bg `#16190B` | Fundo ligeiramente mais claro que o card |
| `border-brand-line/35` | 35% opacity | Maior contraste que borda de card |

### 3.3 Button (shadcn/ui)

**Padrão do botão de exportação:**
```tsx
<Button 
  variant="outline" 
  className="h-10 text-sm gap-2 border-brand-line/40 hover:bg-brand-surface-2 px-4"
>
  <Download className="size-4" />
  Exportar Base
</Button>
```

| Propriedade | Valor | Função |
|-------------|-------|--------|
| `variant="outline"` | Borda visível, fundo transparente | Não compete com KPIs |
| `h-10` | Altura 40px | Padrão consistente |
| `gap-2` | 8px | Espaço entre ícone e texto |
| `border-brand-line/40` | 40% opacity | Borda visível mas não dominante |
| `hover:bg-brand-surface-2` |bg `#1B1F0F` | Feedback visual subtle |

### 3.4 Skeleton (Loading State)

```tsx
<Skeleton className="h-28 w-full rounded-sm" />
```

| Propriedade | Valor | Função |
|-------------|-------|--------|
| `h-28` | 112px | Altura equivalente ao card de KPI |
| `rounded-sm` | 2px | Cantos levemente arredondados (padrão do design system) |

### 3.5 Chart Components

**Container:**
```tsx
<ChartContainer config={chartConfig} className="h-[320px] w-full">
```

| Propriedade | Valor | Função |
|-------------|-------|--------|
| `h-[320px]` | Altura fixa | Garante consistência visual entre gráficos |
| `w-full` | 100% largura | Preenche o card |

**Tooltip Customizado:**
```tsx
<div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm min-w-[150px]">
```

- Fundo: `bg-brand-surface` (#16190B)
- Borda: `border-brand-line/40` (40% opacity)
- Shadow: `shadow-xl` (elevação)
- Min-width: `150px` (evita tooltips muito estreitos)

---

## 4. Sistema Tipográfico

### 4.1 Font Family

```css
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
}
```

**Inter** — Família tipográfica projetada para telas, com boa legibilidade em múltiplos tamanhos. O fallback `ui-sans-serif` garante compatibilidade cross-platform.

### 4.2 Hierarquia de Tamanhos

| Elemento | Classe Tailwind | Tamanho (px) | Peso | Line-height | Letter-spacing |
|----------|-----------------|--------------|------|-------------|-----------------|
| Page title | `text-3xl md:text-4xl` | 30-36px | 600 (semibold) | tight | tight |
| KPI value | `text-4xl` | 36px | 600 (semibold) | tight | tight |
| Card title | `text-lg font-bold` | 18px | 700 | — | — |
| Section label | `text-sm font-medium` | 14px | 500 | — | tight |
| Card description (uppercase) | `text-sm uppercase tracking-wider` | 14px | 500 | — | 0.1em |
| Body text | `text-base` | 16px | — | relaxed | — |
| Caption | `text-sm` | 14px | — | — | — |
| Small caption | `text-xs` | 12px | — | — | — |
| Ultra small | `text-[0.75rem]` | 12px | 500 | — | 0.28em (uppercase) |

### 4.3 Text Styles Específicos

**Label de filtro:**
```tsx
<label className="text-sm font-medium text-brand-soft tracking-tight block">
```

- `tracking-tight` (-0.025em) — Labels mais compactos e legíveis

**Page header description:**
```tsx
<p className="text-brand-soft text-base mt-2 leading-relaxed max-w-2xl">
```

- `leading-relaxed` (1.625) — Maior entrelinha para descrições longas
- `max-w-2xl` (672px) — Limita largura de leitura confortável

**Card description (uppercase):**
```tsx
<CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">
```

- `tracking-wider` (0.1em) — Aumenta espaçamento para readability de uppercase
- `uppercase` — Transformação visual para labels de categoria
- `font-medium` (500) — Peso médio para não competir com título

**Chart axis labels:**
```tsx
tick={{ fontSize: 13, fill: "hsl(var(--brand-muted))", fontWeight: 600 }}
```

- 13px (entre 12 e 14) — Tamanho otimizado para legibilidade em charts
- Weight 600 — Maior peso para ejes visibles mas não dominantes

---

## 5. Sistema de Espaçamento

### 5.1 Padding

| Contexto | Padding | Componente |
|----------|---------|-------------|
| Card header (KPI) | `pb-2` | Proximidade entre label e valor |
| Card header (Gráfico) | `pb-6` | Espaço para título + descrição |
| Card content (KPI) | (default) | Espaço natural |
| Card content (Gráfico) | (default) | Preenchimento interno |
| Section de filtros | `p-6` | Padding interno do container |
| Card inteiro (filtros) | `p-6` | Container padding |

### 5.2 Margens

| Contexto | Classe | Valor |
|----------|--------|-------|
| Page title → descrição | `mt-2` | 8px |
| Title (Page) | — | Já tem spacing no FadeUp |
| Between sections | `gap-6` | 24px |
| Between KPIs | `gap-4` | 16px |
| Between filter fields | `gap-6` | 24px |

### 5.3 Composição de Spacing

**Filtro container:**
```tsx
<div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6">
  <div className="grid md:grid-cols-2 gap-6">
    {/* selects */}
  </div>
</div>
```

Resultado visual: Container com padding interno 24px, gap entre campos 24px, fundo diferenciado do restante da página.

---

## 6. Bordas e Sombras

### 6.1 Bordas

| Contexto | Classe | Cor | Opacity |
|----------|--------|-----|---------|
| Card (todos) | `border-brand-line/20` | #6E725E | 20% |
| Select/Input | `border-brand-line/35` | #6E725E | 35% |
| Button outline | `border-brand-line/40` | #6E725E | 40% |
| Tooltip | `border-brand-line/40` | #6E725E | 40% |
| Tabela | `border-brand-line/20` | #6E725E | 20% |

**Princípio**: Bordas mais intensas (40%) em elementos interativos, bordas sutis (20%) em containers estáticos.

### 6.2 Border Radius

| Elemento | Classe | Valor | Justificativa |
|----------|--------|-------|---------------|
| Cards | `rounded-sm` (default) | 2px (0.125rem) | Cantos sutilmente arredondados, sobriedade visual |
| Buttons | `rounded-sm` | 2px | Consistência com design system |
| Inputs/Selects | `rounded-sm` | 2px | — |
| Skeleton | `rounded-sm` | 2px | — |
| Tooltip | `rounded-sm` | 2px | — |
| Badges | `rounded-sm` | 2px | — |

**Decisão de design**: O projeto utiliza border-radius mínimo (`rounded-sm` = 2px) ao invés de opções mais pronunciadas. Isso contribui para uma estética **sóbria, premium e técnica**.

### 6.3 Sombras

**Padrão dominante**: `shadow-none`

O Dashboard **não utiliza sombras** nos cards. Esta decisão é intencional e segue o design system onde:
- Fundo `brand-surface-2` já fornece contraste suficiente
- Bordas sutis (`border-brand-line/20`) demarcam boundaries
- O design busca **planificação e clareza** ao invés de depth/elevação

**Exceção decorativa** (única):
```tsx
<div className="absolute top-0 right-0 w-32 h-32 bg-brand-highlight/5 blur-3xl -mr-16 -mt-16 rounded-full" />
```
Usado apenas no card "Lojas em Alerta" para criar um efeito de "auréola" sutil que indica importância.

**Exceção em tooltips**: `shadow-xl` — tooltips precisam de elevação para destacado sobre gráficos.

---

## 7. Animações e Transições

### 7.1 FadeUp (Componente Custom)

```tsx
<FadeUp className="...">
  {/* conteúdo */}
</FadeUp>
```

O componente `FadeUp` é usado em todas as principais seções do Dashboard:
- Header (sem delay)
- Filtros (sem delay)
- KPIs (sem delay)
- Gráficos (sem delay)
- Empty state (delay 0.1)

**Propósito**: Entrada sequencial que guia o olhar do usuário topo-baixo.

### 7.2 Transições CSS Globais

No `index.css`:
```css
* {
  transition: background-color 0.2s ease, color 0.15s ease, border-color 0.2s ease;
}
```

Todas as transições de cor (hover, focus) são suaves, com durações entre 0.15s e 0.2s.

### 7.3 Efeitos de Hover

| Elemento | Hover Effect |
|----------|--------------|
| Button outline | `hover:bg-brand-surface-2` (fundo suave) |
| Select/Input | Padrão shadcn (border highlight) |
| Cards | Nenhum (são estáticos) |
| Badges | Nenhum |

---

## 8. Padrões de Dados e Visualização

### 8.1 Formatação de Valores

**Currency (BRL):**
```tsx
const formatBRL = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
```
- Retorna " — " para valores inválidos (design decision de UX)
- Usa locale `pt-BR` para formatação correta (R$ 1.234,56)

**Percentual:**
```tsx
const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return `${value.toFixed(1)}%`
}
```
- 1 casa decimal (ex: "34.5%")

### 8.2 Cores em Gráficos

**AreaChart (Evolução Histórica):**
| Série | Stroke | Fill | Stroke-width | Stroke-dasharray |
|-------|--------|------|--------------|------------------|
| Faturamento | `brand-highlight` | Gradient 20%→0% | 4px | none |
| Custo | `brand-muted` | transparent | 2px | 5 5 |

- Faturamento = linha grossa + fill gradient (ênfase)
- Custo = linha fina tracejada (secundário)

**BarChart (Waterfall):**
| Tipo | Cor |
|------|-----|
| Positive | `brand-highlight` |
| Negative | `brand-muted` |
| Total | `brand-soft` |

**BarChart (Ranking CMV):**
```tsx
fill={entry.cmv_percent > 35 ? "#ef4444" : "hsl(var(--brand-highlight))"}
```
- Normal: brand-highlight
- Acima de 35%: vermelho (#ef4444) — threshold visual para alerta

### 8.3 Labeling em Charts

O Dashboard implementa **labels inline** diretamente sobre os elementos do gráfico (não apenas tooltips):

```tsx
<LabelList 
  dataKey="faturamento" 
  content={(props) => {
    const formattedValue = `R$ ${(value / 1000).toFixed(0)}k`;
    return (
      <g transform={`translate(${x}, ${y - 15})`}>
        <text className="fill-brand-highlight text-[10px] font-bold">
          {formattedValue}
        </text>
      </g>
    );
  }}
/>
```

- Posicionamento: `y - 15` (acima do ponto)
- Tamanho: `text-[10px]` (10px)
- Peso: `font-bold`
- Formato: `Rk` (ex: "R$ 250k")

---

## 9. Estados de Interface

### 9.1 Loading State

```tsx
{loading ? (
  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-sm" />)}
  </div>
) : data ? (
  /* dados */
) : (
  /* empty state */
)}
```

### 9.2 Empty State

```tsx
<FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-10 text-center">
  <Activity className="size-10 text-brand-muted mx-auto mb-4 opacity-30" />
  <p className="text-brand-soft text-lg font-bold mb-2">Dados não disponíveis.</p>
  <p className="text-brand-muted text-sm max-w-md mx-auto">
    Aguardando carregamento dos dados financeiros ou seleção de filtros.
  </p>
</FadeUp>
```

**Características:**
- Fundo: `bg-brand-surface` (diferente dos cards que usam surface-2)
- Borda: `border-brand-line/15` (ainda mais sutil que 20)
- Ícone: `opacity-30` (visual reduced)
- Texto: Explicativo, orientativo

### 9.3 Error State

```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
    <p className="text-destructive text-sm font-medium">{error}</p>
    <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80 text-sm">×</button>
  </div>
)}
```

- Fundo: vermelho 10% (sutil)
- Borda: vermelho 20%
- Close button: `ml-auto` (alinha à direita)

---

## 10. Consistência e Design System

### 10.1 Princípios Observados

1. **Minimalismo funcional**: Sem decorative elements desnecessários
2. **Consistência de spacing**: Multiplos de 4px (4, 8, 16, 24)
3. **Tipografia hierárquica**: clear distinction entre títulos, labels, corpo
4. **Cores semânticas**: brand-highlight = dados importantes, brand-muted = dados secundários
5. **Bordas sutis**: 20% opacity como padrão, 35-40% para elementos interativos
6. **Sem sombras**: Planificação como padrão visual
7. **Radius mínimo**: 2px como identidade do design system

### 10.2 Component Patterns Reutilizáveis

**Card container:**
```tsx
<Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
  <CardHeader className="pb-2 ou pb-6">...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Select/Input field:**
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-brand-soft tracking-tight block">Label</label>
  <Select>
    <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
      <SelectValue />
    </SelectTrigger>
    ...
  </Select>
</div>
```

**Tooltip:**
```tsx
<div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm">
  {/* conteúdo */}
</div>
```

---

## 11. Resumo de Decisões de Design

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| Background principal | `#111307` (brand-bg) | Dark theme premium, facilita leitura de dados |
| Dados principais | `#8CB84F` (brand-highlight) | Verde vibrante, alta contraste, Associations com "positivo/financeiro" |
| Labels secundários | `#9B9888` (brand-muted) | Submissão visual, hierarquia clara |
| Bordas cards | 20% opacity | Demarcação sutil, não competir com dados |
| Border radius | 2px (rounded-sm) | Sobriedade, design system consistente |
| Sombras | none | Planificação, clareza, performance |
| Gráficos | 320px altura fixa | Consistência cross-section |
| Tooltips | bg-surface + shadow-xl | Destaque sobre charts |
| Loading | Skeleton 28px height | Simula estrutura do card |

---

_Análise baseada em Dashboard.tsx, tailwind.config.ts e index.css_