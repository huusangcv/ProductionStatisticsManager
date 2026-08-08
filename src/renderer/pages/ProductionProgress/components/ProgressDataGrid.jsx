import { DataGrid, GridFooter } from "@mui/x-data-grid";
import { viVNGridLocaleText } from "../../../constants/dataGridLocale";
import { Box, Chip } from "@mui/material";
import ProgressSummaryFooter from "./ProgressSummaryFooter";
import ProgressToolbar from "./ProgressToolbar";

const statusColors = {
  "Hoàn thành": { bg: "#E6F4EA", color: "#137333" },
  "Quá hạn Cắt": { bg: "#FCE8E6", color: "#C5221F" },
  "Quá hạn Mài": { bg: "#FCE8E6", color: "#C5221F" },
  "Đang Mài": { bg: "#FEF7E0", color: "#B06000" },
  "Chờ Mài": { bg: "#F3F4F6", color: "#374151" },
  "Đang Cắt": { bg: "#E8F0FE", color: "#1967D2" },
  "Chưa Cắt": { bg: "#F8FAFC", color: "#64748B" },
};

function CustomFooter(props) {
  return (
    <Box sx={{ width: "100%" }}>
      <ProgressSummaryFooter />
      <GridFooter {...props} />
    </Box>
  );
}

export default function ProgressDataGrid({ records, loading, filterText, statusFilterSelect, onImport, onExport, onRefresh }) {
  // Filter logic handled in parent, or we can use DataGrid built-in filter, 
  // but parent passes `records` already filtered by search text and status.

  const columns = [
    { field: "furnace_date", headerName: "Ngày Lò", width: 110 },
    { field: "work_order_number", headerName: "Mã công đơn", width: 160 },
    { field: "item_name", headerName: "Tên hàng", width: 250 },
    { field: "furnace_qty", headerName: "SL Lò", width: 90, type: "number" },
    { field: "cutting_qty", headerName: "SL Cắt", width: 90, type: "number" },
    { 
      field: "missing_cutting", 
      headerName: "Thiếu Cắt", 
      width: 100, 
      type: "number",
      renderCell: (params) => (
        <Box sx={{ color: params.value > 0 ? "#C5221F" : "inherit", fontWeight: params.value > 0 ? 600 : 400 }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: "pending_cutting_strings", 
      headerName: "Xâu chưa Cắt", 
      width: 120, 
      type: "number",
      renderCell: (params) => (
        <Box sx={{ color: params.value > 0 ? "#B06000" : "inherit", fontWeight: params.value > 0 ? 600 : 400 }}>
          {params.value}
        </Box>
      )
    },
    { field: "grinding_qty", headerName: "SL Mài", width: 90, type: "number" },
    { 
      field: "missing_grinding", 
      headerName: "Thiếu Mài", 
      width: 100, 
      type: "number",
      renderCell: (params) => (
        <Box sx={{ color: params.value > 0 ? "#C5221F" : "inherit", fontWeight: params.value > 0 ? 600 : 400 }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: "pending_grinding_strings", 
      headerName: "Xâu chưa Mài", 
      width: 120, 
      type: "number",
      renderCell: (params) => (
        <Box sx={{ color: params.value > 0 ? "#B06000" : "inherit", fontWeight: params.value > 0 ? 600 : 400 }}>
          {params.value}
        </Box>
      )
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 140,
      renderCell: (params) => {
        const style = statusColors[params.value] || { bg: "#F1F5F9", color: "#475569" };
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "4px",
              height: "24px"
            }}
          />
        );
      }
    }
  ];

  return (
    <DataGrid
      rows={records}
      columns={columns}
      loading={loading}
      getRowId={(row) => row.work_order_number}
      localeText={viVNGridLocaleText}
      slots={{ toolbar: ProgressToolbar, footer: CustomFooter }}
      slotProps={{
        toolbar: { statusFilterSelect, onImport, onExport, onRefresh }
      }}
      initialState={{
        pagination: { paginationModel: { pageSize: 50 } },
      }}
      pageSizeOptions={[10, 20, 50, 100]}
      disableRowSelectionOnClick
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
          borderTop: "1px solid #E2E8F0"
        },
        "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
        "& .MuiDataGrid-cell": {
          borderColor: "#E2E8F0",
        },
        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
          outline: "none !important",
        },
        "& .MuiDataGrid-row:hover": {
          bgcolor: "#F8FAFC"
        },
        "& .MuiDataGrid-row.Mui-selected": {
          bgcolor: "#E0F2FE !important",
          "&:hover": {
            bgcolor: "#BAE6FD !important",
          },
        },
        "& .MuiDataGrid-footerContainer": {
          minHeight: "auto",
          flexDirection: "column",
          alignItems: "stretch",
          p: 0,
          borderTop: "1px solid #E2E8F0",
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
  );
}
