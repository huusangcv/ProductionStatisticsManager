export function buildEmployeeSummary(rows, mode) {
  if (!rows || rows.length === 0 || !mode) return [];

  const employeeMap = new Map();

  for (const row of rows) {
    const empName = row.employee_name || row.employee_full_name || row.representative_code || "Khác";
    const repCode = String(row.representative_code || "").trim();
    let value = 0;
    if (mode === "cutting") {
      value = Number(row.joint_count) || 0;
    } else if (mode === "grinding") {
      value = Number(row.completed_quantity) || 0;
    } else if (mode === "personal") {
      if (row.sheet_name === "CẮT" || row.source_type === "cutting") {
        value = Number(row.joint_count) || 0;
      } else {
        value = Number(row.quantity) || Number(row.completed_quantity) || 0;
      }
    }

    if (value === 0 && !row.employee_name && !row.employee_full_name && !row.representative_code) continue;

    if (employeeMap.has(empName)) {
      employeeMap.get(empName).total += value;
    } else {
      employeeMap.set(empName, {
        name: empName,
        code: repCode || empName,
        total: value,
      });
    }
  }

  const result = Array.from(employeeMap.values());

  result.sort((a, b) => {
    return String(a.code).localeCompare(String(b.code), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return result;
}
