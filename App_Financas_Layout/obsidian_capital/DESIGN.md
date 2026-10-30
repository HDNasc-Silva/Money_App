---
name: Obsidian Capital
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff7886'
  on-tertiary-container: '#780021'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.02em
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: 0em
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-ui:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system pairs the structural restraint of Notion with the systematic tonal depth of Material 3 Dark. Tailored for next-generation personal wealth management and modern institutional finance, it targets discerning users who value clarity, precision, and zero-clutter financial instrumentation.

The aesthetic philosophy centers on modern digital minimalism with subtle technical undertones:
- Pristine, content-first presentation with strict elimination of decorative banking gimmicks.
- High-contrast visual hierarchy enabling instantaneous metric scanning.
- Precise architectural surfaces stacked seamlessly to produce natural spatial separation without heavy ornamentation.
- Calm, restrained neutrality punctuated by definitive semantic emerald and rose accents for financial health and risk monitoring.

## Colors
The palette leverages deep, slate-tinted obsidian foundations, layered tonal containers, and crisp typographic contrasts:

- **Canvas & Backgrounds:**
  - Base Canvas: `#0B0F17` (Deep obsidian slate)
  - Surface Low: `#111827` (Receded container base)
  - Surface Container: `#161F30` (Standard card and pane background)
  - Surface High: `#1E293B` (Interactive states, popovers, elevated cards)
  - Surface Highest: `#243047` (Floating overlays, modal dialogs)

- **Semantic Accents:**
  - Primary / Inflow / Positive Yield: `#10B981` (Base Emerald), `#34D399` (Accessible vibrant text/fill)
  - Secondary / Analytical Projection: `#38BDF8` (Precision sky blue for charts, links, and selections)
  - Critical / Outflow / Alert: `#F43F5E` (Vibrant rose coral), `#FB7185` (Soft warning badge text)

- **Typography & Neutral Tokens:**
  - Text Primary: `#F8FAFC` (Pure optical crisp white)
  - Text Secondary: `#94A3B8` (Medium slate for meta labels, unit tags, and subtitles)
  - Text Muted: `#64748B` (Inactive states, placeholders, table column labels)
  - Structural Outline / Border: `#334155` (Subtle 1px boundaries)
  - Subtle Dividing Line: `#1E293B` (Internal row separators)

## Typography
Typographic discipline is essential for financial legibility. The system utilizes three coordinated typefaces:

- **Headlines & Metric Headers (Geist):** Clean, geometric, and modern. Tight letter-spacing provides a crisp, confident presence for high-level portfolio totals and section headers.
- **Continuous Reading & Interface Text (Inter):** Highly legible across varied pixel densities. Neutral shapes prevent reading fatigue in transaction ledgers and narrative breakdowns.
- **Financial Values & Tabular Data (JetBrains Mono):** Applied rigorously to monetary amounts, ticker symbols, transaction codes, and percentage deltas. Its tabular figures eliminate jitter when streaming dynamic real-time market data.

## Layout & Spacing
The layout follows a fluid 12-column grid system built on an 8-point spatial base with a 4-point micro-step:

- **Desktop (>= 1280px):** 12 columns, 32px (`space-xl`) margins, 24px (`gutter`) column spacing. Complex split dashboards default to 8-column main analytical charts and 4-column account feeds.
- **Tablet (768px - 1279px):** 8 columns, 24px margins, 16px gutters. Analytical charts collapse to full-width; secondary widgets stack into 4-column pairs.
- **Mobile (< 768px):** 4 columns, 16px margins, 12px gutters. All primary financial metrics reflow into single-column vertical stacks. Horizontal scroll is preserved strictly for granular ledger comparisons and category chip carousels.

## Elevation & Depth
Depth in this dark ecosystem is achieved primarily through systematic tonal shifting and hairline border definitions, avoiding muddy or indistinct dark shadows:

