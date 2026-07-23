import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Snackbar,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { StandardButton } from "../../components/shared/DataGridToolbarActions";

export default function PersonalProductionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      showSnackbar("Vui lòng chọn đầy đủ Từ ngày và Đến ngày.", "warning");
      return;
    }
    
    if (startDate > endDate) {
      showSnackbar("Từ ngày không thể lớn hơn Đến ngày.", "warning");
      return;
    }

    setGenerating(true);
    setLastResult(null);

    try {
      const result = await window.electronAPI.personalProduction.generate({
        startDate,
        endDate
      });

      if (result.ok) {
        setLastResult(result);
        setShowSuccessDialog(true);
      } else {
        showSnackbar(result.message || "Tạo báo cáo thất bại.", "warning");
      }
    } catch (err) {
      showSnackbar("Lỗi hệ thống: " + err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenFolder = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.personalProduction.openFolder(filePath);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", p: 3 }}>
      <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
        <AssessmentIcon color="primary" />
        Sản lượng cá nhân
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Xuất file Excel báo cáo sản lượng cá nhân dựa trên dữ liệu CẮT và MÀI đã được Import.
      </Typography>

      <Card sx={{ maxWidth: 600, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, p: 4 }}>
          
          <Box sx={{ display: "flex", gap: 3 }}>
            <TextField
              label="Từ ngày"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: endDate || today }}
              fullWidth
            />
            
            <TextField
              label="Đến ngày"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate }}
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <StandardButton
              primary
              icon={generating ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
              label={generating ? "Đang xuất Excel..." : "Xuất Excel"}
              disabled={generating}
              onClick={handleGenerate}
              sx={{ flex: 1, height: 48, fontSize: "1rem" }}
            />
            <StandardButton
              primary={false}
              icon={<FolderOpenIcon />}
              label="Mở thư mục lưu"
              disabled={!lastResult || generating}
              onClick={() => handleOpenFolder(lastResult?.filePath)}
              sx={{ flex: 1, height: 48, fontSize: "1rem" }}
            />
          </Box>

        </CardContent>
      </Card>

      {/* Dialog Báo cáo Thành công */}
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: "success.main" }}>Xuất Excel thành công</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Đã lưu file: <b>{lastResult?.fileName}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Số dòng CẮT: {lastResult?.cuttingCount || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Số dòng MÀI: {lastResult?.grindingCount || 0}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessDialog(false)}>Đóng</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FolderOpenIcon />}
            onClick={() => {
              handleOpenFolder(lastResult?.filePath);
              setShowSuccessDialog(false);
            }}
          >
            Mở thư mục
          </Button>
        </DialogActions>
      </Dialog>

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
