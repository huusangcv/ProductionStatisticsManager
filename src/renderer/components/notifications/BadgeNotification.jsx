import { Badge, IconButton } from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { useNotifications } from "../../context/NotificationContext";

export default function BadgeNotification() {
  const { unreadCount, openDrawer } = useNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <Badge
      badgeContent={hasUnread ? (unreadCount > 99 ? "99+" : unreadCount) : 0}
      color="error"
      max={99}
      sx={{
        "& .MuiBadge-badge": {
          fontSize: 10,
          height: 18,
          minWidth: 18,
          px: 0.5,
          fontWeight: 700,
        },
      }}
    >
      <IconButton
        aria-label="Thông báo"
        onClick={openDrawer}
        sx={{
          width: 40,
          height: 40,
          border: "1px solid",
          borderColor: hasUnread ? "primary.main" : "grey.200",
          bgcolor: hasUnread ? "rgba(37,99,235,0.06)" : "grey.50",
          color: hasUnread ? "primary.main" : "text.secondary",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: "rgba(37,99,235,0.1)",
            color: "primary.main",
            borderColor: "primary.main",
          },
        }}
      >
        {hasUnread
          ? <NotificationsRoundedIcon sx={{ fontSize: 19 }} />
          : <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
        }
      </IconButton>
    </Badge>
  );
}
