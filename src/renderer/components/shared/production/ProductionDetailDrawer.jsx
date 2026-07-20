import { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import ProductionInfoSection, { InfoRow } from "./ProductionInfoSection";

const formatDateForUI = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateStr;
};

/**
 * ProductionEditForm — allows editing completed_quantity, scrap_quantity, and representative_code.
 * After changing representative_code, it looks up the employee to show a preview.
 */
function ProductionEditForm({
  record,
  isGrinding,
  onSave,
  onCancel,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    completed_quantity: record?.completed_quantity || "",
    scrap_quantity: record?.scrap_quantity || "",
    representative_code: record?.representative_code || "",
  });

  // Employee lookup preview
  const [employeePreview, setEmployeePreview] = useState(
    record?.representative_code
      ? {
          full_name: record.employee_full_name || "",
          role_name: record.role_name || "",
          position_name: record.position_name || "",
          found: !!record.employee_full_name,
        }
      : null,
  );

  const lookupTimeout = useRef(null);

  const lookupEmployee = async (code) => {
    if (!code?.trim()) {
      setEmployeePreview(null);
      return;
    }
    try {
      const roleCode = isGrinding ? "GRIND" : "CUT";
      const emp = await window.electronAPI.employees.getByRepresentativeCodeAndRole(code.trim(), roleCode);
      if (emp) {
        setEmployeePreview({
          full_name: emp.full_name,
          role_name: emp.role_name,
          position_name: emp.position_name,
          found: true,
        });
      } else {
        setEmployeePreview({ found: false });
      }
    } catch {
      setEmployeePreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "representative_code") {
      clearTimeout(lookupTimeout.current);
      lookupTimeout.current = setTimeout(() => {
        lookupEmployee(value);
      }, 400);
    }
  };

  useEffect(() => {
    return () => clearTimeout(lookupTimeout.current);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...record,
      completed_quantity: Number(formData.completed_quantity),
      scrap_quantity: isGrinding ? Number(formData.scrap_quantity) : undefined,
      representative_code: formData.representative_code,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Số lượng hoàn thành"
        type="number"
        name="completed_quantity"
        value={formData.completed_quantity}
        onChange={handleChange}
        margin="normal"
        InputProps={{ inputProps: { min: 0 } }}
        required
      />
      {isGrinding && (
        <TextField
          fullWidth
          label="Số lượng báo phế"
          type="number"
          name="scrap_quantity"
          value={formData.scrap_quantity}
          onChange={handleChange}
          margin="normal"
          InputProps={{ inputProps: { min: 0 } }}
        />
      )}

      <TextField
        fullWidth
        label="Mã đại diện"
        name="representative_code"
        value={formData.representative_code}
        onChange={handleChange}
        margin="normal"
        helperText="Nhập mã đại diện — tên nhân viên sẽ tự động cập nhật"
      />

      {/* Employee preview */}
      {employeePreview && (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            bgcolor: employeePreview.found ? "#f0fdf4" : "#fff8f0",
            border: `1px solid ${employeePreview.found ? "#86efac" : "#fde68a"}`,
          }}
        >
          {employeePreview.found ? (
            <>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>✓ Tìm thấy nhân viên</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{employeePreview.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {employeePreview.role_name} • {employeePreview.position_name}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
              ⚠ Không tìm thấy nhân viên với mã này. Dữ liệu vẫn sẽ được lưu.
            </Typography>
          )}
        </Box>
      )}

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

function ProductionDetailDrawer({
  open,
  record,
  isGrinding,
  onClose,
  onEdit,
  onDelete,
  onSave,
  isSaving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!record) return null;

  return (
    <>
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
              Chi tiết sản lượng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.work_order_number} • {record.item_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ngày báo: {formatDateForUI(record.report_date)}
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
            <ProductionEditForm
              record={record}
              isGrinding={isGrinding}
              onSave={async (data) => {
                await onSave(record.id, data);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
              isLoading={isSaving}
            />
          ) : (
            <>
              <ProductionInfoSection title="Thông tin đơn hàng">
                <InfoRow
                  label="Đơn đặt hàng"
                  value={record.customer_order_number}
                />
                <Divider />
                <InfoRow label="Mã công đơn" value={record.work_order_number} />
                <Divider />
                <InfoRow label="Mã liệu" value={record.material_code} />
                <Divider />
                <InfoRow label="Chi tiết kết xâu" value={record.joint_detail} />
                <Divider />
                <InfoRow label="Tên hàng" value={record.item_name} />
                <Divider />
                <InfoRow label="Quy cách" value={record.specification} />
              </ProductionInfoSection>

              <ProductionInfoSection title="Thông tin sản lượng">
                <InfoRow
                  label="Số lượng hoàn thành"
                  value={record.completed_quantity}
                />
                {isGrinding && (
                  <>
                    <Divider />
                    <InfoRow
                      label="Số lượng báo phế"
                      value={record.scrap_quantity}
                    />
                  </>
                )}
                {!isGrinding && record.joint_count != null && (
                  <>
                    <Divider />
                    <InfoRow
                      label="Số xâu"
                      value={record.joint_count}
                    />
                  </>
                )}
                <Divider />
                <InfoRow label="Đơn vị trọng lượng" value={record.unit_weight} />
                {record.completed_weight != null && (
                  <>
                    <Divider />
                    <InfoRow
                      label="Trọng lượng hoàn thành"
                      value={record.completed_weight}
                    />
                  </>
                )}
              </ProductionInfoSection>

              <ProductionInfoSection title="Thông tin nhân viên">
                <InfoRow 
            label="Mã đại diện" 
            value={record.representative_code || "—"} 
          />
          <InfoRow
            label="Tên nhân viên"
            value={record.employee_full_name || "-"}
          />
          <InfoRow 
            label="Vai trò" 
            value={record.role_name || "-"} 
          />
          <InfoRow
            label="Chức vụ"
            value={record.position_name || "-"}
          />      <Divider />
                <InfoRow
                  label="Ngày báo sản lượng"
                  value={formatDateForUI(record.report_date)}
                />
              </ProductionInfoSection>

              <ProductionInfoSection title="Thông tin import">
                <InfoRow
                  label="File Import"
                  value={
                    record.import_session_id
                      ? `Session #${record.import_session_id}`
                      : undefined
                  }
                />
                <Divider />
                <InfoRow label="Ngày Import" value={record.imported_at} />
              </ProductionInfoSection>
            </>
          )}
        </Box>

        {!isEditing && (
          <Box
            sx={{
              p: 3,
              borderTop: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Sửa
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Xóa
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa bản ghi này?
            <br />
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="secondary">
            Không
          </Button>
          <Button
            onClick={async () => {
              await onDelete(record.id);
              setConfirmDeleteOpen(false);
            }}
            color="error"
            autoFocus
          >
            Có
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProductionDetailDrawer;
