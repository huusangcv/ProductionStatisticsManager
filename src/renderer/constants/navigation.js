export const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: "Dashboard" },
  { label: "Điểm danh", path: "/attendance", icon: "Attendance" },
  {
    label: "Sản lượng",
    icon: "Production",
    children: [
      { label: "Cắt", path: "/cutting", icon: "Cutting" },
      { label: "Mài", path: "/grinding", icon: "Grinding" },
      { label: "Xử lý nhiệt", path: "/heat-treatment", icon: "HeatTreatment" },
      { label: "Báo Phế Đúc", path: "/casting-defect", icon: "CastingDefect" },
      { label: "Sản lượng cá nhân", path: "/personal-production" },
    ],
  },
  { label: "Đăng ký tăng ca", path: "/overtime", icon: "Overtime" },
  {
    label: "Danh mục",
    icon: "Employees",
    adminOnly: true,
    children: [
      { label: "Nhân viên", path: "/employees" },
      { label: "Vai trò", path: "/roles" },
      { label: "Chức vụ", path: "/positions" },
      { label: "Chi tiết kết xâu", path: "/detail-joint" },
      { label: "Đơn giá gia công", path: "/prices" },
    ],
  },
  { label: "Lịch sử Import", path: "/import-history", icon: "History", adminOnly: true },
  { label: "Cài đặt", path: "/settings", icon: "Settings", adminOnly: true },
];
