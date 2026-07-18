import { useState, useCallback } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { grey } from "@mui/material/colors";
import { useTemplates } from "../../../hooks/useTemplates";
import TemplateDetailPanel from "./TemplateDetailPanel";

export default function TemplateDataGrid() {
  const { templates, loading, fetchTemplates, deleteTemplate } = useTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleRefresh = async () => {
    await fetchTemplates();
    setSnackbar({
      open: true,
      message: "Đã làm mới danh sách template",
      severity: "success",
    });
  };

  const handlePreview = useCallback(async (template) => {
    await window.electronAPI.template.preview(template.module);
  }, []);

  const handleOpenFolder = useCallback(async (template) => {
    await window.electronAPI.heatTreatment.openFolder(template.template_path);
  }, []);

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    const result = await deleteTemplate(templateToDelete.module);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
    if (result.ok) {
      setSnackbar({
        open: true,
        message: "Đã xóa template",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Xóa thất bại",
        severity: "error",
      });
    }
  };

  const columns = [
    {
      field: "module",
      headerName: "Loại",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "template_name",
      headerName: "Tên Template",
      flex: 1,
    },
    {
      field: "sheet_name",
      headerName: "Sheet",
      width: 120,
    },
    {
      field: "start_row",
      headerName: "Hàng bắt đầu",
      width: 120,
    },
    {
      field: "updated_at",
      headerName: "Ngày cập nhật",
      width: 180,
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "active" ? "Hoạt động" : "Thiếu"}
          size="small"
          color={params.value === "active" ? "success" : "warning"}
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon />}
            onClick={() => handlePreview(params.row)}
          >
            Xem trước
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderOpenOutlinedIcon />}
            onClick={() => handleOpenFolder(params.row)}
          >
            Mở thư mục
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => handleDeleteClick(params.row)}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  const rows = templates.map((template) => ({
    id: template.id,
    ...template,
  }));

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StorageOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Quản lý Excel Templates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quản lý các file Excel template dùng để xuất báo cáo
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
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
              startIcon={<UploadOutlinedIcon />}
              // We'll add upload logic later - for now just show existing button
            >
              Tải lên
            </Button>
          </Box>
        </Box>
        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            getRowHeight={() => 60}
            onRowClick={(params) => setSelectedTemplateId(params.id)}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 20, 50]}
            getDetailPanelContent={({ row }) => <TemplateDetailPanel template={row} />}
            getDetailPanelHeight={() => "auto"}
            sx={{
              [`& .${gridClasses.row}`]: {
                bgcolor: (theme) => (theme.palette.mode === "light" ? grey[50] : grey[900]),
              },
            }}
          />
        </Box>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa template {templateToDelete?.template_name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

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
