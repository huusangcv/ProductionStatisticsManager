import { DataGrid } from "@mui/x-data-grid";
import { MenuItem, Select, TextField } from "@mui/material";
import AttendanceStatusBadge, { STATUS_CONFIG } from "./AttendanceStatusBadge";
import { viVNGridLocaleText } from "../../../../constants/dataGridLocale";

const dataGridSx = {
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
    borderTop: "1px solid #E2E8F0",
  },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
  "& .MuiDataGrid-cell": { borderColor: "#E2E8F0" },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none !important",
  },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
  "& .MuiDataGrid-footerContainer": {
    minHeight: "40px",
    borderTop: "1px solid #E2E8F0",
  },
};

export default function AttendanceGrid({ records, onStatusChange, onNoteChange, loading, readOnly }) {
  
  const columns = [
    { field: "stt", headerName: "STT", width: 60, align: "center", headerAlign: "center",
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
    },
    { field: "employee_code", headerName: "Mã NV", width: 100 },
    { field: "employee_name", headerName: "Tên nhân viên", width: 220 },
    { field: "role_code", headerName: "Vai trò", width: 120 },
    { field: "representative_code", headerName: "Mã đại diện", width: 120 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 180,
      renderCell: (params) => {
        if (readOnly) {
          return <AttendanceStatusBadge status={params.value} />;
        }
        
        return (
          <Select
            size="small"
            value={params.value || "NOT_CHECKED"}
            onChange={(e) => onStatusChange(params.row.employee_id, e.target.value)}
            sx={{
              width: "100%",
              height: 32,
              fontSize: "13px",
              "& .MuiSelect-select": { py: 0.5 }
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: "13px" }}>
                {config.label}
              </MenuItem>
            ))}
          </Select>
        );
      }
    },
    {
      field: "note",
      headerName: "Ghi chú",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (readOnly) {
          return params.value || "";
        }
        return (
          <TextField
            size="small"
            fullWidth
            value={params.value || ""}
            onChange={(e) => onNoteChange(params.row.employee_id, e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{ "& input": { fontSize: "13px", py: 1 } }}
            placeholder="Nhập ghi chú..."
          />
        );
      }
    }
  ];

  return (
    <DataGrid
      rows={records}
      columns={columns}
      getRowId={(row) => row.employee_id}
      loading={loading}
      disableRowSelectionOnClick
      disableColumnMenu
      localeText={viVNGridLocaleText}
      sx={dataGridSx}
      hideFooterSelectedRowCount
    />
  );
}
