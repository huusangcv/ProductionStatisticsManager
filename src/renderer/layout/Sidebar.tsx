import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { NavLink } from "react-router-dom";
import theme from "../theme/theme";

export interface SidebarProps {
  collapsed: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Quản lý nhân viên", path: "/employees", icon: <GroupOutlinedIcon /> },
  { label: "Báo cáo", path: "/reports", icon: <AssessmentOutlinedIcon /> },
  { label: "Cài đặt", path: "/settings", icon: <SettingsOutlinedIcon /> },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: collapsed ? theme.layout.sidebar.widthCollapsed : theme.layout.sidebar.widthExpanded,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.sidebar,
        color: theme.palette.text.inverse,
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
        transition: `width ${theme.transitions.duration.normal}ms ${theme.transitions.easing.standard}`,
        zIndex: theme.zIndex.sticky,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          height: theme.layout.topbar.height,
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1.5,
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${theme.borderRadius.sm}px`,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DashboardOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />
        </Box>

        {!collapsed && (
          <Typography
            sx={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.extrabold,
              lineHeight: theme.typography.lineHeight.tight,
              whiteSpace: "nowrap",
            }}
          >
            Production Stats
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: 2,
          overflow: "hidden",
        }}
      >
        <List disablePadding sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                height: 48,
                mb: 1,
                borderRadius: `${theme.borderRadius.md}px`,
                color: "rgba(255, 255, 255, 0.7)",
                px: 1.5,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                },
                "&.active": {
                  bgcolor: theme.palette.primary[50],
                  color: theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: "inherit",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    noWrap: true,
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>

        <Box
          sx={{
            flexShrink: 0,
            mt: "auto",
            p: collapsed ? 1 : 2,
            borderRadius: `${theme.borderRadius.md}px`,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: collapsed ? "center" : "stretch",
            gap: 1,
          }}
        >
          {!collapsed ? (
            <>
              <Typography
                sx={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: "#fff",
                }}
              >
                Thông tin hệ thống
              </Typography>
              <Typography
                sx={{ fontSize: theme.typography.fontSize.xs, color: "rgba(255, 255, 255, 0.5)" }}
              >
                Phiên bản: 1.0.0
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: theme.statusColors.success.icon,
                    boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.2)",
                  }}
                />
                <Typography
                  sx={{ fontSize: theme.typography.fontSize.sm, color: "rgba(255, 255, 255, 0.8)" }}
                >
                  Đang hoạt động
                </Typography>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: theme.statusColors.success.icon,
                boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.2)",
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
