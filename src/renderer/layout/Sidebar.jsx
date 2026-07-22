import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Box, Collapse, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// ── Icons ─────────────────────────────────────────────────────────────────────
import DashboardRoundedIcon          from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon         from "@mui/icons-material/Inventory2Rounded";
import PrecisionManufacturingRounded from "@mui/icons-material/PrecisionManufacturingRounded";
import ContentCutRoundedIcon         from "@mui/icons-material/ContentCutRounded";
import LocalFireDepartmentRounded    from "@mui/icons-material/LocalFireDepartmentRounded";
import BadgeRoundedIcon              from "@mui/icons-material/BadgeRounded";
import HistoryRoundedIcon            from "@mui/icons-material/HistoryRounded";
import AccessTimeFilledRoundedIcon   from "@mui/icons-material/AccessTimeFilledRounded";
import AssessmentRoundedIcon         from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon           from "@mui/icons-material/SettingsRounded";
import ExpandLessRoundedIcon         from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon         from "@mui/icons-material/ExpandMoreRounded";
import ReportProblemRoundedIcon      from "@mui/icons-material/ReportProblemRounded";

import { navigationItems } from "../constants/navigation";

// ── Constants ─────────────────────────────────────────────────────────────────
const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 72;
const ITEM_HEIGHT       = 48;
const ICON_SIZE         = 22;
const LOGO_SIZE         = 40;
const NAV_PADDING       = 16;

// Static icon map — no re-creation on each render
const ICON_MAP = {
  Dashboard:    <DashboardRoundedIcon          sx={{ fontSize: ICON_SIZE }} />,
  Production:   <Inventory2RoundedIcon         sx={{ fontSize: ICON_SIZE }} />,
  Grinding:     <PrecisionManufacturingRounded sx={{ fontSize: ICON_SIZE }} />,
  Cutting:      <ContentCutRoundedIcon         sx={{ fontSize: ICON_SIZE }} />,
  HeatTreatment:<LocalFireDepartmentRounded    sx={{ fontSize: ICON_SIZE }} />,
  CastingDefect: <ReportProblemRoundedIcon      sx={{ fontSize: ICON_SIZE }} />,
  Employees:    <BadgeRoundedIcon              sx={{ fontSize: ICON_SIZE }} />,
  Overtime:     <AccessTimeFilledRoundedIcon   sx={{ fontSize: ICON_SIZE }} />,
  History:      <HistoryRoundedIcon            sx={{ fontSize: ICON_SIZE }} />,
  Reports:      <AssessmentRoundedIcon         sx={{ fontSize: ICON_SIZE }} />,
  Settings:     <SettingsRoundedIcon           sx={{ fontSize: ICON_SIZE }} />,
};

// ── CollapsedIconButton ───────────────────────────────────────────────────────
/**
 * Collapsed sidebar: 48×48 centered icon button.
 *
 * Colors sourced exclusively from theme.palette.sidebar.*
 * Active = primary.main icon + selected bg + left indicator bar.
 */
function CollapsedIconButton({ icon, label, active, onClick }) {
  const theme = useTheme();
  const sb    = theme.palette.sidebar;

  return (
    <Tooltip title={label} placement="right" arrow>
      <Box
        onClick={onClick}
        sx={{
          position:       "relative",
          width:          ITEM_HEIGHT,
          height:         ITEM_HEIGHT,
          borderRadius:   "12px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          mx:             "auto",
          cursor:         "pointer",
          bgcolor:        active ? sb.selected : "transparent",
          // Icon color: active → primary.main, inactive → sidebar.icon
          color:          active ? theme.palette.primary.main : sb.icon,
          transition:     "background-color 150ms ease, color 150ms ease",
          "&:hover": {
            bgcolor: active ? sb.selected : sb.hover,
          },
          // Left active indicator bar
          "&::before": active ? {
            content:      '""',
            position:     "absolute",
            left:         -NAV_PADDING + 3,
            top:          "50%",
            transform:    "translateY(-50%)",
            width:        3,
            height:       20,
            borderRadius: "0 3px 3px 0",
            bgcolor:      sb.indicator,
          } : {},
        }}
      >
        {icon}
      </Box>
    </Tooltip>
  );
}

