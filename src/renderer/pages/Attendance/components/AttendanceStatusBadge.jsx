import { Chip } from "@mui/material";

const STATUS_CONFIG = {
  NOT_CHECKED: { label: "Chưa điểm danh", color: "default", bgColor: "#f1f5f9", textColor: "#64748b" },
  PRESENT: { label: "Có mặt", color: "success", bgColor: "#dcfce7", textColor: "#166534" },
  LEAVE: { label: "Nghỉ phép", color: "info", bgColor: "#e0f2fe", textColor: "#075985" },
  SICK: { label: "Nghỉ ốm", color: "warning", bgColor: "#fef3c7", textColor: "#92400e" },
  ABSENT: { label: "Nghỉ không phép", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" }
};

export default function AttendanceStatusBadge({ status, size = "small" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_CHECKED;
  
  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontWeight: 600,
        borderRadius: "6px"
      }}
    />
  );
}

export { STATUS_CONFIG };
