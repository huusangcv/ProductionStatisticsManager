import { Box } from "@mui/material";
import type { ReactNode } from "react";
import theme from "../theme/theme";

export interface LayoutProps {
  sidebarCollapsed: boolean;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

const { layout } = theme;

export default function Layout({
  sidebarCollapsed,
  sidebar,
  topbar,
  children,
}: LayoutProps) {
  const sidebarWidth = sidebarCollapsed
    ? layout.sidebar.widthCollapsed
    : layout.sidebar.widthExpanded;

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="aside"
        sx={{
          flexShrink: 0,
          width: sidebarWidth,
          height: "100vh",
          overflow: "hidden",
          transition: `width ${theme.transitions.duration.normal}ms ${theme.transitions.easing.standard}`,
        }}
      >
        {sidebar}
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {topbar}

        <Box
          component="section"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              flex: 1,
              width: "100%",
              maxWidth: layout.container.maxWidth,
              mx: "auto",
              px: {
                xs: `${theme.pagePadding.default}px`,
                lg: `${theme.pagePadding.lg}px`,
                xl: `${theme.pagePadding.xl}px`,
              },
              py: `${theme.pagePadding.default}px`,
              boxSizing: "border-box",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
