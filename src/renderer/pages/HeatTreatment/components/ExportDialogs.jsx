import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ExportDialogs({
  generating,
  generateStepText,
  lastResult,
  showSuccessDialog,
  onCloseSuccess,
  onOpenFile,
  onOpenFolder,
  onPrint,
}) {
  return (
    <>
      {/* Loading Dialog */}
      <Dialog open={generating} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>Đang tạo báo cáo xử lý nhiệt</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography variant="body1" color="text.secondary">
              {generateStepText || "Đang xử lý..."}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={onCloseSuccess} maxWidth="xs" fullWidth>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 3, pb: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Xuất Excel thành công
            </Typography>
            
            {lastResult && (
              <Stack spacing={1} sx={{ width: "100%", bgcolor: "grey.50", p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Số dòng:</Typography>
                  <Typography variant="body2" fontWeight="500">{lastResult.totalRows}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                  <Typography variant="body2" fontWeight="500">{(lastResult.durationMs / 1000).toFixed(2)}s</Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Tên file:</Typography>
                  <Typography variant="body2" fontWeight="500" sx={{ wordBreak: "break-all", textAlign: "right" }}>
                    {lastResult.fileName}
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Thư mục lưu:</Typography>
                  <Typography variant="body2" fontWeight="500" sx={{ wordBreak: "break-all", textAlign: "right" }}>
                    {lastResult.folderPath}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" disableElevation onClick={() => onPrint(lastResult?.filePath)}>
            In ngay
          </Button>
          <Button variant="outlined" onClick={() => onOpenFolder(lastResult?.folderPath)}>
            Mở thư mục
          </Button>
          <Button variant="outlined" onClick={() => onOpenFile(lastResult?.filePath)}>
            Mở Excel
          </Button>
          <Button variant="text" color="inherit" onClick={onCloseSuccess}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
