import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export default function SyncPersonalProductionDialog({
  open,
  onClose,
  currentDate,
  onSuccess,
  showSnackbar,
}) {
  const [date, setDate] = useState(currentDate || "");
  const [syncCutting, setSyncCutting] = useState(true);
  const [syncGrinding, setSyncGrinding] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [unmappedCodes, setUnmappedCodes] = useState([]);
  const [unmappedDialogOpen, setUnmappedDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(currentDate || "");
      setSyncCutting(true);
      setSyncGrinding(true);
      setConfirmOverwrite(false);
    }
  }, [open, currentDate]);

  const handleStartSync = async (forceOverwrite = false) => {
    if (!date) {
      showSnackbar("Vui lòng chọn ngày đồng bộ", "error");
      return;
    }
    if (!syncCutting && !syncGrinding) {
      showSnackbar("Vui lòng chọn ít nhất một nguồn dữ liệu (Cắt hoặc Mài)", "error");
      return;
    }

    const sources = [];
    if (syncCutting) sources.push("cutting");
    if (syncGrinding) sources.push("grinding");

    setIsProcessing(true);
    try {
      if (!forceOverwrite) {
        const checkRes = await window.electronAPI.personalProduction.checkExists(
          date,
          sources
        );
        if (checkRes.ok && checkRes.exists) {
          setIsProcessing(false);
          setConfirmOverwrite(true);
          return;
        }
      }

      setConfirmOverwrite(false);
      const res = await window.electronAPI.personalProduction.sync({
        workDate: date,
        syncCutting,
        syncGrinding,
      });

      if (!res.ok) {
        showSnackbar(res.message || "Lỗi khi đồng bộ dữ liệu", "error");
        return;
      }

      showSnackbar(`Đã đồng bộ thành công ${res.insertedCount || 0} dòng dữ liệu.`);
      if (onSuccess) {
        onSuccess(date);
      }

      if (res.unmappedCodes && res.unmappedCodes.length > 0) {
        setUnmappedCodes(res.unmappedCodes);
        setUnmappedDialogOpen(true);
      } else {
        onClose();
      }
    } catch (error) {
      showSnackbar("Lỗi không xác định: " + error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={isProcessing ? undefined : onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: "1px solid #E2E8F0", pb: 1.5 }}>
          Đồng bộ sản lượng cá nhân
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {confirmOverwrite ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
              <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Dữ liệu của ngày này đã tồn tại!
                </Typography>
                <Typography variant="body2">
                  Bạn có muốn ghi đè dữ liệu mới từ Cắt/Mài cho ngày <b>{date}</b> không? Các chỉnh sửa thủ công trước đó trên ngày này sẽ bị xóa.
                </Typography>
              </Alert>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Dữ liệu sẽ được tổng hợp từ bảng Cắt và Mài theo ngày bạn chọn.
              </Typography>
              <TextField
                label="Ngày đồng bộ"
                type="date"
                fullWidth
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B", display: "block", mb: 0.5 }}>
                  NGUỒN DỮ LIỆU
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={syncCutting}
                      onChange={(e) => setSyncCutting(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Sheet Cắt (toàn bộ sản lượng)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={syncGrinding}
                      onChange={(e) => setSyncGrinding(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Sheet Mài (chỉ dòng có SL hoàn thành > 0)"
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #E2E8F0", px: 3, py: 1.5 }}>
          {confirmOverwrite ? (
            <>
              <Button onClick={() => setConfirmOverwrite(false)} color="inherit" disabled={isProcessing}>
                Hủy
              </Button>
              <Button
                onClick={() => handleStartSync(true)}
                variant="contained"
                color="warning"
                disabled={isProcessing}
                startIcon={<SyncRoundedIcon />}
              >
                Ghi đè
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose} color="inherit" disabled={isProcessing}>
                Hủy
              </Button>
              <Button
                onClick={() => handleStartSync(false)}
                variant="contained"
                color="primary"
                disabled={isProcessing}
                startIcon={<SyncRoundedIcon />}
              >
                Đồng bộ
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Unmapped Codes Warning Dialog */}
      <Dialog
        open={unmappedDialogOpen}
        onClose={() => {
          setUnmappedDialogOpen(false);
          onClose();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "warning.dark" }}>
          ⚠ Mã đại diện chưa khai báo
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Các mã đại diện sau <b>không tìm thấy</b> trong danh mục nhân viên. Dữ liệu đã được đồng bộ nhưng thông tin Mã nhân viên và Tên nhân viên đang để trống.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Vui lòng vào <b>Danh mục → Nhân viên</b> để bổ sung mã đại diện cho các nhân viên này.
          </Typography>
          <List dense sx={{ bgcolor: "#fff8f0", borderRadius: 1, border: "1px solid #fde68a", maxHeight: 200, overflow: "auto" }}>
            {unmappedCodes.map((code, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={code} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUnmappedDialogOpen(false);
              onClose();
            }}
            variant="contained"
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
