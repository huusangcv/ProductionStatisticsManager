const { openDatabase } = require("./connection");
const { getDatabasePath } = require("./paths");



/**
 * Builds the WHERE clause for date filtering
 */
function buildDateCondition(fromDate, toDate) {
  if (fromDate && toDate) {
    return {
      sql: ` AND report_date >= @fromDate AND report_date <= @toDate `,
      params: { fromDate, toDate }
    };
  }
  return { sql: "", params: {} };
}

function getTableName(type) {
  return type === "Cắt" ? "cutting_production" : "grinding_production";
}

function getRoleCode(type) {
  return type === "Cắt" ? "CUT" : "GRIND";
}

function enrichDashboardRows(db, rows, roleCode) {
  if (!rows || rows.length === 0) return rows;

  const allEmps = db
    .prepare(`
      SELECT e.representative_code, e.employee_code, e.full_name, pos.name AS position_name
      FROM employees e
      LEFT JOIN roles r ON r.id = e.role_id
      LEFT JOIN positions pos ON pos.id = e.position_id
      WHERE r.code = ?
    `)
    .all(roleCode);

  const empMap = new Map();
  for (const emp of allEmps) {
    const rep = String(emp.representative_code || "").trim();
    if (!rep) continue;
    if (!empMap.has(rep)) empMap.set(rep, []);
    empMap.get(rep).push(emp);
  }

  const isGrind = roleCode === "GRIND" || roleCode === "MÀI" || String(roleCode).toLowerCase() === "mài";

  for (const row of rows) {
    const rep = String(row.representative_code || "").trim();
    const emps = empMap.get(rep) || [];

    if (isGrind) {
      const cleanedCodes = emps
        .map((e) => String(e.employee_code || "").trim().replace(/^[Vv]/, ""))
        .filter(Boolean);
      row.employee_code = cleanedCodes.length > 0 ? cleanedCodes.join(" ") : null;
      row.employee_full_name = emps.map((e) => e.full_name).filter(Boolean).join(", ") || null;
      row.position_name = emps.map((e) => e.position_name).filter(Boolean).join(", ") || null;
      if (!row.role_name) row.role_name = "Mài";
    } else {
      const emp = emps[0];
      row.employee_code = emp && emp.employee_code ? String(emp.employee_code).trim().replace(/^[Vv]/, "") : null;
      row.employee_full_name = emp ? emp.full_name : null;
      row.position_name = emp ? emp.position_name : null;
      if (!row.role_name) row.role_name = "Cắt";
    }
  }

  return rows;
}

function getDashboardKPIs(type, fromDate, toDate) {
  const db = openDatabase();
  try {
    const tableName = getTableName(type);
    const dateCond = buildDateCondition(fromDate, toDate);
    
    const scrapQuery = tableName === "cutting_production"
      ? "0 as total_scrap"
      : "SUM(scrap_quantity) as total_scrap";

    // Total quantity, weight, scrap, and rows
    const statsQuery = `
      SELECT 
        SUM(completed_quantity) as total_quantity,
        SUM(completed_weight) as total_weight,
        ${scrapQuery},
        COUNT(*) as total_rows
      FROM ${tableName}
      WHERE 1=1 ${dateCond.sql}
    `;
    const stats = db.prepare(statsQuery).get(dateCond.params);

    // Total unique employees with production
    const empQuery = `
      SELECT COUNT(DISTINCT representative_code) as total_employees
      FROM ${tableName}
      WHERE representative_code IS NOT NULL AND representative_code != '' ${dateCond.sql}
    `;
    const empStats = db.prepare(empQuery).get(dateCond.params);

    return {
      ok: true,
      data: {
        total_quantity: stats.total_quantity || 0,
        total_weight: stats.total_weight || 0,
        total_scrap: stats.total_scrap || 0,
        total_rows: stats.total_rows || 0,
        total_employees: empStats.total_employees || 0,
      }
    };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getTopEmployees(type, fromDate, toDate) {
  const db = openDatabase();
  try {
    const tableName = getTableName(type);
    const roleCode = getRoleCode(type);
    const dateCond = buildDateCondition(fromDate, toDate);

    const query = `
      SELECT 
        p.representative_code,
        SUM(p.completed_quantity) as total_quantity,
        r.name as role_name
      FROM ${tableName} p
      LEFT JOIN roles r ON r.code = '${roleCode}'
      WHERE 1=1 ${dateCond.sql}
      GROUP BY p.representative_code
      ORDER BY total_quantity DESC
      LIMIT 5
    `;
    
    const rows = db.prepare(query).all(dateCond.params);
    enrichDashboardRows(db, rows, roleCode);
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getTopWorkOrders(type, fromDate, toDate) {
  const db = openDatabase();
  try {
    const tableName = getTableName(type);
    const dateCond = buildDateCondition(fromDate, toDate);

    const query = `
      SELECT 
        work_order_number,
        SUM(completed_quantity) as total_quantity
      FROM ${tableName}
      WHERE work_order_number IS NOT NULL AND work_order_number != '' ${dateCond.sql}
      GROUP BY work_order_number
      ORDER BY total_quantity DESC
      LIMIT 5
    `;
    
    const rows = db.prepare(query).all(dateCond.params);
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getProductionByDate(type, fromDate, toDate) {
  const db = openDatabase();
  try {
    const tableName = getTableName(type);
    const dateCond = buildDateCondition(fromDate, toDate);

    const query = `
      SELECT 
        report_date,
        SUM(completed_quantity) as total_quantity
      FROM ${tableName}
      WHERE report_date IS NOT NULL AND report_date != '' ${dateCond.sql}
      GROUP BY report_date
      ORDER BY report_date ASC
    `;
    
    const rows = db.prepare(query).all(dateCond.params);
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getDashboardGridData(type, fromDate, toDate) {
  const db = openDatabase();
  try {
    const tableName = getTableName(type);
    const roleCode = getRoleCode(type);
    const dateCond = buildDateCondition(fromDate, toDate);

    const query = `
      SELECT 
        p.*,
        r.name as role_name
      FROM ${tableName} p
      LEFT JOIN roles r ON r.code = '${roleCode}'
      WHERE 1=1 ${dateCond.sql}
      ORDER BY p.report_date DESC, p.id DESC
    `;
    
    const rows = db.prepare(query).all(dateCond.params);
    enrichDashboardRows(db, rows, roleCode);
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  getDashboardKPIs,
  getTopEmployees,
  getTopWorkOrders,
  getProductionByDate,
  getDashboardGridData
};
