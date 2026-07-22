import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid2 as Grid,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  material_code: z.string().trim().min(1, "Mã liệu là bắt buộc"),
  product_name: z.string().trim().min(1, "Tên hàng là bắt buộc"),
  specification: z.string().trim(),
  cutting_price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Đơn giá cắt phải lớn hơn hoặc bằng 0").default(0)
  ).or(z.number()),
  grinding_price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Đơn giá mài phải lớn hơn hoặc bằng 0").default(0)
  ).or(z.number()),
});

function PriceDialog({ open, item, onClose, onSave }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      material_code: "",
      product_name: "",
      specification: "",
      cutting_price: 0,
      grinding_price: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          material_code: item.material_code || "",
          product_name: item.product_name || "",
          specification: item.specification || "",
          cutting_price: item.cutting_price || 0,
          grinding_price: item.grinding_price || 0,
        });
      } else {
        reset({
          material_code: "",
          product_name: "",
          specification: "",
          cutting_price: 0,
          grinding_price: 0,
        });
      }
    }
  }, [open, item, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {item ? "Cập nhật Đơn giá gia công" : "Thêm Đơn giá gia công mới"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                textTransform: "uppercase",
                color: "primary.main",
                fontWeight: 700,
                mb: 2,
              }}
            >
              Thông tin đơn giá
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="material_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Mã liệu"
                      disabled={!!item}
                      error={!!errors.material_code}
                      helperText={errors.material_code?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="cutting_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Đơn giá Cắt"
                      error={!!errors.cutting_price}
                      helperText={errors.cutting_price?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="grinding_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Đơn giá Mài"
                      error={!!errors.grinding_price}
                      helperText={errors.grinding_price?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}
        >
          <Button onClick={onClose} color="secondary" variant="text">
            Hủy bỏ
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {item ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default PriceDialog;