// ── ExpandedNavItem ───────────────────────────────────────────────────────────
/**
 * Expanded sidebar: full-width row — icon slot (40px) + label + optional chevron.
 *
 * Colors sourced exclusively from theme.palette.sidebar.*
 */
function ExpandedNavItem({ icon, label, active, onClick, chevron }) {
  const theme = useTheme();
  const sb    = theme.palette.sidebar;

  return (
    <Box
      onClick={onClick}
      sx={{
        position:       "relative",
        height:         ITEM_HEIGHT,
        borderRadius:   "12px",
        display:        "flex",
        alignItems:     "center",
        px:             `${NAV_PADDING}px`,
        gap:            "16px",
        cursor:         "pointer",
        textDecoration: "none",
        userSelect:     "none",
        bgcolor:        active ? sb.selected : "transparent",
        // Row-level color drives both icon and text via CSS inheritance
        color:          active ? theme.palette.primary.main : sb.icon,
        transition:     "background-color 150ms ease, color 150ms ease",
        "&:hover": {
          bgcolor: active ? sb.selected : sb.hover,
        },
      }}
    >
      {/* Fixed-width icon slot */}
      <Box
        sx={{
          width:          40,
          height:         40,
          flexShrink:     0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          // Icon inherits color from parent Box
        }}
      >
        {icon}
      </Box>

      {/* Label — uses sidebar.text when inactive, primary.main when active */}
      <Box
        component="span"
        sx={{
          flex:       1,
          minWidth:   0,
          fontSize:   "13.5px",
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: "nowrap",
          overflow:   "hidden",
          // Override color for text specifically: slightly brighter than icon
          color:      active ? theme.palette.primary.main : sb.text,
        }}
      >
        {label}
      </Box>

      {/* Chevron (group items only) */}
      {chevron && (
        <Box sx={{ display: "flex", alignItems: "center", opacity: 0.6 }}>
          {chevron}
        </Box>
      )}
    </Box>
  );
}

