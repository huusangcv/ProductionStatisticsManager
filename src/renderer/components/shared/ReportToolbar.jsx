// src/renderer/components/shared/ReportToolbar.jsx
import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

const iconOnlyButtonSx = {
  minWidth: "36px !important",
  width: "36px !important",
  height: "36px !important",
  padding: "0 !important",
  borderRadius: "8px !important",
  color: "#64748B !important",
  fontSize: "0px !important",
  "& .MuiButton-startIcon": {
    margin: "0 !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "& .MuiButton-endIcon": {
    display: "none !important",
  },
  "& span:not(.MuiButton-startIcon):not(.MuiTouchRipple-root):not(.MuiBadge-root):not(.MuiBadge-badge)": {
    display: "none !important",
  },
  "& .MuiBadge-root": {
    display: "flex !important",
    alignItems: "center !important",
    justifyContent: "center !important",
  },
  "& svg": {
    fontSize: "1.25rem !important",
  },
  "&:hover": {
    bgcolor: "#F8FAFC !important",
    color: "#2563eb !important",
  },
};

export default function ReportToolbar({
  leftCustomControls,
  extraMenuItems,
  onGenerate,
  generating = false,
  disableGenerate = false,
  generateLabel = "Tạo Excel",
  onPrint,
  printing = false,
  disablePrint = false,
  printLabel = "In",
  onOpenFolder,
  disableOpenFolder = false,
  onRefresh,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <GridToolbarContainer
      sx={{
        minHeight: 48,
        padding: "0 0 12px 0",
        marginBottom: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "transparent",
      }}
    >
      {/* ── Left Section ─────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarColumnsButton slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Cột" } }} sx={iconOnlyButtonSx} />
        </Box>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarFilterButton slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Bộ lọc" } }} sx={iconOnlyButtonSx} />
        </Box>

        <Box sx={{ ml: 0.5, display: "flex", alignItems: "center" }}>
          <GridToolbarQuickFilter
            placeholder="Tìm kiếm nhanh..."
            variant="outlined"
            size="small"
            sx={{
              width: 180,
              pb: "0 !important",
              m: "0 !important",
              "& .MuiFormControl-root": {
                pb: "0 !important",
                m: "0 !important",
              },
              "& .MuiInputBase-root": {
                height: "36px !important",
                minHeight: "36px !important",
                maxHeight: "36px !important",
                borderRadius: "8px",
                bgcolor: "#fff",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              },
            }}
          />
        </Box>

        {leftCustomControls}
      </Box>

      {/* ── Right Section ────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Dropdown Xuất/In */}
        <Button
          variant="outlined"
          color="primary"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          sx={{
            height: 36,
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            px: 2,
            bgcolor: "#fff",
            borderColor: "#E2E8F0",
            color: "#1E293B",
            "&:hover": {
              bgcolor: "#F8FAFC",
              borderColor: "#CBD5E1",
            },
          }}
        >
          Xuất/In
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          slotProps={{
            paper: {
              elevation: 2,
              sx: {
                borderRadius: "10px",
                mt: 0.5,
                minWidth: 160,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              },
            },
          }}
        >
          <MenuItem
            disabled={disableGenerate || generating}
            onClick={() => {
              setAnchorEl(null);
              if (onGenerate) onGenerate();
            }}
            sx={{
              py: 1,
              gap: 1.5,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1E293B",
            }}
          >
            {generating ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DescriptionIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            )}
            {generating ? "Đang tạo..." : generateLabel}
          </MenuItem>
          <MenuItem
            disabled={disablePrint || generating || printing}
            onClick={() => {
              setAnchorEl(null);
              if (onPrint) onPrint();
            }}
            sx={{
              py: 1,
              gap: 1.5,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1E293B",
            }}
          >
            {printing ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PrintIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            )}
            {printing ? "Đang in..." : printLabel}
          </MenuItem>
          {extraMenuItems}
        </Menu>

        {/* Nút Mở thư mục riêng biệt */}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<FolderOpenIcon />}
          disabled={disableOpenFolder || generating}
          onClick={onOpenFolder}
          sx={{
            height: 36,
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            px: 2,
            bgcolor: "#fff",
            borderColor: "#E2E8F0",
            color: "#1E293B",
            "&:hover": {
              bgcolor: "#F8FAFC",
              borderColor: "#CBD5E1",
            },
          }}
        >
          Mở thư mục
        </Button>

        {/* Nút Làm mới icon-only */}
        <Tooltip title="Làm mới" arrow placement="top">
          <IconButton
            onClick={onRefresh}
            size="small"
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              bgcolor: "#fff",
              color: "#475569",
              "&:hover": {
                bgcolor: "#F8FAFC",
                borderColor: "#CBD5E1",
                color: "primary.main",
              },
            }}
          >
            <RefreshRoundedIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </GridToolbarContainer>
  );
}
