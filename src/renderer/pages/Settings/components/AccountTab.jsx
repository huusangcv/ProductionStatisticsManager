import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { sharedDataGridSx } from "../../../constants/dataGridStyles";
import { useAccounts } from "../../../hooks/useAccounts";
import SettingsHeader from "./SettingsHeader";

const ROLE_OPTIONS = ["ADMIN", "STATISTIC"];
const ROLE_LABEL = { ADMIN: "Quản trị viên", STATISTIC: "Thống kê" };
const ROLE_COLOR = { ADMIN: "error", STATISTIC: "primary" };

// ─── Dialogs ─────────────────────────────────────────────────────────────────

function AddAccountDialog({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "", role: "STATISTIC" });
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.username.trim()) return setError("Tên đăng nhập không được để trống.");
    if (!form.password) return setError("Mật khẩu không được để trống.");
    if (form.password !== form.confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
    setError("");
    await onCreate({ username: form.username.trim(), password: form.password, role: form.role });
    setForm({ username: "", password: "", confirmPassword: "", role: "STATISTIC" });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Thêm tài khoản</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField
          label="Tên đăng nhập"
          value={form.username}
          onChange={handleChange("username")}
          size="small"
          fullWidth
          autoFocus
        />
        <TextField
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          size="small"
          fullWidth
        />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          size="small"
          fullWidth
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Vai trò</InputLabel>
          <Select value={form.role} label="Vai trò" onChange={handleChange("role")}>
            {ROLE_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {error && <Typography color="error" variant="caption">{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">Huỷ</Button>
        <Button onClick={handleSubmit} variant="contained">Tạo tài khoản</Button>
      </DialogActions>
    </Dialog>
  );
}

function ChangePasswordDialog({ open, account, onClose, onSave }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!password) return setError("Mật khẩu không được để trống.");
    if (password !== confirm) return setError("Mật khẩu xác nhận không khớp.");
    setError("");
    await onSave(account.id, password);
    setPassword("");
    setConfirm("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Đổi mật khẩu — {account?.username}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField
          label="Mật khẩu mới"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="small"
          fullWidth
          autoFocus
        />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          size="small"
          fullWidth
        />
        {error && <Typography color="error" variant="caption">{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">Huỷ</Button>
        <Button onClick={handleSubmit} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteConfirmDialog({ open, account, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Xóa tài khoản</DialogTitle>
      <DialogContent>
        <Typography>
          Bạn có chắc muốn xóa tài khoản <b>{account?.username}</b>?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">Huỷ</Button>
        <Button onClick={() => onConfirm(account.id)} variant="contained" color="error">Xóa</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── AccountTab ───────────────────────────────────────────────────────────────

const AccountTab = () => {
  const { accounts, loading, refresh, createAccount, changePassword, changeRole, removeAccount } = useAccounts();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [addOpen, setAddOpen] = useState(false);
  const [pwDialog, setPwDialog] = useState({ open: false, account: null });
  const [delDialog, setDelDialog] = useState({ open: false, account: null });
  const [searchValue, setSearchValue] = useState("");

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleCreate = useCallback(async (data) => {
    const result = await createAccount(data);
    if (result.ok) {
      setAddOpen(false);
      showSnackbar("Tạo tài khoản thành công!");
    } else {
      showSnackbar(result.message || "Lỗi khi tạo tài khoản.", "error");
    }
  }, [createAccount]);

  const handleChangePassword = useCallback(async (id, password) => {
    const result = await changePassword(id, password);
    if (result.ok) {
      setPwDialog({ open: false, account: null });
      showSnackbar("Đổi mật khẩu thành công!");
    } else {
      showSnackbar(result.message || "Lỗi khi đổi mật khẩu.", "error");
    }
  }, [changePassword]);

  const handleChangeRole = useCallback(async (id, role) => {
    const result = await changeRole(id, role);
    if (result.ok) {
      showSnackbar("Cập nhật vai trò thành công!");
    } else {
      showSnackbar(result.message || "Lỗi khi cập nhật vai trò.", "error");
    }
  }, [changeRole]);

  const handleDelete = useCallback(async (id) => {
    const result = await removeAccount(id);
    setDelDialog({ open: false, account: null });
    if (result.ok) {
      showSnackbar("Đã xóa tài khoản.");
    } else {
      showSnackbar(result.message || "Không thể xóa tài khoản.", "error");
    }
  }, [removeAccount]);

  const filteredAccounts = accounts.filter(
    (a) => !searchValue || a.username.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      field: "username",
      headerName: "Tên đăng nhập",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "role",
      headerName: "Vai trò",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={ROLE_LABEL[params.value] ?? params.value}
          color={ROLE_COLOR[params.value] ?? "default"}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "12px" }}
        />
      ),
    },
    {
      field: "updated_at",
      headerName: "Cập nhật lần cuối",
      width: 200,
      valueFormatter: (value) => {
        if (!value) return "—";
        return new Date(value + "Z").toLocaleString("vi-VN");
      },
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VpnKeyOutlinedIcon />}
            onClick={() => setPwDialog({ open: true, account: params.row })}
            sx={{ textTransform: "none", fontSize: "12px" }}
          >
            Đổi MK
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => setDelDialog({ open: true, account: params.row })}
            sx={{ textTransform: "none", fontSize: "12px" }}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%", overflow: "hidden" }}>
      <Box
        elevation={0}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
          p: "16px 20px",
          gap: "8px"
        }}
      >
        <Box sx={{ pb: 1 }}>
          <SettingsHeader
            onRefresh={refresh}
            isRefreshing={loading}
            primaryAction={{
              label: "Thêm tài khoản",
              icon: <AddOutlinedIcon />,
              onClick: () => setAddOpen(true),
              variant: "contained",
            }}
            searchValue={searchValue}
            onSearchChange={(e) => setSearchValue(e.target.value)}
            searchPlaceholder="Tìm kiếm tài khoản..."
            rowCountText={`${filteredAccounts.length} tài khoản`}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <DataGrid
            density="compact"
            rows={filteredAccounts}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            sx={{
              ...sharedDataGridSx,
              border: 0,
              bgcolor: "white",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover" },
            }}
          />
        </Box>
      </Box>

      {/* Dialogs */}
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} onCreate={handleCreate} />
      <ChangePasswordDialog
        open={pwDialog.open}
        account={pwDialog.account}
        onClose={() => setPwDialog({ open: false, account: null })}
        onSave={handleChangePassword}
      />
      <DeleteConfirmDialog
        open={delDialog.open}
        account={delDialog.account}
        onClose={() => setDelDialog({ open: false, account: null })}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountTab;
