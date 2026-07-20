const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function ensureEmployeesTable() {
  const db = openDatabase();
  try {
    // Create new table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_code       TEXT    UNIQUE NOT NULL,
        representative_code TEXT    NOT NULL,
        full_name           TEXT    NOT NULL,
        role_id             INTEGER NOT NULL,
        position_id         INTEGER NOT NULL,
        phone               TEXT,
        status              TEXT    DEFAULT 'Đang làm việc',
        hire_date           TEXT,
        note                TEXT,
        created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (position_id) REFERENCES positions(id),
        UNIQUE(role_id, representative_code)
      )
    `);

    // Migration to check if old columns exist (employee_name, role_code, department)
    const columns = db.prepare("PRAGMA table_info(employees)").all();
    const hasEmployeeName = columns.some((c) => c.name === "employee_name");
    const hasRoleCode = columns.some((c) => c.name === "role_code");
    
    if (hasEmployeeName || hasRoleCode) {
      migrateOldEmployees(db);
    }

    // Migration: Change representative_code UNIQUE to UNIQUE(role_id, representative_code)
    migrateRemoveUniqueRepresentativeCode(db);
    
  } finally {
    db.close();
  }
}

function migrateRemoveUniqueRepresentativeCode(db) {
  // Check if the current table has UNIQUE on representative_code without role_id
  const indexList = db.prepare("PRAGMA index_list(employees)").all();
  let hasUniqueRepCode = false;

  for (const idx of indexList) {
    if (idx.unique === 1) {
      const idxInfo = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
      // If index is ONLY on representative_code
      if (idxInfo.length === 1 && idxInfo[0].name === "representative_code") {
        hasUniqueRepCode = true;
      }
    }
  }
  
  // Alternatively, check sqlite_master for the CREATE TABLE statement
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='employees'").get();
  if (tableInfo && tableInfo.sql.includes("representative_code TEXT    UNIQUE NOT NULL")) {
    hasUniqueRepCode = true;
  }

  if (hasUniqueRepCode) {
    // Create backup of old table
    db.exec("ALTER TABLE employees RENAME TO employees_unique_old");

    // Create new table with composite unique index
    db.exec(`
      CREATE TABLE employees (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_code       TEXT    UNIQUE NOT NULL,
        representative_code TEXT    NOT NULL,
        full_name           TEXT    NOT NULL,
        role_id             INTEGER NOT NULL,
        position_id         INTEGER NOT NULL,
        phone               TEXT,
        status              TEXT    DEFAULT 'Đang làm việc',
        hire_date           TEXT,
        note                TEXT,
        created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (position_id) REFERENCES positions(id),
        UNIQUE(role_id, representative_code)
      )
    `);

    const columns = [
      "id", "employee_code", "representative_code", "full_name",
      "role_id", "position_id", "phone", "status",
      "hire_date", "note", "created_at", "updated_at"
    ].join(", ");

    db.exec(`INSERT INTO employees (${columns}) SELECT ${columns} FROM employees_unique_old`);
    db.exec("DROP TABLE employees_unique_old");
  }
}

function migrateOldEmployees(db) {
  // 1. Get all existing employees
  const oldEmployees = db
    .prepare(
      `
    SELECT id, employee_code, employee_name, role_code, phone, status, hire_date, note
    FROM employees
  `,
    )
    .all();

  // 2. Create backup of old table
  db.exec("ALTER TABLE employees RENAME TO employees_old");

  // 3. Create new table
  db.exec(`
    CREATE TABLE employees (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code       TEXT    UNIQUE NOT NULL,
      representative_code TEXT    NOT NULL,
      full_name           TEXT    NOT NULL,
      role_id             INTEGER NOT NULL,
      position_id         INTEGER NOT NULL,
      phone               TEXT,
      status              TEXT    DEFAULT 'Đang làm việc',
      hire_date           TEXT,
      note                TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (position_id) REFERENCES positions(id),
      UNIQUE(role_id, representative_code)
    )
  `);

  // 4. Get default roles and positions
  const roleMap = new Map();
  const roles = db.prepare("SELECT * FROM roles").all();
  for (const role of roles) roleMap.set(role.code, role.id);

  const positionMap = new Map();
  const positions = db.prepare("SELECT * FROM positions").all();
  for (const pos of positions) positionMap.set(pos.code, pos.id);

  // 5. Insert migrated data
  const insert = db.prepare(`
    INSERT INTO employees (
      id, 
      employee_code, 
      representative_code, 
      full_name, 
      role_id, 
      position_id,
      phone, 
      status, 
      hire_date, 
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const getDefaultPositionId = () =>
    positionMap.get("WORKER") || positions[0]?.id || 1;
  const getDefaultRoleId = () => roleMap.get("GRIND") || roles[0]?.id || 1;

  for (const emp of oldEmployees) {
    let roleId = getDefaultRoleId();
    // Try to map old role_code to new role
    if (emp.role_code) {
      // Try fuzzy match based on name
      const matchedRole = roles.find(
        (r) => r.name.includes(emp.role_code) || emp.role_code.includes(r.name),
      );
      if (matchedRole) roleId = matchedRole.id;
    }

    let positionId = getDefaultPositionId();
    // Try to map old role_code to position
    if (emp.role_code) {
      const matchedPos = positions.find(
        (p) => p.name.includes(emp.role_code) || emp.role_code.includes(p.name),
      );
      if (matchedPos) positionId = matchedPos.id;
    }

    const representativeCode = emp.employee_code; // Use employee_code as default representative_code

    insert.run(
      emp.id,
      emp.employee_code,
      representativeCode,
      emp.employee_name,
      roleId,
      positionId,
      emp.phone,
      emp.status,
      emp.hire_date,
      emp.note,
    );
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const SEED_EMPLOYEES = [
  {
    code: "V1171",
    rep_code: "V1171",
    name: "Đinh Thế Trung Nguyên",
    role_code: "GRIND",
    position_code: "LEADER",
    phone: "0912345678",
    note: "",
  },
  {
    code: "V1781",
    rep_code: "V1781",
    name: "Trang Quang Khánh",
    role_code: "GRIND",
    position_code: "SHIFT",
    phone: "0923456789",
    note: "",
  },
  {
    code: "V3277",
    rep_code: "V3277",
    name: "Lê Hữu Sang",
    role_code: "CUT",
    position_code: "STAFF",
    phone: "0934567890",
    note: "",
  },
  {
    code: "V1245",
    rep_code: "V1245",
    name: "Phan Văn Đợi",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0945678901",
    note: "",
  },
  {
    code: "V1247",
    rep_code: "V1247",
    name: "Phạm Hoàng Lên",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0956789012",
    note: "",
  },
  {
    code: "V1264",
    rep_code: "V1264",
    name: "Phạm Hoàng Xia",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0967890123",
    note: "",
  },
  {
    code: "V3075",
    rep_code: "V3075",
    name: "Phạm Hoàng Sống",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0978901234",
    note: "",
  },
  {
    code: "V1369",
    rep_code: "V1369",
    name: "Đinh Văn Khang",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0989012345",
    note: "",
  },
  {
    code: "V1602",
    rep_code: "V1602",
    name: "Nguyễn Thanh Vân",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0990123456",
    note: "",
  },
  {
    code: "V1209",
    rep_code: "V1209",
    name: "Huỳnh Văn Toàn",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0911122233",
    note: "",
  },
  {
    code: "V0117",
    rep_code: "V0117",
    name: "Nguyễn Thanh Long",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0922233344",
    note: "",
  },
  {
    code: "V3308",
    rep_code: "V3308",
    name: "Dương Văn Hoàng",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0933344455",
    note: "",
  },
  {
    code: "V3274",
    rep_code: "V3274",
    name: "Châu Văn Điền",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0944455566",
    note: "",
  },
  {
    code: "V3242",
    rep_code: "V3242",
    name: "Nguyễn Văn Rớt",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0955566677",
    note: "",
  },
  {
    code: "V1729",
    rep_code: "V1729",
    name: "Phạm Hoàng Gập",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0966677788",
    note: "",
  },
  {
    code: "V2973",
    rep_code: "V2973",
    name: "Phạm Văn Nầy",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0977788899",
    note: "",
  },
  {
    code: "V2787",
    rep_code: "V2787",
    name: "Nguyễn Văn Hậu",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0988899900",
    note: "",
  },
  {
    code: "V3149",
    rep_code: "V3149",
    name: "Nguyễn Minh Hải",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0999900011",
    note: "",
  },
  {
    code: "V0554",
    rep_code: "V0554",
    name: "Trần Công Vương",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0910101010",
    note: "",
  },
  {
    code: "V3176",
    rep_code: "V3176",
    name: "Nguyễn Văn Tiền",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0920202020",
    note: "",
  },
];

function seedEmployeesIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM employees").get();
    if (count.cnt > 0) return;

    const roleMap = new Map();
    const roles = db.prepare("SELECT * FROM roles").all();
    for (const role of roles) roleMap.set(role.code, role.id);

    const positionMap = new Map();
    const positions = db.prepare("SELECT * FROM positions").all();
    for (const pos of positions) positionMap.set(pos.code, pos.id);

    const insert = db.prepare(`
      INSERT OR IGNORE INTO employees (
        employee_code, 
        representative_code, 
        full_name, 
        role_id, 
        position_id, 
        phone, 
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((employees) => {
      for (const emp of employees) {
        insert.run(
          emp.code,
          emp.rep_code,
          emp.name,
          roleMap.get(emp.role_code) || 1,
          positionMap.get(emp.position_code) || 5,
          emp.phone,
          emp.note,
        );
      }
    });

    insertMany(SEED_EMPLOYEES);
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "seedEmployeesIfEmpty error",
      err.message + "\n\n" + err.stack,
    );
    throw err;
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Repository Methods
// ---------------------------------------------------------------------------

function getAllEmployees() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT 
          e.id, 
          e.employee_code, 
          e.representative_code,
          e.full_name, 
          e.role_id, 
          r.name AS role_name,
          r.code AS role_code,
          e.position_id, 
          p.name AS position_name,
          p.code AS position_code,
          e.phone, 
          e.status, 
          e.hire_date, 
          e.note, 
          e.created_at, 
          e.updated_at
         FROM employees e
         LEFT JOIN roles r ON e.role_id = r.id
         LEFT JOIN positions p ON e.position_id = p.id
         ORDER BY e.employee_code ASC`,
      )
      .all();
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "getAllEmployees error",
      err.message + "\n\n" + err.stack,
    );
    throw err;
  } finally {
    db.close();
  }
}

