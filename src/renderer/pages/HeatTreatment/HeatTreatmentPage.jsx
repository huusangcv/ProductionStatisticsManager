import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Snackbar,
  TextField,
  CircularProgress,
  Typography,
  Tooltip,
  MenuItem,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";
import SummarizeIcon from "@mui/icons-material/Summarize";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import ExportDialogs from "./components/ExportDialogs";
import PeriodSummaryDialog from "./components/PeriodSummaryDialog";
import PrintErrorDialog from "../../components/shared/PrintErrorDialog";
import ProductionDataGrid from "../../components/shared/ProductionDataGrid";
import ReportToolbar from "../../components/shared/ReportToolbar";
import { HEAT_TREATMENT_PREVIEW_COLUMNS } from "../../../constants/heatTreatmentColumns";
import { usePrinters } from "../../hooks/usePrinters";

export default function HeatTreatmentPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const isInitialLoad = useRef(true);
  const [fallbackNote, setFallbackNote] = useState("");
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
  const [showPeriodSummaryDialog, setShowPeriodSummaryDialog] = useState(false);

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

      if ((!rows || rows.length === 0) && isInitialLoad.current) {
        try {
          const latestDate = await window.electronAPI.heatTreatment.getLatestDate(date);
          if (latestDate && isInitialLoad.current) {
            isInitialLoad.current = false;
            setSelectedDate(latestDate);
            const [y, m, d] = latestDate.split("-");
            const formattedFallback = `${d}/${m}/${y}`;
            const [ty, tm, td] = date.split("-");
            const formattedToday = `${td}/${tm}/${ty}`;
            setFallbackNote(`Đang hiển thị dữ liệu gần nhất (${formattedFallback}) do hôm nay (${formattedToday}) không có dữ liệu`);
            return;
          }
        } catch (e) {
          console.error("Failed to get latest heat treatment date:", e);
        }
      }

      isInitialLoad.current = false;

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

  const checkExportStatus = useCallback(async (date) => {
    if (!date) return;
    try {
      const res = await window.electronAPI.heatTreatment.checkExportFile(date);
      if (res && res.ok && res.exists) {
        setLastResult((prev) => ({
          ...(prev || {}),
          filePath: res.filePath,
          folderPath: res.folderPath,
          fileName: res.fileName,
        }));
      } else {
        setLastResult(null);
      }
    } catch (err) {
      setLastResult(null);
    }
  }, []);

  useEffect(() => {
    loadGrindingData(selectedDate);
    checkExportStatus(selectedDate);
  }, [selectedDate, loadGrindingData, checkExportStatus]);

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
        checkExportStatus(reportDate);
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
      const result = await printExcel(filePath, "heat-treatment");
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

  const handleDateChange = (newDate) => {
    isInitialLoad.current = false;
    setFallbackNote("");
    setSelectedDate(newDate);
  };

  const heatTreatmentToolbar = () => (
    <ReportToolbar
      leftCustomControls={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            inputProps={{ max: today }}
            sx={{
              width: 150,
              "& .MuiInputBase-root": {
                height: 36,
                borderRadius: "8px",
                fontSize: 14,
                bgcolor: "#fff",
              },
            }}
          />
          {fallbackNote && (
            <Tooltip title={fallbackNote} arrow placement="top">
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}>
                <WarningAmberRoundedIcon sx={{ fontSize: 16, color: "warning.main", cursor: "pointer" }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      }
      extraMenuItems={
        <MenuItem
          onClick={() => setShowPeriodSummaryDialog(true)}
          sx={{
            py: 1,
            gap: 1.5,
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#1E293B",
          }}
        >
          <SummarizeIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
          Tổng hợp kỳ
        </MenuItem>
      }
      onGenerate={handleGenerate}
      generating={generating}
      disableGenerate={!template || generating}
      generateLabel="Tạo Excel"
      onPrint={() => handlePrint(lastResult?.filePath)}
      printing={printing}
      disablePrint={!lastResult || !lastResult.filePath || generating || printing}
      printLabel="In"
      onOpenFolder={() => handleOpenFolder(lastResult?.filePath || lastResult?.folderPath)}
      disableOpenFolder={!lastResult || (!lastResult.filePath && !lastResult.folderPath) || generating}
      onRefresh={loadTemplate}
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

      <PeriodSummaryDialog
        open={showPeriodSummaryDialog}
        onClose={() => setShowPeriodSummaryDialog(false)}
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
