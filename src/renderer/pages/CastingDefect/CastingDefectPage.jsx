import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import ProductionDataGrid from "../../components/shared/ProductionDataGrid";
import { getGrindingDataGridColumns } from "../../../constants/grindingColumns";
import { usePrinters } from "../../hooks/usePrinters";

export default function CastingDefectPage() {
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { printExcel, printing } = usePrinters();

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const loadData = useCallback(async () => {
    if (!filterDate) return;
    setLoadingData(true);
    try {
      const rows = await window.electronAPI.grinding.getDefectsByDate(filterDate);
      setData(rows || []);
    } catch (err) {
      showSnackbar("Lỗi tải dữ liệu: " + err.message, "error");
    } finally {
      setLoadingData(false);
    }
  }, [filterDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setLastResult(null);
    try {
      const result = await window.electronAPI.castingDefect.generate(filterDate);
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

  const hasScrapData = data.length > 0;

  const customActions = (
    <>
      <Button
        variant="contained"
        startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
        onClick={handleGenerate}
        disabled={generating || !hasScrapData}
        sx={{
          height: 36,
          borderRadius: "8px",
          fontWeight: 600,
          textTransform: "none",
          px: 2,
        }}
      >
        {generating ? "Đang tạo..." : "Tạo File Báo Phế"}
      </Button>

      <Button
        variant="outlined"
        color="primary"
        startIcon={printing ? <CircularProgress size={16} /> : <PrintIcon />}
        onClick={handlePrint}
        disabled={printing || !lastResult?.filePath}
        sx={{
          height: 36,
          borderRadius: "8px",
          fontWeight: 600,
          textTransform: "none",
          px: 2,
          bgcolor: "#fff",
          "&:hover": {
            bgcolor: "#F8FAFC",
          },
        }}
      >
        {printing ? "Đang in..." : "In"}
      </Button>
    </>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* ── DataGrid ── */}
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
          columnSpec={getGrindingDataGridColumns()}
          data={data}
          isProcessing={loadingData}
          onRefresh={loadData}
          summaryMode="grinding"
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
          enableDragDrop={false}
          customActions={customActions}
        />
      </Card>

      {/* ── Success Dialog ── */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
      >
        <DialogTitle sx={{ bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" />
          <Typography fontWeight="bold">Tạo file thành công!</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            File Excel báo phế đã được tạo thành công tại:
          </Typography>
          <Box sx={{ bgcolor: "#F1F5F9", p: 1.5, borderRadius: "8px", mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              {lastResult?.filePath}
            </Typography>
          </Box>
          {!lastResult?.printConfigOk && (
            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
              Chưa lưu cấu hình trang in cho mẫu này. File sinh ra có thể chưa được căn lề chuẩn. Vui lòng vào Cài đặt → Excel Templates để cấu hình.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              window.electronAPI.castingDefect.openFolder(lastResult.folderPath);
            }}
            startIcon={<FolderOpenIcon />}
          >
            Mở thư mục
          </Button>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              window.electronAPI.castingDefect.openFile(lastResult.filePath);
            }}
            startIcon={<OpenInNewIcon />}
            variant="contained"
          >
            Mở file
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
