import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import adminAvatar from "../assets/admin-avatar.svg";
import theme from "../theme/theme";

export interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export default function Topbar({
  onMenuClick,
  title = "Dashboard",
  subtitle = "Xin chào, Admin! Chúc bạn một ngày làm việc hiệu quả.",
}: TopbarProps) {
  const { searchBar } = theme.componentStyles;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: theme.zIndex.sticky,
        flexShrink: 0,
        height: theme.layout.topbar.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.palette.border.default}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <IconButton
          edge="start"
          aria-label="toggle sidebar"
          onClick={onMenuClick}
          sx={{
            borderRadius: `${theme.borderRadius.sm}px`,
            color: "text.secondary",
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.extrabold,
              color: "text.primary",
              lineHeight: theme.typography.lineHeight.tight,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.fontSize.sm,
              color: "text.secondary",
              mt: 0.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: searchBar.maxWidth,
            maxWidth: searchBar.maxWidth,
            height: searchBar.height,
            px: 2,
            bgcolor: searchBar.backgroundColor,
            border: `1px solid ${searchBar.borderColor}`,
            borderRadius: `${searchBar.borderRadius}px`,
            transition: `all ${theme.transitions.duration.normal}ms ${theme.transitions.easing.standard}`,
            "&:focus-within": {
              bgcolor: searchBar.backgroundColorFocus,
              borderColor: searchBar.borderColorFocus,
              boxShadow: searchBar.focusRing,
            },
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <InputBase
            placeholder="Tìm kiếm..."
            inputProps={{ "aria-label": "Tìm kiếm" }}
            sx={{
              flex: 1,
              fontSize: searchBar.fontSize,
              color: "text.primary",
            }}
          />
          <Typography
            sx={{
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.semibold,
              color: "text.disabled",
            }}
          >
            Ctrl + K
          </Typography>
        </Box>

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
              border: `1px solid ${theme.palette.border.default}`,
              bgcolor: theme.palette.background.subtle,
              color: "text.secondary",
              "&:hover": {
                bgcolor: theme.palette.primary[50],
                color: "primary.main",
                borderColor: "transparent",
              },
            }}
          >
            <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Badge>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1,
            py: 0.5,
            borderRadius: `${theme.borderRadius.sm}px`,
            cursor: "pointer",
            "&:hover": {
              bgcolor: theme.palette.background.subtle,
            },
          }}
        >
          <Avatar
            src={adminAvatar}
            alt="Admin"
            sx={{ width: theme.componentStyles.avatar.size.md, height: theme.componentStyles.avatar.size.md }}
          />
          <Box>
            <Typography
              sx={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.bold,
                color: "text.primary",
                lineHeight: theme.typography.lineHeight.tight,
              }}
            >
              Admin
            </Typography>
            <Typography sx={{ fontSize: theme.fontSize.sm, color: "text.secondary" }}>
              Quản trị viên
            </Typography>
          </Box>
          <KeyboardArrowDownRoundedIcon sx={{ color: "text.secondary" }} />
        </Box>
      </Box>
    </Box>
  );
}
