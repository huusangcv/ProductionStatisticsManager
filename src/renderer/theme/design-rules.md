# Production Statistics Manager — UI Design System

Desktop-only design standards for the Electron + React + Material UI v7 application.

**Scope:** Reusable visual tokens and MUI theme configuration. No page layouts or business logic.

**Source files:**

| File | Purpose |
|------|---------|
| `theme.ts` | Design tokens (colors, spacing, typography, component standards) |
| `mui-theme.ts` | MUI `createTheme` mapping and component overrides |

---

## 1. Design Principles

1. **Desktop-first** — Optimized for 1280 px and above. No mobile breakpoints.
2. **Clarity over decoration** — Data-dense interfaces with clear hierarchy.
3. **Consistency** — All surfaces derive from shared tokens; avoid one-off values.
4. **Restrained motion** — Transitions 100–300 ms; no distracting animation.
5. **Accessible contrast** — Text meets WCAG AA on standard backgrounds.

---

## 2. Typography

**Font stack:** Inter (primary), system fallbacks.

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 30 px | 700 | Page titles (rare) |
| `h2` | 22 px | 700 | Section headers |
| `h3` | 18 px | 600 | Card titles, panel headers |
| `h4` | 16 px | 600 | Sub-section titles |
| `body1` | 14 px | 400 | Default body text |
| `body2` | 13 px | 400 | Secondary body, table cells |
| `caption` | 12 px | 400 | Labels, metadata |
| `overline` | 11 px | 600 | Category labels (uppercase) |
| `button` | 14 px | 600 | Button labels (no uppercase) |

**Rules:**

- Never use font sizes outside the token scale.
- Line height: `1.5` for body, `1.2` for compact UI labels.
- Do not use `text-transform: uppercase` except for `overline` tokens.
- Monospace (`fontFamily.mono`) reserved for IDs, codes, and raw data.

---

## 3. Spacing

Base unit: **4 px**. All spacing must be a multiple of 4.

| Token | Value | Common use |
|-------|-------|------------|
| `1` | 4 px | Tight inline gaps |
| `2` | 8 px | Icon-to-text gap |
| `3` | 12 px | Compact padding |
| `4` | 16 px | Standard inner padding |
| `5` | 20 px | Section gaps, page padding (default) |
| `6` | 24 px | Card padding, dialog padding |
| `8` | 32 px | Large section separation |
| `16` | 64 px | Empty state vertical padding |

**Rules:**

- Use MUI `spacing(n)` or token values from `theme.ts` — never arbitrary pixel values.
- Vertical rhythm: stack sections with `spacing[5]` (20 px) or `spacing[6]` (24 px).
- Inline element gaps: `spacing[2]` (8 px) minimum.

---

## 4. Container

| Property | Value |
|----------|-------|
| Max content width | 1800 px |
| Min supported width | 1280 px |
| Horizontal alignment | Centered (`margin: 0 auto`) |

**Shell dimensions:**

| Element | Size |
|---------|------|
| Sidebar (expanded) | 240 px |
| Sidebar (collapsed) | 72 px |
| Topbar height | 72 px |
| Window bar (Electron) | 32 px |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4 px | Badges, small indicators |
| `sm` | 8 px | Icon buttons, compact inputs |
| `md` | 12 px | Buttons, inputs, menus (MUI default) |
| `lg` | 16 px | Cards, dialogs, DataGrid |
| `xl` | 20 px | Hero panels |
| `pill` | 9999 px | Search bars, chips, filters |
| `full` | 50% | Avatars, status dots |

---

## 6. Elevation

Flat design with subtle depth. Prefer borders over heavy shadows.

| Level | Shadow | Usage |
|-------|--------|-------|
| `none` | — | Default surfaces |
| `soft` | Dual-layer subtle | Cards, panels |
| `md` | Single medium | Dropdowns |
| `lg` | Prominent | Drawers, modals |
| `xl` | Deep | Dialogs |
| `focusRing` | Blue glow | Focus states on inputs |

**Rules:**

- Cards use `elevation.soft` + 1 px border — not both heavy shadow and thick border.
- Buttons are flat (`disableElevation: true`).
- Modals and drawers may use `elevation.lg` or `elevation.xl`.

---

## 7. Color Palette

### Brand

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#2563eb` | CTAs, active nav, links, focus rings |
| Primary light | `#eff6ff` | Selected row backgrounds, active filter |
| Secondary | `#334155` | Secondary actions, dark UI accents |

