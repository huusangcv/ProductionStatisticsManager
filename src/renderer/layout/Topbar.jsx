import MenuIcon from "@mui/icons-material/Menu";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MinimizeRoundedIcon from "@mui/icons-material/MinimizeRounded";
import CropSquareRoundedIcon from "@mui/icons-material/CropSquareRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import adminAvatar from "../assets/admin-avatar.svg";

function Topbar({ onMenuClick, showMenuButton }) {
  const theme = useTheme();
  const isCompactDesktop = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#fff",
        color: "#0f172a",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1.5,
          minHeight: 68,
          px: { xs: 2, sm: 2.5 },
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}
        >
          {showMenuButton ? (
            <IconButton
              color="default"
              edge="start"
              onClick={onMenuClick}
              aria-label="open sidebar"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.1 }}
              noWrap
            >
              Dashboard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: 12,
                display: { xs: "none", sm: "block" },
              }}
              noWrap
            >
              Xin chào, Admin! Chúc bạn một ngày làm việc hiệu quả.
            </Typography>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="nowrap"
          justifyContent="flex-end"
          sx={{ minWidth: 0 }}
        >
          <Box
            sx={{
              width: { xs: 170, sm: 220, lg: 260 },
              px: 1.75,
              py: 0.8,
              borderRadius: 999,
              bgcolor: "#f8fafc",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <InputBase
              placeholder="Tìm kiếm..."
              sx={{ flex: 1, fontSize: 13, minWidth: 0 }}
              inputProps={{ "aria-label": "Tìm kiếm" }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                fontSize: 11.5,
                whiteSpace: "nowrap",
              }}
            >
              Ctrl + K
            </Typography>
          </Box>

          <IconButton
            sx={{
              bgcolor: "#f8fafc",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              width: 36,
              height: 36,
            }}
          >
            <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          </IconButton>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ pl: 0.5, minWidth: 0 }}
          >
            <Avatar
              src={adminAvatar}
              alt="Admin"
              sx={{
                width: 36,
                height: 36,
                border: "2px solid #fff",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.05,
                  fontSize: 15,
                }}
                noWrap
              >
                Admin
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: 11.5 }}
                noWrap
              >
                Quản trị viên
              </Typography>
            </Box>
            <KeyboardArrowDownRoundedIcon
              sx={{
                color: "text.secondary",
                display: { xs: "none", md: "block" },
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={0.25}
            sx={{
              ml: 0.25,
              display: { xs: "flex", sm: isCompactDesktop ? "flex" : "flex" },
            }}
          >
            <IconButton
              size="small"
              onClick={() => window.electronAPI?.window?.minimize()}
              sx={windowButtonSx}
              aria-label="Thu nhỏ"
            >
              <MinimizeRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => window.electronAPI?.window?.maximizeToggle()}
              sx={windowButtonSx}
              aria-label="Phóng to/Thu nhỏ"
            >
              <CropSquareRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => window.electronAPI?.window?.close()}
              sx={{
                ...windowButtonSx,
                "&:hover": { bgcolor: "#ef4444", color: "#fff" },
              }}
              aria-label="Đóng"
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

const windowButtonSx = {
  width: 32,
  height: 32,
  borderRadius: 1.5,
  color: "#475569",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  bgcolor: "#f8fafc",
  "&:hover": {
    bgcolor: "rgba(15, 23, 42, 0.04)",
  },
};

export default Topbar;
