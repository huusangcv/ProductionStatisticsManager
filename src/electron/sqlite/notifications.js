const { getDatabasePath } = require("./paths");
const { openDatabase } = require("./connection");



// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function ensureNotificationsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        type        TEXT    NOT NULL DEFAULT 'INFO',
        title       TEXT    NOT NULL,
        message     TEXT,
        icon        TEXT,
        level       TEXT    NOT NULL DEFAULT 'info',
        route       TEXT,
        payload     TEXT,
        version     TEXT,
        is_read     INTEGER NOT NULL DEFAULT 0,
        read_at     TEXT,
        expires_at  TEXT,
        created_by  TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Repository Methods
// ---------------------------------------------------------------------------

function createNotification({ type = "INFO", title, message = null, icon = null, level = "info", route = null, payload = null, version = null, expires_at = null, created_by = null }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO notifications (type, title, message, icon, level, route, payload, version, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        type,
        title,
        message,
        icon,
        level,
        route,
        payload ? JSON.stringify(payload) : null,
        version,
        expires_at,
        created_by
      );
    const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(result.lastInsertRowid);
    return { ok: true, id: result.lastInsertRowid, data: row };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getNotifications({ limit = 50, offset = 0 } = {}) {
  const db = openDatabase();
  try {
    const rows = db
      .prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset);
    const total = db.prepare("SELECT COUNT(*) as count FROM notifications").get().count;
    return { ok: true, data: rows, total };
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return { ok: false, data: [], total: 0 };
  } finally {
    db.close();
  }
}

function getUnreadCount() {
  const db = openDatabase();
  try {
    const row = db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0")
      .get();
    return row.count;
  } catch (error) {
    return 0;
  } finally {
    db.close();
  }
}

function markAsRead(id) {
  const db = openDatabase();
  try {
    db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function markAllAsRead() {
  const db = openDatabase();
  try {
    db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now', 'localtime') WHERE is_read = 0"
    ).run();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteNotification(id) {
  const db = openDatabase();
  try {
    db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteAllNotifications() {
  const db = openDatabase();
  try {
    db.prepare("DELETE FROM notifications").run();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function existsUpdateNotification(version) {
  const db = openDatabase();
  try {
    const row = db
      .prepare("SELECT id FROM notifications WHERE type = 'UPDATE' AND version = ? LIMIT 1")
      .get(version);
    return !!row;
  } catch (error) {
    return false;
  } finally {
    db.close();
  }
}

module.exports = {
  ensureNotificationsTable,
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  existsUpdateNotification,
};
