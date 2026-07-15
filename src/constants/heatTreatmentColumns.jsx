import { Box } from "@mui/material";

export const HEAT_TREATMENT_PREVIEW_COLUMNS = [
  { field: "stt",                   headerName: "STT",           width: 56,  type: "number" },
  { field: "customer_order_number", headerName: "Đơn đặt hàng",  width: 140 },
  { field: "work_order_number",     headerName: "Mã CĐ",         width: 130 },
  { field: "material_code",         headerName: "Mã liệu",       width: 140 },
  { field: "item_name",             headerName: "Tên hàng",      flex: 1, minWidth: 180 },
  { field: "specification",         headerName: "Quy cách",      width: 160 },
  { field: "completed_quantity",    headerName: "SL HT",         width: 90,  type: "number" },
  { field: "unit_weight",           headerName: "Đơn trọng",     width: 100, type: "number" },
  { field: "completed_weight",      headerName: "TL HT (kg)",    width: 110, type: "number" },
  {
    field: "classification",
    headerName: "Phân loại",
    width: 100,
    renderCell: (params) => (
      <Box
        sx={{
          px: 1,
          py: 0.25,
          borderRadius: 1,
          fontSize: 12,
          fontWeight: 600,
          bgcolor: params.value === "XLN" ? "#FEF3C7" : "#EFF6FF",
          color: params.value === "XLN" ? "#92400E"  : "#1E40AF",
          display: "inline-block",
        }}
      >
        {params.value}
      </Box>
    ),
  },
];
