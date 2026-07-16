import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Snackbar, Alert, Chip, IconButton, Tooltip, Card } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SessionDetailDialog from "./components/SessionDetailDialog";
import DataGridToolbarActions, { StandardButton } from "../../components/shared/DataGridToolbarActions";

export default function ImportHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", type: "info" });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.importSessions.getAll();
      setSessions(data);
    } catch (error) {
      setNotification({ open: true, message: "Lỗi tải lịch sử import", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRowClick = (params) => {
    setSelectedSession(params.row);
    setDialogOpen(true);
  };

  const handleRollback = async (id) => {
    try {
      const result = await window.electronAPI.importSessions.rollback(id);
      if (result.canceled) return;

      if (result.ok) {
        setNotification({ open: true, message: "Đã hoàn tác dữ liệu thành công!", type: "success" });
        setDialogOpen(false);
        fetchSessions();
      } else {
        setNotification({ open: true, message: result.message || "Lỗi khi hoàn tác", type: "error" });
      }
    } catch (error) {
      setNotification({ open: true, message: "Lỗi hệ thống: " + error.message, type: "error" });
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick(params); }}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      )
    },
    { field: "imported_at", headerName: "Thời gian Import", width: 180 },
    { field: "session_code", headerName: "Mã Phiên", width: 170 },
    { field: "module_name", headerName: "Phân hệ", width: 150 },
    { field: "file_name", headerName: "File nguồn", width: 250 },
    { field: "total_rows", headerName: "Tổng dòng", width: 100, type: "number" },
    { field: "imported_rows", headerName: "Đã thêm", width: 100, type: "number" },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 140,
      renderCell: (params) => {
        const val = params.value;
        let color = "default";
        let label = val;
        if (val === "SUCCESS") { color = "success"; label = "Thành công"; }
        if (val === "NO_NEW_DATA") { color = "info"; label = "Không DL mới"; }
        if (val === "FAILED") { color = "error"; label = "Lỗi"; }
        if (val === "ROLLED_BACK") { color = "default"; label = "Đã hoàn tác"; }

        return <Chip label={label} color={color} size="small" />;
      }
    },
  ];

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          p: "16px 20px",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <DataGrid
          rows={sessions}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          slots={{
            toolbar: () => (
              <DataGridToolbarActions
                hasExport={false}
                rightActions={
                  <StandardButton
                    primary={false}
                    icon={<RefreshIcon />}
                    label="Làm mới"
                    onClick={fetchSessions}
                  />
                }
              />
            )
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#F8FAFC",
              color: "#64748B",
              fontWeight: 600,
              fontSize: 13,
              borderBottom: "1px solid #E2E8F0",
              borderTop: "1px solid #E2E8F0",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
            "& .MuiDataGrid-cell:focus-within": { outline: "none" },
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
      </Card>

      <SessionDetailDialog
        open={dialogOpen}
        session={selectedSession}
        onClose={() => setDialogOpen(false)}
        onRollback={handleRollback}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={notification.type} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
