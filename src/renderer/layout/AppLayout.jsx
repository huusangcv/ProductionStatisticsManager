import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Fade } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AppLayout.module.css";
import { NotificationProvider } from "../context/NotificationContext";
import NotificationDrawer from "../components/notifications/NotificationDrawer";

function StartupTasks() {
  const startupChecked = useRef(false);
  
  useEffect(() => {
    if (startupChecked.current) return;
    startupChecked.current = true;
    
    const checkAttendance = async () => {
      try {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const res = await window.electronAPI.attendance?.checkMissing(today);
        if (res && res.ok && res.missingCount > 0) {
          // If there are missing check-ins, create a notification via IPC
          await window.electronAPI.notifications?.create({
            title: "Cảnh báo điểm danh",
            message: `Hôm nay (${today}) còn ${res.missingCount} nhân viên chưa được điểm danh. Vui lòng cập nhật điểm danh.`,
            type: "warning",
            link: "/attendance"
          });
        }
      } catch (e) {
        console.error("Lỗi khi kiểm tra điểm danh lúc khởi động", e);
      }
    };
    
    checkAttendance();
  }, []);
  
  return null;
}

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
    <NotificationProvider>
      <StartupTasks />
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
      <NotificationDrawer />
    </NotificationProvider>
  );
}

export default AppLayout;
