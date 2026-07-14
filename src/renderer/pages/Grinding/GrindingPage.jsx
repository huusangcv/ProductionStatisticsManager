import { useState, useEffect } from "react";
import { Box, Snackbar, Alert, Typography } from "@mui/material";
import GrindingDataGrid from "./components/GrindingDataGrid";

function GrindingPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await window.electronAPI.grinding.getAll();
      setData(records);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      showSnackbar("Lỗi khi tải dữ liệu: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await loadData();
    showSnackbar("Dữ liệu đã được làm mới");
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.grinding.import();
      if (result.ok) {
        showSnackbar(`Đã import thành công ${result.insertedCount} dòng dữ liệu.`);
        loadData();
      } else if (result.message !== "Đã hủy chọn file.") {
        showSnackbar(result.message, "error");
      }
    } catch (error) {
      showSnackbar("Lỗi khi import: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
        <GrindingDataGrid
          data={data}
          onImport={handleImport}
          onRefresh={handleRefresh}
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

export default GrindingPage;
