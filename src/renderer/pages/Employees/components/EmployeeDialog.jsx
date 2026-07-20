import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid2 as Grid,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  employee_code: z.string().min(1, "Mã NV là bắt buộc"),
  representative_code: z.string().min(1, "Mã đại diện là bắt buộc"),
  full_name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "SĐT không hợp lệ").or(z.literal("")),
  role_id: z.number({ required_error: "Vai trò là bắt buộc" }).min(1, "Vai trò là bắt buộc"),
  position_id: z.number({ required_error: "Chức vụ là bắt buộc" }).min(1, "Chức vụ là bắt buộc"),
  status: z.enum(["Đang làm việc", "Nghỉ việc"]),
  hire_date: z.string().min(1, "Ngày vào làm là bắt buộc"),
  note: z.string().optional(),
});

function EmployeeDialog({ open, employee, roles = [], positions = [], onClose, onSave }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_code: "",
      representative_code: "",
      full_name: "",
      phone: "",
      role_id: roles[0]?.id ?? 0,
      position_id: positions[0]?.id ?? 0,
      status: "Đang làm việc",
      hire_date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          employee_code: employee.employee_code || "",
          representative_code: employee.representative_code || "",
          full_name: employee.full_name || "",
          phone: employee.phone || "",
          role_id: employee.role_id || roles[0]?.id || 0,
          position_id: employee.position_id || positions[0]?.id || 0,
          status: employee.status || "Đang làm việc",
          hire_date: employee.hire_date || new Date().toISOString().split("T")[0],
          note: employee.note || "",
        });
      } else {
        reset({
          employee_code: `V${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
          representative_code: "",
          full_name: "",
          phone: "",
          role_id: roles[0]?.id || 0,
          position_id: positions[0]?.id || 0,
          status: "Đang làm việc",
          hire_date: new Date().toISOString().split("T")[0],
          note: "",
        });
      }
    }
  }, [open, employee, reset, roles, positions]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {employee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}
        >
          {/* Basic Info */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                textTransform: "uppercase",
                color: "primary.main",
                fontWeight: 700,
                mb: 2,
              }}
            >
              Thông tin cơ bản
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="employee_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Mã số nhân viên"
                      error={!!errors.employee_code}
                      helperText={errors.employee_code?.message}
                      slotProps={{
                        input: { readOnly: !!employee, sx: employee ? { bgcolor: "#f8fafc" } : {} },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="representative_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Mã đại diện *"
                      error={!!errors.representative_code}
                      helperText={errors.representative_code?.message || "Mã dùng trong file Excel Cắt/Mài"}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="full_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Họ và tên *"
                      error={!!errors.full_name}
                      helperText={errors.full_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Số điện thoại"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Work Info */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                textTransform: "uppercase",
                color: "primary.main",
                fontWeight: 700,
                mb: 2,
              }}
            >
              Thông tin công việc
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="role_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Vai trò *"
                      error={!!errors.role_id}
                      helperText={errors.role_id?.message}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {roles.filter(r => r.is_active === 1).map((role) => (
                        <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="position_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Chức vụ *"
                      error={!!errors.position_id}
                      helperText={errors.position_id?.message}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {positions.filter(p => p.is_active === 1).map((pos) => (
                        <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="hire_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Ngày vào làm"
                      slotProps={{ inputLabel: { shrink: true } }}
                      error={!!errors.hire_date}
                      helperText={errors.hire_date?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Trạng thái"
                      error={!!errors.status}
                    >
                      <MenuItem value="Đang làm việc">Đang làm việc</MenuItem>
                      <MenuItem value="Nghỉ việc">Nghỉ việc</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Ghi chú"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}
        >
          <Button onClick={onClose} color="secondary" variant="text">
            Hủy bỏ
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {employee ? "Lưu thay đổi" : "Thêm nhân viên"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EmployeeDialog;
