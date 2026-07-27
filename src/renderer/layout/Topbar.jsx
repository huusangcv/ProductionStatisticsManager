import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Chip, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import BadgeNotification from "../components/notifications/BadgeNotification";

const PAGE_META = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Tổng quan hệ thống",
  },
  "/grinding": {
    title: "Sản lượng Mài",
    subtitle: "Quản lý và thống kê sản lượng mài từ file Excel",
  },
  "/cutting": {
    title: "Sản lượng Cắt",
    subtitle: "Quản lý và thống kê sản lượng cắt từ file Excel",
  },
  "/heat-treatment": {
    title: "Xử lý nhiệt",
    subtitle: "Xuất báo cáo xử lý nhiệt từ dữ liệu Mài",
  },
  "/casting-defect": {
    title: "Báo Phế Đúc",
    subtitle: "Quản lý và thống kê báo phế đúc",
  },
  "/employees": {
    title: "Quản lý nhân viên",
    subtitle: "Quản lý danh sách nhân sự",
  },
  "/roles": {
    title: "Vai trò",
    subtitle: "Quản lý vai trò và phân quyền hệ thống",
  },
  "/positions": {
    title: "Chức vụ",
    subtitle: "Quản lý danh mục chức vụ nhân viên",
  },
  "/detail-joint": {
    title: "Chi tiết kết xâu",
    subtitle: "Quản lý danh mục chi tiết kết xâu",
  },
  "/prices": {
    title: "Đơn giá gia công",
    subtitle: "Quản lý đơn giá gia công sản phẩm",
  },
  "/import-history": {
    title: "Lịch sử Import",
    subtitle: "Quản lý các phiên import dữ liệu",
  },
  "/overtime": {
    title: "Đăng ký tăng ca",
    subtitle: "Quản lý đăng ký làm thêm giờ",
  },
  "/personal-production": {
    title: "Sản lượng cá nhân",
    subtitle: "Thống kê sản lượng chi tiết theo từng nhân viên",
  },
  "/reports": {
    title: "Báo cáo",
    subtitle: "Thống kê và xuất dữ liệu sản xuất",
  },
  "/settings": {
    title: "Cài đặt",
    subtitle: "Thiết lập hệ thống",
  },
};

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/$/, "") || "/";
  const pageMeta = PAGE_META[cleanPath] || Object.entries(PAGE_META).find(([path]) => cleanPath.startsWith(path))?.[1] || PAGE_META["/dashboard"];
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

          <Stack spacing={0.25}>
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

          <BadgeNotification />

          <AdminMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
