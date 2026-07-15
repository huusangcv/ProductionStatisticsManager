import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";

/**
 * TemplateStatusCard — shows the current state of the Heat Treatment template.
 *
 * Props:
 *   template  {object|null}  Template row from SQLite (null = not uploaded)
 *   loading   {boolean}
 */
export default function TemplateStatusCard({ template, loading }) {
  const navigate = useNavigate();

  if (loading) return null;

  if (!template) {
    return (
      <Alert
        severity="warning"
        icon={<WarningAmberIcon />}
        action={
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<SettingsIcon />}
            onClick={() => navigate("/settings")}
          >
            Cài đặt
          </Button>
        }
        sx={{ borderRadius: 2 }}
      >
        <strong>Chưa có template.</strong> Vui lòng upload file Excel template trong{" "}
        <strong>Cài đặt → Excel Templates</strong> trước khi xuất báo cáo.
      </Alert>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "success.light" }}>
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 20 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {template.template_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Sheet: {template.sheet_name} · Hàng bắt đầu: {template.start_row} · Cập nhật:{" "}
              {template.updated_at}
            </Typography>
          </Box>
          <Chip label="Template OK" color="success" size="small" variant="outlined" />
        </Stack>
      </CardContent>
    </Card>
  );
}
