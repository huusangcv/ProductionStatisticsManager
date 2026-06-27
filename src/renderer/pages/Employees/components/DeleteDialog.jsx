import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function DeleteDialog({ open, count, employeeName, onClose, onConfirm }) {
  const isMultiple = count > 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "error.main" }}>
        <WarningAmberIcon />
        <Typography variant="h6" sx={{ fontWeight: 700, m: 0 }}>
          Xác nhận xóa
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {isMultiple
            ? `Bạn có chắc chắn muốn xóa ${count} nhân viên đã chọn?`
            : `Bạn có chắc chắn muốn xóa nhân viên ${employeeName || ""} không?`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Hành động này không thể hoàn tác. Dữ liệu liên quan đến nhân viên này cũng sẽ bị xóa.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="secondary" variant="text">
          Hủy bỏ
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Xóa {isMultiple ? "tất cả" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteDialog;
