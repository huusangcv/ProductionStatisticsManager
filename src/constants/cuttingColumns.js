/**
 * Cutting Production column specification.
 * Single source of truth for Excel headers, database field names, and DataGrid config.
 *
 * NOTE: "Họ tên nhân viên 员工名称" in Excel = representative_code (mã đại diện), NOT the employee name.
 * Note: Cutting does NOT have a "Số lượng báo phế" (scrap_quantity) column.
 */
export const CUTTING_COLUMNS = [
  {
    excelHeader: "Ngày báo sản lượng报产日期",
    databaseField: "report_date",
    headerName: "Ngày báo sản lượng",
    width: 150,
  },
  {
    excelHeader: "Đơn đặt hàng của khách hàng客户订单号",
    databaseField: "customer_order_number",
    headerName: "Đơn đặt hàng",
    width: 200,
  },
  {
    excelHeader: "Mã công đơn工单号",
    databaseField: "work_order_number",
    headerName: "Mã công đơn",
    width: 180,
  },
  {
    excelHeader: "Mã liệu料号",
    databaseField: "material_code",
    headerName: "Mã liệu",
    width: 180,
  },
  {
    excelHeader: "Chi tiết kết xâu",
    databaseField: "joint_detail",
    headerName: "Chi tiết kết xâu",
    width: 180,
  },
  {
    excelHeader: "Số xâu",
    databaseField: "joint_count",
    headerName: "Số xâu",
    width: 150,
    type: "number",
  },
  {
    excelHeader: "Tên hàng品名",
    databaseField: "item_name",
    headerName: "Tên hàng",
    flex: 1,
    minWidth: 200,
  },
  {
    excelHeader: "Quy cách规格",
    databaseField: "specification",
    headerName: "Quy cách",
    width: 250,
  },
  {
    excelHeader: "Số lượng hoàn thành完工数量",
    databaseField: "completed_quantity",
    headerName: "Số lượng hoàn thành",
    width: 160,
    type: "number",
  },
  {
    excelHeader: "Họ tên nhân viên员工名称",
    databaseField: "representative_code",
    headerName: "Mã đại diện",
    width: 130,
  },
  {
    // Computed via JOIN — not in Excel
    databaseField: "employee_full_name",
    headerName: "Tên nhân viên",
    width: 180,
  },
  {
    // Computed via JOIN — not in Excel
    databaseField: "role_name",
    headerName: "Vai trò",
    width: 130,
  },
  {
    // Computed via JOIN — not in Excel
    databaseField: "position_name",
    headerName: "Chức vụ",
    width: 120,
  },
  {
    excelHeader: "Đơn vị trọng lượng单位重量",
    databaseField: "unit_weight",
    headerName: "Đơn vị trọng lượng",
    width: 160,
    type: "number",
  },
  {
    excelHeader: "Trọng lượng hoàn thành完成重量",
    databaseField: "completed_weight",
    headerName: "Trọng lượng hoàn thành",
    width: 180,
    type: "number",
  },
];

const formatDateForUI = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const getCuttingDataGridColumns = () => {
  return CUTTING_COLUMNS.map((col) => {
    const gridCol = {
      field: col.databaseField,
      headerName: col.headerName,
      width: col.width,
    };
    if (col.flex) gridCol.flex = col.flex;
    if (col.minWidth) gridCol.minWidth = col.minWidth;
    if (col.type) gridCol.type = col.type;
    if (col.databaseField === "report_date") {
      gridCol.renderCell = (params) => {
        const formatted = formatDateForUI(params.row?.report_date);
        return formatted;
      };
    }
    return gridCol;
  });
};
