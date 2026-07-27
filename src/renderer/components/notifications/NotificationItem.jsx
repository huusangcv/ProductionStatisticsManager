import { Avatar, Box, Chip, ListItemButton, ListItemAvatar, ListItemText, Tooltip, Typography } from "@mui/material";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

const TYPE_CONFIG = {
  UPDATE:     { icon: SystemUpdateAltRoundedIcon, color: "#2563EB", bg: "#EFF6FF", label: "Cập nhật" },
  IMPORT:     { icon: FileDownloadRoundedIcon,    color: "#16A34A", bg: "#F0FDF4", label: "Import"   },
  EXPORT:     { icon: FileUploadRoundedIcon,      color: "#059669", bg: "#ECFDF5", label: "Export"   },
  SYNC:       { icon: SyncRoundedIcon,            color: "#2563EB", bg: "#EFF6FF", label: "Đồng bộ"  },
  WARNING:    { icon: WarningAmberRoundedIcon,    color: "#D97706", bg: "#FFFBEB", label: "Cảnh báo" },
  ERROR:      { icon: ErrorOutlineRoundedIcon,    color: "#DC2626", bg: "#FEF2F2", label: "Lỗi"      },
  SYSTEM:     { icon: SettingsRoundedIcon,        color: "#6B7280", bg: "#F9FAFB", label: "Hệ thống" },
  OVERTIME:   { icon: AccessTimeRoundedIcon,      color: "#7C3AED", bg: "#F5F3FF", label: "Tăng ca"  },
  PRODUCTION: { icon: FactoryRoundedIcon,         color: "#0891B2", bg: "#ECFEFF", label: "Sản xuất" },
  REPORT:     { icon: AssessmentRoundedIcon,      color: "#0891B2", bg: "#ECFEFF", label: "Báo cáo"  },
  INFO:       { icon: InfoOutlinedIcon,           color: "#6B7280", bg: "#F9FAFB", label: "Thông tin"},
};

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export default function NotificationItem({ notification, onClick }) {
  const type = notification.type || "INFO";
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.INFO;
  const IconComponent = config.icon;
  const isUnread = !notification.is_read;

  return (
    <ListItemButton
      onClick={() => onClick(notification)}
      sx={{
        px: 2,
        py: 1.5,
        alignItems: "flex-start",
        gap: 1.5,
        bgcolor: isUnread ? "rgba(37,99,235,0.04)" : "transparent",
        borderLeft: isUnread ? "3px solid #2563EB" : "3px solid transparent",
        transition: "all 0.15s",
        "&:hover": { bgcolor: "grey.50" },
      }}
    >
      <ListItemAvatar sx={{ minWidth: 44, mt: 0.5 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: config.bg,
            color: config.color,
          }}
        >
          <IconComponent sx={{ fontSize: 18 }} />
        </Avatar>
      </ListItemAvatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isUnread ? 700 : 500,
              color: isUnread ? "text.primary" : "text.secondary",
              fontSize: 13,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 200,
            }}
          >
            {notification.title}
          </Typography>
          <Chip
            label={config.label}
            size="small"
            sx={{
              fontSize: 10,
              height: 18,
              bgcolor: config.bg,
              color: config.color,
              fontWeight: 600,
              ml: 0.5,
              flexShrink: 0,
            }}
          />
        </Box>

        {notification.message && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: 12,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notification.message}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
            {formatRelativeTime(notification.created_at)}
          </Typography>
          {isUnread && (
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#2563EB",
                flexShrink: 0,
              }}
            />
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
}
