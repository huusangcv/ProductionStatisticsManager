export function buildEmployeeSummary(rows, mode) {
  if (!rows || rows.length === 0 || !mode) return [];

  const employeeMap = new Map();

  for (const row of rows) {
    const empName = row.employee_full_name || row.representative_code || "Khác";
    const value = mode === "cutting" ? (row.joint_count || 0) : (row.completed_quantity || 0);

    if (value === 0 && !row.employee_full_name && !row.representative_code) continue;

    if (employeeMap.has(empName)) {
      employeeMap.set(empName, employeeMap.get(empName) + value);
    } else {
      employeeMap.set(empName, value);
    }
  }

  const result = Array.from(employeeMap.entries()).map(([name, total]) => ({
    name,
    total,
  }));

  result.sort((a, b) => b.total - a.total);

  return result;
}
