import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import GenerationSummaryCard from "./components/GenerationSummaryCard";
import HeatTreatmentToolbar from "./components/HeatTreatmentToolbar";
import { HEAT_TREATMENT_PREVIEW_COLUMNS } from "../../../constants/heatTreatmentColumns";

// ── DataGrid locale text ───────────────────────────────────────────────────────

const viVNGridLocaleText = {
  noRowsLabel: "Không có dữ liệu. Chọn ngày có dữ liệu Mài để xem trước.",
  MuiTablePagination: {
    labelRowsPerPage: "Số dòng mỗi trang:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} trong ${count !== -1 ? count : `nhiều hơn ${to}`}`,
  },
};

// ── HeatTreatmentPage ─────────────────────────────────────────────────────────

export default function HeatTreatmentPage() {
  // ── State ─────────────────────────────────────────────────────────────────

  // Today in YYYY-MM-DD (native date input format)
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [grindingRows, setGrindingRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null); // last generate result
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Load template ─────────────────────────────────────────────────────────

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

  // ── Load grinding data for selected date (preview) ────────────────────────

  const loadGrindingData = useCallback(async (date) => {
    if (!date) return;
    try {
      // Convert YYYY-MM-DD to DD/MM/YYYY to match grinding_production.report_date
      const [y, m, d] = date.split("-");
      const reportDate = `${d}/${m}/${y}`;
      const rows = await window.electronAPI.heatTreatment.getGrindingByDate(reportDate);
      setGrindingRows(rows || []);

      // Build preview rows (simple mapping — same fields as the rules engine)
      const mapped = (rows || []).map((row, idx) => ({
        id: idx,
        stt: idx + 1,
        report_date: row.report_date,
        work_order_number: row.work_order_number,
        material_code: row.material_code,
        item_name: row.item_name,
        specification: row.specification,
        employee_name: row.employee_name,
        completed_quantity: row.completed_quantity,
        scrap_quantity: row.scrap_quantity,
        completed_weight: row.completed_weight,
        classification: classifyLocal(row),
      }));
      setPreviewRows(mapped);
    } catch (err) {
      showSnackbar("Lỗi tải dữ liệu: " + err.message, "error");
    }
  }, []);

  useEffect(() => {
    setLastResult(null); // clear summary when date changes
    loadGrindingData(selectedDate);
  }, [selectedDate, loadGrindingData]);

  // ── Local classification (mirrors heatTreatmentRules.js) ─────────────────
  // Used only for preview coloring — actual classification is done server-side.

  function classifyLocal(row) {
    const kws = ["XLN", "XỬ LÝ NHIỆT", "NHIỆT LUYỆN", "HT", "HARDENED"];
    const name = (row.item_name || "").toUpperCase();
    const spec = (row.specification || "").toUpperCase();
    return kws.some((k) => name.includes(k) || spec.includes(k)) ? "XLN" : "NO";
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    setLastResult(null);

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [y, m, d] = selectedDate.split("-");
    const reportDate = `${d}/${m}/${y}`;

    try {
      const result = await window.electronAPI.heatTreatment.generate({ reportDate });
      if (result.ok) {
        setLastResult(result);
        showSnackbar(`Xuất thành công: ${result.fileName}`);
      } else {
        showSnackbar(result.message || "Tạo file thất bại.", "error");
      }
    } catch (err) {
      showSnackbar("Lỗi hệ thống: " + err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  // ── Open folder / file / print ────────────────────────────────────────────

  const handleOpenFolder = async (folderPath) => {
    if (!folderPath) return;
    await window.electronAPI.heatTreatment.openFolder(folderPath);
  };

  const handleOpenFile = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.heatTreatment.openFile(filePath);
  };

  const handlePrint = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.heatTreatment.print(filePath);
    showSnackbar("Đã gửi lệnh in.");
  };

  // ── Summary counts ────────────────────────────────────────────────────────

  const xlnCount = previewRows.filter((r) => r.classification === "XLN").length;
  const noCount = previewRows.filter((r) => r.classification === "NO").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", minHeight: 0 }}>
      {/* ── Generation summary (shown after successful generate) ── */}
      {lastResult && (
        <GenerationSummaryCard
          result={lastResult}
          onOpenFolder={handleOpenFolder}
          onOpenFile={handleOpenFile}
          onPrint={handlePrint}
        />
      )}

      {/* ── Data preview grid ── */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            height: "100%",
            width: "100%",
            bgcolor: "#FFFFFF",
            borderRadius: "18px",
            overflow: "hidden",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
          }}
        >
          <DataGrid
            rows={previewRows}
            columns={HEAT_TREATMENT_PREVIEW_COLUMNS}
            localeText={viVNGridLocaleText}
            disableRowSelectionOnClick
            density="compact"
            slots={{
              toolbar: () => (
                <HeatTreatmentToolbar
                  hasTemplate={!!template}
                  hasResult={!!lastResult}
                  lastFilePath={lastResult?.filePath}
                  lastFolderPath={lastResult?.folderPath}
                  generating={generating}
                  onGenerate={handleGenerate}
                  onPrint={handlePrint}
                  onOpenFolder={handleOpenFolder}
                  onRefreshTemplate={loadTemplate}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  today={today}
                  totalCount={previewRows.length}
                  xlnCount={xlnCount}
                  noCount={noCount}
                />
              )
            }}
            initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
            pageSizeOptions={[25, 50, 100]}
            sx={{
              border: "none",
              color: "#0F172A",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#F8FAFC",
                color: "#64748B",
                fontWeight: 600,
                fontSize: 12,
                borderBottom: "1px solid #E2E8F0",
              },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
              "& .MuiDataGrid-cell": { borderColor: "#E2E8F0", fontSize: 12 },
              "& .MuiDataGrid-cell:focus-within": { outline: "none" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #E2E8F0" },
            }}
          />
        </Box>
      </Box>

      {/* ── Snackbar ── */}
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
