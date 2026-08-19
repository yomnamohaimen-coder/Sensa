---
name: Sensa
description: Calm instrument-panel analytics for product teams who need plain-language insight
colors:
  ink: "#18181b"
  ink-secondary: "#3f3f46"
  ink-muted: "#71717a"
  ink-faint: "#a1a1aa"
  paper-mist: "#fafafa"
  paper: "#ffffff"
  paper-raised: "#f4f4f5"
  hairline: "#e4e4e7"
  stroke: "#d4d4d8"
  signal-green: "#059669"
  deep-teal: "#0f766e"
  mint-arc: "#5eead4"
  alert-red: "#b91c1c"
  alert-wash: "#fef2f2"
  alert-stroke: "#fecaca"
  warning-amber: "#92400e"
  warning-wash: "#fffbeb"
typography:
  display:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  "2xl": "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "#27272a"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  button-danger:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.xl}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  nav-item-active:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  nav-item:
    backgroundColor: "transparent"
    textColor: "#52525b"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
---

# Design System: Sensa

## Overview

**Creative North Star: "The Calm Instrument Panel"**

Sensa’s interface is a quiet tools surface for serious product decisions. It favors clarity, hierarchy, and trust over flourish. Screens read as a calm instrument panel: light zinc fields, dark ink for structure, and restrained chrome that stays out of the way of the narrative and the numbers.

Density is moderate and scannable—cards and sections give each job room without sprawling into dashboard noise. Color is rare and semantic. The system should feel like a professional analytics product a non-technical product owner can trust at a glance, never like a consumer app or a decorative marketing site.

**Key Characteristics:**
- Zinc-neutral shell with white cards on Paper Mist
- Semibold, tight-tracking page titles; small muted labels
- Color only for meaning (trends, conversion, danger)
- Flat structure with hairline borders and soft card shadow
- Refined, restrained controls—no playful chrome

## Colors

A cool neutral zinc scale carries almost all UI; teal/emerald and red appear only when encoding meaning.

