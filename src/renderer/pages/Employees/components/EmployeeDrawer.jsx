import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusChip from "./EmployeeStatusChip";

function InfoRow({ label, value, valueColor = "text.primary" }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: valueColor, textAlign: "right", maxWidth: "60%" }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

function EmployeeDrawer({
  open,
  employee,
  onClose,
  onEdit,
  onDelete,
  onDeactivate,
}) {
  if (!employee) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 420, display: "flex", flexDirection: "column" },
      }}
    >
      <Box sx={{ p: 3, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Thông tin chi tiết</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Avatar + Name */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
          <EmployeeAvatar name={employee.full_name} size={80} status={employee.status} />
          <Box>
            <Typography variant="h6">{employee.full_name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{employee.employee_code}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Mã đại diện: <b>{employee.representative_code}</b>
            </Typography>
            <EmployeeStatusChip status={employee.status} />
          </Box>
        </Box>

        {/* Work Info */}
        <Box>
          <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", mb: 1, fontWeight: 700 }}>
            Công việc
          </Typography>
          <InfoRow label="Vai trò" value={employee.role_name} />
          <Divider />
          <InfoRow label="Chức vụ" value={employee.position_name} />
          <Divider />
          <InfoRow label="Ngày vào làm" value={employee.hire_date} />
        </Box>

        {/* Personal Info */}
        <Box>
          <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", mb: 1, fontWeight: 700 }}>
            Cá nhân
          </Typography>
          <InfoRow label="Số điện thoại" value={employee.phone} />
        </Box>

        {/* Note */}
        {employee.note && (
          <Box>
            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", mb: 1, fontWeight: 700 }}>
              Ghi chú
            </Typography>
            <Typography variant="body2" color="text.primary">{employee.note}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 3, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" fullWidth startIcon={<EditIcon />} onClick={() => onEdit(employee)}>
              Sửa
            </Button>
            <Button variant="outlined" color="warning" fullWidth startIcon={<PersonOffIcon />} onClick={() => onDeactivate(employee)}>
              Ngưng HĐ
            </Button>
          </Stack>
          <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={() => onDelete(employee)}>
            Xóa nhân viên
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

export default EmployeeDrawer;
