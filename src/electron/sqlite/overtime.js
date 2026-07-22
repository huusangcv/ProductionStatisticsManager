const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

function ensureOvertimeTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS overtime_history (
        id              TEXT PRIMARY KEY,
        department_id   TEXT NOT NULL,
        department_name TEXT,
        ot_date         TEXT NOT NULL,
        shift           TEXT NOT NULL,
        data            TEXT NOT NULL,
        created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

function getHistory(departmentId) {
  const db = openDatabase();
  try {
    // If we only have "Trước xử lý", departmentId can be ignored or hardcoded,
    // but keeping it for flexibility.
    const rows = db
      .prepare(`SELECT * FROM overtime_history WHERE department_id = ? ORDER BY created_at DESC`)
      .all(departmentId);

    // Parse the JSON data back to an object
    return rows.map((row) => JSON.parse(row.data));
  } catch (error) {
    console.error("Error getting overtime history:", error);
    return [];
  } finally {
    db.close();
  }
}

function saveHistory(snapshotData) {
  const db = openDatabase();
  try {
    const id = snapshotData.id;
    const departmentId = snapshotData.departmentId;
    const departmentName = snapshotData.departmentName;
    const otDate = snapshotData.date;
    const shift = snapshotData.shift;
    const dataStr = JSON.stringify(snapshotData);

    const result = db
      .prepare(
        `INSERT OR REPLACE INTO overtime_history (
          id, department_id, department_name, ot_date, shift, data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, departmentId, departmentName, otDate, shift, dataStr, snapshotData.createdAt);

    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error("Error saving overtime history:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteHistory(id) {
  const db = openDatabase();
  try {
    const result = db.prepare(`DELETE FROM overtime_history WHERE id = ?`).run(id);
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy bản ghi với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    console.error("Error deleting overtime history:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function clearHistory(departmentId) {
  const db = openDatabase();
  try {
    db.prepare(`DELETE FROM overtime_history WHERE department_id = ?`).run(departmentId);
    return { ok: true };
  } catch (error) {
    console.error("Error clearing overtime history:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureOvertimeTable,
  getHistory,
  saveHistory,
  deleteHistory,
  clearHistory,
};