// ── ExpandedChildItem ─────────────────────────────────────────────────────────
function ExpandedChildItem({ label, active }) {
  const theme = useTheme();
  const sb    = theme.palette.sidebar;

  return (
    <Box
      sx={{
        height:       ITEM_HEIGHT,
        borderRadius: "12px",
        display:      "flex",
        alignItems:   "center",
        // Indent: NAV_PADDING(16) + icon-slot(40) + gap(16) + extra(8) = 80px
        pl:           "80px",
        pr:           `${NAV_PADDING}px`,
        bgcolor:      active ? sb.selected : "transparent",
        color:        active ? theme.palette.primary.main : sb.text,
        cursor:       "pointer",
        transition:   "background-color 150ms ease, color 150ms ease",
        "&:hover":    { bgcolor: active ? sb.selected : sb.hover },
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize:   "13.5px",
          fontWeight: active ? 600 : 500,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

// ── NavGroup ──────────────────────────────────────────────────────────────────
function NavGroup({ item, collapsed }) {
  const location = useLocation();
  const isActive = item.children.some((child) => location.pathname === child.path);
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  const handleToggle = () => {
    if (!collapsed) setOpen((prev) => !prev);
  };

  if (collapsed) {
    return (
      <CollapsedIconButton
        icon={ICON_MAP[item.icon]}
        label={item.label}
        active={isActive}
        onClick={handleToggle}
      />
    );
  }

  return (
    <>
      <ExpandedNavItem
        icon={ICON_MAP[item.icon]}
        label={item.label}
        active={isActive}
        onClick={handleToggle}
        chevron={
          open
            ? <ExpandLessRoundedIcon sx={{ fontSize: 16 }} />
            : <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />
        }
      />
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", mt: "4px", mb: "4px" }}>
          {item.children.map((child) => (
            <NavLink key={child.path} to={child.path} style={{ textDecoration: "none" }}>
              {({ isActive: childActive }) => (
                <ExpandedChildItem label={child.label} active={childActive} />
              )}
            </NavLink>
          ))}
        </Box>
      </Collapse>
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ desktopOpen }) {
  const collapsed = !desktopOpen;
  const theme     = useTheme();
  const sb        = theme.palette.sidebar;

  return (
    <Box
      component="aside"
      sx={{
        position:      "sticky",
        top:           0,
        height:        "100vh",
        width:         collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        flexShrink:    0,
        bgcolor:       sb.background,
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        borderRight:   `1px solid ${sb.border}`,
        transition:    "width 0.2s ease",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          height:         72,
          flexShrink:     0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: collapsed ? "center" : "flex-start",
          px:             collapsed ? 0 : `${NAV_PADDING}px`,
          borderBottom:   `1px solid ${sb.border}`,
          overflow:       "hidden",
          transition:     "padding 0.2s ease",
        }}
      >
        <Box
          sx={{
            width:          LOGO_SIZE,
            height:         LOGO_SIZE,
            borderRadius:   "10px",
            bgcolor:        "primary.main",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            boxShadow:      "0 2px 8px rgba(37,99,235,0.35)",
          }}
        >
          <Inventory2RoundedIcon sx={{ fontSize: 22, color: "#fff" }} />
        </Box>

        <Box
          sx={{
            ml:         "12px",
            maxWidth:   collapsed ? 0 : 160,
            opacity:    collapsed ? 0 : 1,
            overflow:   "hidden",
            whiteSpace: "nowrap",
            transition: "max-width 0.2s ease, opacity 0.15s ease",
          }}
        >
          <Box component="span" sx={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
            Production
          </Box>
          <Box component="span" sx={{ display: "block", fontSize: "11px", fontWeight: 500, color: sb.icon, lineHeight: 1.2, mt: "2px" }}>
            Statistics Manager
          </Box>
        </Box>
      </Box>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex:          1,
          overflowY:     "auto",
          overflowX:     "hidden",
          pt:            `${NAV_PADDING}px`,
          pb:            `${NAV_PADDING}px`,
          px:            `${NAV_PADDING}px`,
          display:       "flex",
          flexDirection: "column",
          gap:           "8px",
          "&::-webkit-scrollbar":       { width: "4px" },
          "&::-webkit-scrollbar-thumb": { bgcolor: sb.hover, borderRadius: "4px" },
        }}
      >
        {navigationItems.map((item) => {
          if (item.children) {
            return <NavGroup key={item.label} item={item} collapsed={collapsed} />;
          }
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: "none" }}>
              {({ isActive }) =>
                collapsed ? (
                  <CollapsedIconButton
                    icon={ICON_MAP[item.icon]}
                    label={item.label}
                    active={isActive}
                  />
                ) : (
                  <ExpandedNavItem
                    icon={ICON_MAP[item.icon]}
                    label={item.label}
                    active={isActive}
                  />
                )
              }
            </NavLink>
          );
        })}

        {/* ── Status footer ─────────────────────────────────────────────── */}
        <Box sx={{ mt: "auto", pt: "8px" }}>
          {collapsed ? (
            <Tooltip title="Hệ thống đang hoạt động" placement="right" arrow>
              <Box
                sx={{
                  display:        "flex",
                  justifyContent: "center",
                  alignItems:     "center",
                  height:         32,
                  cursor:         "default",
                }}
              >
                <Box
                  sx={{
                    width:        10,
                    height:       10,
                    borderRadius: "50%",
                    bgcolor:      "#22c55e",
                    boxShadow:    "0 0 0 3px rgba(34,197,94,0.2)",
                  }}
                />
              </Box>
            </Tooltip>
          ) : (
            <Box
              sx={{
                borderRadius: "12px",
                bgcolor:      sb.hover,
                border:       `1px solid ${sb.border}`,
                px:           "14px",
                py:           "12px",
                display:      "flex",
                alignItems:   "center",
                gap:          "8px",
              }}
            >
              <Box
                sx={{
                  width:        8,
                  height:       8,
                  borderRadius: "50%",
                  bgcolor:      "#22c55e",
                  flexShrink:   0,
                  boxShadow:    "0 0 0 3px rgba(34,197,94,0.2)",
                }}
              />
              <Box
                component="span"
                sx={{
                  fontSize:   "11px",
                  fontWeight: 600,
                  color:      sb.statusText,
                  whiteSpace: "nowrap",
                }}
              >
                Đang hoạt động
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;
