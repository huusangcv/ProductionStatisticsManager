const { openDatabase } = require("./connection");
const { getDatabasePath } = require("./paths");



/**
 * Khởi tạo bảng personal_production và các chỉ mục (index) cần thiết
 */
function ensurePersonalProductionTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS personal_production (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        work_date           TEXT    NOT NULL,
        source_type         TEXT    NOT NULL,
        source_id           INTEGER NOT NULL,
        employee_code       TEXT,
        employee_name       TEXT,
        representative_code TEXT,
        customer_order_number TEXT,
        job_code            TEXT,
        material_code       TEXT,
        product_name        TEXT,
        specification       TEXT,
        detail              TEXT,
        quantity            REAL,
        joint_count         REAL DEFAULT 0,
        sheet_name          TEXT    NOT NULL,
        created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        is_edited           INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_personal_production_date_source 
      ON personal_production(work_date, source_type);
    `);

    const columns = db.prepare("PRAGMA table_info(personal_production)").all().map(c => c.name);
    if (!columns.includes("joint_count")) {
      db.exec("ALTER TABLE personal_production ADD COLUMN joint_count REAL DEFAULT 0");
    }
    if (!columns.includes("customer_order_number")) {
      db.exec("ALTER TABLE personal_production ADD COLUMN customer_order_number TEXT");
    }
  } finally {
    db.close();
  }
}

/**
 * Lấy danh sách sản lượng cá nhân theo ngày
 */
function enrichPersonalProductionRows(db, rows) {
  if (!rows || rows.length === 0) return rows;

  const allEmps = db
    .prepare(`
      SELECT e.representative_code, e.employee_code, e.full_name, r.code AS role_code
      FROM employees e
      JOIN roles r ON r.id = e.role_id
      WHERE r.code IN ('CUT', 'GRIND')
    `)
    .all();

  const cutMap = new Map();
  const grindMap = new Map();

  for (const emp of allEmps) {
    const rep = String(emp.representative_code || "").trim();
    if (!rep) continue;
    const map = emp.role_code === "CUT" ? cutMap : grindMap;
    if (!map.has(rep)) map.set(rep, []);
    map.get(rep).push(emp);
  }

  for (const row of rows) {
    const isGrind = row.source_type === "grinding" || row.sheet_name === "MÀI";
    const rep = String(row.representative_code || "").trim();
    const map = isGrind ? grindMap : cutMap;
    const emps = map.get(rep) || [];

    if (isGrind) {
      if (emps.length > 0) {
        const cleanedCodes = emps
          .map((e) => String(e.employee_code || "").trim().replace(/^[Vv]/, ""))
          .filter(Boolean);
        row.employee_code = cleanedCodes.length > 0 ? cleanedCodes.join(" ") : (row.employee_code || rep || null);
        row.employee_name = emps.map((e) => e.full_name).filter(Boolean).join(", ") || row.employee_name || null;
      } else if (row.employee_code) {
        row.employee_code = String(row.employee_code)
          .trim()
          .split(/\s+/)
          .map((c) => c.replace(/^[Vv]/, ""))
          .join(" ");
      }
    } else {
      const emp = emps[0];
      if (emp) {
        row.employee_code = emp.employee_code || row.employee_code || null;
        row.employee_name = emp.full_name || row.employee_name || null;
      }
      if (row.employee_code) {
        row.employee_code = String(row.employee_code).trim().replace(/^[Vv]/, "");
      }
    }
  }

  return rows;
}

function getByDate(workDate) {
  const db = openDatabase();
  try {
    const rows = db
      .prepare(`
        SELECT p.*
        FROM personal_production p
        WHERE p.work_date = ?
        ORDER BY p.sheet_name ASC, p.id ASC
      `)
      .all(workDate);
    return enrichPersonalProductionRows(db, rows);
  } finally {
    db.close();
  }
}

/**
 * Lấy danh sách sản lượng cá nhân theo khoảng thời gian
 */
function getByDateRange(startDate, endDate) {
  const db = openDatabase();
  try {
    const rows = db
      .prepare(`
        SELECT p.*
        FROM personal_production p
        WHERE p.work_date >= ? AND p.work_date <= ?
        ORDER BY p.sheet_name ASC, p.id ASC
      `)
      .all(startDate, endDate);
    return enrichPersonalProductionRows(db, rows);
  } finally {
    db.close();
  }
}

/**
 * Kiểm tra dữ liệu trong ngày đã tồn tại hay chưa theo nguồn (sourceTypes = ['cutting', 'grinding'])
 */
function checkExists(workDate, sources = ["cutting", "grinding"]) {
  if (!sources || sources.length === 0) return false;
  const db = openDatabase();
  try {
    const placeholders = sources.map(() => "?").join(",");
    const row = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM personal_production
        WHERE work_date = ? AND source_type IN (${placeholders})
      `)
      .get(workDate, ...sources);
    return (row?.count || 0) > 0;
  } finally {
    db.close();
  }
}

