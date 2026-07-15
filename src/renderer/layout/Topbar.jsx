import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import {
  AppBar,
  Badge,
  Box,
  Chip,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import AdminMenu from "./AdminMenu";

const PAGE_META = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Tổng quan hệ thống",
  },
  "/employees": {
    title: "Quản lý nhân viên",
    subtitle: "Quản lý nhân sự bộ phận Mài và Cắt",
  },
  "/grinding": {
    title: "Sản lượng Mài",
    subtitle: "Quản lý và thống kê sản lượng mài từ file Excel",
  },
  "/cutting": {
    title: "Sản lượng Cắt",
    subtitle: "Quản lý và thống kê sản lượng cắt từ file Excel",
  },
  "/import-history": {
    title: "Lịch sử Import",
    subtitle: "Quản lý các phiên import dữ liệu",
  },
  "/reports": {
    title: "Báo cáo",
    subtitle: "Thống kê và xuất dữ liệu sản xuất",
  },
  "/heat-treatment": {
    title: "Nhiệt luyện",
    subtitle: "Xuất báo cáo nhiệt luyện từ dữ liệu Mài",
  },
  "/settings": {
    title: "Cài đặt",
    subtitle: "Thiết lập hệ thống",
  },
};

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const pageMeta = PAGE_META[location.pathname] ?? PAGE_META["/dashboard"];
  const { title, subtitle, chipLabel } = pageMeta;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        height: 72,
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        boxShadow: "none",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          height: 72,
          minHeight: 72,
          px: 3,
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexShrink: 0 }}
        >
          <IconButton
            edge="start"
            aria-label="toggle sidebar"
            onClick={onMenuClick}
            sx={{ color: "text.secondary" }}
          >
            <MenuIcon />
          </IconButton>

          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: 28,
                  color: "#111827",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </Typography>
              {chipLabel && (
                <Chip
                  label={chipLabel}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography
              variant="body2"
              sx={{
                color: "#64748B",
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexShrink: 0 }}
        >
          {/* <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: 320,
              height: 42,
              px: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 999,
              "&:focus-within": {
                bgcolor: "background.paper",
                borderColor: "primary.main",
              },
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Box
              component="input"
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm"
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                fontSize: 13,
                color: "text.primary",
                fontFamily: "inherit",
                minWidth: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: "text.disabled",
                whiteSpace: "nowrap",
              }}
            >
              Ctrl + K
            </Typography>
          </Box> */}

          <Badge
            badgeContent={3}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: 10,
                height: 18,
                minWidth: 18,
              },
            }}
          >
            <IconButton
              aria-label="notifications"
              sx={{
                width: 40,
                height: 40,
                border: "1px solid",
                borderColor: "grey.200",
                bgcolor: "grey.50",
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "action.hover",
                  color: "primary.main",
                  borderColor: "transparent",
                },
              }}
            >
              <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Badge>

          <AdminMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
