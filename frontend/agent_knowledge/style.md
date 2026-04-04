# style.md

## Paleta de cores

### Tokens e valores exatos

| Token | Hex | Papel |
|---|---|---|
| `brand-bg` | `#111307` | Fundo principal |
| `brand-surface` | `#16190B` | Fundo secundário (seções alternadas) |
| `brand-surface-2` | `#1B1F0F` | Cards elevados |
| `brand-primary` | `#5E6F37` | **Botões** — verde militar escuro |
| `brand-highlight` | `#8CB84F` | **Texto em destaque, ícones SVG, bullets** — verde mais claro (~5.5:1 contraste) |
| `brand-secondary` | `#C94CB6` | Magenta — glow, hover, microdetalhes |
| `brand-text` | `#F5F4EE` | Texto principal |
| `brand-soft` | `#C9C7BA` | Texto secundário |
| `brand-muted` | `#9B9888` | Texto fraco / apoio |
| `brand-line` | `#6E725E` | Bordas e linhas |

> **Distinção importante:** `brand-primary` é o verde escuro dos **botões**. `brand-highlight` é o verde claro para **texto de destaque e ícones**. Não inverter.

---

## Como aplicar na landing

### Hero
- Fundo: `brand-bg` (`#111307`)
- Arcos SVG: `rgba(110,114,94, 0.08–0.35)` (brand-line com opacidade variável)
- Headline: `brand-text`
- Palavras de destaque (ex: "margem"): `text-brand-highlight`
- Sublinhado decorativo (`.hl-under`): `#7BA83F`, 3px, offset 6px
- CTA principal (`.btn-primary`): fundo `#5E6F37`, texto `#F5F4EE`
- CTA secundário: borda `brand-line/50`, texto `brand-soft`
- Hover do `.btn-primary`: `#6b7f41` + box-shadow com `rgba(201,76,182,0.18)` e `rgba(94,111,55,0.25)`
- Glows difusos: verde `rgba(94,111,55,0.07)` e magenta `rgba(201,76,182,0.05)`

### Problema
- Fundo: `brand-surface` (`#16190B`)
- H2: `brand-text` com destaque `brand-highlight`
- Bullets dos títulos: `bg-brand-highlight` (bolinhas 1.5×1.5)
- Descrições: `brand-muted`
- Separador: `border-t border-brand-line/30`

### Solução
- Fundo: `brand-bg`
- Cards: `brand-surface-2`, borda `brand-line/20`, `rounded-sm`
- Ícones SVG: `stroke="#8CB84F"` (brand-highlight)
- Títulos: `brand-text`
- Descrições: `brand-muted`

### Benefícios
- Fundo: `brand-surface`
- Números (01–06): `text-brand-highlight font-light`
- Títulos: `brand-text font-medium`
- Descrições: `brand-muted`

### CTA Final
- Fundo: `brand-bg` com glow verde `rgba(94,111,55,0.06)`
- Botão: `.btn-primary` (fundo `#5E6F37`)
- Input: fundo `brand-surface`, borda `brand-line/40`, foco `brand-highlight/60`
- Ícone de sucesso: `text-brand-highlight`
- Hint: `brand-muted`

### Footer
- Fundo: `brand-bg`
- Borda superior: `border-brand-line/20`
- Logo e copyright: `brand-muted`

---

## Animações

| Nome | Uso | Duração |
|---|---|---|
| `arcSpin` | Rotação do arco externo do hero | 40s linear infinite |
| `.fade-up` | Scroll reveal de sections e cards | 0.6s ease, delay escalonado |
| Arrow hover (`.btn-access`) | `translateX(2px)` na seta → | 0.2s |
| Form submit | `opacity: 0` no form, exibe `#form-success` | 0.3s |

---

## Tipografia

- Fonte: **Inter** (Google Fonts — pesos 300, 400, 500, 600, 700)
- H1: `semibold`, `leading-[1.08]`, `tracking-tight`
- H2: `semibold`, `leading-snug`
- Eyebrows (labels de seção): `text-xs tracking-[0.35em] uppercase font-medium`
- Body: `text-base` ou `text-lg`, `leading-relaxed`
- Logo: `tracking-[0.2em] uppercase font-semibold`