import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Popover, useTheme } from "@mui/material";
import {
  gridFilteredSortedRowEntriesSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  computeProductionSummaryTotals,
  formatProductionQuantity,
  formatProductionWeight,
  formatProductionPrice,
} from "../../utils/productionSummaryFormat";
import { buildEmployeeSummary } from "../../utils/productionSummary";

const getSummaryItems = (mode) => {
  if (mode === "personal") {
    return [
      { key: "cuttingQuantity", label: "Tổng SL hoàn thành cắt", format: formatProductionQuantity },
      { key: "grindingQuantity", label: "Tổng SL hoàn thành mài", format: formatProductionQuantity },
      { key: "cuttingJointCount", label: "Tổng số xâu cắt", format: formatProductionQuantity },
    ];
  }
  const items = [
    { key: "completedQuantity", label: "Tổng SL hoàn thành", format: formatProductionQuantity },
    { key: "scrapQuantity", label: "Tổng SL báo phế", format: formatProductionQuantity },
    { key: "unitWeight", label: "Tổng đơn vị trọng lượng", format: formatProductionWeight },
    { key: "completedWeight", label: "Tổng trọng lượng hoàn thành", format: formatProductionWeight },
  ];
  if (mode === "cutting") {
    items.push({ key: "jointCount", label: "Tổng số xâu", format: formatProductionQuantity });
    items.push({ key: "totalPrice", label: "Tổng Tiền Cắt", format: formatProductionPrice });
  } else if (mode === "grinding") {
    items.push({ key: "totalPrice", label: "Tổng Tiền Mài", format: formatProductionPrice });
  }
  return items;
};

function SummaryFooter({ summaryMode }) {
  const theme = useTheme();
  const apiRef = useGridApiContext();
  const filteredRowEntries = useGridSelector(apiRef, gridFilteredSortedRowEntriesSelector);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const totals = useMemo(
    () => computeProductionSummaryTotals(filteredRowEntries.map(({ model }) => model)),
    [filteredRowEntries],
  );

  const employeeSummary = useMemo(
    () => buildEmployeeSummary(filteredRowEntries.map(({ model }) => model), summaryMode),
    [filteredRowEntries, summaryMode]
  );

  const items = getSummaryItems(summaryMode);
  const hasEmployees = employeeSummary && employeeSummary.length > 0;
  const empTitle = summaryMode === "cutting" ? "Tổng số xâu theo nhân viên" : "Tổng sản lượng theo nhân viên";

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
      {hasEmployees && (
        <>
          <Button
            size="small"
            variant="outlined"
            onClick={handleClick}
            startIcon={<GroupsRoundedIcon sx={{ fontSize: "18px !important", color: "#2563EB" }} />}
            endIcon={open ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              borderColor: open ? "#2563EB" : "#E2E8F0",
              bgcolor: open ? "#EFF6FF" : "#F8FAFC",
              color: "#1E293B",
              fontWeight: 600,
              fontSize: 13,
              px: 1.5,
              py: 0.5,
              height: 34,
              mr: "auto",
              "&:hover": {
                bgcolor: "#EFF6FF",
                borderColor: "#60A5FA",
              },
            }}
          >
            {empTitle} ({employeeSummary.length})
          </Button>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            slotProps={{
              paper: {
                sx: {
                  p: 2,
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                  border: "1px solid #E2E8F0",
                  maxWidth: 550,
                  maxHeight: 320,
                  mb: 1,
                },
              },
            }}
          >
            <Box sx={{ mb: 1.2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                {empTitle}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                {employeeSummary.length} nhân viên
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", overflowY: "auto", maxHeight: 250 }}>
              {employeeSummary.map((emp) => (
                <Chip
                  key={emp.name}
                  label={
                    <Box sx={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>{emp.name}</Typography>
                      <Typography sx={{ color: "#94A3B8", fontSize: 10 }}>•</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#2563EB" }}>
                        {emp.total.toLocaleString("vi-VN")}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    height: 30,
                    borderRadius: "15px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      backgroundColor: "#EFF6FF",
                      borderColor: "#BFDBFE",
                    },
                  }}
                />
              ))}
            </Box>
          </Popover>
        </>
      )}

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
