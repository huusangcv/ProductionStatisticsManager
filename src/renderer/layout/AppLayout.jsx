import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    setMobileOpen((currentValue) => !currentValue);
  };

  const handleCloseSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef3f9" }}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Topbar onMenuClick={handleToggleSidebar} showMenuButton={!isDesktop} />
        <Sidebar mobileOpen={mobileOpen} onMobileClose={handleCloseSidebar} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 1.75, sm: 2.5, lg: 3 },
            pb: 3,
            pt: { xs: "76px", sm: "76px" },
            bgcolor: "#fff",
            borderTopLeftRadius: { md: 4 },
            boxShadow: { md: "inset 0 1px 0 rgba(15, 23, 42, 0.04)" },
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
