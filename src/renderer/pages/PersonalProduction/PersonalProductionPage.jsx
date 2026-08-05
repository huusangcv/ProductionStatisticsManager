import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Card, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { DataGrid } from "@mui/x-data-grid";
import { PERSONAL_PRODUCTION_COLUMNS } from "../../../constants/personalProductionColumns";
import PersonalProductionToolbar from "./components/PersonalProductionToolbar";
import SyncPersonalProductionDialog from "./components/SyncPersonalProductionDialog";
import PersonalProductionDrawer from "./components/PersonalProductionDrawer";
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
  // Highlight dòng có nhân viên vắng mặt
  "& .row-has-absent": {
    bgcolor: "#FFF7ED !important",
    borderLeft: "3px solid #F97316 !important",
    "&:hover": { bgcolor: "#FFEDD5 !important" },
  },
};

export default function PersonalProductionPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
      const [prodRes, attRes] = await Promise.all([
        window.electronAPI.personalProduction.getByDate(filterDate),
        window.electronAPI.attendance?.getByDate(filterDate)
      ]);
      
      if (prodRes.ok) {
        let records = prodRes.records || [];
        
        if (attRes?.ok && attRes.records) {
          const attMap = {};
          attRes.records.forEach(r => {
            attMap[r.employee_code] = r.status;
          });
          
          records = records.map(r => ({
            ...r,
            attendance_status: attMap[r.employee_code] || 'NOT_CHECKED'
          }));
        }
        
        setData(records);
      } else {
        showSnackbar(prodRes.message || "Lỗi tải dữ liệu", "error");
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

  const handleRowDoubleClick = (params) => {
    setSelectedRecord(params.row);
    setDrawerOpen(true);
  };

  const handleSaveDrawer = async (updatedData) => {
    setIsSaving(true);
    try {
      const res = await window.electronAPI.personalProduction.update(updatedData.id, updatedData);
      if (!res.ok) {
        showSnackbar(res.message || "Lỗi cập nhật dữ liệu", "error");
      } else {
        showSnackbar("Cập nhật thành công", "success");
        setDrawerOpen(false);
        loadData(); // Tải lại để cập nhật DataGrid
      }
    } catch (error) {
      showSnackbar("Lỗi: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!filterDate) {
      showSnackbar("Vui lòng chọn ngày để xuất Excel", "warning");
      return;
    }
    setExporting(true);
    try {
      const res = await window.electronAPI.personalProduction.generate({
        startDate: filterDate,
        endDate: filterDate,
      });
      if (res.ok) {
        setExportResult(res);
        setExportDialogOpen(true);
        showSnackbar("Xuất Excel thành công!", "success");
      } else {
        showSnackbar(res.message || "Lỗi xuất Excel", "error");
      }
    } catch (error) {
      showSnackbar("Lỗi: " + error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const toolbar = useCallback(
    () => (
      <PersonalProductionToolbar
        onOpenSync={() => setSyncDialogOpen(true)}
        onRefresh={loadData}
        onExport={handleExport}
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
          onRowDoubleClick={handleRowDoubleClick}
          getRowClassName={(params) =>
            params.row.absent_codes ? "row-has-absent" : ""
          }
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

      <PersonalProductionDrawer
        open={drawerOpen}
        record={selectedRecord}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveDrawer}
        isSaving={isSaving}
      />

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
          <FileDownloadOutlinedIcon color="success" />
          Xuất Excel Sản lượng cá nhân thành công
        </DialogTitle>
        <DialogContent dividers>
          {exportResult && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 0.5 }}>
              <Typography variant="body1">
                <strong>Tên file:</strong> {exportResult.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                {exportResult.filePath}
              </Typography>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", gap: 3 }}>
                <Typography variant="body2">
                  Sản lượng Cắt: <strong>{exportResult.cuttingCount || 0} dòng</strong>
                </Typography>
                <Typography variant="body2">
                  Sản lượng Mài: <strong>{exportResult.grindingCount || 0} dòng</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={() => {
              if (exportResult?.filePath) {
                window.electronAPI.personalProduction.openFolder(exportResult.filePath);
              }
            }}
          >
            Mở thư mục
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<OpenInNewIcon />}
            onClick={() => {
              if (exportResult?.filePath) {
                window.electronAPI.personalProduction.openFile(exportResult.filePath);
              }
            }}
          >
            Mở file Excel
          </Button>
          <Button onClick={() => setExportDialogOpen(false)} color="inherit">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

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