function getEmployeeByCode(employeeCode) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT 
            e.id, 
            e.employee_code, 
            e.representative_code,
            e.full_name, 
            e.role_id, 
            r.name AS role_name,
            r.code AS role_code,
            e.position_id, 
            p.name AS position_name,
            p.code AS position_code,
            e.phone, 
            e.status, 
            e.hire_date, 
            e.note, 
            e.created_at, 
            e.updated_at
           FROM employees e
           LEFT JOIN roles r ON e.role_id = r.id
           LEFT JOIN positions p ON e.position_id = p.id
           WHERE e.employee_code = ?`,
        )
        .get(employeeCode) ?? null
    );
  } finally {
    db.close();
  }
}

function getEmployeeByRepresentativeCodeAndRole(representativeCode, roleCode) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT 
            e.id, 
            e.employee_code, 
            e.representative_code,
            e.full_name, 
            e.role_id, 
            r.name AS role_name,
            r.code AS role_code,
            e.position_id, 
            p.name AS position_name,
            p.code AS position_code,
            e.phone, 
            e.status, 
            e.hire_date, 
            e.note, 
            e.created_at, 
            e.updated_at
           FROM employees e
           JOIN roles r ON e.role_id = r.id
           LEFT JOIN positions p ON e.position_id = p.id
           WHERE e.representative_code = ? AND r.code = ?`,
        )
        .get(representativeCode, roleCode) ?? null
    );
  } finally {
    db.close();
  }
}

