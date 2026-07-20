import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  gridFilteredSortedRowEntriesSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import {
  computeProductionSummaryTotals,
  formatProductionQuantity,
  formatProductionWeight,
} from "../../utils/productionSummaryFormat";

const getSummaryItems = (mode) => {
  const items = [
    { key: "completedQuantity", label: "Tổng SL hoàn thành", format: formatProductionQuantity },
    { key: "scrapQuantity", label: "Tổng SL báo phế", format: formatProductionQuantity },
    { key: "unitWeight", label: "Tổng đơn vị trọng lượng", format: formatProductionWeight },
    { key: "completedWeight", label: "Tổng trọng lượng hoàn thành", format: formatProductionWeight },
  ];
  if (mode === "cutting") {
    items.push({ key: "jointCount", label: "Tổng số xâu", format: formatProductionQuantity });
  }
  return items;
};

function SummaryFooter({ summaryMode }) {
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredRowEntries = useGridSelector(apiRef, gridFilteredSortedRowEntriesSelector);

  const totals = useMemo(
    () => computeProductionSummaryTotals(filteredRowEntries.map(({ model }) => model)),
    [filteredRowEntries],
  );

  const items = getSummaryItems(summaryMode);

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
      }}
    >
      {items.map(({ key, label, format }) => (
        <Box key={key} sx={{ textAlign: "right", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {label}
          </Typography>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {format(totals[key])}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default SummaryFooter;
