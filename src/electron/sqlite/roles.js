const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

const DEFAULT_ROLES = [
  { code: "GRIND", name: "Mài", sort_order: 1, description: "" },
  { code: "CUT", name: "Cắt", sort_order: 2, description: "" },
  { code: "GAS_GRIND", name: "Mài hơi", sort_order: 3, description: "" },
  { code: "PLASMA", name: "Cắt Plasma", sort_order: 4, description: "" },
  { code: "AUTO_GRIND", name: "Mài tự động", sort_order: 5, description: "" },
  { code: "STATISTIC", name: "Thống kê", sort_order: 6, description: "" },
];

function ensureRolesTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        code            TEXT    UNIQUE NOT NULL,
        name            TEXT    NOT NULL,
        description     TEXT,
        sort_order      INTEGER DEFAULT 0,
        is_active       INTEGER DEFAULT 1,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } finally {
    db.close();
  }
}

function seedRolesIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM roles").get();
    if (count.cnt > 0) return;

    const insert = db.prepare(`
      INSERT INTO roles (code, name, description, sort_order, is_active)
      VALUES (@code, @name, @description, @sort_order, 1)
    `);

    const insertMany = db.transaction((roles) => {
      for (const role of roles) {
        insert.run(role);
      }
    });

    insertMany(DEFAULT_ROLES);
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("seedRolesIfEmpty error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

function getAllRoles() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
         FROM roles
         ORDER BY sort_order ASC, id ASC`,
      )
      .all();
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("getAllRoles error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

function getRoleById(id) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
           FROM roles
           WHERE id = ?`,
        )
        .get(id) ?? null
    );
  } finally {
    db.close();
  }
}

function getRoleByCode(code) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
           FROM roles
           WHERE code = ?`,
        )
        .get(code) ?? null
    );
  } finally {
    db.close();
  }
}

function createRole({ code, name, description, sort_order, is_active }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO roles (code, name, description, sort_order, is_active)
         VALUES (@code, @name, @description, @sort_order, @is_active)`,
      )
      .run({ code, name, description, sort_order, is_active });
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return { ok: false, message: `Mã vai trò "${code}" đã tồn tại.` };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updateRole(id, { code, name, description, sort_order, is_active }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `UPDATE roles
         SET code = @code,
             name = @name,
             description = @description,
             sort_order = @sort_order,
             is_active = @is_active,
             updated_at = datetime('now')
         WHERE id = @id`,
      )
      .run({ id, code, name, description, sort_order, is_active });

    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy vai trò với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return { ok: false, message: `Mã vai trò "${code}" đã tồn tại.` };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteRole(id) {
  const db = openDatabase();
  try {
    const result = db.prepare("DELETE FROM roles WHERE id = ?").run(id);
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy vai trò với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureRolesTable,
  seedRolesIfEmpty,
  getAllRoles,
  getRoleById,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole,
};
