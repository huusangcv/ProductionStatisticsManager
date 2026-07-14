import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { Box, Button, Chip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PreviewIcon from "@mui/icons-material/Preview";

const viVNGridLocaleText = {
  toolbarColumns: "Cột",
  toolbarFilters: "Bộ lọc",
  toolbarDensity: "Mật độ",
  toolbarExport: "Xuất file",
  noRowsLabel: "Không có dữ liệu",
  MuiTablePagination: {
    labelRowsPerPage: "Số dòng mỗi trang:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} trong ${count !== -1 ? count : `nhiều hơn ${to}`}`,
  },
};

function NormalToolbar({ onImport, onRefresh }) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarExport />
        <Button variant="outlined" color="secondary" startIcon={<RefreshIcon />} onClick={onRefresh}>
          Làm mới
        </Button>
        <Button variant="contained" color="primary" startIcon={<UploadFileIcon />} onClick={onImport} disableElevation>
          Import Excel
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

function PreviewToolbar({ onSave, onCancel, reportDate, rowCount }) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, borderBottom: "2px solid #F59E0B", bgcolor: "#FFFBEB" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
        <PreviewIcon sx={{ color: "#D97706" }} />
        <Box sx={{ fontWeight: 600, color: "#92400E", fontSize: 14 }}>
          Chế độ xem trước
        </Box>
        <Chip label={`${rowCount} dòng`} size="small" sx={{ bgcolor: "#FEF3C7", color: "#92400E" }} />
        <Chip label={`Ngày: ${reportDate}`} size="small" sx={{ bgcolor: "#FEF3C7", color: "#92400E" }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} onClick={onCancel}>
          Hủy
        </Button>
        <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={onSave} disableElevation>
          Lưu dữ liệu
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

function ProductionDataGrid({ columnSpec, data, isPreview, previewMeta, onImport, onRefresh, onSave, onCancelPreview }) {
  const toolbar = isPreview
    ? () => (
        <PreviewToolbar
          onSave={onSave}
          onCancel={onCancelPreview}
          reportDate={previewMeta?.reportDate || ""}
          rowCount={data.length}
        />
      )
    : () => <NormalToolbar onImport={onImport} onRefresh={onRefresh} />;

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        bgcolor: "#FFFFFF",
        borderRadius: "18px",
        overflow: "hidden",
        border: isPreview ? "2px solid #F59E0B" : "1px solid #E2E8F0",
        boxShadow: isPreview
          ? "0 0 0 4px rgba(245, 158, 11, 0.15)"
          : "0 2px 12px rgba(15, 23, 42, 0.05)",
        transition: "border 0.2s, box-shadow 0.2s",
      }}
    >
      <DataGrid
        localeText={viVNGridLocaleText}
        rows={data}
        columns={columnSpec}
        disableRowSelectionOnClick
        slots={{ toolbar }}
        initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        pageSizeOptions={[10, 20, 50, 100]}
        sx={{
          border: "none",
          width: "100%",
          minWidth: 0,
          color: "#0F172A",
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#F8FAFC",
            color: "#64748B",
            fontWeight: 600,
            fontSize: 13,
            borderBottom: "1px solid #E2E8F0",
          },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
          "& .MuiDataGrid-cell": { borderColor: "#E2E8F0" },
          "& .MuiDataGrid-cell:focus-within": { outline: "none" },
          "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
          "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #E2E8F0" },
        }}
      />
    </Box>
  );
}

export default ProductionDataGrid;
