import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  LinearProgress,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

const viVNGridLocaleText = {
  toolbarColumns: "Cột",
  toolbarFilters: "Bộ lọc",
  noRowsLabel: "Không có dữ liệu",
  MuiTablePagination: {
    labelRowsPerPage: "Số dòng mỗi trang:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} trong ${count !== -1 ? count : `nhiều hơn ${to}`}`,
  },
};

// ── SheetGrid ─────────────────────────────────────────────────────────────────

function SheetGrid({ sheetData }) {
  if (!sheetData) return null;

  const { headers, rows } = sheetData;

  // Build DataGrid columns from header row
  const columns = headers.map((h, idx) => ({
    field: `col_${idx}`,
    headerName: h || `Cột ${idx + 1}`,
    width: 140,
    flex: idx === 0 ? undefined : 1,
    minWidth: 80,
    sortable: false,
  }));

  // Build DataGrid rows from data rows
  const gridRows = rows.map((row, rIdx) => {
    const obj = { id: rIdx };
    headers.forEach((_, cIdx) => {
      obj[`col_${cIdx}`] = row[cIdx] ?? "";
    });
    return obj;
  });

  if (columns.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Sheet trống hoặc không có dữ liệu.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 440, width: "100%" }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
        localeText={viVNGridLocaleText}
        disableRowSelectionOnClick
        disableColumnMenu
        density="compact"
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#F8FAFC",
            fontWeight: 600,
            fontSize: 12,
          },
          "& .MuiDataGrid-cell": { fontSize: 12 },
          "& .MuiDataGrid-cell:focus-within": { outline: "none" },
        }}
      />
    </Box>
  );
}

// ── TemplatePreviewDialog ─────────────────────────────────────────────────────

export default function TemplatePreviewDialog({ open, module, onClose }) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [previewData, setPreviewData] = useState(null); // { sheetNames, sheets }
  const [activeSheet, setActiveSheet] = useState(0);

  const loadPreview = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.template.preview(module);
      if (!result.ok) {
        setError(result.message || "Không thể đọc template.");
      } else {
        setPreviewData(result);
        setActiveSheet(0);
      }
    } catch (err) {
      setError("Lỗi hệ thống: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [open, module]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleClose = () => {
    setPreviewData(null);
    setError(null);
    onClose();
  };

  const currentSheetName = previewData?.sheetNames?.[activeSheet];
  const currentSheetData = currentSheetName ? previewData?.sheets?.[currentSheetName] : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: "80vh" } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 1, pb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Preview Template
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chỉ xem — không thể chỉnh sửa
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {loading && <LinearProgress />}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {previewData && (
          <>
            {/* Sheet Tabs */}
            {previewData.sheetNames.length > 1 && (
              <Tabs
                value={activeSheet}
                onChange={(_, v) => setActiveSheet(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
              >
                {previewData.sheetNames.map((name) => (
                  <Tab key={name} label={name} sx={{ fontSize: 12 }} />
                ))}
              </Tabs>
            )}

            {previewData.sheetNames.length === 1 && (
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary">
                  Sheet: <strong>{previewData.sheetNames[0]}</strong>
                </Typography>
              </Box>
            )}

            {/* Grid */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              <SheetGrid sheetData={currentSheetData} />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={handleClose} variant="outlined" size="small">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
