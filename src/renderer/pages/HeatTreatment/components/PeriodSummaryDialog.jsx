/**
 * PeriodSummaryDialog.jsx — Dialog chọn kỳ và generate file tổng hợp Hàng XLN.
 */
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import SummarizeIcon from "@mui/icons-material/Summarize";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function PeriodSummaryDialog({ open, onClose }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | { ok, filePath, folderPath, fileName, recordCount, message }

  const periodLabel = () => {
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const curM = String(month).padStart(2, "0");
    const pM = String(prevM).padStart(2, "0");
    return `Kỳ tháng ${curM}/${year} (26/${pM}/${prevY} → 25/${curM}/${year})`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await window.electronAPI.heatTreatment.generatePeriodSummary({
        periodYear: year,
        periodMonth: month,
      });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, message: "Lỗi hệ thống: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    if (!result?.folderPath) return;
    await window.electronAPI.heatTreatment.openFolder(result.folderPath);
  };

  const handleOpenFile = async () => {
    if (!result?.filePath) return;
    await window.electronAPI.heatTreatment.openFile(result.filePath);
  };

  const handleClose = () => {
    if (loading) return;
    setResult(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SummarizeIcon sx={{ color: "primary.main", fontSize: 22 }} />
          Xuất file tổng hợp kỳ
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Chọn tháng/năm */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 1, alignItems: "center" }}>
          <TextField
            label="Tháng"
            type="number"
            size="small"
            value={month}
            onChange={(e) => {
              const v = Math.min(12, Math.max(1, Number(e.target.value)));
              setMonth(v);
              setResult(null);
            }}
            inputProps={{ min: 1, max: 12 }}
            sx={{ width: 100 }}
          />
          <TextField
            label="Năm"
            type="number"
            size="small"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setResult(null);
            }}
            inputProps={{ min: 2020, max: 2099 }}
            sx={{ width: 120 }}
          />
        </Box>

        {/* Hiển thị kỳ */}
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontStyle: "italic" }}>
          {periodLabel()}
        </Typography>

        {/* Kết quả */}
        {result && result.ok && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            sx={{ borderRadius: "10px", mb: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Xuất thành công!
            </Typography>
            <Typography variant="caption" sx={{ display: "block" }}>
              File: {result.fileName}
            </Typography>
            <Typography variant="caption" sx={{ display: "block" }}>
              Số ngày có dữ liệu: {result.recordCount}
            </Typography>
          </Alert>
        )}
        {result && !result.ok && (
          <Alert severity="error" sx={{ borderRadius: "10px", mb: 1 }}>
            {result.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {result?.ok && (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderOpenIcon />}
              onClick={handleOpenFolder}
              sx={{ borderRadius: "8px", textTransform: "none" }}
            >
              Mở thư mục
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenFile}
              sx={{ borderRadius: "8px", textTransform: "none" }}
            >
              Mở file
            </Button>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          onClick={handleClose}
          disabled={loading}
          sx={{ borderRadius: "8px", textTransform: "none" }}
        >
          Đóng
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleGenerate}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : <SummarizeIcon />
          }
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
        >
          {loading ? "Đang tạo..." : "Tạo file"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
