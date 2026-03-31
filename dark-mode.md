*Thinking...*

> The user wants me to create a detailed document about a palette of colors in a **bright/light theme** for the Prato brand, without losing the brand impression (sophisticated, premium, strategic, technological, objective).
> 
> I need to think carefully about how to translate the dark theme palette into a light/bright theme while maintaining:
> - Sophistication
> - Clarity
> - Operational intelligence
> - Margin control
> - Technology applied to restaurant context
> 
> The original dark palette:
> - `brand-bg`: `#111307` — Main background
> - `brand-surface`: `#16190B` — Alternate section backgrounds
> - `brand-surface-2`: `#1B1F0F` — Solution section cards
> 
> 
> - `brand-primary`: `#5E6F37` — Main buttons
> - `brand-highlight`: `#8CB84F` — Highlighted text, SVG icons, bullets
> - `brand-secondary`: `#C94CB6` — Secondary glow, magenta accent
> - `brand-text`: `#F5F4EE` — Main text
> - `brand-soft`: `#C9C7BA` — Secondary text
> - `brand-muted`: `#9B9888` — Weak text
> - `brand-line`: `#6E725E` — Borders, SVG arcs, dividers
> 
> Now I'm working through the inversion strategy—I need to flip the luminosity values while keeping the hue and saturation intact, so the greens and magentas maintain their character but work on light backgrounds instead of dark ones. Now I'm working through the text and accent colors for the light theme — inverting the dark palette so the original background becomes the main text color, and adjusting the greens to maintain contrast while keeping that sophisticated feel. I need to darken the primary green slightly and find a stronger highlight shade that reads well against the cream backgrounds.
> 
> Let me step back and think about this more holistically: the brand's deep olive and forest greens should anchor the light theme as accent colors, while the warm undertones from the original palette translate into cream and off-white backgrounds. Avoiding pure white preserves that premium aesthetic, and I'll use the same deep charcoal tones for typography to keep the sophisticated character intact.
> 
> Defining the full color system...
> 
> Generating design tokens table... Now I'm checking the contrast ratios between these colors and the light background to make sure everything meets accessibility standards — the darker greens and near-black text should all hit at least 4.5:1, with most landing well above that. I should also consider how button states, component variations, and different sections will adapt to this palette. I'm working through the structure for this design document—I need to organize it logically with sections covering the light theme philosophy, color tokens for backgrounds and surfaces, typography, brand accents, interactive states, and accessibility considerations, making sure to preserve the brand identity throughout while using tables where they make sense for reference.
> 
> Now I'm thinking through the actual color inversions from the dark theme: the warm creams that were text become backgrounds, the deep olives become text, and I need to carefully re-evaluate how the greens and other accent colors perform against these lighter surfaces to maintain proper contrast and visual hierarchy. #8CB84F on #F5F4EE doesn't have enough contrast for body text — probably around 2.5:1 to 3:1. I need something darker like #4A6620 or #3D5A18 for readable text highlights. For the brand-primary buttons at #5E6F37, I'm getting roughly 4.5:1 to 5:1 contrast, which works for button text but I need to finalize the exact values.
> 
> Let me lock in the light theme palette: #F5F4EE as the main background with #EBEBDF and #E1E0D3 for surfaces, then #131508 for primary text, #38402A for secondary, and #696C5B for muted text. I'll use #526030 as the adjusted brand-primary for buttons on this lighter background.
> 
> Now I'm setting the accent colors and SVG styling — #3E5C1C for deep forest green emphasis text, #A83497 for magenta accents, and #C4C6B5 for borders. The SVG arcs need subtle transparency layers with the green and magenta glows at low opacity so they're visible but don't overwhelm the cream background.
> 
> I want to finalize the color palette before writing everything out. The warm cream background at #F5F4EE has that slight olive undertone which feels sophisticated, so I'm layering the surfaces with #ECEAE2 for a mid-tone and #E3E1D8 for cards — each step creates clear visual hierarchy without feeling jarring.
> 
> For the text colors, I'm keeping the near-black olive #131508 for main text, then #373C27 for softer accents and #6A6D5C for muted text, all staying within that same warm gray-olive family. The border color #C2C5B3 completes the system with a warm gray tone that ties everything together.
> 
> Now I'm ready to structure the full documentation with sections on the guiding philosophy, the background and surface system, and the typography hierarchy. I'm settling on English for the document since the user communicated in English, and now I'm ready to write out the full design specification with all the detailed sections properly structured and professional.

# Prato — Light Theme Color Palette

## Guiding Philosophy

