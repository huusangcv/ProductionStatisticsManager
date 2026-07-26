import { Box, Button, IconButton, TextField, Tooltip } from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridToolbarExport,
  useGridApiContext,
} from "@mui/x-data-grid";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

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

export default function PersonalProductionToolbar({
  onOpenSync,
  onRefresh,
  onExport,
  filterDate,
  onFilterDateChange,
}) {
  const apiRef = useGridApiContext();

  const handleExport = () => {
    if (onExport) {
      onExport();
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
        <Button
          variant="contained"
          color="primary"
          onClick={onOpenSync}
          startIcon={<SyncRoundedIcon />}
          sx={{
            height: 36,
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            px: 2,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            },
          }}
        >
          Đồng bộ dữ liệu
        </Button>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleExport}
          startIcon={<FileDownloadOutlinedIcon sx={{ color: "success.main" }} />}
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
          Xuất Excel
        </Button>

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
