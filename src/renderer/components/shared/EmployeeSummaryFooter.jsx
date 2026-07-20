import { useMemo } from "react";
import { Box, Typography, Chip, useTheme } from "@mui/material";
import {
  gridFilteredSortedRowEntriesSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import { buildEmployeeSummary } from "../../utils/productionSummary";

function EmployeeSummaryFooter({ summaryMode }) {
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredRowEntries = useGridSelector(apiRef, gridFilteredSortedRowEntriesSelector);

  const employeeSummary = useMemo(
    () => buildEmployeeSummary(filteredRowEntries.map(({ model }) => model), summaryMode),
    [filteredRowEntries, summaryMode]
  );

  if (!employeeSummary || employeeSummary.length === 0) {
    return null;
  }

  const title = summaryMode === "cutting" ? "Tổng số xâu theo nhân viên" : "Tổng sản lượng theo nhân viên";

  return (
    <Box
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        px: theme.spacing(2),
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {employeeSummary.map((emp) => (
          <Chip
            key={emp.name}
            label={
              <Box sx={{ display: "flex", gap: "4px" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{emp.name}</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 12 }}>•</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#2563EB" }}>
                  {emp.total.toLocaleString("vi-VN")}
                </Typography>
              </Box>
            }
            sx={{
              height: 28,
              borderRadius: "14px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              "&:hover": {
                backgroundColor: "#EFF6FF",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default EmployeeSummaryFooter;
