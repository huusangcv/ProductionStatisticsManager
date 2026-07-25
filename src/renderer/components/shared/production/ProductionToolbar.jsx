// src/renderer/components/shared/production/ProductionToolbar.jsx
import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  useGridApiContext,
} from "@mui/x-data-grid";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
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

export default function ProductionToolbar({
  onImport,
  onRefresh,
  filterDate,
  onFilterDateChange,
  fallbackNote,
}) {
  const apiRef = useGridApiContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleExport = () => {
    setAnchorEl(null);
    if (apiRef.current && apiRef.current.exportDataAsCsv) {
      apiRef.current.exportDataAsCsv({
        fileName: `San_luong_${filterDate || "tat_ca"}`,
        utf8WithBom: true,
      });
    }
  };

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

        {onFilterDateChange && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              type="date"
              size="small"
              value={filterDate || ""}
              onChange={(e) => onFilterDateChange(e.target.value)}
              sx={{
                width: 140,
                m: "0 !important",
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
            {fallbackNote && (
              <Tooltip title={fallbackNote} arrow placement="top">
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}>
                  <WarningAmberRoundedIcon sx={{ fontSize: 16, color: "warning.main", cursor: "pointer" }} />
                </Box>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* ── Right Section ────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          Xuất/Nhập
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
                minWidth: 150,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              if (onImport) onImport();
            }}
            sx={{
              py: 1,
              gap: 1.5,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1E293B",
            }}
          >
            <UploadFileRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
            Nhập Excel
          </MenuItem>
          <MenuItem
            onClick={handleExport}
            sx={{
              py: 1,
              gap: 1.5,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1E293B",
            }}
          >
            <FileDownloadOutlinedIcon
              sx={{ fontSize: 18, color: "success.main" }}
            />
            Xuất file
          </MenuItem>
        </Menu>

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
