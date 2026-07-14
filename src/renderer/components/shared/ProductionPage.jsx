import { useState, useEffect } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import ProductionDataGrid from "./ProductionDataGrid";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = async () => {
    try {
      const records = await window.electronAPI[ipcKey].getAll();
      setSavedData(records);
    } catch (error) {
      showSnackbar(`Lỗi khi tải dữ liệu ${moduleName}: ` + error.message, "error");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipcKey]);

  // --- Import Flow: Select → Parse → Show Preview ---
  const handleImport = async () => {
    // Step 1: Select file
    const fileResult = await window.electronAPI[ipcKey].selectFile();
    if (!fileResult.ok) return; // User cancelled

    // Step 2: Parse Excel
    const parseResult = await window.electronAPI[ipcKey].parseExcel(fileResult.filePath);
    if (!parseResult.ok) {
      showSnackbar(parseResult.message, "error");
      return;
    }

    // Step 3: Enter preview mode — assign temporary IDs for DataGrid row identification
    const rowsWithId = parseResult.records.map((row, index) => ({ ...row, id: index + 1 }));
    setPreviewData(rowsWithId);
    setPreviewMeta({ fileName: parseResult.fileName, reportDate: parseResult.reportDate });
  };

  // --- Save Flow: User confirms preview → Persist to SQLite ---
  const handleSave = async () => {
    if (!previewData || !previewMeta) return;

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
      await loadData();
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
  const displayData = isPreview ? previewData : savedData;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ProductionDataGrid
          columnSpec={columnSpec}
          data={displayData}
          isPreview={isPreview}
          previewMeta={previewMeta}
          onImport={handleImport}
          onRefresh={handleRefresh}
          onSave={handleSave}
          onCancelPreview={handleCancelPreview}
        />
      </Box>

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

export default ProductionPage;
