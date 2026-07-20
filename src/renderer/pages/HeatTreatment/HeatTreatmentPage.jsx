import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Card,
  Snackbar,
  TextField,
  CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";

import ExportDialogs from "./components/ExportDialogs";
import PrintErrorDialog from "../../components/shared/PrintErrorDialog";
import ProductionDataGrid from "../../components/shared/ProductionDataGrid";
import DataGridToolbarActions, {
  StandardButton,
} from "../../components/shared/DataGridToolbarActions";
import { HEAT_TREATMENT_PREVIEW_COLUMNS } from "../../../constants/heatTreatmentColumns";
import { usePrinters } from "../../hooks/usePrinters";

export default function HeatTreatmentPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [previewRows, setPreviewRows] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generateStepText, setGenerateStepText] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [printErrorResult, setPrintErrorResult] = useState(null);

  const { printExcel, printing } = usePrinters();

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const loadTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const tmpl = await window.electronAPI.template.get("heat-treatment");
      setTemplate(tmpl);
    } catch (err) {
      showSnackbar("Lỗi tải template: " + err.message, "error");
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const loadGrindingData = useCallback(async (date) => {
    if (!date) return;
    try {
      // Send YYYY-MM-DD directly now!
      const rows =
        await window.electronAPI.heatTreatment.getGrindingByDate(date);

      const mapped = (rows || []).map((row, idx) => ({
        id: idx,
        stt: idx + 1,
        report_date: row.report_date,
        customer_order_number: row.customer_order_number,
        work_order_number: row.work_order_number,
        material_code: row.material_code,
        item_name: row.item_name,
        specification: row.specification,
        employee_name: row.employee_name,
        completed_quantity: row.completed_quantity,
        scrap_quantity: row.scrap_quantity,
        unit_weight: row.unit_weight,
        completed_weight: row.completed_weight,
        classification: classifyLocal(row),
      }));
      setPreviewRows(mapped);
    } catch (err) {
      showSnackbar("Lỗi tải dữ liệu: " + err.message, "error");
    }
  }, []);

  useEffect(() => {
    setLastResult(null);
    loadGrindingData(selectedDate);
  }, [selectedDate, loadGrindingData]);

  function classifyLocal(row) {
    const kws = ["XLN", "XỬ LÝ NHIỆT", "NHIỆT LUYỆN", "HT", "HARDENED"];
    const name = (row.item_name || "").toUpperCase();
    const spec = (row.specification || "").toUpperCase();
    return kws.some((k) => name.includes(k) || spec.includes(k)) ? "XLN" : "NO";
  }

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    setLastResult(null);
    setGenerateStepText("Đang đọc dữ liệu...");

    // Send YYYY-MM-DD directly now!
    const reportDate = selectedDate;

    const steps = [
      { ms: 600, text: "Đang lọc XLN..." },
      { ms: 1400, text: "Đang tạo Excel..." },
      { ms: 2200, text: "Đang lưu tệp..." },
    ];

    const timeouts = steps.map((step) =>
      setTimeout(() => setGenerateStepText(step.text), step.ms),
    );

    try {
      const result = await window.electronAPI.heatTreatment.generate({
        reportDate,
      });
      timeouts.forEach(clearTimeout);
      if (result.ok) {
        setLastResult(result);
        setShowSuccessDialog(true);
        showSnackbar(`Xuất thành công: ${result.fileName}`);
      } else {
        showSnackbar(result.message || "Tạo file thất bại.", "error");
      }
    } catch (err) {
      timeouts.forEach(clearTimeout);
      showSnackbar("Lỗi hệ thống: " + err.message, "error");
    } finally {
      timeouts.forEach(clearTimeout);
      setGenerating(false);
    }
  };

  const handleOpenFolder = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.heatTreatment.openFolder(filePath);
  };

  const handleOpenFile = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.heatTreatment.openFile(filePath);
  };

  const handlePrint = async (filePath) => {
    if (!filePath) return;
    try {
      const result = await printExcel(filePath);
      if (result.ok) {
        showSnackbar(result.message || "In thành công.");
      } else {
        setPrintErrorResult(result);
      }
    } catch (error) {
      setPrintErrorResult({
        ok: false,
        message: "Không thể in: " + error.message,
        details: { file: filePath, exception: error.message }
      });
    }
  };

  const heatTreatmentToolbar = () => (
    <DataGridToolbarActions
      hasExport={false}
      rightActions={
        <>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            inputProps={{ max: today }}
            sx={{
              width: 160,
              "& .MuiInputBase-root": {
                height: 38,
                borderRadius: "8px",
                fontSize: 14,
              },
            }}
          />
          <StandardButton
            primary
            icon={
              generating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DescriptionIcon />
              )
            }
            label={generating ? "Đang tạo..." : "Tạo Excel"}
            disabled={!template || generating}
            onClick={handleGenerate}
          />
          <StandardButton
            primary={false}
            icon={
              printing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PrintIcon />
              )
            }
            label={printing ? "Đang in..." : "In"}
            disabled={!lastResult || generating || printing}
            onClick={() => handlePrint(lastResult?.filePath)}
          />
          <StandardButton
            primary={false}
            icon={<FolderOpenIcon />}
            label="Mở thư mục"
            disabled={!lastResult || generating}
            onClick={() => handleOpenFolder(lastResult?.filePath)}
          />
          <StandardButton
            primary={false}
            icon={<RefreshIcon />}
            label="Làm mới"
            onClick={loadTemplate}
          />
        </>
      }
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        minHeight: 0,
      }}
    >
      <ExportDialogs
        generating={generating}
        generateStepText={generateStepText}
        lastResult={lastResult}
        showSuccessDialog={showSuccessDialog}
        onCloseSuccess={() => setShowSuccessDialog(false)}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onPrint={handlePrint}
      />

      <PrintErrorDialog 
        open={!!printErrorResult} 
        onClose={() => setPrintErrorResult(null)} 
        result={printErrorResult} 
      />

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
            columnSpec={HEAT_TREATMENT_PREVIEW_COLUMNS}
            data={previewRows}
            isProcessing={templateLoading}
            enableDragDrop={false}
            density="compact"
            pageSizeOptions={[25, 50, 100]}
            renderToolbar={heatTreatmentToolbar}
          />
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
