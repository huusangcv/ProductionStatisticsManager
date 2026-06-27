/**
 * Production Statistics Manager — Design Tokens
 * Desktop-only Electron application design system foundation.
 */

// ---------------------------------------------------------------------------
// Breakpoints (desktop only)
// ---------------------------------------------------------------------------

export const breakpoints = {
  /** Minimum supported desktop width */
  xs: 1280,
  /** Standard laptop / small desktop */
  sm: 1366,
  /** Medium desktop */
  md: 1440,
  /** Large desktop / Full HD */
  lg: 1920,
  /** Ultra-wide / 4K */
  xl: 2560,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// ---------------------------------------------------------------------------
// Spacing (4px base unit)
// ---------------------------------------------------------------------------

export const spacingUnit = 4;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Multiply design-token spacing by unit (matches MUI spacing helper) */
export function space(key: SpacingKey): number {
  return spacing[key];
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  primary:
    "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 22,
  "3xl": 30,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  tight: "-0.01em",
  normal: "0",
  wide: "0.02em",
  wider: "0.05em",
} as const;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  h1: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body1: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  body2: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  subtitle1: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },
  subtitle2: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase" as const,
  },
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    textTransform: "none" as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

export const palette = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    main: "#2563eb",
    light: "#60a5fa",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
  },
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    main: "#334155",
    light: "#64748b",
    dark: "#1e293b",
    contrastText: "#ffffff",
  },
  neutral: {
    white: "#ffffff",
    black: "#000000",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  background: {
    default: "#f5f7fb",
    paper: "#ffffff",
    elevated: "#ffffff",
    subtle: "#f8fafc",
    muted: "#f1f5f9",
    sidebar: "#0f172a",
    overlay: "rgba(15, 23, 42, 0.45)",
  },
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    disabled: "#94a3b8",
    inverse: "#f8fafc",
    link: "#2563eb",
    linkHover: "#1d4ed8",
  },
  border: {
    default: "#e8eaf0",
    subtle: "#e2e8f0",
    strong: "#cbd5e1",
    focus: "#2563eb",
    divider: "#e5e7eb",
  },
  action: {
    hover: "rgba(15, 23, 42, 0.04)",
    selected: "rgba(37, 99, 235, 0.08)",
    disabled: "rgba(15, 23, 42, 0.26)",
    focus: "rgba(37, 99, 235, 0.12)",
  },
} as const;

// ---------------------------------------------------------------------------
// Status colors
// ---------------------------------------------------------------------------

export const statusColors = {
  success: {
    main: "#16a34a",
    light: "#dcfce7",
    dark: "#15803d",
    contrastText: "#ffffff",
    border: "#bbf7d0",
    icon: "#22c55e",
  },
  warning: {
    main: "#d97706",
    light: "#fef3c7",
    dark: "#b45309",
    contrastText: "#ffffff",
    border: "#fde68a",
    icon: "#f59e0b",
  },
  error: {
    main: "#dc2626",
    light: "#fee2e2",
    dark: "#b91c1c",
    contrastText: "#ffffff",
    border: "#fecaca",
    icon: "#ef4444",
  },
  info: {
    main: "#0284c7",
    light: "#e0f2fe",
    dark: "#0369a1",
    contrastText: "#ffffff",
    border: "#bae6fd",
    icon: "#0ea5e9",
  },
  neutral: {
    main: "#64748b",
    light: "#f1f5f9",
    dark: "#475569",
    contrastText: "#ffffff",
    border: "#e2e8f0",
    icon: "#94a3b8",
  },
} as const;

export type StatusVariant = keyof typeof statusColors;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  pill: 9999,
  full: "50%",
} as const;

// ---------------------------------------------------------------------------
// Elevation (shadows)
// ---------------------------------------------------------------------------

export const elevation = {
  none: "none",
  xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
  sm: "0 2px 4px rgba(15, 23, 42, 0.06)",
  md: "0 2px 8px rgba(15, 23, 42, 0.08)",
  lg: "0 8px 24px rgba(15, 23, 42, 0.10)",
  xl: "0 16px 40px rgba(15, 23, 42, 0.12)",
  soft: "0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
  focusRing: "0 0 0 3px rgba(37, 99, 235, 0.16)",
  inner: "inset 0 1px 2px rgba(15, 23, 42, 0.06)",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1100,
  sticky: 1200,
  drawer: 1300,
  modal: 1400,
  snackbar: 1500,
  tooltip: 1600,
} as const;

// ---------------------------------------------------------------------------
// Layout & container
// ---------------------------------------------------------------------------

export const layout = {
  sidebar: {
    widthExpanded: 240,
    widthCollapsed: 72,
  },
  topbar: {
    height: 72,
  },
  container: {
    maxWidth: 1800,
    minWidth: breakpoints.xs,
  },
  windowBar: {
    height: 32,
  },
} as const;

export const pagePadding = {
  /** 1280 – 1919 px */
  default: spacing[5],
  /** 1920 – 2559 px */
  lg: spacing[6],
  /** 2560 px and above */
  xl: spacing[8],
} as const;

// ---------------------------------------------------------------------------
// Grid rules
// ---------------------------------------------------------------------------

