const { getDatabasePath } = require("./paths");
const { openDatabase } = require("./connection");



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
  // Check if the current table has UNIQUE on representative_code or UNIQUE(role_id, representative_code)
  const indexList = db.prepare("PRAGMA index_list(employees)").all();
  let hasUniqueRepCode = false;

  for (const idx of indexList) {
    if (idx.unique === 1) {
      const idxInfo = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
      const cols = idxInfo.map((c) => c.name);
      if (cols.includes("representative_code")) {
        hasUniqueRepCode = true;
      }
    }
  }

  // Alternatively, check sqlite_master for the CREATE TABLE statement
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='employees'").get();
  if (tableInfo && (tableInfo.sql.includes("UNIQUE(role_id, representative_code)") || tableInfo.sql.includes("representative_code TEXT    UNIQUE") || tableInfo.sql.includes("representative_code TEXT UNIQUE"))) {
    hasUniqueRepCode = true;
  }

  if (hasUniqueRepCode) {
    db.transaction(() => {
      // Create backup of old table
      db.exec("ALTER TABLE employees RENAME TO employees_unique_old");

      // Create new table without unique index on representative_code
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
          FOREIGN KEY (position_id) REFERENCES positions(id)
        )
      `);

      const columns = [
        "id", "employee_code", "representative_code", "full_name",
        "role_id", "position_id", "phone", "status",
        "hire_date", "note", "created_at", "updated_at"
      ].join(", ");

      // Use INSERT OR IGNORE to prevent unique constraint violations from crashing the migration
      db.exec(`INSERT OR IGNORE INTO employees (${columns}) SELECT ${columns} FROM employees_unique_old`);
      db.exec("DROP TABLE employees_unique_old");
    })();
  }
}

function migrateOldEmployees(db) {
  db.transaction(() => {
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
    INSERT OR IGNORE INTO employees (
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
  })();
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const SEED_EMPLOYEES = [
  {
    code: "V21111171",
    rep_code: "8",
    name: "Đinh Thế Trung Nguyên",
    role_code: "GRIND",
    position_code: "LEADER",
    phone: "0912345678",
    note: "",
  },
  {
    code: "V23021781",
    rep_code: "7",
    name: "Trang Quang Khánh",
    role_code: "GRIND",
    position_code: "SHIFT",
    phone: "0923456789",
    note: "",
  },
  {
    code: "V26063277",
    rep_code: "0",
    name: "Lê Hữu Sang",
    role_code: "CUT",
    position_code: "STAFF",
    phone: "0934567890",
    note: "",
  },
  {
    code: "V22021245",
    rep_code: "1",
    name: "Phan Văn Đợi",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0945678901",
    note: "",
  },
  {
    code: "V22021247",
    rep_code: "2",
    name: "Phạm Hoàng Lên",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0956789012",
    note: "",
  },
  {
    code: "V22021264",
    rep_code: "2",
    name: "Phạm Hoàng Xia",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0967890123",
    note: "",
  },
  {
    code: "V26013075",
    rep_code: "3",
    name: "Phạm Hoàng Sống",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0978901234",
    note: "",
  },
  {
    code: "V22031369",
    rep_code: "4",
    name: "Đinh Văn Khang",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0989012345",
    note: "",
  },
  {
    code: "V22061602",
    rep_code: "5",
    name: "Nguyễn Thanh Vân",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0990123456",
    note: "",
  },
  {
    code: "V21121209",
    rep_code: "6",
    name: "Huỳnh Văn Toàn",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0911122233",
    note: "",
  },
  {
    code: "V19090117",
    rep_code: "7",
    name: "Nguyễn Thanh Long",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0922233344",
    note: "",
  },
  {
    code: "V26063308",
    rep_code: "8",
    name: "Dương Văn Hoàng",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0933344455",
    note: "",
  },
  {
    code: "V26063274",
    rep_code: "9",
    name: "Châu Văn Điền",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0944455566",
    note: "",
  },
  {
    code: "V26053242",
    rep_code: "0",
    name: "Nguyễn Văn Rớt",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0955566677",
    note: "",
  },
  {
    code: "V22091729",
    rep_code: "1",
    name: "Phạm Hoàng Gập",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0966677788",
    note: "",
  },
  {
    code: "V25092973",
    rep_code: "2",
    name: "Phạm Văn Nầy",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0977788899",
    note: "",
  },
  {
    code: "V25052787",
    rep_code: "3",
    name: "Nguyễn Văn Hậu",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0988899900",
    note: "",
  },
  {
    code: "V20080554",
    rep_code: "0",
    name: "Trần Công Vương",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0910101010",
    note: "",
  },
  {
    code: "V26043176",
    rep_code: "V26043176",
    name: "Nguyễn Văn Tiền",
    role_code: "GRIND",
    position_code: "WORKER",
    phone: "0920202020",
    note: "",
  },
];

function migrateEmployeeCodesTo8Digits(db) {
  try {
    const mapping = [
      { old: "V1171", new: "V21111171" },
      { old: "V1781", new: "V23021781" },
      { old: "V3277", new: "V26063277" },
      { old: "V1245", new: "V22021245" },
      { old: "V1247", new: "V22021247" },
      { old: "V1264", new: "V22021264" },
      { old: "V3075", new: "V26013075" },
      { old: "V1369", new: "V22031369" },
      { old: "V1602", new: "V22061602" },
      { old: "V1209", new: "V21121209" },
      { old: "V0117", new: "V19090117" },
      { old: "V3308", new: "V26063308" },
      { old: "V3274", new: "V26063274" },
      { old: "V3242", new: "V26053242" },
      { old: "V1729", new: "V22091729" },
      { old: "V2973", new: "V25092973" },
      { old: "V2787", new: "V25052787" },
      { old: "V3149", new: "V26053149" },
      { old: "V0554", new: "V20080554" },
      { old: "V3176", new: "V26043176" },
    ];

    db.pragma("foreign_keys = OFF");

    // Helper: check if a table exists before running statements against it
    const tableExists = (name) =>
      !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);

    const updateEmp = db.prepare("UPDATE employees SET employee_code = ?, representative_code = ? WHERE employee_code = ?");
    const updateProd = tableExists("personal_production_records")
      ? db.prepare("UPDATE personal_production_records SET employee_code = ? WHERE employee_code = ?")
      : null;
    const updateOt = tableExists("overtime_records")
      ? db.prepare("UPDATE overtime_records SET employee_code = ? WHERE employee_code = ?")
      : null;

    const runMigration = db.transaction(() => {
      for (const item of mapping) {
        try { updateEmp.run(item.new, item.new, item.old); } catch (e) { }
        try { if (updateProd) updateProd.run(item.new, item.old); } catch (e) { }
        try { if (updateOt) updateOt.run(item.new, item.old); } catch (e) { }
      }
    });
    runMigration();
    db.pragma("foreign_keys = ON");
  } catch (err) {
    console.error("Error migrating employee codes to 8 digits:", err);
  }
}

function seedEmployeesIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM employees").get();
    if (count.cnt > 0) {
      migrateEmployeeCodesTo8Digits(db);
      return;
    }

    // Safety check: if old tables exist, a previous migration failed. Do NOT seed.
    const hasOldTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name='employees_old' OR name='employees_unique_old')").get();
    if (hasOldTable) {
      console.warn("Safety Check: Found backup employees table. Skipping seed to prevent data loss.");
      return;
    }

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
    const rows = db
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
      .all(representativeCode, roleCode);
    if (!rows || rows.length === 0) return null;
    if (rows.length === 1) return rows[0];
    return {
      ...rows[0],
      employee_code: rows.map((r) => String(r.employee_code || "").trim().replace(/^[Vv]/, "")).filter(Boolean).join(" "),
      full_name: rows.map((r) => r.full_name).filter(Boolean).join(", "),
      position_name: rows.map((r) => r.position_name).filter(Boolean).join(", "),
    };
  } finally {
    db.close();
  }
}

function getEmployeeByRepresentativeCode(representativeCode) {
  const db = openDatabase();
  try {
    const rows = db
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
         WHERE e.representative_code = ?`,
      )
      .all(representativeCode);
    if (!rows || rows.length === 0) return null;
    if (rows.length === 1) return rows[0];
    return {
      ...rows[0],
      employee_code: rows.map((r) => String(r.employee_code || "").trim().replace(/^[Vv]/, "")).filter(Boolean).join(" "),
      full_name: rows.map((r) => r.full_name).filter(Boolean).join(", "),
      position_name: rows.map((r) => r.position_name).filter(Boolean).join(", "),
    };
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

function validateRepresentativeCode(db, role_id, representative_code, excludeId = null) {
  if (!representative_code) return { ok: true };

  const role = db.prepare("SELECT code, name FROM roles WHERE id = ?").get(role_id);
  if (!role) return { ok: true };

  const roleCode = (role.code || "").toUpperCase();
  const roleName = (role.name || "").trim().toLowerCase();

  if (roleCode === "CUT" || roleName === "cắt" || roleName === "cat") {
    let query = `SELECT id FROM employees WHERE representative_code = ? AND role_id = ?`;
    const params = [String(representative_code).trim(), role_id];

    if (excludeId !== null && excludeId !== undefined) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const existing = db.prepare(query).get(...params);
    if (existing) {
      return {
        ok: false,
        message: "Mã số đại diện đã được sử dụng cho nhân viên Cắt.",
      };
    }
  }

  return { ok: true };
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
    const valRes = validateRepresentativeCode(db, role_id, representative_code);
    if (!valRes.ok) {
      return valRes;
    }

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
      ) ||
      error.message.includes(
        "UNIQUE constraint failed: employees.representative_code",
      )
    ) {
      return {
        ok: false,
        message: "Mã số đại diện đã được sử dụng cho nhân viên Cắt.",
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
    employee_code = null,
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
    const current = db.prepare("SELECT role_id, representative_code FROM employees WHERE id = ?").get(id);
    if (!current) {
      return { ok: false, message: `Không tìm thấy nhân viên với id ${id}.` };
    }
    const checkRoleId = role_id !== undefined ? role_id : current.role_id;
    const checkRepCode = representative_code !== undefined ? representative_code : current.representative_code;

    const valRes = validateRepresentativeCode(db, checkRoleId, checkRepCode, id);
    if (!valRes.ok) {
      return valRes;
    }

    const result = db
      .prepare(
        `UPDATE employees
         SET employee_code = COALESCE(@employee_code, employee_code),
             representative_code = @representative_code,
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

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy nhân viên với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    if (
      error.message.includes(
        "UNIQUE constraint failed: employees.role_id, employees.representative_code",
      ) ||
      error.message.includes(
        "UNIQUE constraint failed: employees.representative_code",
      )
    ) {
      return {
        ok: false,
        message: "Mã số đại diện đã được sử dụng cho nhân viên Cắt.",
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