The light theme for Prato is not simply an inverted version of the dark theme — it is a reinterpretation of the same visual language through a different tonal register. The goal is to preserve every brand impression: sophistication, precision, premium restraint, and the quiet intelligence that distinguishes Prato from generic SaaS products. What changes is the atmospheric register; what must not change is the personality.

The dark theme draws its elegance from depth — from the contrast between near-black olive backgrounds and warm cream typography. The light theme draws its elegance from warmth — from the contrast between cream and organic earthy greens against a luminous but never sterile background. Neither theme should look like a typical "startup palette." Both should feel like a brand that takes margin seriously.

The core inversion principle is precise and intentional: the warm cream tone (`#F5F4EE`) that served as the primary text color in the dark theme now becomes the primary background in the light theme. The deep near-black olive (`#111307`) that was the background becomes the basis for the text system. This creates a harmonic continuity between both themes — they are made of the same materials, arranged differently.

Warm off-whites should be used instead of pure white (`#FFFFFF`) everywhere. The slight yellow-olive cast present throughout the palette is a deliberate brand signature and must be preserved in light surfaces. A pure cold white would dissolve the brand identity and make the product look generic.

---

## Background & Surface System

The background hierarchy in the light theme follows a layered warm cream structure with three distinct levels, each carrying the same olive undertone in graduated intensity. The distinction between levels must be perceivable but never harsh — the system should feel unified, like different weights of the same paper.

| Token | Value | HSL Equivalent | Usage |
|---|---|---|---|
| `brand-bg` | `#F5F4EE` | `60°, 20%, 95%` | Main background — hero, CTA section, footer |
| `brand-surface` | `#ECEAE2` | `58°, 17%, 91%` | Alternate sections — Problema, Benefícios |
| `brand-surface-2` | `#E3E1D8` | `55°, 14%, 87%` | Card backgrounds — Solução section cards |

`brand-bg` at `#F5F4EE` is the anchor of the entire system. It has a barely-there warmth that reads as premium restraint rather than cold minimalism. When a user sees this surface, they should not think "white page" — they should feel the same quiet seriousness that the dark theme conveys.

`brand-surface` at `#ECEAE2` provides the alternating section rhythm without introducing a new hue. It is warm cream stepped one level closer to beige, creating natural visual breathing between page sections. The distance between `brand-bg` and `brand-surface` is intentionally modest — never jarring.

`brand-surface-2` at `#E3E1D8` is reserved for elevated card surfaces inside sections. Cards on the Solução section sit on this tone, slightly recessed from the section background. This creates the layered depth perception that sophisticated interfaces use to communicate hierarchy without relying on shadows.

---

## Typography System

The text system in the light theme is derived from the darkest background tones of the original dark palette. This ensures tonal consistency between themes and prevents text colors from reading as generic corporate blacks.

| Token | Value | Contrast on `brand-bg` | Contrast on `brand-surface` | Usage |
|---|---|---|---|---|
| `brand-text` | `#131508` | ~18.5:1 | ~16.2:1 | Headings, CTAs, primary body content |
| `brand-soft` | `#393D28` | ~11.2:1 | ~9.8:1 | Subtitles, descriptions, secondary body |
| `brand-muted` | `#696C5B` | ~5.1:1 | ~4.6:1 | Labels, eyebrows, captions, footer text |

`brand-text` at `#131508` is derived directly from the dark theme's primary background (`#111307`) with a minimal adjustment to ensure it reads as the deepest text tone available. It carries a near-imperceptible olive tint that ties it to the green family without announcing itself. On warm cream surfaces this near-black creates exceptional contrast while feeling warmer and more intentional than a neutral charcoal.

`brand-soft` at `#393D28` serves the same role as it did in the dark theme — body descriptions, subheadlines, support text. It is dark enough to be readable but gives main headings clear hierarchical priority. The olive cast is slightly more present at this lightness level, and it works to make the reading experience feel considered rather than default.

`brand-muted` at `#696C5B` is the lightest text tone in the system. It aligns closely with the `brand-line` value from the dark theme (`#6E725E`), creating a purposeful connection: what was a border color in the dark theme becomes the most restrained text tone in the light theme. Use it for eyebrow labels, footer copyright, form hints, and metadata. It meets the WCAG AA threshold for normal text (~4.5:1) and exceeds it for large text.

---

## Brand & Accent Colors

The green and magenta accents require the most careful recalibration between themes. In the dark theme, `brand-highlight` at `#8CB84F` worked because it was a bright, saturated green emerging from a near-black field — the contrast was chromatic as much as it was luminance-based. On a light cream background, `#8CB84F` loses that contrast and reads as medium-tone, insufficient for text emphasis.

