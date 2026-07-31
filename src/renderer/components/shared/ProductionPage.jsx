import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Snackbar, Alert, Card, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText } from "@mui/material";
import ProductionDataGrid from "./ProductionDataGrid";
import ProductionDetailDrawer from "./production/ProductionDetailDrawer";

/**
 * Shared production page for Grinding and Cutting modules.
 * @param {string} moduleName - "Sản lượng Mài" or "Sản lượng Cắt" (for display/logging if needed)
 * @param {string} ipcKey - "grinding" or "cutting" (for IPC channels)
 * @param {Array} columnSpec - Column definitions for the DataGrid
 */
function ProductionPage({ moduleName, ipcKey, columnSpec }) {
  const [savedData, setSavedData] = useState([]);
  const [previewData, setPreviewData] = useState(null); // null = not in preview
  const [previewMeta, setPreviewMeta] = useState(null); // { fileName, reportDate }
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [absentDialog, setAbsentDialog] = useState({ open: false, employees: [] });

  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const isGrinding = ipcKey === "grinding";

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = async () => {
    try {
      const records = await window.electronAPI[ipcKey].getAll();
      console.log("loadData got records:", records); // Debug log
      setSavedData(records);
    } catch (error) {
      showSnackbar(
        `Lỗi khi tải dữ liệu ${moduleName}: ` + error.message,
        "error",
      );
    }
  };

  const handleRowDoubleClick = (params) => {
    setSelectedRecord(params.row);
    setDrawerOpen(true);
  };

  const handleSaveRecord = async (id, data) => {
    setIsSaving(true);
    try {
      const result = await window.electronAPI[ipcKey].update(id, data);
      if (!result.ok) {
        showSnackbar(result.message || "Lỗi khi cập nhật", "error");
        return;
      }
      showSnackbar("Cập nhật thành công");
      await loadData();
      setDrawerOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      showSnackbar(`Lỗi khi cập nhật: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const result = await window.electronAPI[ipcKey].delete(id);
      if (!result.ok) {
        showSnackbar(result.message || "Lỗi khi xóa", "error");
        return;
      }
      showSnackbar("Xóa thành công");
      await loadData();
      setDrawerOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      showSnackbar(`Lỗi khi xóa: ${error.message}`, "error");
    }
  };

  const isInitialLoad = useRef(true);
  const [fallbackNote, setFallbackNote] = useState("");

  useEffect(() => {
    isInitialLoad.current = true;
    setFallbackNote("");
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFilterDate(todayStr);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipcKey]);

  useEffect(() => {
    if (!savedData) return;
    if (!isInitialLoad.current) return;

    const todayStr = filterDate;
    const todayRows = savedData.filter((row) => row.report_date === todayStr);

    if (todayRows.length === 0 && savedData.length > 0) {
      window.electronAPI[ipcKey].getLatestDate(todayStr).then((latestDate) => {
        if (latestDate && isInitialLoad.current) {
          isInitialLoad.current = false;
          setFilterDate(latestDate);
          const [y, m, d] = latestDate.split("-");
          const formattedFallback = `${d}/${m}/${y}`;
          const [ty, tm, td] = todayStr.split("-");
          const formattedToday = `${td}/${tm}/${ty}`;
          setFallbackNote(`Đang hiển thị dữ liệu gần nhất (${formattedFallback}) do hôm nay (${formattedToday}) không có dữ liệu`);
        } else {
          isInitialLoad.current = false;
        }
      }).catch(() => {
        isInitialLoad.current = false;
      });
    } else {
      if (savedData.length > 0 || todayRows.length > 0) {
        isInitialLoad.current = false;
      }
    }
  }, [savedData, filterDate, ipcKey]);

  const handleFilterDateChange = (newDate) => {
    isInitialLoad.current = false;
    setFallbackNote("");
    setFilterDate(newDate);
  };

  // --- Shared File Processing ---
  const processExcelFile = async (filePath) => {
    setIsProcessing(true);
    const parseResult = await window.electronAPI[ipcKey].parseExcel(filePath);
    setIsProcessing(false);

    if (!parseResult.ok) {
      showSnackbar(parseResult.message, "error");
      return;
    }

    const rowsWithId = parseResult.records.map((row, index) => ({
      ...row,
      id: index + 1,
    }));
    setPreviewData(rowsWithId);
    setPreviewMeta({
      fileName: parseResult.fileName,
      reportDate: parseResult.reportDate,
    });
  };

  // --- Import Flow: Select → Parse → Show Preview ---
  const handleImport = async () => {
    if (isProcessing) return;
    const fileResult = await window.electronAPI[ipcKey].selectFile();
    if (!fileResult.ok) return; // User cancelled
    await processExcelFile(fileResult.filePath);
  };

  // --- Drag & Drop Flow ---
  const handleFileDrop = async (file) => {
    if (isProcessing) return;
    await processExcelFile(file.path);
  };

  const handleInvalidFile = (message) => {
    showSnackbar(message, "error");
  };

  // --- Save Flow: User confirms preview → Persist to SQLite ---
  const handleSave = async () => {
    if (!previewData || !previewMeta) return;

    // Determine if user is currently viewing the latest date in savedData
    const latestExistingDate = savedData.length > 0
      ? savedData.reduce((max, r) => (r.report_date > max ? r.report_date : max), savedData[0].report_date)
      : null;
    const isViewingLatest = !latestExistingDate || filterDate === latestExistingDate;
    const importedDate = previewMeta.reportDate;

    // Strip the temporary `id` field before sending to backend
    const records = previewData.map(({ id, ...rest }) => rest);

    const result = await window.electronAPI[ipcKey].save({
      records,
      fileName: previewMeta.fileName,
      reportDate: previewMeta.reportDate,
    });

    if (result.ok) {
      showSnackbar(`Đã lưu thành công ${result.insertedCount} dòng dữ liệu.`);
      setPreviewData(null);
      setPreviewMeta(null);
      if (isViewingLatest || (importedDate && importedDate >= (latestExistingDate || ""))) {
        isInitialLoad.current = false;
        setFallbackNote("");
        setFilterDate(importedDate);
      }
      await loadData();
      // Show warning if some employees are not present
      if (result.absentEmployees && result.absentEmployees.length > 0) {
        setAbsentDialog({ open: true, employees: result.absentEmployees });
      }
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
    setPreviewMeta(null);
  };

  const handleRefresh = async () => {
    await loadData();
    showSnackbar("Dữ liệu đã được làm mới");
  };

  const isPreview = previewData !== null;
  
  const filteredSavedData = useMemo(() => {
    if (!filterDate) return savedData;
    return savedData.filter((row) => row.report_date === filterDate);
  }, [savedData, filterDate]);

  const displayData = isPreview ? previewData : filteredSavedData;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
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
        <ProductionDataGrid
          columnSpec={columnSpec}
          data={displayData}
          isPreview={isPreview}
          previewMeta={previewMeta}
          isProcessing={isProcessing}
          onImport={handleImport}
          onRefresh={handleRefresh}
          onSave={handleSave}
          onCancelPreview={handleCancelPreview}
          onFileDrop={handleFileDrop}
          onInvalidFile={handleInvalidFile}
          onRowDoubleClick={!isPreview ? handleRowDoubleClick : undefined}
          summaryMode={ipcKey}
          filterDate={filterDate}
          onFilterDateChange={handleFilterDateChange}
          fallbackNote={fallbackNote}
        />
      </Card>

      <ProductionDetailDrawer
        open={drawerOpen}
        record={selectedRecord}
        isGrinding={isGrinding}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRecord(null);
        }}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        isSaving={isSaving}
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

      {/* Absent Employees Dialog */}
      <Dialog
        open={absentDialog.open}
        onClose={() => setAbsentDialog({ open: false, employees: [] })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "warning.dark", fontWeight: 600 }}>⚠ Cảnh báo: Nhân viên nghỉ việc có sản lượng</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Các nhân viên sau <b>không có mặt (nghỉ)</b> trong ngày {filterDate} nhưng lại có báo sản lượng.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Dữ liệu sản lượng <b>vẫn được lưu</b>, nhưng vui lòng kiểm tra lại điểm danh hoặc báo cáo sản lượng!
          </Typography>
          <List dense sx={{ bgcolor: "#fff8f0", borderRadius: 1, border: "1px solid #fde68a", maxHeight: 240, overflow: "auto" }}>
            {absentDialog.employees.map((emp, i) => (
              <ListItem key={i}>
                <ListItemText primary={emp} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbsentDialog({ open: false, employees: [] })} variant="contained">
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductionPage;
