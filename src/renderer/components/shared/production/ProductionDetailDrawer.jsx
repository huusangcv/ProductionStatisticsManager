import { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ProductionInfoSection, { InfoRow } from "./ProductionInfoSection";

const formatDateForUI = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateStr;
};

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
    employee_name: record?.employee_name || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...record,
      completed_quantity: Number(formData.completed_quantity),
      scrap_quantity: isGrinding ? Number(formData.scrap_quantity) : undefined,
      employee_name: formData.employee_name,
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
        label="Nhân viên"
        name="employee_name"
        value={formData.employee_name}
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
                <InfoRow label="Nhân viên" value={record.employee_name} />
                <Divider />
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
