export const GRINDING_EXCEL_HEADERS = [
  "Ngày báo sản lượng报产日期",
  "Đơn đặt hàng của khách hàng客户订单号",
  "Mã công đơn工单号",
  "Mã liệu料号",
  "Tên hàng品名",
  "Quy cách规格",
  "Số lượng hoàn thành完工数量",
  "Họ tên nhân viên员工名称",
  "Số lượng báo phế报废数量",
  "Đơn vị trọng lượng单位重量",
  "Trọng lượng hoàn thành完成重量"
];

export const GRINDING_DB_FIELDS = [
  "report_date",
  "customer_order_number",
  "work_order_number",
  "material_code",
  "item_name",
  "specification",
  "completed_quantity",
  "employee_name",
  "scrap_quantity",
  "unit_weight",
  "completed_weight"
];

// DataGrid columns definition
export const getGrindingDataGridColumns = () => [
  { field: "report_date", headerName: "Ngày báo sản lượng", width: 150 },
  { field: "customer_order_number", headerName: "Đơn đặt hàng", width: 180 },
  { field: "work_order_number", headerName: "Mã công đơn", width: 150 },
  { field: "material_code", headerName: "Mã liệu", width: 180 },
  { field: "item_name", headerName: "Tên hàng", flex: 1, minWidth: 200 },
  { field: "specification", headerName: "Quy cách", width: 250 },
  { field: "completed_quantity", headerName: "Số lượng hoàn thành", width: 160, type: "number" },
  { field: "employee_name", headerName: "Nhân viên", width: 160 },
  { field: "scrap_quantity", headerName: "Số lượng báo phế", width: 160, type: "number" },
  { field: "unit_weight", headerName: "Đơn vị trọng lượng", width: 160, type: "number" },
  { field: "completed_weight", headerName: "Trọng lượng hoàn thành", width: 180, type: "number" }
];
