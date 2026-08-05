import { Box, Button, Tooltip, IconButton, CircularProgress, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useState } from "react";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";

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

/**
 * Enterprise Shared DataGrid Toolbar
 * Ensures identical layout, spacing, sizing, and button styling across all DataGrid pages.
 *
 * @param {boolean} hasExport - Whether to show the standard MUI Export button
 * @param {React.ReactNode} rightActions - Elements rendered on the right side (Date Picker, custom buttons)
 */
export default function DataGridToolbarActions({ hasExport = true, rightActions }) {
  return (
    <GridToolbarContainer
      sx={{
        minHeight: 48,
        padding: "0 0 8px 0",
        marginBottom: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "transparent",
      }}
    >
      {/* Left Section (Fixed standard order) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarColumnsButton slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Cột" } }} sx={iconOnlyButtonSx} />
        </Box>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarFilterButton slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Bộ lọc" } }} sx={iconOnlyButtonSx} />
        </Box>
        {hasExport && <GridToolbarExport />}
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
      </Box>

      {/* Right Section (Page-specific actions) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {rightActions}
      </Box>
    </GridToolbarContainer>
  );
}

// ── Shared Standard Buttons for Right Actions ────────────────────────────────

export const StandardButton = ({
  primary,
  icon,
  label,
  loading,
  disabled,
  onClick,
  ...props
}) => {
  if (label === "Làm mới" || props.iconOnly) {
    return (
      <Tooltip title={label} arrow placement="top">
        <IconButton
          onClick={onClick}
          size="small"
          disabled={disabled || loading}
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
          {...props}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : icon}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={primary ? "contained" : "outlined"}
      color={primary ? "primary" : "inherit"}
      disableElevation={primary}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : icon}
      disabled={disabled || loading}
      onClick={onClick}
      sx={{
        height: 36,
        borderRadius: "8px",
        fontWeight: 600,
        textTransform: "none",
        px: 2,
        ...(primary
          ? {
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              },
            }
          : {
              bgcolor: "#fff",
              borderColor: "#E2E8F0",
              color: "#1E293B",
              "&:hover": {
                bgcolor: "#F8FAFC",
                borderColor: "#CBD5E1",
              },
            }),
      }}
      {...props}
    >
      {label}
    </Button>
  );
};

export const ExportImportDropdown = ({ onImport, onExport }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
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
        Nhập/Xuất
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
        {onImport && (
          <MenuItem
            onClick={() => { setAnchorEl(null); onImport(); }}
            sx={{ py: 1, gap: 1.5, fontSize: "0.875rem", fontWeight: 500, color: "#1E293B" }}
          >
            <FileUploadOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            Nhập Excel
          </MenuItem>
        )}
        {onExport && (
          <MenuItem
            onClick={() => { setAnchorEl(null); onExport(); }}
            sx={{ py: 1, gap: 1.5, fontSize: "0.875rem", fontWeight: 500, color: "#1E293B" }}
          >
            <FileDownloadOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            Xuất Excel
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
