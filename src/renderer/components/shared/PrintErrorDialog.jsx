import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function PrintErrorDialog({ open, onClose, result }) {
  if (!result || !result.details) return null;

  const { printer, file, exception, stderr, errorCode } = result.details;

  const handleCopy = () => {
    const textToCopy = `[Print Error Report]\nPrinter: ${printer || "N/A"}\nFile: ${file || "N/A"}\nRoot Cause: ${result.message || "N/A"}\nError Code: ${errorCode || "N/A"}\nException Details: ${exception || stderr || "N/A"}`;
    navigator.clipboard.writeText(textToCopy);
    alert("Đã copy mã lỗi vào clipboard!");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
        Lỗi In Ấn
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Tên máy in
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {printer || "Chưa xác định"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Đường dẫn file
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {file || "N/A"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nguyên nhân gốc
          </Typography>
          <Typography variant="body1" color="error" fontWeight={500}>
            {result.message}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Chi tiết kỹ thuật (dành cho IT)
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: "#f5f5f5",
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: "0.85rem",
              maxHeight: 120,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {`Code: ${errorCode || "N/A"}\nDetails: ${exception || stderr || "N/A"}`}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} startIcon={<ContentCopyIcon />} color="primary">
          Copy Error
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
