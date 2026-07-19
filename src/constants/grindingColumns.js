export const GRINDING_COLUMNS = [
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
    width: 180,
  },
  {
    excelHeader: "Mã công đơn工单号",
    databaseField: "work_order_number",
    headerName: "Mã công đơn",
    width: 150,
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
    databaseField: "employee_name",
    headerName: "Nhân viên",
    width: 160,
  },
  {
    excelHeader: "Số lượng báo phế报废数量",
    databaseField: "scrap_quantity",
    headerName: "Số lượng báo phế",
    width: 160,
    type: "number",
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

  // If already in dd/MM/yyyy format, just return it
  if (dateStr.includes("/")) {
    return dateStr;
  }

  // If in yyyy-MM-dd format, convert to dd/MM/yyyy
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

// Extracted for DataGrid definitions
export const getGrindingDataGridColumns = () => {
  return GRINDING_COLUMNS.map((col) => {
    const dataGridCol = {
      field: col.databaseField,
      headerName: col.headerName,
      width: col.width,
    };
    if (col.flex) dataGridCol.flex = col.flex;
    if (col.minWidth) dataGridCol.minWidth = col.minWidth;
    if (col.type) dataGridCol.type = col.type;
    if (col.databaseField === "report_date") {
      dataGridCol.renderCell = (params) => {
        const formatted = formatDateForUI(params.row?.report_date);
        return formatted;
      };
    }
    return dataGridCol;
  });
};