export const grid = {
  columns: 12,
  gap: {
    default: spacing[5],
    lg: spacing[6],
  },
  /** Standard content area spans */
  spans: {
    full: 12,
    half: 6,
    third: 4,
    quarter: 3,
    twoThirds: 8,
    sidebar: 4,
    main: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const transitions = {
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;

// ---------------------------------------------------------------------------
// Component style tokens (standards — not React components)
// ---------------------------------------------------------------------------

export const componentStyles = {
  card: {
    backgroundColor: palette.background.paper,
    borderRadius: borderRadius.lg,
    border: `1px solid ${palette.border.default}`,
    boxShadow: elevation.soft,
    padding: spacing[6],
    headerGap: spacing[5],
    titleColor: palette.text.primary,
    titleFontSize: fontSize.xl,
    titleFontWeight: fontWeight.bold,
  },
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    minWidth: 88,
    borderRadius: borderRadius.md,
    paddingX: spacing[4],
    paddingY: spacing[2],
    fontWeight: fontWeight.semibold,
    textTransform: "none" as const,
    iconGap: spacing[2],
    boxShadow: elevation.none,
  },
  dialog: {
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    maxWidth: {
      sm: 480,
      md: 640,
      lg: 800,
    },
    titleFontSize: fontSize.lg,
    titleFontWeight: fontWeight.bold,
    backdropColor: palette.background.overlay,
  },
  drawer: {
    width: {
      sm: 360,
      md: 420,
      lg: 480,
    },
    padding: spacing[6],
    headerHeight: 64,
    borderColor: palette.border.divider,
    backgroundColor: palette.background.paper,
  },
  table: {
    headerBackground: palette.background.subtle,
    headerColor: palette.text.secondary,
    headerFontSize: fontSize.sm,
    headerFontWeight: fontWeight.semibold,
    rowHeight: 52,
    rowHoverBackground: palette.background.muted,
    rowSelectedBackground: palette.primary[50],
    borderColor: palette.border.subtle,
    cellPaddingX: spacing[4],
    cellPaddingY: spacing[3],
  },
  dataGrid: {
    headerBackground: palette.background.subtle,
    headerColor: palette.text.secondary,
    headerFontSize: fontSize.sm,
    headerFontWeight: fontWeight.semibold,
    rowHeight: 52,
    rowHoverBackground: palette.background.muted,
    rowSelectedBackground: palette.primary[50],
    borderColor: palette.border.subtle,
    toolbarBackground: palette.background.subtle,
    toolbarHeight: 48,
    footerHeight: 52,
    checkboxColor: palette.primary.main,
  },
  searchBar: {
    height: 40,
    minWidth: 240,
    maxWidth: 360,
    borderRadius: borderRadius.pill,
    backgroundColor: palette.background.subtle,
    backgroundColorFocus: palette.background.paper,
    borderColor: palette.border.default,
    borderColorFocus: palette.primary.main,
    fontSize: fontSize.md,
    paddingX: spacing[4],
    iconGap: spacing[2],
    focusRing: elevation.focusRing,
  },
  filter: {
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: palette.background.paper,
    borderColor: palette.border.default,
    activeBackground: palette.primary[50],
    activeBorderColor: palette.primary.main,
    activeColor: palette.primary.main,
    fontSize: fontSize.sm,
    paddingX: spacing[3],
    gap: spacing[2],
  },
  input: {
    height: {
      sm: 36,
      md: 40,
      lg: 48,
    },
    borderRadius: borderRadius.md,
    backgroundColor: palette.background.paper,
    borderColor: palette.border.default,
    borderColorHover: palette.border.strong,
    borderColorFocus: palette.primary.main,
    fontSize: fontSize.base,
    labelFontSize: fontSize.sm,
    helperFontSize: fontSize.sm,
    paddingX: spacing[3],
    focusRing: elevation.focusRing,
  },
  chip: {
    height: {
      sm: 24,
      md: 28,
      lg: 32,
    },
    borderRadius: borderRadius.pill,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    paddingX: spacing[3],
    iconSize: 16,
  },
  avatar: {
    size: {
      xs: 24,
      sm: 32,
      md: 36,
      lg: 40,
      xl: 48,
    },
    borderRadius: borderRadius.full,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    backgroundColor: palette.primary[100],
    color: palette.primary.main,
    border: `2px solid ${palette.background.paper}`,
  },
  snackbar: {
    borderRadius: borderRadius.md,
    paddingX: spacing[4],
    paddingY: spacing[3],
    minWidth: 320,
    maxWidth: 480,
    fontSize: fontSize.base,
    boxShadow: elevation.lg,
    successBackground: statusColors.success.dark,
    errorBackground: statusColors.error.dark,
    warningBackground: statusColors.warning.dark,
    infoBackground: statusColors.info.dark,
  },
  loading: {
    spinnerSize: {
      sm: 20,
      md: 32,
      lg: 48,
    },
    overlayBackground: "rgba(255, 255, 255, 0.72)",
    skeletonBackground: palette.background.muted,
    skeletonHighlight: palette.background.subtle,
    pulseDuration: 1200,
  },
  emptyState: {
    paddingY: spacing[16],
    paddingX: spacing[6],
    iconSize: 80,
    iconBackground: palette.background.muted,
    iconColor: palette.text.disabled,
    titleFontSize: fontSize.lg,
    titleFontWeight: fontWeight.bold,
    titleColor: palette.text.secondary,
    descriptionFontSize: fontSize.base,
    descriptionColor: palette.text.secondary,
    actionGap: spacing[4],
  },
  scrollbar: {
    width: 10,
    height: 10,
    thumbColor: "rgba(15, 23, 42, 0.18)",
    thumbColorHover: "rgba(15, 23, 42, 0.28)",
    trackColor: "transparent",
    borderRadius: borderRadius.pill,
    sidebarWidth: 4,
    sidebarThumbColor: "rgba(255, 255, 255, 0.10)",
  },
} as const;

// ---------------------------------------------------------------------------
// Aggregated theme export
// ---------------------------------------------------------------------------

export const theme = {
  breakpoints,
  spacing,
  spacingUnit,
  typography,
  palette,
  statusColors,
  borderRadius,
  elevation,
  zIndex,
  layout,
  pagePadding,
  grid,
  transitions,
  componentStyles,
} as const;

export type Theme = typeof theme;
export default theme;
