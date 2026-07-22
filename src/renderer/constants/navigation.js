export const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: "Dashboard" },
  {
    label: "Sản lượng",
    icon: "Production",
    children: [
      { label: "Mài", path: "/grinding", icon: "Grinding" },
      { label: "Cắt", path: "/cutting", icon: "Cutting" },
      { label: "Xử lý nhiệt", path: "/heat-treatment", icon: "HeatTreatment" },
      { label: "Báo Phế Đúc", path: "/casting-defect", icon: "CastingDefect" },
    ],
  },
  {
    label: "Danh mục",
    icon: "Employees",
    children: [
      { label: "Nhân viên", path: "/employees" },
      { label: "Vai trò", path: "/roles" },
      { label: "Chức vụ", path: "/positions" },
      { label: "Chi tiết kết xâu", path: "/detail-joint" },
    ],
  },
  { label: "Lịch sử Import", path: "/import-history", icon: "History" },
  { label: "Báo cáo", path: "/reports", icon: "Reports" },
  { label: "Cài đặt", path: "/settings", icon: "Settings" },
];
