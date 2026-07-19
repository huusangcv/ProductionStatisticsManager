import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  material_code: z.string().trim().min(1, "Mã liệu là bắt buộc"),
  product_name: z.string().trim().min(1, "Tên hàng là bắt buộc"),
  specification: z.string().trim().min(1, "Quy cách là bắt buộc"),
  detail: z.string().trim().min(1, "Chi tiết là bắt buộc"),
});

function DetailJointDrawer({ open, item, allItems, onClose, onSave, loading }) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      material_code: "",
      product_name: "",
      specification: "",
      detail: "",
    },
  });

  useEffect(() => {
    if (open && item) {
      reset({
        material_code: item.material_code || "",
        product_name: item.product_name || "",
        specification: item.specification || "",
        detail: item.detail || "",
      });
    }
  }, [open, item, reset]);

  const handleClose = () => {
    if (isDirty) {
      setConfirmDialogOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setConfirmDialogOpen(false);
    onClose();
  };

  const handleCancelClose = () => {
    setConfirmDialogOpen(false);
  };

  const onSubmit = (data) => {
    onSave(data);
  };

  if (!open || !item) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 420, display: "flex", flexDirection: "column" },
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Chỉnh sửa chi tiết kết xâu
          </Typography>
          <IconButton onClick={handleClose} size="small">
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
          <form onSubmit={handleSubmit(onSubmit)} id="detail-joint-form">
            <Stack spacing={2}>
              <Controller
                name="material_code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Mã liệu"
                    error={!!errors.material_code}
                    helperText={errors.material_code?.message}
                  />
                )}
              />
              <Controller
                name="product_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tên hàng"
                    error={!!errors.product_name}
                    helperText={errors.product_name?.message}
                  />
                )}
              />
              <Controller
                name="specification"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quy cách"
                    error={!!errors.specification}
                    helperText={errors.specification?.message}
                  />
                )}
              />
              <Controller
                name="detail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Chi tiết"
                    error={!!errors.detail}
                    helperText={errors.detail?.message}
                  />
                )}
              />
              <Divider />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                    fontWeight: 700,
                  }}
                >
                  Thông tin hệ thống
                </Typography>
                <TextField
                  fullWidth
                  label="Ngày tạo"
                  value={item.created_at || ""}
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Ngày cập nhật"
                  value={item.updated_at || ""}
                  disabled
                />
              </Box>
            </Stack>
          </form>
        </Box>

        <Box
          sx={{
            p: 3,
            borderTop: "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button onClick={handleClose} variant="text" color="secondary">
            Hủy
          </Button>
          <Button
            type="submit"
            form="detail-joint-form"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </Box>
      </Drawer>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelClose}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">
          Xác nhận hủy thay đổi
        </DialogTitle>
        <DialogContent>
          <Typography>Bạn có muốn hủy các thay đổi chưa lưu?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose} color="secondary">
            Không
          </Button>
          <Button onClick={handleConfirmClose} color="primary">
            Có
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DetailJointDrawer;