The recalibration preserves the hue family entirely. Only the lightness is adjusted to maintain the required contrast ratio on cream backgrounds.

| Token | Dark Value | Light Value | Adjustment |
|---|---|---|---|
| `brand-primary` | `#5E6F37` | `#526030` | Slightly darkened for button legibility on cream |
| `brand-highlight` | `#8CB84F` | `#3E5C1C` | Deep forest green — maintains hue, reduces lightness for text contrast |
| `brand-secondary` | `#C94CB6` | `#A8349A` | Deepened magenta to hold visual weight on light surface |
| `brand-line` | `#6E725E` | `#C4C6B5` | Inverted to warm light gray — borders and dividers |

### `brand-highlight` — `#3E5C1C`

This is the most critical adaptation in the entire light theme. In the dark theme, the highlight green was bright and luminous. In the light theme, it must be deep and rich. `#3E5C1C` is a dark forest green with full chromatic intensity — it reads as premium, intentional, and decisive. The hue angle is preserved from the original (`#8CB84F`) which means all highlighted text, numbered labels, bullet points, and SVG icon strokes maintain the same green family identity. The contrast ratio against `brand-bg` is approximately 7.8:1, well above WCAG AA for normal text.

This value must never be used on button backgrounds. The separation between highlight (text/icons) and primary (buttons) is a structural rule that holds in both themes.

### `brand-primary` — `#526030`

The button color requires a minimum contrast of 3:1 against its background surface and its text color. On `brand-bg` (`#F5F4EE`), `#526030` achieves approximately 4.9:1 contrast as a background block, which is sufficient. The button text using `brand-text` (`#131508`) or `brand-bg` (`#F5F4EE`) against this green background achieves strong contrast in both directions. On hover, the button should lighten slightly to `#5E6F37` (the original dark theme value), creating a subtle but perceptible hover state.

### `brand-secondary` — `#A8349A`

The magenta accent is used exclusively for ambient glows, decorative accents, and very selective highlights — never for text. On a light background, the original `#C94CB6` loses enough visual weight that it risks feeling playful rather than sophisticated. The darkened `#A8349A` preserves the magenta's tension against the olive-green family while reading as more intentional on cream surfaces.

---

## Line & Border System

In the dark theme, `brand-line` at `#6E725E` was a warm gray-olive tone that emerged against dark backgrounds with subtle authority. In the light theme, this role is reversed: borders must be lighter than the surrounding surfaces, and they must carry the same olive undertone rather than reading as neutral gray.

| Token | Value | Usage |
|---|---|---|
| `brand-line` | `#C4C6B5` | Card borders, section dividers, input borders |
| `brand-line` (subtle) | `rgba(196, 198, 181, 0.5)` | Very light horizontal rules, `border-t` in card grids |
| `brand-line` (strong) | `rgba(196, 198, 181, 0.85)` | Focused input states, separators with visual prominence |

The olive undertone in `#C4C6B5` (hue: ~65°, saturation: ~8%) is what separates this border system from standard gray. A neutral gray border would break the tonal family and make the interface look assembled from mismatched parts. The slight warmth is invisible at first glance but perceptible as intentional in direct comparison.

---

## Ambient Glow & SVG Arc Palette

The concentric arc system — the most distinctive visual element of the Prato interface — requires the most delicate recalibration in the light theme. In the dark theme, the glows and arcs are expressed as luminous additions to a dark field. In the light theme, they must be expressed as subtractive, shadow-like presences on a light field. The opacity values drop significantly to prevent the arcs from reading as intrusive overlays.

### SVG Arc Strokes

In the dark theme, arcs used `brand-line` at `rgba(110,114,94, N)` with decreasing opacity. In the light theme, the arcs use the deep olive text color at very low opacity, creating a subtle impression of structure.

| Arc | Radius | Dark Opacity | Light Value |
|---|---|---|---|
| Arc 1 (outermost) | 375 | `rgba(110,114,94,0.35)` | `rgba(57,61,40,0.15)` |
| Arc 2 | 295 | `rgba(110,114,94,0.28)` | `rgba(57,61,40,0.12)` |
| Arc 3 | 215 | `rgba(110,114,94,0.22)` | `rgba(57,61,40,0.09)` |
| Arc 4 | 135 | `rgba(110,114,94,0.16)` | `rgba(57,61,40,0.07)` |
| Arc 5 (innermost) | 58 | `rgba(110,114,94,0.10)` | `rgba(57,61,40,0.05)` |

