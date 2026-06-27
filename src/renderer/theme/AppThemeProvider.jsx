import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
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
