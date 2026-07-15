export const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: "Dashboard" },
  {
    label: "Sản lượng",
    icon: "Production",
    children: [
      { label: "Mài", path: "/grinding", icon: "Grinding" },
      { label: "Cắt", path: "/cutting", icon: "Cutting" },
      { label: "Nhiệt luyện", path: "/heat-treatment", icon: "HeatTreatment" },
    ],
  },
  { label: "Quản lý nhân viên", path: "/employees", icon: "Employees" },
  { label: "Lịch sử Import", path: "/import-history", icon: "History" },
  { label: "Báo cáo", path: "/reports", icon: "Reports" },
  { label: "Cài đặt", path: "/settings", icon: "Settings" },
];