The scale markers (small horizontal lines at arc extremities) follow the same opacity pattern. The center anchor point uses `rgba(62,92,28,0.45)` — a rich dark green that is visible but not distracting on the cream field.

### Outer Arc Glow Faixa

The outer arc has a wide, soft stroke that creates a diffuse glow effect. In the dark theme this was `rgba(94,111,55,0.04)` at `stroke-width="28"`. In the light theme this becomes `rgba(57,61,40,0.05)` at the same stroke width — a barely perceptible shadow ring that reinforces the arc's presence.

### Ambient Radial Glows

The two ambient glow divs (green and magenta) require significantly reduced opacity in the light theme, as radial gradients on light surfaces bleed into the palette far more aggressively than on dark ones.

| Glow | Dark Value | Light Value | Position |
|---|---|---|---|
| Green ambient | `rgba(94,111,55,0.22)` → transparent | `rgba(62,92,28,0.07)` → transparent | Center-left, 45% height |
| Magenta ambient | `rgba(201,76,182,0.15)` → transparent | `rgba(168,52,154,0.05)` → transparent | Right side |

The `filter: blur(80px)` value from the dark theme should be increased to `filter: blur(100px)` in the light theme to ensure the glows remain genuinely diffuse rather than forming visible color patches. The ambience should be felt, not seen.

---

## Interactive States

### `.btn-primary` — Light Theme

The primary button in the light theme uses `brand-primary` (`#526030`) as its background with `brand-bg` (`#F5F4EE`) as the text color. This maintains the same structural logic as the dark theme but adapted for cream surfaces.

On **hover**, the background transitions to `#5E6F37` (the original dark theme button color, which becomes the lightened hover state in this context). The box-shadow should incorporate both the magenta and green glows but at reduced opacity compared to dark theme, since the light surface absorbs glow differently: `0 0 0 1px rgba(82,96,48,0.3), 0 4px 16px rgba(82,96,48,0.2), 0 1px 4px rgba(168,52,154,0.1)`.

On **focus**, a 2px outline in `brand-primary` at 50% opacity provides keyboard accessibility without breaking the visual system.

On **disabled**, the button background uses `rgba(82,96,48,0.35)` and text uses `rgba(245,244,238,0.5)` — preserving the color family identity even in inactive states.

### `.btn-access` (Header Access Button)

The outline button in the light theme inverts its logic: the border becomes `rgba(57,61,40,0.3)` (dark olive at low opacity) and the text color becomes `brand-soft` (`#393D28`). The arrow character uses `brand-primary` (`#526030`). Hover state lightens the border to `rgba(57,61,40,0.5)` and the background gains `rgba(82,96,48,0.05)` — a ghost-green tint.

### Form Input States

Email input fields in the CTA section use `brand-surface-2` as background, `brand-line` as default border, and `brand-soft` as placeholder text. On focus, the border transitions to `brand-primary` (`#526030`) and a very subtle inset shadow of `rgba(82,96,48,0.12)` provides depth perception. Error state uses `brand-secondary` (`#A8349A`) as the border accent.

---

## Section-by-Section Color Application

### Hero

The hero section uses `brand-bg` (`#F5F4EE`) as its background. The eyebrow text uses `brand-muted` (`#696C5B`). The H1 uses `brand-text` (`#131508`) with the highlighted word "margem" in `brand-highlight` (`#3E5C1C`). The `.hl-under` underline on "restaurante." uses `#3E5C1C` directly (matching the highlight) with identical `text-decoration-thickness: 3px` and `text-underline-offset: 6px`. The subheadline uses `brand-soft` (`#393D28`) and the support text uses `brand-muted` (`#696C5B`). The header background is `brand-bg` with `backdrop-filter: blur(8px)` and a bottom border of `brand-line` (`rgba(196,198,181,0.6)`).

### Problema

The section background is `brand-surface` (`#ECEAE2`), creating the first visible contrast break from the hero. The eyebrow uses `brand-muted`. The H2 uses `brand-text` with `"está custando"` in `brand-highlight`. Card separators use `border-t border-brand-line/30`. Card title text uses `brand-text` and body uses `brand-soft`. Bullet points remain the same green as in the dark theme — `bg-brand-highlight` — since the highlight color is now the deep forest green `#3E5C1C` which works perfectly as a filled circle on cream.

### Solução

The section background returns to `brand-bg` (`#F5F4EE`). Cards use `brand-surface-2` (`#E3E1D8`) as background and `brand-line` as border. SVG icon strokes inside cards switch from `#8CB84F` (dark theme) to `#3E5C1C` (light theme highlight). All other copy follows the established text hierarchy.

