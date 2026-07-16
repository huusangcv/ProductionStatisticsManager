import { DataGrid } from "@mui/x-data-grid";
import { Box, Chip } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

import DataGridToolbarActions, { StandardButton } from "./DataGridToolbarActions";
import { useDragDropImport } from "../../hooks/useDragDropImport";

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

function ProductionDataGrid({
  columnSpec,
  data,
  isPreview,
  previewMeta,
  onImport,
  onRefresh,
  onSave,
  onCancelPreview,
  onFileDrop,
  onInvalidFile,
  isProcessing,
}) {
  const { isDragging, dragProps } = useDragDropImport({
    onDropFile: onFileDrop,
    onInvalidFile: onInvalidFile,
    acceptedExtensions: [".xls", ".xlsx"],
  });

  const toolbar = () => {
    if (isPreview) {
      return (
        <DataGridToolbarActions
          hasExport={false}
          rightActions={
            <>
              <Chip label={`Ngày: ${previewMeta?.reportDate || ""}`} sx={{ height: 32, borderRadius: "8px" }} />
              <Chip label={`${data.length} dòng`} sx={{ height: 32, borderRadius: "8px" }} />
              <StandardButton
                primary={true}
                icon={<SaveIcon />}
                label="Lưu dữ liệu"
                onClick={onSave}
              />
              <StandardButton
                primary={false}
                icon={<CancelIcon />}
                label="Hủy"
                onClick={onCancelPreview}
              />
            </>
          }
        />
      );
    }

    return (
      <DataGridToolbarActions
        hasExport={true}
        rightActions={
          <>
            <StandardButton
              primary={true}
              icon={<UploadFileRoundedIcon />}
              label="Import Excel"
              onClick={onImport}
            />
            <StandardButton
              primary={false}
              icon={<RefreshRoundedIcon />}
              label="Làm mới"
              onClick={onRefresh}
            />
          </>
        }
      />
    );
  };

  return (
    <Box
      {...dragProps}
      sx={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        bgcolor: "#FFFFFF",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DataGrid
        localeText={viVNGridLocaleText}
        rows={data}
        columns={columnSpec}
        disableRowSelectionOnClick
        loading={isProcessing}
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
            borderTop: "1px solid #E2E8F0", // Add top border so it's framed under the toolbar
          },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
          "& .MuiDataGrid-cell": { borderColor: "#E2E8F0" },
          "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
            minHeight: "48px",
          },
          "& .MuiTablePagination-root": {
            padding: "4px 12px",
          },
          "& .MuiTablePagination-toolbar": {
            minHeight: "40px",
            padding: 0,
          },
        }}
      />
      {isDragging && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(248, 250, 252, 0.85)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #3B82F6",
            borderRadius: "18px",
          }}
        >
          <Box sx={{ fontSize: 48, mb: 2 }}>📄</Box>
          <Box sx={{ fontSize: 20, fontWeight: 600, color: "#1E293B" }}>
            Thả file Excel vào đây
          </Box>
          <Box sx={{ fontSize: 14, color: "#64748B", mt: 1 }}>
            (.xls hoặc .xlsx)
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ProductionDataGrid;
