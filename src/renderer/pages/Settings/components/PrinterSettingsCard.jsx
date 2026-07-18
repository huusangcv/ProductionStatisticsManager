import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { usePrinters } from "../../../hooks/usePrinters";

export default function PrinterSettingsCard() {
  const {
    windowsPrinters,
    defaultPrinter,
    loading,
    printing,
    fetchPrinters,
    saveDefaultPrinter,
    checkPrinterStatus,
    printTestPage,
  } = usePrinters();
  
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [printerStatus, setPrinterStatus] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (defaultPrinter) {
      setSelectedPrinter(defaultPrinter.printer_name);
    }
  }, [defaultPrinter]);

  const handleRefresh = async () => {
    await fetchPrinters();
    setSnackbar({
      open: true,
      message: "Đã làm mới danh sách máy in",
      severity: "success",
    });
  };

  const handleSave = async () => {
    const result = await saveDefaultPrinter(selectedPrinter);
    if (result.ok) {
      setSnackbar({
        open: true,
        message: "Đã lưu máy in mặc định",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Lưu thất bại",
        severity: "error",
      });
    }
  };

  const handleCheckStatus = async () => {
    if (!selectedPrinter) return;
    const status = await checkPrinterStatus(selectedPrinter);
    setPrinterStatus(status);
    setSnackbar({
      open: true,
      message: status ? "Máy in trực tuyến" : "Máy in ngoại tuyến",
      severity: status ? "success" : "warning",
    });
  };

  const handlePrintTest = async () => {
    // We need a test file - for now let's just show a message
    setSnackbar({
      open: true,
      message: "Chọn một file Excel để in thử",
      severity: "info",
    });
  };

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <PrintOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Cấu hình máy in
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Quản lý máy in mặc định
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Máy in mặc định</InputLabel>
            <Select
              value={selectedPrinter}
              label="Máy in mặc định"
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={loading}
            >
              {windowsPrinters.map((printer) => (
                <MenuItem key={printer.name} value={printer.name}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography>{printer.name}</Typography>
                    {printer.isDefault && (
                      <Chip
                        label="Mặc định"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {printerStatus !== null && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {printerStatus ? (
                <CheckCircleOutlinedIcon color="success" />
              ) : (
                <CheckCircleOutlinedIcon color="warning" />
              )}
              <Typography variant="body2" color="text.secondary">
                Trạng thái: {printerStatus ? "Trực tuyến" : "Ngoại tuyến"}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshOutlinedIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              onClick={handleCheckStatus}
              disabled={loading || !selectedPrinter}
            >
              Kiểm tra trạng thái
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !selectedPrinter}
            >
              Lưu
            </Button>
            <Button
              variant="outlined"
              startIcon={printing ? <CircularProgress size={16} /> : <PrintOutlinedIcon />}
              onClick={handlePrintTest}
              disabled={loading || printing || !selectedPrinter}
            >
              In thử
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
