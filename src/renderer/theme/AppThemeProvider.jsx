import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo } from "react";

function AppThemeProvider({ children }) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: {
            main: "#0f766e",
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
          borderRadius: 14,
        },
        typography: {
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          h4: {
            fontWeight: 700,
          },
          h5: {
            fontWeight: 700,
          },
          h6: {
            fontWeight: 700,
          },
        },
      }),
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
