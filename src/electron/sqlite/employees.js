const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/**
 * Creates the employees table if it does not exist.
 * Designed to support: Excel import, production statistics, reports, mapping.
 */
function ensureEmployeesTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_code   TEXT    UNIQUE NOT NULL,
        employee_name   TEXT    NOT NULL,
        role_code       TEXT,
        department      TEXT,
        phone           TEXT,
        status          TEXT    DEFAULT 'Đang làm việc',
        hire_date       TEXT,
        note            TEXT,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const SEED_EMPLOYEES = [
  { code: "V1171", name: "Đinh Thế Trung Nguyên", role: "Tổ trưởng", phone: "0912345678", note: "" },
  { code: "V1781", name: "Trang Quang Khánh", role: "Trưởng ca", phone: "0923456789", note: "" },
  { code: "V3277", name: "Lê Hữu Sang", role: "Nhân viên", phone: "0934567890", note: "" },
  { code: "V1245", name: "Phan Văn Đợi", role: "Công nhân", phone: "0945678901", note: "" },
  { code: "V1247", name: "Phạm Hoàng Lên", role: "Công nhân", phone: "0956789012", note: "" },
  { code: "V1264", name: "Phạm Hoàng Xia", role: "Công nhân", phone: "0967890123", note: "" },
  { code: "V3075", name: "Phạm Hoàng Sống", role: "Công nhân", phone: "0978901234", note: "" },
  { code: "V1369", name: "Đinh Văn Khang", role: "Công nhân", phone: "0989012345", note: "" },
  { code: "V1602", name: "Nguyễn Thanh Vân", role: "Công nhân", phone: "0990123456", note: "" },
  { code: "V1209", name: "Huỳnh Văn Toàn", role: "Công nhân", phone: "0911122233", note: "" },
  { code: "V0117", name: "Nguyễn Thanh Long", role: "Công nhân", phone: "0922233344", note: "" },
  { code: "V3308", name: "Dương Văn Hoàng", role: "Công nhân", phone: "0933344455", note: "" },
  { code: "V3274", name: "Châu Văn Điền", role: "Công nhân", phone: "0944455566", note: "" },
  { code: "V3242", name: "Nguyễn Văn Rớt", role: "Công nhân", phone: "0955566677", note: "" },
  { code: "V1729", name: "Phạm Hoàng Gập", role: "Công nhân", phone: "0966677788", note: "" },
  { code: "V2973", name: "Phạm Văn Nầy", role: "Công nhân", phone: "0977788899", note: "" },
  { code: "V2787", name: "Nguyễn Văn Hậu", role: "Công nhân", phone: "0988899900", note: "" },
  { code: "V3149", name: "Nguyễn Minh Hải", role: "Công nhân", phone: "0999900011", note: "" },
  { code: "V0554", name: "Trần Công Vương", role: "Công nhân", phone: "0910101010", note: "" },
  { code: "V3176", name: "Nguyễn Văn Tiền", role: "Công nhân", phone: "0920202020", note: "" },
];

/**
 * Seeds the employees table only when it is empty.
 * Never creates duplicate records.
 */
function seedEmployeesIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM employees").get();
    if (count.cnt > 0) return; // Already has data, skip

    const insert = db.prepare(`
      INSERT OR IGNORE INTO employees (employee_code, employee_name, role_code, phone, note)
      VALUES (@code, @name, @role, @phone, @note)
    `);

    const insertMany = db.transaction((employees) => {
      for (const emp of employees) {
        insert.run(emp);
      }
    });

    insertMany(SEED_EMPLOYEES);
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("seedEmployeesIfEmpty error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Repository Methods
// ---------------------------------------------------------------------------

/**
 * Returns all employees ordered by employee_code ASC.
 */
function getAllEmployees() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT id, employee_code, employee_name, role_code, department,
                phone, status, hire_date, note, created_at, updated_at
         FROM employees
         ORDER BY employee_code ASC`,
      )
      .all();
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("getAllEmployees error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Returns a single employee by employee_code.
 */
function getEmployeeByCode(employeeCode) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, employee_code, employee_name, role_code, department,
                  phone, status, hire_date, note, created_at, updated_at
           FROM employees
           WHERE employee_code = ?`,
        )
        .get(employeeCode) ?? null
    );
  } finally {
    db.close();
  }
}

/**
 * Creates a new employee record.
 * Returns { ok: true, id } on success or { ok: false, message } on failure.
 */
function createEmployee({ employee_code, employee_name, role_code, department, phone, status, hire_date, note }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO employees (employee_code, employee_name, role_code, department, phone, status, hire_date, note)
         VALUES (@employee_code, @employee_name, @role_code, @department, @phone, @status, @hire_date, @note)`,
      )
      .run({ employee_code, employee_name, role_code, department, phone, status, hire_date, note });

    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return { ok: false, message: `Mã nhân viên "${employee_code}" đã tồn tại.` };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Updates an existing employee by employee_code.
 * Returns { ok: true } on success or { ok: false, message } on failure.
 */
function updateEmployee(employeeCode, { employee_name, role_code, department, phone, status, hire_date, note }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `UPDATE employees
         SET employee_name = @employee_name,
             role_code     = @role_code,
             department    = @department,
             phone         = @phone,
             status        = @status,
             hire_date     = @hire_date,
             note          = @note,
             updated_at    = datetime('now')
         WHERE employee_code = @employee_code`,
      )
      .run({ employee_code: employeeCode, employee_name, role_code, department, phone, status, hire_date, note });

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy nhân viên "${employeeCode}".` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Deletes an employee by employee_code.
 * Returns { ok: true } on success or { ok: false, message } on failure.
 */
function deleteEmployee(employeeCode) {
  const db = openDatabase();
  try {
    const result = db
      .prepare("DELETE FROM employees WHERE employee_code = ?")
      .run(employeeCode);

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy nhân viên "${employeeCode}".` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureEmployeesTable,
  seedEmployeesIfEmpty,
  getAllEmployees,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
