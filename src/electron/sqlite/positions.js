const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

const DEFAULT_POSITIONS = [
  { code: "LEADER", name: "Tổ trưởng", sort_order: 1, description: "" },
  { code: "DEPUTY", name: "Tổ phó", sort_order: 2, description: "" },
  { code: "SHIFT", name: "Trưởng ca", sort_order: 3, description: "" },
  { code: "STAFF", name: "Nhân viên", sort_order: 4, description: "" },
  { code: "WORKER", name: "Công nhân", sort_order: 5, description: "" },
];

function ensurePositionsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
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

function seedPositionsIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM positions").get();
    if (count.cnt > 0) return;

    const insert = db.prepare(`
      INSERT INTO positions (code, name, description, sort_order, is_active)
      VALUES (@code, @name, @description, @sort_order, 1)
    `);

    const insertMany = db.transaction((positions) => {
      for (const pos of positions) {
        insert.run(pos);
      }
    });

    insertMany(DEFAULT_POSITIONS);
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("seedPositionsIfEmpty error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

function getAllPositions() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
         FROM positions
         ORDER BY sort_order ASC, id ASC`,
      )
      .all();
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("getAllPositions error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

function getPositionById(id) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
           FROM positions
           WHERE id = ?`,
        )
        .get(id) ?? null
    );
  } finally {
    db.close();
  }
}

function getPositionByCode(code) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, code, name, description, sort_order, is_active, created_at, updated_at
           FROM positions
           WHERE code = ?`,
        )
        .get(code) ?? null
    );
  } finally {
    db.close();
  }
}

function createPosition({ code, name, description, sort_order, is_active }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO positions (code, name, description, sort_order, is_active)
         VALUES (@code, @name, @description, @sort_order, @is_active)`,
      )
      .run({ code, name, description, sort_order, is_active });
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return { ok: false, message: `Mã chức vụ "${code}" đã tồn tại.` };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updatePosition(id, { code, name, description, sort_order, is_active }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `UPDATE positions
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
      return { ok: false, message: `Không tìm thấy chức vụ với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return { ok: false, message: `Mã chức vụ "${code}" đã tồn tại.` };
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deletePosition(id) {
  const db = openDatabase();
  try {
    const result = db.prepare("DELETE FROM positions WHERE id = ?").run(id);
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy chức vụ với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensurePositionsTable,
  seedPositionsIfEmpty,
  getAllPositions,
  getPositionById,
  getPositionByCode,
  createPosition,
  updatePosition,
  deletePosition,
};
