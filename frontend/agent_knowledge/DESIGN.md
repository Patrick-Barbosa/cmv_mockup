---
name: Prato
colors:
  brand-bg: "#111307"
  brand-surface: "#16190B"
  brand-surface-2: "#1B1F0F"
  brand-primary: "#5E6F37"
  brand-highlight: "#8CB84F"
  brand-secondary: "#C94CB6"
  brand-text: "#F5F4EE"
  brand-soft: "#C9C7BA"
  brand-muted: "#9B9888"
  brand-line: "#6E725E"
typography:
  h1:
    fontFamily: "Inter"
    fontWeight: 600
    lineHeight: "1.08"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Inter"
    fontWeight: 600
    lineHeight: "1.375"
  eyebrow:
    fontFamily: "Inter"
    fontWeight: 500
    letterSpacing: "0.35em"
  body:
    fontFamily: "Inter"
    fontWeight: 400
rounded:
  base: "2px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
---

## Overview
A sophisticated, modern, and high-tech interface for restaurant margin intelligence. The UI evokes a premium, focused, and data-driven experience, relying on a dark theme to create contrast and emphasize key metrics.

## Colors
The palette is rooted in a dark olive/warm black base, utilizing subtle shifts in surface color for depth.
- `brand-bg`, `brand-surface`, and `brand-surface-2` define the foundational layers.
- `brand-primary` (dark military green) is strictly for primary actions like buttons.
- `brand-highlight` (lighter green) provides high contrast for essential text emphasis, SVG icons, and bullet points.
- `brand-secondary` (magenta) is used sparingly for ambient glows and micro-interactions.

## Typography
Clean, legible, and structured typography utilizing the Inter font family.
- H1 is tight and bold, conveying authority and focus.
- Section eyebrows utilize generous tracking (`0.35em`) to create a structured, editorial feel.
- Body text prioritizes readability across dense data interfaces.

## Spacing
A consistent, modular scale ensures generous breathing room between sections, preventing cognitive overload when digesting complex margin calculations and data tables.

## Elevation
Instead of traditional drop shadows, elevation is achieved through subtle tonal shifts (`brand-surface`, `brand-surface-2`) and faint border lines (`brand-line` at low opacities). Glows (magenta and green) are used selectively to draw attention to critical interactive elements or hero sections.

## Components
- **Buttons**: Primary buttons use `brand-primary` backgrounds with `brand-text` foregrounds, transitioning to a slightly lighter hover state with a subtle, multi-colored glow.
- **Cards**: Elevated on `brand-surface-2` with thin `brand-line` borders to separate data cleanly without visual noise.
- **Inputs**: Defined by `brand-surface` backgrounds and `brand-line` borders, focusing on `brand-highlight` during interaction.

## Layout
Mobile-first, utilizing fluid grids. Data-heavy views (like Insumos and Receitas tables) prioritize horizontal space and utilize scroll areas gracefully.

## Imagery
Abstract, procedurally generated visuals like SVG arcs and glows are preferred over photography, reinforcing the application's analytical and technological nature.

## Motion
Animations are purposeful and smooth.
- Continuous, slow linear rotations (`arcSpin` over 40s) for background elements.
- Staggered `fade-up` effects (0.6s) to reveal sections and cards gracefully as the user scrolls.
- Quick, crisp transitions (0.15s - 0.2s) for color, background, and border changes on interactive elements.
