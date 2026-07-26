import React from "react";

/**
 * Cấu hình cột cho bảng Sản lượng cá nhân (Personal Production).
 * Định nghĩa cho Material UI DataGrid và cấu hình chỉnh sửa trực tiếp.
 */
export const PERSONAL_PRODUCTION_COLUMNS = [
  {
    field: "sheet_name",
    headerName: "Nguồn",
    width: 100,
    editable: false,
    renderCell: (params) => {
      const val = params.value;
      const isCutting = val === "CẮT";
      return React.createElement(
        "span",
        {
          style: {
            fontWeight: 600,
            color: isCutting ? "#0284c7" : "#d97706",
            backgroundColor: isCutting ? "#e0f2fe" : "#fef3c7",
            padding: "2px 8px",
            borderRadius: "6px",
            fontSize: "12px",
          },
        },
        val || "—"
      );
    },
  },
  {
    field: "work_date",
    headerName: "Ngày",
    width: 120,
    editable: false,
  },
  {
    field: "customer_order_number",
    headerName: "Đơn đặt hàng",
    width: 160,
    editable: false,
  },
  {
    field: "job_code",
    headerName: "Mã công đơn",
    width: 150,
    editable: false,
  },
  {
    field: "material_code",
    headerName: "Mã liệu",
    width: 160,
    editable: false,
  },
  {
    field: "product_name",
    headerName: "Tên hàng",
    flex: 1,
    minWidth: 200,
    editable: false,
  },
  {
    field: "specification",
    headerName: "Quy cách",
    width: 220,
    editable: false,
  },
  {
    field: "detail",
    headerName: "Chi tiết kết xâu",
    width: 160,
    editable: true,
  },
  {
    field: "joint_count",
    headerName: "Số xâu",
    width: 120,
    type: "number",
    editable: true,
    align: "right",
    headerAlign: "right",
  },
  {
    field: "quantity",
    headerName: "Số lượng",
    width: 130,
    type: "number",
    editable: true,
    align: "right",
    headerAlign: "right",
  },
  {
    field: "representative_code",
    headerName: "Mã đại diện",
    width: 130,
    editable: true,
  },
  {
    field: "employee_code",
    headerName: "Mã nhân viên",
    width: 140,
    editable: true,
  },
  {
    field: "employee_name",
    headerName: "Tên nhân viên",
    width: 180,
    editable: true,
  },
];
