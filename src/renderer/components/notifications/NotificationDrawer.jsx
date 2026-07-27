import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import NotificationItem from "./NotificationItem";

export default function NotificationDrawer() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    total,
    loading,
    drawerOpen,
    hasMore,
    closeDrawer,
    markAsRead,
    markAllAsRead,
    deleteAll,
    loadMore,
  } = useNotifications();

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.route) {
      closeDrawer();
      navigate(notif.route);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      PaperProps={{
        sx: {
          width: 400,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "grey.100",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <NotificationsNoneRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} fontSize={15}>
            Thông báo
          </Typography>
          {unreadCount > 0 && (
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 999,
                bgcolor: "#2563EB",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.6,
                minWidth: 20,
                textAlign: "center",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Đánh dấu tất cả đã đọc">
            <span>
              <IconButton
                size="small"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
              >
                <DoneAllRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Xoá tất cả">
            <span>
              <IconButton
                size="small"
                onClick={deleteAll}
                disabled={notifications.length === 0}
                sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
              >
                <DeleteSweepRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <IconButton
            size="small"
            onClick={closeDrawer}
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 1.5,
            }}
          >
            <NotificationsNoneRoundedIcon sx={{ fontSize: 48, color: "grey.300" }} />
            <Typography variant="body2" color="text.disabled" fontWeight={500}>
              Không có thông báo nào
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notif, idx) => (
              <Box key={notif.id}>
                <NotificationItem notification={notif} onClick={handleItemClick} />
                {idx < notifications.length - 1 && (
                  <Divider sx={{ mx: 2 }} />
                )}
              </Box>
            ))}

            {hasMore && (
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Button
                  size="small"
                  onClick={loadMore}
                  disabled={loading}
                  variant="text"
                  sx={{ fontSize: 12, color: "text.secondary" }}
                >
                  {loading ? <CircularProgress size={14} /> : "Tải thêm..."}
                </Button>
              </Box>
            )}
          </List>
        )}
      </Box>

      {/* Footer */}
      {total > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "grey.100",
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" color="text.disabled" fontSize={11}>
            {total} thông báo tổng cộng
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
