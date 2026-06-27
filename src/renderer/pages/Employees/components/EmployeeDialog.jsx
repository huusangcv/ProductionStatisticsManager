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
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  id: z.string().min(1, "Mã NV là bắt buộc"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "SĐT không hợp lệ"),
  gender: z.enum(["Nam", "Nữ"]),
  address: z.string().optional(),
  department: z.enum(["Mài", "Cắt"]),
  role: z.enum(["Thống kê", "Trưởng ca", "Tổ trưởng", "Công nhân"]),
  shift: z.enum(["Ca 1", "Ca 2", "Ca 3", "Hành chính"]),
  status: z.enum(["Đang làm việc", "Nghỉ việc"]),
  joinDate: z.string().min(1, "Ngày vào làm là bắt buộc"),
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
      id: "",
      fullName: "",
      phone: "",
      gender: "Nam",
      address: "",
      department: "Mài",
      role: "Công nhân",
      shift: "Hành chính",
      status: "Đang làm việc",
      joinDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          ...employee,
        });
      } else {
        reset({
          id: `EMP${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`,
          fullName: "",
          phone: "",
          gender: "Nam",
          address: "",
          department: "Mài",
          role: "Công nhân",
          shift: "Hành chính",
          status: "Đang làm việc",
          joinDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, employee, reset]);

  const onSubmit = (data) => {
    onSave({
      ...data,
      avatar: employee?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {employee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Basic Info */}
          <Box>
            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "primary.main", fontWeight: 700, mb: 2 }}>
              Thông tin cơ bản
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="id"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Mã NV" error={!!errors.id} helperText={errors.id?.message} slotProps={{ input: { readOnly: true, sx: { bgcolor: "#f8fafc" } } }} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Họ và tên" error={!!errors.fullName} helperText={errors.fullName?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Số điện thoại" error={!!errors.phone} helperText={errors.phone?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Giới tính" error={!!errors.gender}>
                      <MenuItem value="Nam">Nam</MenuItem>
                      <MenuItem value="Nữ">Nữ</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Địa chỉ" error={!!errors.address} helperText={errors.address?.message} />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Work Info */}
          <Box>
            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "primary.main", fontWeight: 700, mb: 2 }}>
              Thông tin công việc
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Phòng ban" error={!!errors.department}>
                      <MenuItem value="Mài">Mài</MenuItem>
                      <MenuItem value="Cắt">Cắt</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Vai trò" error={!!errors.role}>
                      <MenuItem value="Thống kê">Thống kê</MenuItem>
                      <MenuItem value="Trưởng ca">Trưởng ca</MenuItem>
                      <MenuItem value="Tổ trưởng">Tổ trưởng</MenuItem>
                      <MenuItem value="Công nhân">Công nhân</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="shift"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Ca làm việc" error={!!errors.shift}>
                      <MenuItem value="Ca 1">Ca 1</MenuItem>
                      <MenuItem value="Ca 2">Ca 2</MenuItem>
                      <MenuItem value="Ca 3">Ca 3</MenuItem>
                      <MenuItem value="Hành chính">Hành chính</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="joinDate"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} type="date" fullWidth label="Ngày vào làm" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.joinDate} helperText={errors.joinDate?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Trạng thái" error={!!errors.status}>
                      <MenuItem value="Đang làm việc">Đang làm việc</MenuItem>
                      <MenuItem value="Nghỉ việc">Nghỉ việc</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
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
