import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AppLayout.module.css";

function AppLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleToggleSidebar = () => {
    setDesktopOpen((prev) => !prev);
  };

  return (
    <div
      className={styles.appContainer}
      data-sidebar-collapsed={!desktopOpen}
    >
      <Sidebar desktopOpen={desktopOpen} />
      <div className={styles.mainContent}>
        <Topbar onMenuClick={handleToggleSidebar} />
        <div className={styles.pageContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
