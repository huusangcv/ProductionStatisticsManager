import { useState, useCallback, useEffect } from "react";
import {
  Box, Card, Stack, Snackbar, Alert, Drawer, Typography, IconButton,
  Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import DataGridToolbarActions, { StandardButton } from "../../components/shared/DataGridToolbarActions";
import { viVNGridLocaleText } from "../../constants/dataGridLocale";

const GRID_SX = {
  border: "none",
  width: "100%",
  minWidth: 0,
  color: "#0F172A",
  "& .MuiDataGrid-columnHeaders": { bgcolor: "#F8FAFC", color: "#64748B", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #E2E8F0" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
  "& .MuiDataGrid-cell": { borderColor: "#E2E8F0" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
  "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #E2E8F0", minHeight: "48px" },
};

function StatusChip({ active }) {
  return active
    ? <Chip label="Hoạt động" size="small" color="success" sx={{ fontWeight: 600, borderRadius: "8px" }} />
    : <Chip label="Vô hiệu" size="small" color="default" sx={{ fontWeight: 600, borderRadius: "8px" }} />;
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value ?? "—"}</Typography>
    </Box>
  );
}

// ── Roles Page ──────────────────────────────────────────────────────────────
function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerItem, setDrawerItem] = useState(null);
  const [dialogItem, setDialogItem] = useState(null); // null = add, object = edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.roles.getAll();
      setRoles(data);
    } catch (e) {
      showSnackbar("Lỗi tải dữ liệu: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  // ── Dialog form state ──
  const [form, setForm] = useState({ code: "", name: "", description: "", sort_order: 0, is_active: 1 });
  const [formErrors, setFormErrors] = useState({});

  const openAdd = () => {
    setForm({ code: "", name: "", description: "", sort_order: roles.length + 1, is_active: 1 });
    setFormErrors({});
    setDialogItem(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setForm({ code: row.code, name: row.name, description: row.description || "", sort_order: row.sort_order, is_active: row.is_active });
    setFormErrors({});
    setDialogItem(row);
    setDialogOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = "Mã vai trò là bắt buộc";
    if (!form.name.trim()) errs.name = "Tên vai trò là bắt buộc";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload = { code: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim(), sort_order: Number(form.sort_order), is_active: form.is_active };
    let result;
    if (dialogItem) {
      result = await window.electronAPI.roles.update(dialogItem.id, payload);
    } else {
      result = await window.electronAPI.roles.create(payload);
    }
    if (result.ok) {
      showSnackbar(dialogItem ? "Cập nhật vai trò thành công" : "Thêm vai trò thành công");
      setDialogOpen(false);
      loadRoles();
      if (drawerItem?.id === dialogItem?.id) setDrawerItem(null);
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleDelete = async () => {
    const result = await window.electronAPI.roles.delete(deleteDialog.id);
    if (result.ok) {
      showSnackbar("Đã xóa vai trò");
      if (drawerItem?.id === deleteDialog.id) setDrawerItem(null);
      loadRoles();
    } else {
      showSnackbar(result.message, "error");
    }
    setDeleteDialog(null);
  };

  const columns = [
    { field: "code", headerName: "Mã", width: 140 },
    { field: "name", headerName: "Tên vai trò", flex: 1, minWidth: 160 },
    { field: "description", headerName: "Mô tả", flex: 1, minWidth: 200 },
    { field: "sort_order", headerName: "Thứ tự", width: 90, type: "number" },
    {
      field: "is_active",
      headerName: "Trạng thái",
      width: 130,
      renderCell: (p) => <StatusChip active={p.value === 1} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 90,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(p.row); }}><EditOutlinedIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog(p.row); }}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Card sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "8px", p: "16px 20px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <DataGrid
          localeText={viVNGridLocaleText}
          rows={roles}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          onRowDoubleClick={(p) => setDrawerItem(p.row)}
          slots={{
            toolbar: () => (
              <DataGridToolbarActions
                hasExport={true}
                rightActions={
                  <>
                    <StandardButton primary icon={<AddIcon />} label="Thêm vai trò" onClick={openAdd} />
                    <StandardButton primary={false} icon={<RefreshIcon />} label="Làm mới" onClick={() => { loadRoles(); showSnackbar("Dữ liệu đã được làm mới"); }} />
                  </>
                }
              />
            ),
          }}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          pageSizeOptions={[10, 20, 50, 100]}
          sx={GRID_SX}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={!!drawerItem} onClose={() => setDrawerItem(null)}
        PaperProps={{ sx: { width: 400, display: "flex", flexDirection: "column" } }}>
        {drawerItem && (
          <>
            <Box sx={{ p: 3, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Chi tiết vai trò</Typography>
              <IconButton onClick={() => setDrawerItem(null)} size="small"><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                <Chip label={drawerItem.code} color="primary" sx={{ fontWeight: 700, fontSize: 14, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{drawerItem.name}</Typography>
              </Box>
              <InfoRow label="Mã" value={drawerItem.code} />
              <Divider />
              <InfoRow label="Tên vai trò" value={drawerItem.name} />
              <Divider />
              <InfoRow label="Mô tả" value={drawerItem.description} />
              <Divider />
              <InfoRow label="Thứ tự sắp xếp" value={drawerItem.sort_order} />
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                <StatusChip active={drawerItem.is_active === 1} />
              </Box>
            </Box>
            <Box sx={{ p: 3, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" fullWidth startIcon={<EditOutlinedIcon />} onClick={() => { openEdit(drawerItem); }}>Sửa</Button>
                  <Button variant="outlined" color="error" fullWidth startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setDeleteDialog(drawerItem)}>Xóa</Button>
                </Stack>
              </Stack>
            </Box>
          </>
        )}
      </Drawer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{dialogItem ? "Cập nhật vai trò" : "Thêm vai trò mới"}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Mã vai trò *" value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            error={!!formErrors.code} helperText={formErrors.code}
            fullWidth disabled={!!dialogItem}
            slotProps={dialogItem ? { input: { readOnly: true, sx: { bgcolor: "#f8fafc" } } } : {}}
          />
          <TextField
            label="Tên vai trò *" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={!!formErrors.name} helperText={formErrors.name}
            fullWidth
          />
          <TextField
            label="Mô tả" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth multiline rows={2}
          />
          <TextField
            label="Thứ tự sắp xếp" type="number" value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
            fullWidth
          />
          <TextField
            select label="Trạng thái" value={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: Number(e.target.value) }))}
            fullWidth
          >
            <MenuItem value={1}>Hoạt động</MenuItem>
            <MenuItem value={0}>Vô hiệu</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary" variant="text">Hủy bỏ</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {dialogItem ? "Lưu thay đổi" : "Thêm vai trò"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa vai trò <b>{deleteDialog?.name}</b> không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} color="secondary">Hủy</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default RolesPage;
