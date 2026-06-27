/**
 * Production Statistics Manager — Material UI v7 Theme
 * Maps design tokens from theme.ts to MUI createTheme configuration.
 */

import { createTheme, alpha, type ThemeOptions } from "@mui/material/styles";
import theme from "./theme";

const {
  palette,
  typography: typeTokens,
  borderRadius,
  elevation,
  zIndex,
  layout,
  componentStyles,
  transitions,
  statusColors,
} = theme;

// ---------------------------------------------------------------------------
// MUI breakpoint values (desktop only — min-width queries)
// ---------------------------------------------------------------------------

const muiBreakpoints = {
  values: {
    xs: theme.breakpoints.xs,
    sm: theme.breakpoints.sm,
    md: theme.breakpoints.md,
    lg: theme.breakpoints.lg,
    xl: theme.breakpoints.xl,
  },
};

// ---------------------------------------------------------------------------
// Theme options
// ---------------------------------------------------------------------------

export const muiThemeOptions: ThemeOptions = {
  breakpoints: muiBreakpoints,
  spacing: theme.spacingUnit,
  palette: {
    mode: "light",
    primary: {
      main: palette.primary.main,
      light: palette.primary.light,
      dark: palette.primary.dark,
      contrastText: palette.primary.contrastText,
    },
    secondary: {
      main: palette.secondary.main,
      light: palette.secondary.light,
      dark: palette.secondary.dark,
      contrastText: palette.secondary.contrastText,
    },
    error: {
      main: statusColors.error.main,
      light: statusColors.error.light,
      dark: statusColors.error.dark,
      contrastText: statusColors.error.contrastText,
    },
    warning: {
      main: statusColors.warning.main,
      light: statusColors.warning.light,
      dark: statusColors.warning.dark,
      contrastText: statusColors.warning.contrastText,
    },
    info: {
      main: statusColors.info.main,
      light: statusColors.info.light,
      dark: statusColors.info.dark,
      contrastText: statusColors.info.contrastText,
    },
    success: {
      main: statusColors.success.main,
      light: statusColors.success.light,
      dark: statusColors.success.dark,
      contrastText: statusColors.success.contrastText,
    },
    background: {
      default: palette.background.default,
      paper: palette.background.paper,
    },
    text: {
      primary: palette.text.primary,
      secondary: palette.text.secondary,
      disabled: palette.text.disabled,
    },
    divider: palette.border.divider,
    action: {
      hover: palette.action.hover,
      selected: palette.action.selected,
      disabled: palette.action.disabled,
      focus: palette.action.focus,
    },
  },
  shape: {
    borderRadius: borderRadius.md,
  },
  typography: {
    fontFamily: typeTokens.fontFamily.primary,
    h1: typeTokens.h1,
    h2: typeTokens.h2,
    h3: typeTokens.h3,
    h4: typeTokens.h4,
    h5: typeTokens.h5,
    h6: typeTokens.h6,
    body1: typeTokens.body1,
    body2: typeTokens.body2,
    subtitle1: typeTokens.subtitle1,
    subtitle2: typeTokens.subtitle2,
    caption: typeTokens.caption,
    overline: typeTokens.overline,
    button: typeTokens.button,
  },
  zIndex: {
    appBar: zIndex.sticky,
    drawer: zIndex.drawer,
    modal: zIndex.modal,
    snackbar: zIndex.snackbar,
    tooltip: zIndex.tooltip,
  },
  components: {
    // ----- Global baseline -----
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          colorScheme: "light",
        },
        body: {
          backgroundColor: palette.background.default,
          color: palette.text.primary,
          overflow: "hidden",
        },
        "#root": {
          width: "100%",
          minHeight: "100%",
        },
        "::-webkit-scrollbar": {
          width: theme.componentStyles.scrollbar.width,
          height: theme.componentStyles.scrollbar.height,
        },
        "::-webkit-scrollbar-thumb": {
          backgroundColor: theme.componentStyles.scrollbar.thumbColor,
          borderRadius: theme.componentStyles.scrollbar.borderRadius,
        },
        "::-webkit-scrollbar-thumb:hover": {
          backgroundColor: theme.componentStyles.scrollbar.thumbColorHover,
        },
        "::-webkit-scrollbar-track": {
          backgroundColor: theme.componentStyles.scrollbar.trackColor,
        },
      },
    },

    // ----- Card -----
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: componentStyles.card.backgroundColor,
          borderRadius: componentStyles.card.borderRadius,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
          padding: componentStyles.card.padding,
          transition: `box-shadow ${transitions.duration.normal}ms ${transitions.easing.standard}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: 0,
          marginBottom: componentStyles.card.headerGap,
        },
        title: {
          fontSize: componentStyles.card.titleFontSize,
          fontWeight: componentStyles.card.titleFontWeight,
          color: componentStyles.card.titleColor,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 0,
          "&:last-child": {
            paddingBottom: 0,
          },
        },
      },
    },

    // ----- Button -----
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: componentStyles.button.textTransform,
          fontWeight: componentStyles.button.fontWeight,
          borderRadius: componentStyles.button.borderRadius,
          boxShadow: componentStyles.button.boxShadow,
          minWidth: componentStyles.button.minWidth,
          transition: `all ${transitions.duration.fast}ms ${transitions.easing.standard}`,
          "&:hover": {
            boxShadow: componentStyles.button.boxShadow,
          },
        },
        sizeSmall: {
          height: componentStyles.button.height.sm,
          padding: `0 ${componentStyles.button.paddingX}px`,
          fontSize: typeTokens.fontSize.sm,
        },
        sizeMedium: {
          height: componentStyles.button.height.md,
          padding: `0 ${componentStyles.button.paddingX}px`,
        },
        sizeLarge: {
          height: componentStyles.button.height.lg,
          padding: `0 ${theme.spacing[6]}px`,
          fontSize: typeTokens.fontSize.lg,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: palette.primary.dark,
          },
        },
        outlined: {
          borderColor: palette.border.strong,
          "&:hover": {
            borderColor: palette.primary.main,
            backgroundColor: palette.primary[50],
          },
        },
        text: {
          "&:hover": {
            backgroundColor: palette.action.hover,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          transition: `all ${transitions.duration.fast}ms ${transitions.easing.standard}`,
        },
      },
    },

    // ----- Dialog -----
    MuiDialog: {
      defaultProps: {
        maxWidth: "sm",
        fullWidth: true,
      },
      styleOverrides: {
        paper: {
          borderRadius: componentStyles.dialog.borderRadius,
          boxShadow: elevation.xl,
          border: `1px solid ${palette.border.subtle}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: componentStyles.dialog.titleFontSize,
          fontWeight: componentStyles.dialog.titleFontWeight,
          padding: `${componentStyles.dialog.padding}px ${componentStyles.dialog.padding}px 0`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: componentStyles.dialog.padding,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: `0 ${componentStyles.dialog.padding}px ${componentStyles.dialog.padding}px`,
          gap: theme.spacing[2],
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: componentStyles.dialog.backdropColor,
        },
      },
    },

    // ----- Drawer -----
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: componentStyles.drawer.width.md,
          backgroundColor: componentStyles.drawer.backgroundColor,
          borderLeft: `1px solid ${componentStyles.drawer.borderColor}`,
          boxShadow: elevation.lg,
        },
      },
    },

    // ----- Table -----
    MuiTable: {
      defaultProps: {
        size: "medium",
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: componentStyles.table.headerBackground,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: componentStyles.table.headerFontSize,
          fontWeight: componentStyles.table.headerFontWeight,
          color: componentStyles.table.headerColor,
          borderBottom: `1px solid ${componentStyles.table.borderColor}`,
          padding: `${componentStyles.table.cellPaddingY}px ${componentStyles.table.cellPaddingX}px`,
          whiteSpace: "nowrap",
        },
        body: {
          fontSize: typeTokens.fontSize.base,
          borderBottom: `1px solid ${componentStyles.table.borderColor}`,
          padding: `${componentStyles.table.cellPaddingY}px ${componentStyles.table.cellPaddingX}px`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          height: componentStyles.table.rowHeight,
          "&:hover": {
            backgroundColor: componentStyles.table.rowHoverBackground,
          },
          "&.Mui-selected": {
            backgroundColor: componentStyles.table.rowSelectedBackground,
            "&:hover": {
              backgroundColor: alpha(componentStyles.table.rowSelectedBackground, 0.85),
            },
          },
        },
      },
    },

    // ----- Input / TextField -----
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: componentStyles.input.borderRadius,
          backgroundColor: componentStyles.input.backgroundColor,
          fontSize: componentStyles.input.fontSize,
          transition: `border-color ${transitions.duration.fast}ms ${transitions.easing.standard}`,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: componentStyles.input.borderColorHover,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: componentStyles.input.borderColorFocus,
            borderWidth: 1,
          },
          "&.Mui-focused": {
            boxShadow: componentStyles.input.focusRing,
          },
        },
        input: {
          padding: `${theme.spacing[2]}px ${componentStyles.input.paddingX}px`,
          height: "auto",
        },
        inputSizeSmall: {
          padding: `${theme.spacing[1]}px ${componentStyles.input.paddingX}px`,
        },
        notchedOutline: {
          borderColor: componentStyles.input.borderColor,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: componentStyles.input.labelFontSize,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: componentStyles.input.helperFontSize,
          marginLeft: 0,
        },
      },
    },

    // ----- Chip -----
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: componentStyles.chip.borderRadius,
          fontWeight: componentStyles.chip.fontWeight,
          fontSize: componentStyles.chip.fontSize,
        },
        sizeSmall: {
          height: componentStyles.chip.height.sm,
        },
        sizeMedium: {
          height: componentStyles.chip.height.md,
        },
        filled: {
          border: `1px solid transparent`,
        },
        outlined: {
          borderColor: palette.border.default,
        },
      },
    },

    // ----- Avatar -----
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: componentStyles.avatar.fontWeight,
          fontSize: componentStyles.avatar.fontSize,
          backgroundColor: componentStyles.avatar.backgroundColor,
          color: componentStyles.avatar.color,
          border: componentStyles.avatar.border,
        },
      },
    },

    // ----- Snackbar / Alert -----
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      },
      styleOverrides: {
        root: {
          zIndex: zIndex.snackbar,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: componentStyles.snackbar.borderRadius,
          boxShadow: componentStyles.snackbar.boxShadow,
          fontSize: componentStyles.snackbar.fontSize,
          minWidth: componentStyles.snackbar.minWidth,
          maxWidth: componentStyles.snackbar.maxWidth,
          padding: `${componentStyles.snackbar.paddingY}px ${componentStyles.snackbar.paddingX}px`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontSize: typeTokens.fontSize.base,
        },
        standardSuccess: {
          backgroundColor: statusColors.success.light,
          color: statusColors.success.dark,
          border: `1px solid ${statusColors.success.border}`,
        },
        standardError: {
          backgroundColor: statusColors.error.light,
          color: statusColors.error.dark,
          border: `1px solid ${statusColors.error.border}`,
        },
        standardWarning: {
          backgroundColor: statusColors.warning.light,
          color: statusColors.warning.dark,
          border: `1px solid ${statusColors.warning.border}`,
        },
        standardInfo: {
          backgroundColor: statusColors.info.light,
          color: statusColors.info.dark,
          border: `1px solid ${statusColors.info.border}`,
        },
      },
    },

    // ----- DataGrid (MUI X) -----
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${componentStyles.dataGrid.borderColor}`,
          borderRadius: borderRadius.lg,
          backgroundColor: palette.background.paper,
          fontSize: typeTokens.fontSize.base,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: componentStyles.dataGrid.headerBackground,
            borderBottom: `1px solid ${componentStyles.dataGrid.borderColor}`,
            minHeight: `${componentStyles.dataGrid.toolbarHeight}px !important`,
            maxHeight: `${componentStyles.dataGrid.toolbarHeight}px !important`,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: componentStyles.dataGrid.headerFontWeight,
            fontSize: componentStyles.dataGrid.headerFontSize,
            color: componentStyles.dataGrid.headerColor,
          },
          "& .MuiDataGrid-row": {
            minHeight: `${componentStyles.dataGrid.rowHeight}px !important`,
            maxHeight: `${componentStyles.dataGrid.rowHeight}px !important`,
            "&:hover": {
              backgroundColor: componentStyles.dataGrid.rowHoverBackground,
            },
            "&.Mui-selected": {
              backgroundColor: componentStyles.dataGrid.rowSelectedBackground,
              "&:hover": {
                backgroundColor: alpha(
                  componentStyles.dataGrid.rowSelectedBackground,
                  0.85,
                ),
              },
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${componentStyles.dataGrid.borderColor}`,
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: `1px solid ${componentStyles.dataGrid.borderColor}`,
            minHeight: componentStyles.dataGrid.footerHeight,
            backgroundColor: palette.background.subtle,
          },
          "& .MuiDataGrid-toolbarContainer": {
            padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
            backgroundColor: componentStyles.dataGrid.toolbarBackground,
            borderBottom: `1px solid ${componentStyles.dataGrid.borderColor}`,
            gap: theme.spacing[1],
          },
        },
      },
    },

    // ----- Paper (generic surface) -----
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: borderRadius.lg,
        },
      },
    },

    // ----- AppBar / Toolbar (topbar alignment) -----
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          color: palette.text.primary,
          borderBottom: `1px solid ${palette.border.default}`,
          height: layout.topbar.height,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: `${layout.topbar.height}px !important`,
          paddingLeft: theme.spacing[6],
          paddingRight: theme.spacing[6],
        },
      },
    },

    // ----- Menu / Popover -----
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.md,
          border: `1px solid ${palette.border.subtle}`,
          boxShadow: elevation.lg,
          marginTop: theme.spacing[1],
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: typeTokens.fontSize.base,
          borderRadius: borderRadius.sm,
          margin: `0 ${theme.spacing[1]}px`,
          padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
          "&:hover": {
            backgroundColor: palette.background.muted,
          },
          "&.Mui-selected": {
            backgroundColor: palette.primary[50],
            "&:hover": {
              backgroundColor: palette.primary[100],
            },
          },
        },
      },
    },

    // ----- Tooltip -----
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: typeTokens.fontSize.sm,
          backgroundColor: palette.secondary[800],
          borderRadius: borderRadius.sm,
          padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
        },
        arrow: {
          color: palette.secondary[800],
        },
      },
    },

    // ----- Divider -----
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.border.divider,
        },
      },
    },

    // ----- Linear / Circular progress (loading) -----
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: palette.primary.main,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.pill,
          height: 4,
          backgroundColor: palette.background.muted,
        },
        bar: {
          borderRadius: borderRadius.pill,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: componentStyles.loading.skeletonBackground,
        },
        wave: {
          "&::after": {
            background: `linear-gradient(90deg, transparent, ${componentStyles.loading.skeletonHighlight}, transparent)`,
          },
        },
      },
    },

    // ----- Tabs (filter-style segmented controls) -----
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: componentStyles.filter.height,
        },
        indicator: {
          height: 3,
          borderRadius: `${borderRadius.pill}px ${borderRadius.pill}px 0 0`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: typeTokens.fontWeight.semibold,
          fontSize: typeTokens.fontSize.sm,
          minHeight: componentStyles.filter.height,
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Create and export theme instance
// ---------------------------------------------------------------------------

export const muiTheme = createTheme(muiThemeOptions);

export default muiTheme;
