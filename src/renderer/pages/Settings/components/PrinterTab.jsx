import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { usePrinters } from "../../../hooks/usePrinters";

const PrinterTab = () => {
  const {
    printers,
    defaultPrinter,
    loading,
    printing,
    refreshPrinters,
    saveDefaultPrinter,
    checkPrinter,
    printTestPage,
  } = usePrinters();

  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const columns = [
    {
      field: "name",
      headerName: "Tên máy in",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "driver",
      headerName: "Driver",
      width: 180,
    },
    {
      field: "port",
      headerName: "Port",
      width: 150,
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params) => {
        let color = "default";
        if (params.value === "Online") color = "success";
        if (params.value === "Offline") color = "warning";
        if (params.value === "Error") color = "error";
        return (
          <Chip
            label={params.value || "Unknown"}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    {
      field: "isDefault",
      headerName: "Mặc định",
      width: 120,
      renderCell: (params) => {
        const isSelectedDefault =
          defaultPrinter?.printer_name === params.row.name;
        return isSelectedDefault ? (
          <Chip
            label="Mặc định"
            size="small"
            color="primary"
            variant="filled"
          />
        ) : (
          <Chip label="Không" size="small" variant="outlined" />
        );
      },
    },
  ];

  const rows = printers.map((p, idx) => ({
    id: idx,
    ...p,
  }));

  const handleSelectPrinter = (params) => {
    setSelectedPrinter(params.row);
    setCheckResult(null);
  };

  const handleSaveDefault = async () => {
    if (!selectedPrinter) return;
    const result = await saveDefaultPrinter(selectedPrinter.name);
    if (result.ok) {
      setSnackbar({
        open: true,
        message: "Đã lưu máy in mặc định!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Lỗi khi lưu máy in mặc định!",
        severity: "error",
      });
    }
  };

  const handleCheckPrinter = async () => {
    if (!selectedPrinter) return;
    const result = await checkPrinter(selectedPrinter.name);
    setCheckResult(result);
  };

  const handlePrintTest = async () => {
    if (!selectedPrinter) return;
    const result = await printTestPage(selectedPrinter.name);
    if (result.ok) {
      setSnackbar({
        open: true,
        message: result.message || "Đã gửi trang in thử nghiệm!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Lỗi khi in thử nghiệm!",
        severity: "error",
      });
    }
  };

  const handleRefresh = async () => {
    await refreshPrinters();
    setCheckResult(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "hidden" }}>
      <Grid container spacing={3} sx={{ height: "100%" }}>
        <Grid item xs={12} md={6} sx={{ height: "100%" }}>
          <Paper
            sx={{
              borderRadius: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Danh sách máy in
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                onRowClick={handleSelectPrinter}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                sx={{ border: "none" }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} sx={{ height: "100%" }}>
          <Paper
            sx={{ borderRadius: 2, height: "100%", p: 3, overflow: "auto" }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Thông tin máy in
            </Typography>
            {selectedPrinter ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <InfoItem label="Tên máy in" value={selectedPrinter.name} />
                <InfoItem
                  label="Driver"
                  value={selectedPrinter.driver || "Không xác định"}
                />
                <InfoItem
                  label="Port"
                  value={selectedPrinter.port || "Không xác định"}
                />
                <InfoItem
                  label="Trạng thái"
                  value={
                    <Chip
                      label={selectedPrinter.status || "Unknown"}
                      size="small"
                      color={
                        selectedPrinter.status === "Online"
                          ? "success"
                          : selectedPrinter.status === "Offline"
                            ? "warning"
                            : selectedPrinter.status === "Error"
                              ? "error"
                              : "default"
                      }
                      variant="outlined"
                    />
                  }
                />
                <InfoItem
                  label="Mặc định"
                  value={
                    defaultPrinter?.printer_name === selectedPrinter.name
                      ? "Có"
                      : "Không"
                  }
                />

                {checkResult && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Kết quả kiểm tra:
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <CheckItem
                        label="Tìm thấy máy in"
                        ok={checkResult.printerFound}
                      />
                      <CheckItem label="Driver OK" ok={checkResult.driverOk} />
                      <CheckItem label="Port OK" ok={checkResult.portOk} />
                      <CheckItem label="Sẵn sàng" ok={checkResult.ready} />
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshOutlinedIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Làm mới
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSaveDefault}
                    disabled={
                      loading ||
                      defaultPrinter?.printer_name === selectedPrinter.name
                    }
                  >
                    Lưu mặc định
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircleOutlinedIcon />}
                    onClick={handleCheckPrinter}
                    disabled={loading}
                  >
                    Kiểm tra
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PrintOutlinedIcon />}
                    onClick={handlePrintTest}
                    disabled={printing || loading}
                  >
                    {printing ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : null}
                    In thử
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 8 }}
              >
                Chọn một máy in để xem chi tiết
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const InfoItem = ({ label, value }) => (
  <Box sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>
      {typeof value === "string" ? (
        <Typography variant="body2">{value}</Typography>
      ) : (
        value
      )}
    </Box>
  </Box>
);

const CheckItem = ({ label, ok }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {ok ? (
      <CheckCircleOutlinedIcon color="success" fontSize="small" />
    ) : (
      <CheckCircleOutlinedIcon color="error" fontSize="small" />
    )}
    <Typography variant="body2" color={ok ? "success.main" : "error.main"}>
      {label}: {ok ? "✓" : "✗"}
    </Typography>
  </Box>
);

export default PrinterTab;