/**
 * Xóa dữ liệu theo ngày và nguồn
 */
function deleteByDateAndSources(workDate, sources = ["cutting", "grinding"]) {
  if (!sources || sources.length === 0) return { ok: true, deletedCount: 0 };
  const db = openDatabase();
  try {
    const placeholders = sources.map(() => "?").join(",");
    const result = db
      .prepare(`
        DELETE FROM personal_production
        WHERE work_date = ? AND source_type IN (${placeholders})
      `)
      .run(workDate, ...sources);
    return { ok: true, deletedCount: result.changes };
  } finally {
    db.close();
  }
}

/**
 * Thêm danh sách bản ghi mới (sử dụng transaction)
 */
function insertBatch(records) {
  if (!records || records.length === 0) return { ok: true, insertedCount: 0 };
  const db = openDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO personal_production (
        work_date, source_type, source_id, employee_code, employee_name,
        representative_code, customer_order_number, job_code, material_code, product_name,
        specification, detail, quantity, joint_count, sheet_name, created_at, updated_at, is_edited
      ) VALUES (
        @work_date, @source_type, @source_id, @employee_code, @employee_name,
        @representative_code, @customer_order_number, @job_code, @material_code, @product_name,
        @specification, @detail, @quantity, @joint_count, @sheet_name,
        datetime('now', 'localtime'), datetime('now', 'localtime'), 0
      )
    `);

    const insertMany = db.transaction((rows) => {
      let count = 0;
      for (const row of rows) {
        stmt.run({
          work_date: row.work_date || "",
          source_type: row.source_type || "",
          source_id: row.source_id || 0,
          employee_code: row.employee_code || null,
          employee_name: row.employee_name || null,
          representative_code: row.representative_code || null,
          customer_order_number: row.customer_order_number || null,
          job_code: row.job_code || null,
          material_code: row.material_code || null,
          product_name: row.product_name || null,
          specification: row.specification || null,
          detail: row.detail || null,
          quantity: Number(row.quantity) || 0,
          joint_count: Number(row.joint_count) || 0,
          sheet_name: row.sheet_name || "",
        });
        count++;
      }
      return count;
    });

    const insertedCount = insertMany(records);
    return { ok: true, insertedCount };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Cập nhật thông tin khi người dùng chỉnh sửa trên DataGrid
 */
function updateRecord(id, data) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(`
        UPDATE personal_production
        SET employee_code = COALESCE(@employee_code, employee_code),
            employee_name = COALESCE(@employee_name, employee_name),
            representative_code = COALESCE(@representative_code, representative_code),
            customer_order_number = COALESCE(@customer_order_number, customer_order_number),
            quantity = COALESCE(@quantity, quantity),
            joint_count = COALESCE(@joint_count, joint_count),
            detail = COALESCE(@detail, detail),
            is_edited = 1,
            updated_at = datetime('now', 'localtime')
        WHERE id = @id
      `)
      .run({
        id,
        employee_code: data.employee_code ?? null,
        employee_name: data.employee_name ?? null,
        representative_code: data.representative_code ?? null,
        customer_order_number: data.customer_order_number ?? null,
        quantity: data.quantity !== undefined && data.quantity !== null ? Number(data.quantity) : null,
        joint_count: data.joint_count !== undefined && data.joint_count !== null ? Number(data.joint_count) : null,
        detail: data.detail ?? null,
      });

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy dòng dữ liệu ID ${id}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensurePersonalProductionTable,
  getByDate,
  getByDateRange,
  checkExists,
  deleteByDateAndSources,
  insertBatch,
  updateRecord,
};
