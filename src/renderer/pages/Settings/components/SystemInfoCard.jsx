import { Paper, Typography, Box } from "@mui/material";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

export default function SystemInfoCard() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        <BuildOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Nhật ký hệ thống
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Xem nhật ký hoạt động (sắp ra mắt)
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Tính năng này sẽ được cập nhật trong phiên bản tới.
        </Typography>
      </Box>
    </Paper>
  );
}
