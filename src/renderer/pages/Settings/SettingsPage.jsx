import { Box, Divider, Paper, Typography } from "@mui/material";
import ExcelTemplatesSection from "./components/ExcelTemplatesSection";

function SettingsPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 900, pb: 4 }}>
      {/* Account / System settings can be added here as more sections in future */}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Cấu hình Excel Templates
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Quản lý các file Excel template dùng để xuất báo cáo
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 3 }}>
          <ExcelTemplatesSection />
        </Box>
      </Paper>
    </Box>
  );
}

export default SettingsPage;
