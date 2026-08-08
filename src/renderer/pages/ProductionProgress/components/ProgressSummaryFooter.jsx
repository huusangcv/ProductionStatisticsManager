import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  gridFilteredSortedRowEntriesSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";

export default function ProgressSummaryFooter() {
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredRowEntries = useGridSelector(apiRef, gridFilteredSortedRowEntriesSelector);

  const kpi = useMemo(() => {
    let pendingCutting = 0;
    let pendingGrinding = 0;
    let overdueCutting = 0;
    let overdueGrinding = 0;
    let missingCuttingQty = 0;
    let missingGrindingQty = 0;
    let totalPendingStrings = 0;

    filteredRowEntries.forEach(({ model: r }) => {
      if (r.status === "Chưa Cắt" || r.status === "Đang Cắt" || r.status === "Quá hạn Cắt") pendingCutting++;
      if (r.status === "Chờ Mài" || r.status === "Đang Mài" || r.status === "Quá hạn Mài") pendingGrinding++;
      if (r.status === "Quá hạn Cắt") overdueCutting++;
      if (r.status === "Quá hạn Mài") overdueGrinding++;
      
      missingCuttingQty += r.missing_cutting || 0;
      missingGrindingQty += r.missing_grinding || 0;
      totalPendingStrings += (r.pending_cutting_strings || 0) + (r.pending_grinding_strings || 0);
    });

    return [
      { label: "Đơn chờ cắt", value: pendingCutting, color: "#1967D2" },
      { label: "Đơn chờ mài", value: pendingGrinding, color: "#B06000" },
      { label: "Quá hạn cắt", value: overdueCutting, color: "#C5221F" },
      { label: "Quá hạn mài", value: overdueGrinding, color: "#C5221F" },
      { label: "Tổng SL chờ cắt", value: missingCuttingQty, color: "#0F9D58" },
      { label: "Tổng SL chờ mài", value: missingGrindingQty, color: "#0F9D58" },
      { label: "Xâu còn chờ", value: Math.round(totalPendingStrings * 10) / 10, color: "#E37400" },
    ];
  }, [filteredRowEntries]);

  return (
    <Box
      sx={{
        height: 52,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        px: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(4),
        width: "100%",
        boxSizing: "border-box",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: 4,
        },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: theme.palette.divider,
          borderRadius: 2,
        }
      }}
    >
      {kpi.map((item, index) => (
        <Box key={index} sx={{ textAlign: "right", minWidth: 0, flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {item.label}
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: item.color }} noWrap>
            {item.value.toLocaleString("vi-VN")}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
