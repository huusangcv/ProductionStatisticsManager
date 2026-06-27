import { Card, CardContent, Typography, Box, Grid2 as Grid } from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";

function StatCard({ title, value, icon, color, description }) {
  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, p: "20px !important", display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 3,
            backgroundColor: `${color}15`,
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
          {description && (
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }} noWrap>
              {description}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function EmployeeStatistics({ stats }) {
  const cards = [
    { title: "Tổng nhân sự", value: stats.total, icon: <PeopleAltOutlinedIcon />, color: "#2563eb", description: "Toàn bộ nhà máy" },
    { title: "Tổ Mài", value: stats.grinding, icon: <ConstructionOutlinedIcon />, color: "#0891b2", description: "Công nhân mài" },
    { title: "Tổ Cắt", value: stats.cutting, icon: <ContentCutOutlinedIcon />, color: "#059669", description: "Công nhân cắt" },
    { title: "Quản lý / Thống kê", value: stats.managers, icon: <ManageAccountsOutlinedIcon />, color: "#7c3aed", description: "Cán bộ quản lý" },
    { title: "Nghỉ việc", value: stats.inactive, icon: <PersonOffOutlinedIcon />, color: "#dc2626", description: "Đã thôi việc" },
    { title: "Tỷ lệ duy trì", value: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`, icon: <HowToRegOutlinedIcon />, color: "#10b981", description: "Nhân sự hoạt động" },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}

export default EmployeeStatistics;
