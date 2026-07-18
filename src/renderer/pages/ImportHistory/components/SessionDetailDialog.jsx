import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function SessionDetailDialog({
  open,
  session,
  onClose,
  onRollback,
}) {
  if (!session) return null;

  const isRolledBack = session.status === "ROLLED_BACK";

  const formatDateForUI = (dateStr) => {
    if (!dateStr) return "Không có dữ liệu";

    // If already in dd/MM/yyyy format, just return it
    if (dateStr.includes("/")) {
      return dateStr;
    }

    // If in yyyy-MM-dd format, convert to dd/MM/yyyy
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "SUCCESS":
        return <Chip label="Thành công" color="success" size="small" />;
      case "NO_NEW_DATA":
        return <Chip label="Không có DL mới" color="info" size="small" />;
      case "FAILED":
        return <Chip label="Thất bại" color="error" size="small" />;
      case "ROLLED_BACK":
        return <Chip label="Đã hoàn tác" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Chi tiết phiên Import</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="primary">
            {session.session_code}
          </Typography>
          {getStatusChip(session.status)}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Phân hệ
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {session.module_name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Ngày báo sản lượng
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatDateForUI(session.report_date)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Thời gian Import
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {session.imported_at}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              File dữ liệu
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {session.file_name}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Tổng dòng
            </Typography>
            <Typography variant="h6">{session.total_rows}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Đã thêm
            </Typography>
            <Typography variant="h6" color="success.main">
              {session.imported_rows}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Trùng lặp
            </Typography>
            <Typography variant="h6" color="warning.main">
              {session.duplicate_rows}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Lỗi
            </Typography>
            <Typography variant="h6" color="error.main">
              {session.failed_rows}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                mt: 1,
              }}
            >
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2">
                Thời gian xử lý: {session.duration_ms} ms
              </Typography>
            </Box>
          </Grid>

          {session.note && (
            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: "rgba(0,0,0,0.03)",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ghi chú / Lỗi
                </Typography>
                <Typography variant="body2" color="error.main">
                  {session.note}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!isRolledBack && session.status === "SUCCESS" && (
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => onRollback(session.id)}
            sx={{ mr: "auto" }}
          >
            Rollback Dữ Liệu
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
