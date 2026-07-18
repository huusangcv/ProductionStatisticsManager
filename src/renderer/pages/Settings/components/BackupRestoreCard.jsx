import { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useBackupRestore } from "../../../hooks/useBackupRestore";

export default function BackupRestoreCard() {
  const { backups, loading, createBackup, restoreBackup, fetchBackups } = useBackupRestore();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);

  const handleCreateBackup = async () => {
    const result = await createBackup();
    if (result.ok) {
      setSnackbar({
        open: true,
        message: `Đã tạo backup: ${result.backupName}`,
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Tạo backup thất bại",
        severity: "error",
      });
    }
  };

  const handleRestoreClick = (backup) => {
    setBackupToRestore(backup);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!backupToRestore) return;
    const result = await restoreBackup(backupToRestore.path);
    setRestoreDialogOpen(false);
    setBackupToRestore(null);
    if (result.ok) {
      setSnackbar({
        open: true,
        message: "Đã khôi phục backup thành công",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.message || "Khôi phục thất bại",
        severity: "error",
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <BackupOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Backup & Restore
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sao lưu và khôi phục cơ sở dữ liệu
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <BackupOutlinedIcon />}
              onClick={handleCreateBackup}
              disabled={loading}
            >
              Tạo Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetAppOutlinedIcon />}
            >
              Xuất DB
            </Button>
            <Button
              variant="outlined"
              startIcon={<PublishOutlinedIcon />}
            >
              Nhập DB
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Lịch sử backup
          </Typography>
          {backups.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              Chưa có backup nào
            </Typography>
          ) : (
            <List>
              {backups.map((backup, index) => (
                <Box key={backup.name}>
                  <ListItem>
                    <ListItemText
                      primary={backup.name}
                      secondary={
                        <Box component="span" sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(backup.createdAt).toLocaleString("vi-VN")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(backup.size)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="restore"
                        onClick={() => handleRestoreClick(backup)}
                      >
                        <RestoreOutlinedIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < backups.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Xác nhận khôi phục</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn khôi phục từ backup {backupToRestore?.name}?
            <br />
            Dữ liệu hiện tại sẽ bị thay thế.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleConfirmRestore} color="primary" autoFocus>
            Khôi phục
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
