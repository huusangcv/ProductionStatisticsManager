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
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useTemplateTypes } from "../../../hooks/useTemplateTypes";

const TemplateTypeTab = () => {
  const { types, loading, createType, updateType, deleteType } = useTemplateTypes();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    display_order: 0,
    is_active: 1,
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditMode(true);
      setCurrentId(type.id);
      setFormData({
        name: type.name,
        code: type.code,
        description: type.description || "",
        display_order: type.display_order || 0,
        is_active: type.is_active,
      });
    } else {
      setEditMode(false);
      setCurrentId(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        display_order: 0,
        is_active: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      showSnackbar("Tên và mã loại không được để trống", "error");
      return;
    }

    const payload = { ...formData, display_order: Number(formData.display_order) };
    
    let result;
    if (editMode) {
      result = await updateType(currentId, payload);
    } else {
      result = await createType(payload);
    }

    if (result.success) {
      showSnackbar(editMode ? "Cập nhật thành công" : "Thêm mới thành công");
      handleCloseDialog();
    } else {
      showSnackbar(result.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại template này?")) {
      const result = await deleteType(id);
      if (result.success) {
        showSnackbar("Xóa thành công");
      } else {
        showSnackbar(result.message || "Có lỗi xảy ra khi xóa", "error");
      }
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Tên Loại", flex: 1 },
    { field: "code", headerName: "Mã (Code)", flex: 1 },
    { field: "description", headerName: "Mô tả", flex: 1.5 },
    { field: "display_order", headerName: "Thứ tự", width: 100 },
    {
      field: "is_active",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Hoạt động" : "Tạm dừng"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(params.row)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">
          Quản Lý Loại Template Excel
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Loại Mới
        </Button>
      </Box>

      <Paper sx={{ flex: 1, overflow: "hidden" }}>
        <DataGrid
          rows={types}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          rowHeight={50}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "background.default",
              borderBottom: 1,
              borderColor: "divider",
            },
          }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Cập Nhật Loại Template" : "Thêm Loại Template Mới"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Tên Loại"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Mã (Code) - Không dấu, viết liền"
            name="code"
            value={formData.code}
            onChange={handleChange}
            fullWidth
            required
            disabled={editMode} // Không cho sửa code khi đã tạo để tránh lỗi liên kết
          />
          <TextField
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Thứ tự hiển thị"
            name="display_order"
            type="number"
            value={formData.display_order}
            onChange={handleChange}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active === 1}
                onChange={handleChange}
                name="is_active"
              />
            }
            label="Đang hoạt động"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Lưu Thay Đổi" : "Tạo Mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateTypeTab;
