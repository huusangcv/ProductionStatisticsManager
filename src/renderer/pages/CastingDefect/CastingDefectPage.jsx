import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DataGrid } from "@mui/x-data-grid";
import { usePrinters } from "../../hooks/usePrinters";

const DEFECT_COLUMNS = [
  { field: "stt", headerName: "STT", width: 60 },
  { field: "work_order_number", headerName: "Mã Công Đơn", width: 160 },
  { field: "item_name", headerName: "Tên Sản Phẩm", flex: 1 },
  { field: "specification", headerName: "Quy Cách", width: 150 },
  {
    field: "scrap_quantity",
    headerName: "Số Phế (PCS)",
    width: 120,
    renderCell: (p) => (
      <Chip label={p.value} size="small" color={p.value > 0 ? "error" : "default"} />
    ),
  },
  { field: "unit_weight", headerName: "Đơn Giá (kg)", width: 120, type: "number" },
];

export default function CastingDefectPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [previewRows, setPreviewRows] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { printExcel, printing } = usePrinters();

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Load Template ───────────────────────────────────────────────────────────
  const loadTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const res = await window.electronAPI.template.get("casting-defect-return");
      setTemplate(res?.data || res);
    } catch (err) {
      showSnackbar("Lỗi tải template: " + err.message, "error");
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  // ── Load Defect Data ────────────────────────────────────────────────────────
  const loadData = useCallback(async (date) => {
    if (!date) return;
    setLoadingData(true);
    try {
      const result = await window.electronAPI.castingDefect.getByDate(date);
      const rows = (result?.rows || []).map((row, idx) => ({
        id: idx,
        stt: idx + 1,
        ...row,
      }));
      setPreviewRows(rows);
    } catch (err) {
      showSnackbar("Lỗi tải dữ liệu: " + err.message, "error");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    setLastResult(null);
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  // ── Generate Excel ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!template) {
      showSnackbar("Chưa cấu hình template. Vào Cài đặt → Excel Templates để upload file P-029-06.01.", "error");
      return;
    }
    setGenerating(true);
    setLastResult(null);
    try {
      const result = await window.electronAPI.castingDefect.generate(selectedDate);
      if (result.ok) {
        setLastResult(result);
        setShowSuccessDialog(true);
      } else {
        showSnackbar(result.message || "Tạo file thất bại.", "error");
      }
    } catch (err) {
      showSnackbar("Lỗi: " + err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  // ── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = async () => {
    if (!lastResult?.filePath) {
      showSnackbar("Chưa có file để in. Hãy tạo file trước.", "warning");
      return;
    }
    const result = await printExcel(lastResult.filePath, "casting-defect-return");
    if (result?.ok) {
      showSnackbar("Đã gửi lệnh in thành công.");
    } else {
      showSnackbar(result?.message || "Lỗi khi in.", "error");
    }
  };

  const hasScrapData = previewRows.length > 0;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 3, gap: 2, overflow: "hidden" }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Báo Phế — Xưởng Đúc
          </Typography>
          <Typography variant="body2" color="text.secondary">
            P-029-06.01 A3 — 铸造车间不良品回炉申请单
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            label="Ngày báo phế"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
            onClick={handleGenerate}
            disabled={generating || !hasScrapData || templateLoading}
          >
            {generating ? "Đang tạo..." : "Tạo File Excel"}
          </Button>

          <Button
            variant="outlined"
            startIcon={printing ? <CircularProgress size={16} /> : <PrintIcon />}
            onClick={handlePrint}
            disabled={printing || !lastResult?.filePath}
          >
            {printing ? "Đang in..." : "In"}
          </Button>
        </Box>
      </Box>

      {/* ── Template warning ── */}
      {!templateLoading && !template?.template_path && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          Chưa upload template P-029-06.01. Vào <strong>Cài đặt → Excel Templates</strong> để upload file mẫu.
        </Alert>
      )}



      {/* ── Summary cards ── */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Tổng dòng có phế</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              {previewRows.length}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Tổng PCS phế</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              {previewRows.reduce((s, r) => s + (Number(r.scrap_quantity) || 0), 0)}
            </Typography>
          </CardContent>
        </Card>
        {lastResult && (
          <Card variant="outlined" sx={{ flex: 1, borderColor: "success.main" }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="success.main">File đã tạo</Typography>
              <Typography variant="body2" noWrap fontWeight={500}>{lastResult.fileName}</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ── Data Grid ── */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <DataGrid
          rows={previewRows}
          columns={DEFECT_COLUMNS}
          loading={loadingData}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          rowHeight={44}
          sx={{
            height: "100%",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 1 }}>
                <Typography color="text.secondary">
                  Không có dữ liệu phế cho ngày {selectedDate}
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>

      {/* ── Success Dialog ── */}
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" />
          Tạo File Thành Công
        </DialogTitle>
        <DialogContent dividers>
          {lastResult && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography><strong>File:</strong> {lastResult.fileName}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{lastResult.filePath}</Typography>
              <Divider />
              <Typography>Số dòng: <strong>{lastResult.totalRows}</strong></Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            startIcon={<FolderOpenIcon />}
            onClick={() => { window.electronAPI.castingDefect.openFolder(lastResult.filePath); }}
          >
            Mở Thư Mục
          </Button>
          <Button
            startIcon={<OpenInNewIcon />}
            onClick={() => { window.electronAPI.castingDefect.openFile(lastResult.filePath); }}
          >
            Mở File
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={async () => { setShowSuccessDialog(false); await handlePrint(); }}
          >
            In Ngay
          </Button>
          <Button onClick={() => setShowSuccessDialog(false)} color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
