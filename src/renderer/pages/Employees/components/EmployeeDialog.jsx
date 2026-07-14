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
  employee_name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "SĐT không hợp lệ").or(z.literal("")),
  department: z.enum(["Mài", "Cắt"]),
  role_code: z.enum(["Thống kê", "Trưởng ca", "Tổ trưởng", "Công nhân"]),
  status: z.enum(["Đang làm việc", "Nghỉ việc"]),
  hire_date: z.string().min(1, "Ngày vào làm là bắt buộc"),
});

function EmployeeDialog({ open, employee, onClose, onSave }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_code: "",
      employee_name: "",
      phone: "",
      department: "Mài",
      role_code: "Công nhân",
      status: "Đang làm việc",
      hire_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          employee_code: employee.employee_code || "",
          employee_name: employee.employee_name || "",
          phone: employee.phone || "",
          department: employee.department || "Mài",
          role_code: employee.role_code || "Công nhân",
          status: employee.status || "Đang làm việc",
          hire_date: employee.hire_date || new Date().toISOString().split("T")[0],
        });
      } else {
        reset({
          employee_code: `V${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
          employee_name: "",
          phone: "",
          department: "Mài",
          role_code: "Công nhân",
          status: "Đang làm việc",
          hire_date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, employee, reset]);

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
                      label="Mã NV"
                      error={!!errors.employee_code}
                      helperText={errors.employee_code?.message}
                      slotProps={{
                        input: { readOnly: true, sx: { bgcolor: "#f8fafc" } },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="employee_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Họ và tên"
                      error={!!errors.employee_name}
                      helperText={errors.employee_name?.message}
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
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Phòng ban"
                      error={!!errors.department}
                    >
                      <MenuItem value="Mài">Mài</MenuItem>
                      <MenuItem value="Cắt">Cắt</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="role_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Vai trò"
                      error={!!errors.role_code}
                    >
                      <MenuItem value="Thống kê">Thống kê</MenuItem>
                      <MenuItem value="Trưởng ca">Trưởng ca</MenuItem>
                      <MenuItem value="Tổ trưởng">Tổ trưởng</MenuItem>
                      <MenuItem value="Nhân viên">Nhân viên</MenuItem>
                      <MenuItem value="Công nhân">Công nhân</MenuItem>
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
