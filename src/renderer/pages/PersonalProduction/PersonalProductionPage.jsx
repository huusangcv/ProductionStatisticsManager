import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Card, Snackbar, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { PERSONAL_PRODUCTION_COLUMNS } from "../../../constants/personalProductionColumns";
import PersonalProductionToolbar from "./components/PersonalProductionToolbar";
import SyncPersonalProductionDialog from "./components/SyncPersonalProductionDialog";
import { viVNGridLocaleText } from "../../constants/dataGridLocale";
import ProductionGridFooter from "../../components/shared/ProductionGridFooter";

const productionDataGridSx = {
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
  "& .MuiDataGrid-row.Mui-selected": {
    bgcolor: "#E0F2FE !important",
    "&:hover": {
      bgcolor: "#BAE6FD !important",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    minHeight: "40px",
    borderTop: "1px solid #E2E8F0",
  },
  "& .MuiTablePagination-root": {
    padding: "4px 12px",
  },
  "& .MuiTablePagination-toolbar": {
    minHeight: "40px",
    padding: 0,
  },
};

export default function PersonalProductionPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadData = useCallback(async () => {
    if (!filterDate) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.personalProduction.getByDate(filterDate);
      if (res.ok) {
        setData(res.records || []);
      } else {
        showSnackbar(res.message || "Lỗi tải dữ liệu", "error");
      }
    } catch (err) {
      showSnackbar("Lỗi hệ thống: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessRowUpdate = async (newRow, oldRow) => {
    try {
      const res = await window.electronAPI.personalProduction.update(newRow.id, newRow);
      if (!res.ok) {
        showSnackbar(res.message || "Lỗi cập nhật dữ liệu", "error");
        return oldRow;
      }
      showSnackbar("Cập nhật thành công", "success");
      return newRow;
    } catch (error) {
      showSnackbar("Lỗi: " + error.message, "error");
      return oldRow;
    }
  };

  const handleProcessRowUpdateError = (error) => {
    showSnackbar("Lỗi chỉnh sửa: " + error.message, "error");
  };

  const toolbar = useCallback(
    () => (
      <PersonalProductionToolbar
        onOpenSync={() => setSyncDialogOpen(true)}
        onRefresh={loadData}
        filterDate={filterDate}
        onFilterDateChange={setFilterDate}
      />
    ),
    [loadData, filterDate]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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
          localeText={viVNGridLocaleText}
          rows={data}
          columns={PERSONAL_PRODUCTION_COLUMNS}
          loading={loading}
          density="compact"
          ignoreDiacritics={true}
          slots={{ toolbar, footer: ProductionGridFooter }}
          slotProps={{ footer: { summaryMode: "personal" } }}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          sx={productionDataGridSx}
        />
      </Card>

      <SyncPersonalProductionDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        currentDate={filterDate}
        onSuccess={(syncedDate) => {
          if (syncedDate !== filterDate) {
            setFilterDate(syncedDate);
          } else {
            loadData();
          }
        }}
        showSnackbar={showSnackbar}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