### Surfaces

| Role | Hex |
|------|-----|
| Body background | `#f5f7fb` |
| Paper / card | `#ffffff` |
| Subtle | `#f8fafc` |
| Muted | `#f1f5f9` |
| Sidebar | `#0f172a` |

### Text

| Role | Hex |
|------|-----|
| Primary | `#0f172a` |
| Secondary | `#64748b` |
| Disabled | `#94a3b8` |
| Inverse | `#f8fafc` |

### Borders

| Role | Hex |
|------|-----|
| Default | `#e8eaf0` |
| Subtle | `#e2e8f0` |
| Strong | `#cbd5e1` |
| Focus | `#2563eb` |

---

## 8. Status Colors

Use semantic status tokens — never hardcode one-off greens/reds.

| Status | Main | Light BG | Dark | Border |
|--------|------|----------|------|--------|
| Success | `#16a34a` | `#dcfce7` | `#15803d` | `#bbf7d0` |
| Warning | `#d97706` | `#fef3c7` | `#b45309` | `#fde68a` |
| Error | `#dc2626` | `#fee2e2` | `#b91c1c` | `#fecaca` |
| Info | `#0284c7` | `#e0f2fe` | `#0369a1` | `#bae6fd` |
| Neutral | `#64748b` | `#f1f5f9` | `#475569` | `#e2e8f0` |

**Rules:**

- Chips and badges: light background + dark text + matching border.
- Snackbars: dark background variant for high contrast.
- Status dots: use `icon` shade with optional glow ring.

---

## 9. Component Standards

### Card

```
Background:   #ffffff
Border:       1px solid #e8eaf0
Radius:       16px
Shadow:       elevation.soft
Padding:      24px
Title:        18px / 700 / #0f172a
Header gap:   20px below title row
```

### Button

| Size | Height | Notes |
|------|--------|-------|
| Small | 32 px | Toolbar actions |
| Medium | 40 px | Default |
| Large | 48 px | Primary page actions |

- `text-transform: none`
- No box shadow on any variant
- Min width: 88 px
- Icon gap: 8 px

| Variant | Style |
|---------|-------|
| Contained | Primary fill, white text |
| Outlined | Border `#cbd5e1`, hover → primary tint |
| Text | Transparent, hover → `action.hover` |

### Dialog

- Max widths: 480 / 640 / 800 px (`sm` / `md` / `lg`)
- Border radius: 16 px
- Padding: 24 px
- Backdrop: `rgba(15, 23, 42, 0.45)`
- Title: 16 px / 700

### Drawer

- Default width: 420 px (`md`)
- Range: 360–480 px
- Slides from right
- Border-left: 1px `#e5e7eb`
- Header height: 64 px

### Table

| Property | Value |
|----------|-------|
| Header background | `#f8fafc` |
| Header text | 12 px / 600 / `#64748b` |
| Row height | 52 px |
| Row hover | `#f1f5f9` |
| Row selected | `#eff6ff` |
| Cell padding | 12 px vertical, 16 px horizontal |

### DataGrid

Inherits table standards plus:

| Property | Value |
|----------|-------|
| Toolbar background | `#f8fafc` |
| Toolbar height | 48 px |
| Footer height | 52 px |
| Border radius | 16 px (outer container) |
| Checkbox | Primary color |

### Search Bar

| Property | Value |
|----------|-------|
| Height | 40 px |
| Width | 240–360 px |
| Shape | Pill (`border-radius: 9999px`) |
| Background | `#f8fafc` → `#ffffff` on focus |
| Focus ring | 3 px primary glow |
| Font | 13 px |

### Filter

| Property | Value |
|----------|-------|
| Height | 36 px |
| Shape | 12 px radius |
| Default | White bg, `#e8eaf0` border |
| Active | `#eff6ff` bg, `#2563eb` border + text |
| Font | 12 px / 600 |

### Input (TextField)

| Size | Height |
|------|--------|
| Small | 36 px |
| Medium | 40 px |
| Large | 48 px |

- Outlined variant only (default)
- Border radius: 12 px
- Focus: primary border + focus ring
- Helper text: 12 px, aligned left

### Chip

| Size | Height |
|------|--------|
| Small | 24 px |
| Medium | 28 px |
| Large | 32 px |

- Pill shape
- Status chips map to `statusColors` tokens
- Font: 12 px / 500

### Avatar

| Size | Pixels |
|------|--------|
| xs | 24 |
| sm | 32 |
| md | 36 |
| lg | 40 |
| xl | 48 |

