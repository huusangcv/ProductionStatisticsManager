import { useState, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { getGrindingDataGridColumns } from "../../../../constants/grindingColumns";

// Reuse the localized texts (abridged for brevity but typically we would extract this to a shared file)
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

function CustomToolbar({ onImport, onRefresh }) {
  return (
    <GridToolbarContainer
      sx={{
        p: 1.5,
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "#F8FAFC",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarExport />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadFileIcon />}
          onClick={onImport}
          disableElevation
        >
          Import Excel
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Làm mới
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

function GrindingDataGrid({
  data,
  onImport,
  onRefresh,
}) {
  const columns = getGrindingDataGridColumns();

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        bgcolor: "#FFFFFF",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
      }}
    >
      <DataGrid
        localeText={viVNGridLocaleText}
        rows={data}
        columns={columns}
        disableRowSelectionOnClick
        slots={{ toolbar: CustomToolbar }}
        slotProps={{
          toolbar: {
            onImport,
            onRefresh,
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 50 },
          },
        }}
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
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#E2E8F0",
          },
          "& .MuiDataGrid-cell:focus-within": {
            outline: "none",
          },
          "& .MuiDataGrid-row:hover": {
            bgcolor: "#F8FAFC",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
          },
        }}
      />
    </Box>
  );
}

export default GrindingDataGrid;
