const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function ensureUpdateLogsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS update_logs (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        version       TEXT    NOT NULL,
        status        TEXT    NOT NULL,
        release_notes TEXT,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Repository Methods
// ---------------------------------------------------------------------------

function logUpdateEvent(version, status, releaseNotes = null) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO update_logs (version, status, release_notes) 
         VALUES (?, ?, ?)`
      )
      .run(version, status, releaseNotes);
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error("Failed to log update event:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getRecentUpdateLogs(limit = 50) {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT * FROM update_logs ORDER BY created_at DESC LIMIT ?`
      )
      .all(limit);
  } catch (error) {
    console.error("Failed to get update logs:", error);
    return [];
  } finally {
    db.close();
  }
}

module.exports = {
  ensureUpdateLogsTable,
  logUpdateEvent,
  getRecentUpdateLogs
};