- Circular
- Fallback bg: `#dbeafe`, text: `#2563eb`
- 2 px white border when overlapping

### Snackbar

- Position: bottom-right
- Min width: 320 px, max: 480 px
- Border radius: 12 px
- Shadow: `elevation.lg`
- Use `MuiAlert` for structured messages

### Loading

| Type | Standard |
|------|----------|
| Inline spinner | 20 / 32 / 48 px by context |
| Page overlay | `rgba(255,255,255,0.72)` |
| Skeleton | `#f1f5f9` base, `#f8fafc` wave |
| Pulse duration | 1200 ms |

### Empty State

- Centered column layout
- Icon circle: 80 px, `#f1f5f9` background
- Title: 16 px / 700 / `#475569`
- Description: 14 px / `#64748b`
- Vertical padding: 64 px

---

## 10. Scrollbar

| Context | Width | Thumb |
|---------|-------|-------|
| Global | 10 px | `rgba(15, 23, 42, 0.18)` |
| Sidebar nav | 4 px | `rgba(255, 255, 255, 0.10)` |

- Track: transparent
- Shape: pill
- Hover: slightly darker thumb

---

## 11. Page Padding

Responsive padding inside the content container:

| Viewport | Padding |
|----------|---------|
| 1280 – 1919 px | 20 px |
| 1920 – 2559 px | 24 px |
| 2560 px+ | 32 px |

Applied to `.pageContainer` and equivalent MUI `Box` wrappers.

---

## 12. Grid Rules

- **System:** 12-column CSS Grid
- **Default gap:** 20 px
- **Large desktop gap:** 24 px (≥ 1920 px)

### Common spans

| Layout | Span |
|--------|------|
| Full width | 12 |
| Half | 6 |
| Third | 4 |
| Quarter | 3 |
| Two-thirds | 8 |
| Sidebar panel | 4 |
| Main content | 8 |

### Breakpoint-driven layouts

At smaller desktop widths, stack to full width (span 12). Progressive enhancement at `sm` (1366), `md` (1440), `lg` (1920).

**Example — KPI row:**

```
≥ 1366 px → 4 cards × span 3
≥ 1280 px → 2 cards × span 6
< 1280 px → not supported
```

---

## 13. Desktop Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `xs` | 1280 px | Minimum laptop |
| `sm` | 1366 px | Standard laptop |
| `md` | 1440 px | Medium desktop |
| `lg` | 1920 px | Full HD |
| `xl` | 2560 px | Ultra-wide / 4K |

MUI media queries:

```ts
theme.breakpoints.up('sm')   // ≥ 1366
theme.breakpoints.up('lg')   // ≥ 1920
```

---

## 14. Z-Index Scale

| Layer | Value |
|-------|-------|
| Dropdown | 1100 |
| Sticky (topbar) | 1200 |
| Drawer | 1300 |
| Modal / Dialog | 1400 |
| Snackbar | 1500 |
| Tooltip | 1600 |

---

## 15. Integration Guide

### Using tokens in CSS Modules

Reference CSS custom properties defined in `global.css` or map directly:

```css
.panel {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}
```

### Using tokens in MUI `sx`

```tsx
import { spacing } from './theme/theme';

<Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }} />
```

### Applying the MUI theme

Replace inline `createTheme` in `AppThemeProvider` with:

```tsx
import { ThemeProvider } from '@mui/material';
import muiTheme from './mui-theme';

<ThemeProvider theme={muiTheme}>
  {children}
</ThemeProvider>
```

---

## 16. Do / Don't

| Do | Don't |
|----|-------|
| Import values from `theme.ts` | Hardcode hex colors in components |
| Use 4 px spacing multiples | Use 15 px, 22 px, etc. |
| Use status color tokens | Invent new reds/greens per page |
| Keep buttons flat | Add drop shadows to buttons |
| Use pill shape for search | Use rectangular search bars |
| Limit animations to 300 ms | Use long or bouncy transitions |
| Test at 1280 px minimum | Design for mobile viewports |

---

## 17. File Ownership

```
src/renderer/theme/
├── theme.ts          ← Design tokens (source of truth)
├── mui-theme.ts      ← MUI theme factory
├── AppThemeProvider.jsx  ← React provider (wire to mui-theme)
└── design-rules.md   ← This document
```

When adding a new visual pattern, update `theme.ts` first, then `mui-theme.ts`, then document the rule here.