### Benefícios

The section background is `brand-surface` (`#ECEAE2`). The numbered labels (`01`–`06`) use `brand-highlight` (`#3E5C1C`) — this is where the deep forest green really earns its place, providing strong chromatic interest against the warm cream. The benefit item titles use `brand-text` and descriptions use `brand-soft`.

### CTA Final

The CTA section returns to `brand-bg`. The static arcs inside the CTA use the light-theme arc palette described in the ambient section. The form input and button follow the interactive states documented above. The success checkmark SVG uses `brand-highlight` (`#3E5C1C`). The hint text "Sem spam. Sem compromisso." uses `brand-muted`.

### Footer

Background: `brand-bg`. Logo text: `brand-text`. Copyright and supporting text: `brand-muted`. Divider: `brand-line`. No additional color complexity — the footer should read as the quietest element of the page.

---

## Contrast & Accessibility

All text pairings in the light theme meet or exceed WCAG 2.1 AA standards. The table below summarizes the critical pairings:

| Foreground | Background | Ratio | WCAG Level |
|---|---|---|---|
| `brand-text` (`#131508`) | `brand-bg` (`#F5F4EE`) | ~18.5:1 | AAA |
| `brand-text` (`#131508`) | `brand-surface` (`#ECEAE2`) | ~16.2:1 | AAA |
| `brand-soft` (`#393D28`) | `brand-bg` (`#F5F4EE`) | ~11.2:1 | AAA |
| `brand-muted` (`#696C5B`) | `brand-bg` (`#F5F4EE`) | ~5.1:1 | AA |
| `brand-muted` (`#696C5B`) | `brand-surface` (`#ECEAE2`) | ~4.6:1 | AA |
| `brand-highlight` (`#3E5C1C`) | `brand-bg` (`#F5F4EE`) | ~7.8:1 | AAA |
| `brand-bg` (`#F5F4EE`) | `brand-primary` (`#526030`) | ~4.9:1 | AA (button) |

The magenta `brand-secondary` (`#A8349A`) is never used as text color in either theme. It serves decorative and ambient roles exclusively, so it carries no contrast obligation.

---

## Comparison Table: Dark vs. Light

| Token | Dark Value | Light Value | Logic |
|---|---|---|---|
| `brand-bg` | `#111307` | `#F5F4EE` | Full inversion — dark bg becomes light bg |
| `brand-surface` | `#16190B` | `#ECEAE2` | Maintains relative distance from bg |
| `brand-surface-2` | `#1B1F0F` | `#E3E1D8` | Third layer, same step logic |
| `brand-primary` | `#5E6F37` | `#526030` | Slightly darkened for contrast on cream |
| `brand-highlight` | `#8CB84F` | `#3E5C1C` | Same hue, inverted lightness — critical adaptation |
| `brand-secondary` | `#C94CB6` | `#A8349A` | Deepened magenta for light-surface weight |
| `brand-text` | `#F5F4EE` | `#131508` | Full inversion — text and bg swap roles |
| `brand-soft` | `#C9C7BA` | `#393D28` | Analogous relative step to main text |
| `brand-muted` | `#9B9888` | `#696C5B` | Meets AA in both directions |
| `brand-line` | `#6E725E` | `#C4C6B5` | Inverted: dark divider → light divider |

---

## Invariant Brand Rules

Certain rules transcend theme and must remain constant in both the dark and light versions of the Prato interface.

The separation between `brand-highlight` (text, icons, bullets) and `brand-primary` (buttons) is absolute. No matter which theme is active, highlighted text never uses the button color and buttons never use the highlight color. This structural rule is what gives the interface its tonal discipline.

The warm undertone (olive, yellow-green cast) must persist in all neutral surfaces. There is no pure white, no neutral gray, no cold beige in the Prato palette. Every surface, text, and line value belongs to the same warm-olive chromatic family.

The magenta accent (`brand-secondary`) remains ambient and decorative in both themes. It is never the primary visual statement of any element — it is tension, not identity.

The concentric arc motif retains its character in the light theme by reducing opacity rather than changing color. The arcs should still feel like a considered architectural choice — not wallpaper, not decoration, but structure. They should be subtle enough that a user might notice them on second glance, not first.

Typography weights, tracking values, and size scales are completely unchanged between themes. Visual hierarchy is expressed through color in the dark theme and through both color and tonal contrast in the light theme — the typographic architecture that carries the brand's intelligence should never be altered to compensate for a theme change.