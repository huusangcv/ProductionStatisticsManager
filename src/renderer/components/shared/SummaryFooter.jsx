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

const SUMMARY_ITEMS = [
  { key: "completedQuantity", label: "Tổng SL hoàn thành", format: formatProductionQuantity },
  { key: "scrapQuantity", label: "Tổng SL báo phế", format: formatProductionQuantity },
  { key: "unitWeight", label: "Tổng đơn vị trọng lượng", format: formatProductionWeight },
  { key: "completedWeight", label: "Tổng trọng lượng hoàn thành", format: formatProductionWeight },
];

function SummaryFooter() {
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredRowEntries = useGridSelector(apiRef, gridFilteredSortedRowEntriesSelector);

  const totals = useMemo(
    () => computeProductionSummaryTotals(filteredRowEntries.map(({ model }) => model)),
    [filteredRowEntries],
  );

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
      {SUMMARY_ITEMS.map(({ key, label, format }) => (
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