function getEmployeeByRepresentativeCode(representativeCode) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT 
            e.id, 
            e.employee_code, 
            e.representative_code,
            e.full_name, 
            e.role_id, 
            r.name AS role_name,
            r.code AS role_code,
            e.position_id, 
            p.name AS position_name,
            p.code AS position_code,
            e.phone, 
            e.status, 
            e.hire_date, 
            e.note, 
            e.created_at, 
            e.updated_at
           FROM employees e
           LEFT JOIN roles r ON e.role_id = r.id
           LEFT JOIN positions p ON e.position_id = p.id
           WHERE e.representative_code = ?
           LIMIT 1`,
        )
        .get(representativeCode) ?? null
    );
  } finally {
    db.close();
  }
}

function getEmployeeById(id) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT 
            e.id, 
            e.employee_code, 
            e.representative_code,
            e.full_name, 
            e.role_id, 
            r.name AS role_name,
            r.code AS role_code,
            e.position_id, 
            p.name AS position_name,
            p.code AS position_code,
            e.phone, 
            e.status, 
            e.hire_date, 
            e.note, 
            e.created_at, 
            e.updated_at
           FROM employees e
           LEFT JOIN roles r ON e.role_id = r.id
           LEFT JOIN positions p ON e.position_id = p.id
           WHERE e.id = ?`,
        )
        .get(id) ?? null
    );
  } finally {
    db.close();
  }
}

