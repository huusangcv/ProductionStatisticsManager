import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

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

const btnOutlined = {
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
};

export default function PersonalProductionToolbar({
  onOpenSync,
  onRefresh,
  onExport,
  filterDate,
  onFilterDateChange,
}) {
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const handleTaoExcel = () => {
    setExportAnchorEl(null);
    if (onExport) onExport();
  };

  const handleMoThuMuc = async () => {
    setExportAnchorEl(null);
    const res = await window.electronAPI.personalProduction.openExportFolder(filterDate);
    if (!res?.ok) {
      console.warn("Không thể mở thư mục:", res?.message);
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
      {/* Left Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarColumnsButton
            slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Cột" } }}
            sx={iconOnlyButtonSx}
          />
        </Box>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <GridToolbarFilterButton
            slotProps={{ button: { sx: iconOnlyButtonSx, "aria-label": "Bộ lọc" } }}
            sx={iconOnlyButtonSx}
          />
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
          </Box>
        )}
      </Box>

      {/* Right Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Xuất/In dropdown — gồm: Đồng bộ dữ liệu + Tạo Excel */}
        <Button
          variant="outlined"
          color="inherit"
          onClick={(e) => setExportAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDownIcon fontSize="small" />}
          sx={btnOutlined}
        >
          Xuất/In
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={() => setExportAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiPaper-root": {
              mt: 0.5,
              minWidth: 190,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              borderRadius: "8px",
            },
          }}
        >
          <MenuItem
            onClick={() => { setExportAnchorEl(null); if (onOpenSync) onOpenSync(); }}
            sx={{ fontSize: "13px", py: 1 }}
          >
            <SyncRoundedIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            Đồng bộ dữ liệu
          </MenuItem>
          <MenuItem onClick={handleTaoExcel} sx={{ fontSize: "13px", py: 1 }}>
            <DescriptionOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
            Tạo Excel
          </MenuItem>
        </Menu>

        {/* Mở thư mục — standalone */}
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<FolderOpenIcon fontSize="small" />}
          onClick={handleMoThuMuc}
          sx={btnOutlined}
        >
          Mở thư mục
        </Button>

        {/* Refresh */}
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
