import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AppLayout.module.css";

function AppLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleToggleSidebar = () => {
    setDesktopOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display:    "flex",
        height:     "100vh",
        overflow:   "hidden",
        bgcolor:    "var(--color-bg-body)",
      }}
    >
      {/* Sidebar manages its own width via transition */}
      <Sidebar desktopOpen={desktopOpen} />

      {/* Main content fills the remaining space */}
      <Box
        sx={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          minWidth:      0,
          height:        "100vh",
          overflow:      "hidden",
        }}
      >
        <Topbar onMenuClick={handleToggleSidebar} />
        <Box className={styles.pageContainer}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
