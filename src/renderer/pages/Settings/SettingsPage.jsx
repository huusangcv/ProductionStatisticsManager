import { useEffect, useState } from "react";
import { Box, Chip, Divider, Paper, Skeleton, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import ExcelTemplatesSection from "./components/ExcelTemplatesSection";

// ── AppInfoSection ────────────────────────────────────────────────────────────

function AppInfoSection() {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    window.electronAPI.app.getVersion().then((res) => {
      setVersion(res?.version ?? "—");
    });
  }, []);

  const rows = [
    { label: "Phiên bản",         value: version ? `v${version}` : null },
    { label: "Thư mục dữ liệu",   value: "D:\\ProductionStatisticsManager" },
    { label: "Cơ sở dữ liệu",     value: "D:\\ProductionStatisticsManager\\database\\production.db" },
    { label: "Thư mục xuất báo cáo", value: "D:\\ProductionStatisticsManager\\exports" },
  ];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Thông tin ứng dụng
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Phiên bản và cấu hình hệ thống
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 3, py: 2 }}>
        {rows.map(({ label, value }) => (
          <Box
            key={label}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
              {label}
            </Typography>
            {value === null ? (
              <Skeleton width={80} height={20} />
            ) : (
              <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "monospace", fontSize: 12 }}>
                {value}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

function SettingsPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 900, pb: 4 }}>
      {/* Application info */}
      <AppInfoSection />

      {/* Excel Templates */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <StorageOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Cấu hình Excel Templates
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Quản lý các file Excel template dùng để xuất báo cáo
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 3 }}>
          <ExcelTemplatesSection />
        </Box>
      </Paper>
    </Box>
  );
}

export default SettingsPage;
