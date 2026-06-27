import { Chip } from "@mui/material";

function EmployeeStatusChip({ status }) {
  const isActive = status === "Đang làm việc";
  
  return (
    <Chip
      label={isActive ? "Đang làm việc" : "Nghỉ việc"}
      size="small"
      sx={{
        backgroundColor: isActive ? "#ecfdf5" : "#fef2f2",
        color: isActive ? "#10b981" : "#ef4444",
        fontWeight: 600,
        borderRadius: "6px",
      }}
    />
  );
}

export default EmployeeStatusChip;
