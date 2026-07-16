import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { viVN } from "@mui/material/locale";
function AppThemeProvider({ children }) {
  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            mode: "light",
            primary: {
              main: "#2563eb",
            },
            secondary: {
              main: "#334155",
            },
            background: {
              default: "#f5f7fb",
              paper: "#ffffff",
            },
            // ── Sidebar palette ──────────────────────────────────────
            // All tokens are derived from white and primary so they follow
            // any future brand colour changes automatically.
            // Consumed by Sidebar.jsx via theme.palette.sidebar.*
            sidebar: {
              background: "#0f172a",
              border:     "rgba(255,255,255,0.07)",
              text:       alpha("#ffffff", 0.72),  // inactive labels
              icon:       alpha("#ffffff", 0.60),  // inactive icons
              hover:      alpha("#ffffff", 0.07),  // hover on dark bg
              selected:   alpha("#2563eb", 0.18),  // active bg (primary @ 18%)
              indicator:  "#2563eb",               // left active bar = primary.main
              statusText: alpha("#ffffff", 0.80),  // status footer text
            },
          },
          shape: {
            borderRadius: 12,
          },
          components: {
            MuiCard: {
              styleOverrides: {
                root: {
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #E5E7EB",
                },
              },
            },
            MuiButton: {
              styleOverrides: {
                root: {
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "none",
                  },
                  transition: "all 150ms ease-in-out",
                },
              },
            },
          },
          typography: {
            fontFamily:
              "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            h1: {
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.5,
            },
            h2: {
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.5,
            },
            h6: {
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.5,
            },
            body1: {
              fontSize: 14,
              lineHeight: 1.5,
            },
            body2: {
              fontSize: 14,
              lineHeight: 1.5,
            },
            caption: {
              fontSize: 12,
              lineHeight: 1.5,
            },
          },
        },
        viVN,
      ),
    [],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default AppThemeProvider;
