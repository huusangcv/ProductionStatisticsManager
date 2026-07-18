import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { useTemplates } from "../../../hooks/useTemplates";

const formatFileSize = (bytes) => {
  if (!bytes || typeof bytes !== "number" || bytes <= 0) return "—";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
};

const TemplateTab = () => {
  const {
    templates,
    loading,
    selectedTemplate,
    drawerOpen,
    confirmDialog,
    handleSelectTemplate,
    handleCloseDrawer,
    handleUpload,
    handleReplace,
    handlePreview,
    handleOpenFolder,
    handlePrintTest,
    handleDelete,
    handleRefresh,
    handleConfirmDialogClose,
  } = useTemplates();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("heat-treatment");

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    {
      field: "module",
      headerName: "Loại",
      width: 150,
      renderCell: (params) => {
        const value = params?.value || "";
        const label = value
          .replace("-", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return <Chip label={label} size="small" variant="outlined" />;
      },
    },
    {
      field: "template_name",
      headerName: "Tên File",
      flex: 1,
    },
    {
      field: "sheet_name",
      headerName: "Sheet",
      width: 120,
    },
    {
      field: "start_row",
      headerName: "Hàng Bắt Đầu",
      width: 150,
    },
    {
      field: "updated_at",
      headerName: "Ngày Cập Nhật",
      width: 200,
    },
    {
      field: "status",
      headerName: "Trạng Thái",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "active" ? "Active" : "Missing"}
          size="small"
          color={params.value === "active" ? "success" : "warning"}
          variant="outlined"
        />
      ),
    },
    {
      field: "file_size",
      headerName: "Kích Thước",
      width: 120,
      valueGetter: (params) => formatFileSize(params?.row?.file_size),
    },
  ];

  const rows = (templates || []).map((template) => ({
    id: template?.id || Math.random(),
    ...template,
  }));

  const handleUploadClick = async () => {
    setUploadDialogOpen(true);
  };

  const confirmUpload = async () => {
    setUploadDialogOpen(false);
    const result = await handleUpload(selectedModule);
    if (result.canceled) return;
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleReplaceClick = async () => {
    const result = await handleReplace();
    if (result.canceled) return;
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handlePreviewClick = async () => {
    const result = await handlePreview();
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleOpenFolderClick = async () => {
    const result = await handleOpenFolder();
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handlePrintTestClick = async () => {
    const result = await handlePrintTest();
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleDeleteClick = async () => {
    const result = await handleDelete();
    if (result.success) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleRefreshClick = async () => {
    const result = await handleRefresh();
    showSnackbar(result.message, "success");
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "hidden" }}>
      <Paper
        sx={{
          borderRadius: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Excel Templates
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={handleRefreshClick}
              disabled={loading}
            >
              Làm Mới
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadOutlinedIcon />}
              onClick={handleUploadClick}
              disabled={loading}
            >
              Upload
            </Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            onRowClick={(params) => handleSelectTemplate(params.row)}
            onRowDoubleClick={(params) => handleSelectTemplate(params.row)}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 20 },
              },
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            getRowId={(row) => row.id}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Drawer for Template Details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: 450,
            boxSizing: "border-box",
            p: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chi Tiết Template
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <CloseOutlinedIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />
        {selectedTemplate && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <InfoItem label="Tên File" value={selectedTemplate.template_name} />
            <InfoItem label="Loại" value={selectedTemplate.module} />
            <InfoItem label="Sheet" value={selectedTemplate.sheet_name} />
            <InfoItem
              label="Hàng Bắt Đầu"
              value={selectedTemplate.start_row?.toString()}
            />
            <InfoItem
              label="Đường Dẫn"
              value={selectedTemplate.template_path}
            />
            <InfoItem
              label="Ngày Upload"
              value={selectedTemplate.uploaded_at}
            />
            <InfoItem
              label="Ngày Cập Nhật"
              value={selectedTemplate.updated_at}
            />
            <InfoItem
              label="Kích Thước"
              value={formatFileSize(selectedTemplate.file_size)}
            />
            <InfoItem label="Checksum" value={selectedTemplate.checksum} />
            <InfoItem label="Trạng Thái" value={selectedTemplate.status} />
            <Box sx={{ display: "flex", gap: 1, mt: 3, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<VisibilityOutlinedIcon />}
                onClick={handlePreviewClick}
                disabled={loading}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SwapHorizOutlinedIcon />}
                onClick={handleReplaceClick}
                disabled={loading}
              >
                Thay Thế
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FolderOpenOutlinedIcon />}
                onClick={handleOpenFolderClick}
                disabled={loading}
              >
                Mở Thư Mục
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrintOutlinedIcon />}
                onClick={handlePrintTestClick}
                disabled={loading}
              >
                Print Test
              </Button>
              <Button
                variant="outlined"
                fullWidth
                color="error"
                startIcon={<DeleteOutlinedIcon />}
                onClick={handleDeleteClick}
                disabled={loading}
              >
                Xóa
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      >
        <DialogTitle>Upload Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Chọn loại template:
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
            >
              {[
                { value: "heat-treatment", label: "Xử Lý Nhiệt" },
                { value: "grinding", label: "Mài" },
                { value: "cutting", label: "Cắt" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={
                    selectedModule === option.value ? "contained" : "outlined"
                  }
                  onClick={() => setSelectedModule(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Hủy</Button>
          <Button onClick={confirmUpload} variant="contained">
            Chọn File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleConfirmDialogClose}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Hủy</Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm?.();
            }}
            variant="contained"
            autoFocus
          >
            Đồng Ý
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
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
    <Typography
      variant="body2"
      sx={{
        mt: 0.5,
        wordBreak: "break-all",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

export default TemplateTab;
