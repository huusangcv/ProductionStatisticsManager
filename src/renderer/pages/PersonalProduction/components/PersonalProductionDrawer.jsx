import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  TextField,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

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

function PersonalProductionEditForm({ record, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    employee_code: record?.employee_code || "",
    employee_name: record?.employee_name || "",
    representative_code: record?.representative_code || "",
    quantity: record?.quantity ?? "",
    joint_count: record?.joint_count ?? "",
    detail: record?.detail || "",
  });

  const [presentEmployees, setPresentEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const attRes = await window.electronAPI.attendance?.getByDate(record.work_date);
        if (attRes?.ok && attRes.records) {
          // Chỉ lấy những nhân viên có trạng thái PRESENT và có mã nhân viên
          const present = attRes.records.filter(r => r.status === "PRESENT" && r.employee_code);
          setPresentEmployees(present);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách điểm danh", error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    
    if (record?.work_date) {
      fetchEmployees();
    }
  }, [record?.work_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        employee_code: newValue.employee_code,
        employee_name: newValue.employee_name,
        representative_code: newValue.representative_code || prev.representative_code,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employee_code: "",
        employee_name: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...record,
      ...formData,
      quantity: formData.quantity !== "" ? Number(formData.quantity) : null,
      joint_count: formData.joint_count !== "" ? Number(formData.joint_count) : null,
    });
  };

  const selectedEmployee = presentEmployees.find(emp => emp.employee_code === formData.employee_code) || 
    (formData.employee_code ? { employee_code: formData.employee_code, employee_name: formData.employee_name } : null);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Autocomplete
        options={presentEmployees}
        getOptionLabel={(option) => `${option.employee_code} - ${option.employee_name}`}
        value={selectedEmployee}
        onChange={handleEmployeeChange}
        loading={loadingEmployees}
        isOptionEqualToValue={(option, value) => option.employee_code === value?.employee_code}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Mã & Tên nhân viên (Chỉ người có mặt)"
            margin="normal"
            fullWidth
            required
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.employee_code}>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {option.employee_code} - {option.employee_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Đại diện: {option.representative_code || "—"} | Vai trò: {option.role_code || "—"}
              </Typography>
            </Box>
          </li>
        )}
      />

      <TextField
        fullWidth
        label="Mã đại diện"
        name="representative_code"
        value={formData.representative_code}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Số lượng"
        type="number"
        name="quantity"
        value={formData.quantity}
        onChange={handleChange}
        margin="normal"
        InputProps={{ inputProps: { min: 0 } }}
      />
      
      <TextField
        fullWidth
        label="Số xâu"
        type="number"
        name="joint_count"
        value={formData.joint_count}
        onChange={handleChange}
        margin="normal"
        InputProps={{ inputProps: { min: 0 } }}
      />

      <TextField
        fullWidth
        label="Chi tiết kết xâu"
        name="detail"
        value={formData.detail}
        onChange={handleChange}
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onCancel} variant="outlined" color="secondary">
          Hủy
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </Stack>
    </Box>
  );
}

function PersonalProductionDrawer({
  open,
  record,
  onClose,
  onSave,
  isSaving,
}) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsEditing(false);
    }
  }, [open, record]);

  if (!record) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 520, display: "flex", flexDirection: "column" },
      }}
    >
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sản lượng cá nhân
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {record.work_date} • Nguồn: {record.sheet_name || "—"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {isEditing ? (
          <PersonalProductionEditForm
            record={record}
            onSave={(data) => {
              onSave(data);
            }}
            onCancel={() => setIsEditing(false)}
            isLoading={isSaving}
          />
        ) : (
          <Box>
            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", mb: 1, fontWeight: 700 }}>
              Thông tin công việc
            </Typography>
            <InfoRow label="Đơn đặt hàng" value={record.customer_order_number} />
            <Divider />
            <InfoRow label="Mã công đơn" value={record.job_code} />
            <Divider />
            <InfoRow label="Mã liệu" value={record.material_code} />
            <Divider />
            <InfoRow label="Tên hàng" value={record.product_name} />
            <Divider />
            <InfoRow label="Quy cách" value={record.specification} />
            
            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", mt: 3, mb: 1, fontWeight: 700 }}>
              Nhân viên & Khối lượng
            </Typography>
            <InfoRow label="Mã nhân viên" value={record.employee_code} />
            <Divider />
            <InfoRow label="Tên nhân viên" value={record.employee_name} />
            <Divider />
            <InfoRow label="Mã đại diện" value={record.representative_code} />
            <Divider />
            <InfoRow label="Số lượng" value={record.quantity} />
            <Divider />
            <InfoRow label="Số xâu" value={record.joint_count} />
            <Divider />
            <InfoRow label="Chi tiết kết xâu" value={record.detail} />
          </Box>
        )}
      </Box>

      {!isEditing && (
        <Box sx={{ p: 3, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Chỉnh sửa
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

export default PersonalProductionDrawer;
