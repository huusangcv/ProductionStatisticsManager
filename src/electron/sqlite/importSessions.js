const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");
const crypto = require("crypto");

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Generate a unique session code.
 * Example: IMP-20260715-12A4B
 */
function generateSessionCode() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `IMP-${yyyy}${mm}${dd}-${rand}`;
}

function ensureImportSessionsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS import_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_code TEXT NOT NULL UNIQUE,
        module_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        imported_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        total_rows INTEGER DEFAULT 0,
        imported_rows INTEGER DEFAULT 0,
        duplicate_rows INTEGER DEFAULT 0,
        failed_rows INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        note TEXT
      )
    `);
  } finally {
    db.close();
  }
}

/**
 * Creates a new import session.
 * @returns {number} The ID of the newly created session
 */
function createSession(moduleName, tableName, fileName, totalRows) {
  const db = openDatabase();
  try {
    const sessionCode = generateSessionCode();
    const info = db
      .prepare(
        `INSERT INTO import_sessions (session_code, module_name, table_name, file_name, total_rows, status)
         VALUES (?, ?, ?, ?, ?, 'IMPORTING')`
      )
      .run(sessionCode, moduleName, tableName, fileName, totalRows);
    return info.lastInsertRowid;
  } finally {
    db.close();
  }
}

/**
 * Updates a session with the results of the import.
 */
function finishSession(sessionId, { importedRows = 0, duplicateRows = 0, failedRows = 0, status, durationMs = 0, note = null }) {
  const db = openDatabase();
  try {
    db.prepare(
      `UPDATE import_sessions 
       SET imported_rows = ?, duplicate_rows = ?, failed_rows = ?, status = ?, duration_ms = ?, note = ?
       WHERE id = ?`
    ).run(importedRows, duplicateRows, failedRows, status, durationMs, note, sessionId);
  } finally {
    db.close();
  }
}

function getAllSessions() {
  const db = openDatabase();
  try {
    return db.prepare(`SELECT * FROM import_sessions ORDER BY imported_at DESC`).all();
  } finally {
    db.close();
  }
}

function getSessionById(sessionId) {
  const db = openDatabase();
  try {
    return db.prepare(`SELECT * FROM import_sessions WHERE id = ?`).get(sessionId);
  } finally {
    db.close();
  }
}

function deleteSession(sessionId) {
  const db = openDatabase();
  try {
    db.prepare(`DELETE FROM import_sessions WHERE id = ?`).run(sessionId);
  } finally {
    db.close();
  }
}

/**
 * Rollback an import session.
 * This deletes all production records linked to this session_id from its target table,
 * and updates the session status to 'ROLLED_BACK'.
 */
function rollbackSession(sessionId) {
  const db = openDatabase();
  try {
    const session = db.prepare(`SELECT * FROM import_sessions WHERE id = ?`).get(sessionId);
    if (!session) {
      throw new Error(`Session ID ${sessionId} không tồn tại.`);
    }

    if (session.status === "ROLLED_BACK") {
      throw new Error("Session này đã được rollback trước đó.");
    }

    const { table_name } = session;

    db.transaction(() => {
      // Delete rows from the production table
      db.prepare(`DELETE FROM ${table_name} WHERE import_session_id = ?`).run(sessionId);

      // Mark session as rolled back
      db.prepare(`UPDATE import_sessions SET status = 'ROLLED_BACK', note = 'Đã hoàn tác bởi người dùng' WHERE id = ?`).run(sessionId);
    })();

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureImportSessionsTable,
  createSession,
  finishSession,
  getAllSessions,
  getSessionById,
  deleteSession,
  rollbackSession,
};