function createEmployee({
  employee_code,
  representative_code,
  full_name,
  role_id,
  position_id,
  phone,
  status,
  hire_date,
  note,
}) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO employees (
          employee_code, 
          representative_code, 
          full_name, 
          role_id, 
          position_id, 
          phone, 
          status, 
          hire_date, 
          note
        ) VALUES (@employee_code, @representative_code, @full_name, @role_id, @position_id, @phone, @status, @hire_date, @note)`,
      )
      .run({
        employee_code,
        representative_code,
        full_name,
        role_id,
        position_id,
        phone,
        status,
        hire_date,
        note,
      });

    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    if (
      error.message.includes(
        "UNIQUE constraint failed: employees.employee_code",
      )
    ) {
      return {
        ok: false,
        message: `Mã nhân viên "${employee_code}" đã tồn tại.`,
      };
    }
    if (
      error.message.includes(
        "UNIQUE constraint failed: employees.role_id, employees.representative_code",
      )
    ) {
      return {
        ok: false,
        message: `Mã đại diện "${representative_code}" đã tồn tại trong vai trò này.`,
      };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updateEmployee(
  id,
  {
    representative_code,
    full_name,
    role_id,
    position_id,
    phone,
    status,
    hire_date,
    note,
  },
) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `UPDATE employees
         SET representative_code = @representative_code,
             full_name = @full_name,
             role_id = @role_id,
             position_id = @position_id,
             phone = @phone,
             status = @status,
             hire_date = @hire_date,
             note = @note,
             updated_at = datetime('now')
         WHERE id = @id`,
      )
      .run({
        id,
        representative_code,
        full_name,
        role_id,
        position_id,
        phone,
        status,
        hire_date,
        note,
      });

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy nhân viên với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    if (
      error.message.includes(
        "UNIQUE constraint failed: employees.role_id, employees.representative_code",
      )
    ) {
      return {
        ok: false,
        message: `Mã đại diện "${representative_code}" đã tồn tại trong vai trò này.`,
      };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteEmployee(id) {
  const db = openDatabase();
  try {
    const result = db.prepare("DELETE FROM employees WHERE id = ?").run(id);
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy nhân viên với id ${id}.` };
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
  getEmployeeByRepresentativeCode,
  getEmployeeByRepresentativeCodeAndRole,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
