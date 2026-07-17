import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Fade } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AppLayout.module.css";

function AppLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const transitionStartedRef = useRef(false);
  const location = useLocation();

  const handleToggleSidebar = () => {
    setDesktopOpen((prev) => !prev);
  };

  const handleDashboardReady = useCallback(() => {
    setDashboardReady(true);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    if (!dashboardReady || transitionStartedRef.current) return;

    transitionStartedRef.current = true;

    const runTransition = async () => {
      await window.electronAPI?.window?.setApplicationMode?.();
      requestAnimationFrame(() => setContentVisible(true));
    };

    runTransition();
  }, [location.pathname, dashboardReady]);

  return (
    <Fade in={contentVisible} timeout={400}>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          bgcolor: "var(--color-bg-body)",
          opacity: contentVisible ? 1 : 0,
        }}
      >
        <Sidebar desktopOpen={desktopOpen} />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Topbar onMenuClick={handleToggleSidebar} />
          <Box className={styles.pageContainer}>
            <Outlet context={{ onDashboardReady: handleDashboardReady }} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

export default AppLayout;