- **Base Layer (Canvas):** Pure `#0B0F17`. Serves as the deep bedrock for all screens.
- **Container Layer (Surfaces):** Cards and static panels use `#161F30` with an explicit 1px border rendered in `#334155` at 50% opacity.
- **Interactive & Raised State:** Lifted panels shift to `#1E293B` supported by a soft, directional ambient shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.45)`.
- **Overlay & Popover Layer:** Floating menus, context menus, and tooltips utilize `#243047` with a fine outline (`#334155` at 80% opacity) and an ambient depth glow: `0 16px 36px -8px rgba(0, 0, 0, 0.65)`.
- **Glass Accent:** Header navigation bars and floating action trays utilize a subtle backdrop blur (`backdrop-filter: blur(12px)`) with 80% alpha opacity on the base surface tone (`rgba(11, 15, 23, 0.8)`).

## Shapes
Geometry strikes a balance between professional restraint and modern tactile softness:

- **Cards & Primary Modules:** Use `rounded-2xl` (1rem to 1.5rem / 16px–24px) to frame analytical units and portfolio breakdowns cleanly.
- **Interactive Controls:** Buttons, input fields, dropdown triggers, and status badges utilize `rounded-lg` (0.5rem to 0.75rem / 8px–12px) for structured, deliberate click/touch targets.
- **Micro-Indicators & Avatars:** Tickers, category icons, and circular budget rings use fully rounded shapes (`rounded-full`) to contrast against the architectural cards.

## Components

### Buttons
- **Primary:** Background `#10B981`, foreground `#0B0F17` (bold/600), border none. Hover state scales to `#34D399`. Active state subtly dims.
- **Secondary / Surface:** Background `#1E293B`, foreground `#F8FAFC`, border 1px solid `#334155`. Hover shifts to `#243047` with border highlighting `#475569`.
- **Destructive:** Background `rgba(244, 63, 94, 0.1)`, foreground `#F43F5E`, border 1px solid `rgba(244, 63, 94, 0.25)`. Hover fills to `#F43F5E` with `#0B0F17` text.

### Cards
- Surface background `#161F30`, 1px solid border `#334155`, corner radius `1rem` (`rounded-2xl`). Internal padding conforms to `1.5rem` (`space-lg`).
- Stat Card Pattern: Upper label in `label-ui` (`#94A3B8`), central metric in `headline-lg` Geist or `label-numeric-lg` JetBrains Mono, footer containing an inline delta pill showing net movement.

### Data Chips & Badges
- **Positive Yield Badge:** Background `rgba(16, 185, 129, 0.12)`, text `#34D399`, font `JetBrains Mono` 12px, border 1px solid `rgba(16, 185, 129, 0.25)`.
- **Expense / Warning Badge:** Background `rgba(244, 63, 94, 0.12)`, text `#FB7185`, font `JetBrains Mono` 12px, border 1px solid `rgba(244, 63, 94, 0.25)`.
- **Filter Chip:** Neutral `#1E293B` background, `#94A3B8` text, rounded-lg. Selected state flips border to `#38BDF8` and text to `#F8FAFC`.

### Form Fields & Inputs
- Background `#111827`, border 1px solid `#334155`, text `#F8FAFC`, placeholder `#64748B`. Corner radius `0.5rem`.
- Focus state features a sharp, zero-offset 1px accent border `#38BDF8` with a diffused glow ring `0 0 0 3px rgba(56, 189, 248, 0.15)`.

### Financial Transaction Lists
- Row layout with zero heavy dividers. Uses subtle `#1E293B` borders on bottom only.
- Left slot: 40px rounded-xl icon container with category symbol.
- Center slot: Primary payee in `#F8FAFC` (Inter 14px Regular), metadata/timestamp in `#64748B`.
- Right slot: Monospace value (`JetBrains Mono` 14px Medium). Negative flows prefixed with `−` in `#F8FAFC`, positive inflows prefixed with `+` in `#34D399`.

### Selection Controls (Checkboxes & Radios)
- Base container `#111827`, border 1.5px solid `#475569`.
- Checked state fills `#10B981` with `#0B0F17` tick/dot mark, reinforcing visual validation instantly.