### Primary
- **Ink** (#18181b): Primary text, brand wordmark weight, primary button fill, hero metric numbers.
- **Deep Teal** (#0f766e): Conversion donut first-stage ring and related chart structure.
- **Mint Arc** (#5eead4): Conversion donut completed arc—lighter accent within the teal family.

### Secondary
- **Signal Green** (#059669): Positive trend indicators and constructive chart strokes (e.g. 7-day trend line).

### Tertiary
- **Alert Red** (#b91c1c): Destructive actions and danger-zone emphasis; `#dc2626` for inline error text. Washes use `#fef2f2` / `#fecaca`.

### Neutral
- **Paper Mist** (#fafafa): Authenticated app canvas behind the sidebar.
- **Paper** (#ffffff): Cards, sidebar, modal surfaces.
- **Paper Raised** (#f4f4f5): Active nav item wash, subtle wells.
- **Hairline** (#e4e4e7): Default borders and dividers.
- **Stroke** (#d4d4d8): Input borders at rest.
- **Ink Secondary** (#3f3f46): Secondary labels / medium emphasis.
- **Ink Muted** (#71717a): Helper text, flat trends, secondary copy.
- **Ink Faint** (#a1a1aa): Non-text decoration only (icons, inactive chrome). Do not use for readable copy — prefer Ink Muted.

### Dark appearance
Appearance is **manual** (Settings → Light or Dark). Default is Light. Do not follow `prefers-color-scheme`.

Dark is a composed night panel, not a mechanical invert: canvas sits below surface, surface lifts with raised wells, hairlines stay visible, and ink/paper swap roles.

- **Canvas** (#09090b): App shell behind the sidebar.
- **Surface** (#18181b): Cards, sidebar, dialogs.
- **Raised** (#27272a): Active nav, wells, segmented tracks.
- **Hairline** (#3f3f46) / **Stroke** (#52525b): Borders.
- **Ink** (#fafafa) / **Ink Secondary** (#d4d4d8) / **Ink Muted** (#a1a1aa): Text. Muted uses the light-theme faint step so copy stays ≥4.5:1 on Surface.
- **On Ink** (#18181b): Label on the inverted primary button (Paper fill).
- **Signal Green** (#34d399), **Deep Teal** (#0d9488), **Mint Arc** (#5eead4), **Alert** text (#f87171): meaning colors only, lifted for contrast. Destructive button fill stays Alert Red (#b91c1c).

Heatmap snapshots and the Harbor Homes wireframe stay light — they depict the customer’s page, not Sensa chrome.

### Named Rules
**The Meaning-Only Color Rule.** Decorative color is banned. Green / teal / red appear only when they encode meaning (positive trend, conversion, danger/error). Otherwise stay in zinc.

## Typography

**Display Font:** Geist Sans (via `--font-geist-sans`, with UI sans / system fallbacks)  
**Body Font:** Geist Sans (same)  
**Label/Mono Font:** Geist Mono available via `--font-geist-mono` for code snippets

**Character:** Clean, modern product sans—neutral and highly legible. Hierarchy comes from size and weight, not ornamental type.

### Hierarchy
- **Display** (600, 1.5rem / `text-2xl`, tight tracking): Page titles (“Welcome…”, “Reports”, “Sensa” on auth).
- **Headline** (600, 1.125rem / `text-lg`): Settings section headers, report titles.
- **Title** (600, 1rem / `text-base`): Card titles (“Last analysis”, form section heads).
- **Body** (400–500, 0.875rem / `text-sm`): Primary reading copy, buttons, form controls.
- **Label** (400–500, 0.75rem / `text-xs`): Metric labels, meta, empty hints; often Ink Muted.

### Named Rules
**The Quiet Type Rule.** Do not introduce display serifs, gradient text, or oversized marketing headlines inside the authenticated product. Keep tracking tight only on large titles.

## Layout

Authenticated shell: fixed **224px** (`w-56`) left sidebar + scrollable main on Paper Mist. Content columns center at **`max-w-3xl`** (Dashboard, Connect, Settings) or **`max-w-4xl`** (Reports, Session Recordings) with **`px-6 py-10`**.

Vertical rhythm uses stacked sections with `gap-3`–`gap-5` between cards; settings groups use `mt-10` between major sections. Stat grids: `sm:grid-cols-2 lg:grid-cols-4`. Prefer one clear column of work over multi-column marketing layouts.

Breakpoints follow Tailwind defaults (`sm` 640px, `lg` 1024px). Sidebar stays desktop-first; do not invent a second mobile nav pattern without an explicit product decision.

## Elevation & Depth

Flat-by-default. Structure comes from Hairline borders and tonal wells (Paper Raised), not dramatic shadows. Cards rest on a soft ambient shadow only.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` / Tailwind `shadow-sm`): Default elevated panel.
- **Dialog lift** (`shadow-lg`): Modals / confirmation dialogs only.
- **Overlay** (`background: rgb(24 24 27 / 0.5)`): Modal backdrop.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Do not stack multi-layer glow shadows or colored blurs on product chrome.

## Shapes

Corners are softly rounded, never pill-like for primary actions.

- **Controls / nav items:** `rounded-md` (0.375rem)
- **Cards / dialogs / empty placeholders:** `rounded-lg` (0.5rem)
- **Segmented toggles / tiny chips:** `rounded` / `rounded-sm` as needed
- Borders: 1px Hairline or Stroke; dashed Hairline for empty chart placeholders
- Funnel bars and progress tracks: full rounded-full tracks with zinc fills

## Components

Character: **refined and restrained**.

### Buttons
- **Shape:** `rounded-md`
- **Primary:** Ink fill, white text, `px-4/5 py-2/2.5`, `text-sm font-medium`; hover Ink → zinc-800 (`#27272a`); disabled at 60% opacity
- **Secondary / Ghost:** white or transparent with Stroke/Hairline border, Ink Secondary text; hover Paper Raised
- **Danger:** Alert Red fill; hover deeper red (`#991b1b`)
- **Focus:** zinc or semantic ring (`focus:ring-1 focus:ring-zinc-500` / danger red on destructive fields)

### Cards / Containers
- **Corner Style:** `rounded-lg`
- **Background:** Paper
- **Shadow Strategy:** card rest (`shadow-sm`)
- **Border:** Hairline
- **Internal Padding:** typically `p-5` or `p-6`
- **Hero metric card:** slightly stronger border (`border-zinc-300`) to elevate one primary number

### Inputs / Fields
- **Style:** Paper fill, Stroke border, `rounded-md`, `px-3 py-2`, `text-sm`
- **Focus:** border + ring shift to zinc-500 (or Alert Red in danger flows)
- **Error:** `text-red-600` helper; optional red wash alert box
- **Disabled:** muted zinc fill/text

### Navigation
- Sidebar: Paper, Hairline right border, brand “Sensa” as Title/Display-scale semibold Ink
- Items: `text-sm font-medium`; default Ink-secondary (`#52525b`); hover Paper Mist/Raised; active Paper Raised + Ink
- Logout mirrors inactive nav item styling

### Empty states
- Stat empties: label remains; value becomes “No data yet” in Ink Muted (`text-zinc-500`), not a bold em dash
- Chart empties: dashed Hairline box, centered Ink Muted copy + decorative icon

### Signature: Mini conversion donut
- Deep Teal full ring + Mint Arc completion arc; center percent in Ink
- Legend uses live funnel stage names and counts—never hardcode “Search/Contact”

### Signature: Trend indicator
- Signal Green up, Alert-family red down, Ink Muted flat; arrows ↑ ↓ →
- Invert meaning only when the metric is “bad when up” (e.g. drop-off)

## Do's and Don'ts

### Do:
- **Do** keep authenticated screens on Paper Mist with white Hairline cards in Light, and on Canvas / Surface / Hairline tokens in Dark.
- **Do** reserve Signal Green / Deep Teal / Mint Arc / Alert Red for semantic meaning only.
- **Do** use one hero metric treatment (larger type, slightly stronger border) when a primary KPI leads the view.
- **Do** prefer Geist Sans hierarchy already in use; keep page titles `text-2xl font-semibold tracking-tight`.
- **Do** clear empty states with muted copy and dashed placeholders—not bare “—” as a fake number.

### Don't:
- **Don't** introduce purple gradients, glow stacks, or consumer “delight” chrome into the product shell.
- **Don't** use color as decoration on cards, nav, or backgrounds.
- **Don't** treat `globals.css` dark-mode Arial defaults as product authority—follow the zinc Tailwind patterns in components.
- **Don't** invent testimonials, marketing hero layouts, or playful illustration systems inside Operate surfaces.
- **Don't** hardcode funnel stage labels in conversion visuals when `metrics.funnel` provides names.
