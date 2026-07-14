import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import { navigationItems } from "../constants/navigation";
import styles from "./Sidebar.module.css";

const iconMap = {
  Dashboard: <DashboardOutlinedIcon />,
  Production: <PrecisionManufacturingOutlinedIcon />,
  Grinding: <BuildCircleOutlinedIcon />,
  Cutting: <ConstructionOutlinedIcon />,
  Employees: <GroupOutlinedIcon />,
  Reports: <AssessmentOutlinedIcon />,
  Settings: <SettingsOutlinedIcon />,
};

function NavGroup({ item, desktopOpen }) {
  const location = useLocation();
  const isActive = item.children.some((child) => child.path === location.pathname);

  const [open, setOpen] = useState(isActive);

  // Auto-expand if a child becomes active
  useEffect(() => {
    if (isActive) {
      setOpen(true);
    }
  }, [isActive]);

  const toggleOpen = () => {
    // Only allow toggle if expanded sidebar (or handle it gracefully)
    if (desktopOpen) {
      setOpen(!open);
    }
  };

  return (
    <>
      <div
        className={`${styles.navItem} ${isActive ? styles.activeParent : ""}`}
        onClick={toggleOpen}
      >
        <div className={styles.navIcon}>{iconMap[item.icon]}</div>
        <div className={styles.navText}>{item.label}</div>
        <div style={{ flexGrow: 1 }} />
        {desktopOpen && (
          <div className={styles.navExpandIcon}>
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </div>
        )}
      </div>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div className={styles.navChildren}>
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive: childActive }) =>
                `${styles.navItem} ${styles.navChildItem} ${
                  childActive ? styles.active : ""
                }`
              }
            >
              <div className={styles.navIcon}>{iconMap[child.icon]}</div>
              <div className={styles.navText}>{child.label}</div>
            </NavLink>
          ))}
        </div>
      </Collapse>
    </>
  );
}

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
        {navigationItems.map((item) => {
          if (item.children) {
            return (
              <NavGroup
                key={item.label}
                item={item}
                desktopOpen={desktopOpen}
              />
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ""}`
              }
            >
              <div className={styles.navIcon}>{iconMap[item.icon]}</div>
              <div className={styles.navText}>{item.label}</div>
            </NavLink>
          );
        })}

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
