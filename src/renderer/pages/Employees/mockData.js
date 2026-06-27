export const DEPARTMENTS = ["Mài", "Cắt", "Khác"];
export const ROLES = ["Thống kê", "Trưởng ca", "Tổ trưởng", "Công nhân"];
export const STATUSES = ["Đang làm việc", "Nghỉ việc"];
export const SHIFTS = ["Ca 1", "Ca 2", "Ca 3", "Hành chính"];

// Helper to generate a random date in the past
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
    .toISOString()
    .split("T")[0];
}

export const generateMockEmployees = (count = 5000) => {
  const firstNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
  ];
  const middleNames = [
    "Thị",
    "Văn",
    "Hữu",
    "Đức",
    "Minh",
    "Ngọc",
    "Hoài",
    "Quang",
    "Xuân",
    "Thanh",
    "Tuấn",
    "Hoàng",
  ];
  const lastNames = [
    "Anh",
    "Bình",
    "Cường",
    "Dũng",
    "Em",
    "Phong",
    "Giang",
    "Hải",
    "Hương",
    "Kiên",
    "Linh",
    "Mai",
    "Nam",
    "Oanh",
    "Phương",
    "Quyên",
    "Sơn",
    "Trang",
    "Uyên",
    "Vinh",
    "Vy",
    "Yến",
  ];

  const employees = [];

  for (let i = 1; i <= count; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const mn = middleNames[Math.floor(Math.random() * middleNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fn} ${mn} ${ln}`;

    // Distribute roles (mostly workers)
    const roleRandom = Math.random();
    let role = "Công nhân";
    if (roleRandom > 0.98) role = "Thống kê";
    else if (roleRandom > 0.95) role = "Trưởng ca";
    else if (roleRandom > 0.85) role = "Tổ trưởng";

    const department =
      DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];

    // Status mostly active
    const status = Math.random() > 0.1 ? "Đang làm việc" : "Nghỉ việc";
    const shift = SHIFTS[Math.floor(Math.random() * SHIFTS.length)];

    const year = 2023 - Math.floor(Math.random() * 5);
    const joinDate = randomDate(new Date(year, 0, 1), new Date());

    employees.push({
      id: `EMP${String(i).padStart(4, "0")}`,
      fullName,
      gender: Math.random() > 0.5 ? "Nam" : "Nữ",
      phone: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0")}`,
      department,
      role,
      shift,
      status,
      joinDate,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      address: "Bắc Ninh, Việt Nam",
      notes: "",
    });
  }

  return employees;
};

// Generate 5000 employees for virtualization testing
export const MOCK_EMPLOYEES = generateMockEmployees(5000);
