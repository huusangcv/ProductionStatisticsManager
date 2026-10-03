import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Fade } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AppLayout.module.css";
import { NotificationProvider } from "../context/NotificationContext";
import NotificationDrawer from "../components/notifications/NotificationDrawer";
import { ShortcutProvider, useShortcutTrigger } from "../context/ShortcutContext";
import { useAuth } from "../context/AuthContext";

// F1–F9 → route map (real routes from AppRoutes.jsx)
const F_KEY_ROUTES = {
  F1: "/cutting",
  F2: "/grinding",
  F3: "/attendance",
  F4: "/heat-treatment",
  F5: "/casting-defect",
  F6: "/personal-production",
  F7: "/overtime",
  F8: "/dashboard",
  F9: "/reports",
};

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

/**
 * Inner layout component — needs access to ShortcutContext trigger hooks,
 * so it must be a child of ShortcutProvider.
 */
function AppLayoutInner({ desktopOpen, onToggleSidebar }) {
  const [contentVisible, setContentVisible] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const transitionStartedRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { triggerPrint, triggerExport } = useShortcutTrigger();

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

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only act when the app is authenticated (not on lock/login screen)
      if (!isAuthenticated) return;

      // ── Ctrl+B: toggle sidebar ──────────────────────────────────────────
      if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && e.key === 'b') {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // ── Ctrl+P: print ───────────────────────────────────────────────────
      if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && e.key === 'p') {
        // Only intercept if a page has registered a print handler
        // triggerPrint is a no-op if nothing registered, but we still preventDefault
        // to avoid the system/browser print dialog opening unexpectedly.
        // Pages that don't have print simply won't do anything.
        e.preventDefault();
        triggerPrint();
        return;
      }

      // ── Ctrl+E: export ──────────────────────────────────────────────────
      if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && e.key === 'e') {
        e.preventDefault();
        triggerExport();
        return;
      }

      // ── F1–F9: navigate views ───────────────────────────────────────────
      const route = F_KEY_ROUTES[e.key];
      if (route && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        navigate(route);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAuthenticated, onToggleSidebar, navigate, triggerPrint, triggerExport]);

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
            <Topbar onMenuClick={onToggleSidebar} />
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

function AppLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleToggleSidebar = useCallback(() => {
    setDesktopOpen((prev) => !prev);
  }, []);

  return (
    <ShortcutProvider>
      <AppLayoutInner
        desktopOpen={desktopOpen}
        onToggleSidebar={handleToggleSidebar}
      />
    </ShortcutProvider>
  );
}

export default AppLayout;
