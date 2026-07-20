const { getDashboardKPIs, getTopEmployees } = require("./src/electron/sqlite/dashboard.js");

console.log("KPIs (Mài):", getDashboardKPIs("Mài", "2026-07-01", "2026-07-31"));
console.log("Employees (Mài):", getTopEmployees("Mài", "2026-07-01", "2026-07-31"));

console.log("KPIs no date:", getDashboardKPIs("Mài", "", ""));
