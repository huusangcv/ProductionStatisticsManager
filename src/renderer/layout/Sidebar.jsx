import { NavLink } from "react-router-dom";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { navigationItems } from "../constants/navigation";
import styles from "./Sidebar.module.css";

const iconByLabel = {
  Dashboard: <DashboardOutlinedIcon />,
  "Quản lý nhân viên": <GroupOutlinedIcon />,
  "Báo cáo": <AssessmentOutlinedIcon />,
  "Cài đặt": <SettingsOutlinedIcon />,
};

function Sidebar({ desktopOpen }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <DashboardOutlinedIcon />
        </div>
        <div className={styles.logoText}>Production Stats</div>
      </div>

      <nav className={styles.navContainer}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <div className={styles.navIcon}>{iconByLabel[item.label]}</div>
            <div className={styles.navText}>{item.label}</div>
          </NavLink>
        ))}

        <div className={styles.systemInfo}>
          {desktopOpen ? (
            <>
              <div className={styles.systemTitle}>Thông tin hệ thống</div>
              <div className={styles.systemVersion}>Phiên bản: 1.0.0</div>
              <div className={styles.statusIndicator}>
                <div className={styles.statusDot} />
                <div className={styles.statusText}>Đang hoạt động</div>
              </div>
            </>
          ) : (
            <div className={styles.statusDot} style={{ margin: "8px 0" }} />
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
