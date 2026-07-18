/**
 * excelTemplates.js — DAO for the excel_templates table.
 *
 * One row per module. Only "heat-treatment" is used currently.
 *
 * Table columns:
 *   id            INTEGER PK AUTOINCREMENT
 *   module        TEXT NOT NULL UNIQUE   -- e.g. "heat-treatment"
 *   template_name TEXT NOT NULL          -- original file name shown to user
 *   template_path TEXT NOT NULL          -- absolute path inside <userData>/templates/
 *   sheet_name    TEXT NOT NULL          -- which worksheet to fill
 *   start_row     INTEGER NOT NULL       -- 1-based row where data starts
 *   uploaded_at   TEXT NOT NULL          -- ISO timestamp of first upload
 *   updated_at    TEXT NOT NULL          -- ISO timestamp of last replace
 *   status        TEXT NOT NULL          -- "active" | "missing"
 */

const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

// ── ensureExcelTemplatesTable ─────────────────────────────────────────────────

function ensureExcelTemplatesTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS excel_templates (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        module        TEXT    NOT NULL UNIQUE,
        template_name TEXT    NOT NULL,
        template_path TEXT    NOT NULL,
        sheet_name    TEXT    NOT NULL DEFAULT 'Sheet1',
        start_row     INTEGER NOT NULL DEFAULT 3,
        uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        status        TEXT    NOT NULL DEFAULT 'active',
        checksum      TEXT,
        file_size     INTEGER
      )
    `);

    // Add missing columns if table already existed
    const columns = db
      .prepare("PRAGMA table_info(excel_templates)")
      .all()
      .map((col) => col.name);
    if (!columns.includes("checksum")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN checksum TEXT");
    }
    if (!columns.includes("file_size")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN file_size INTEGER");
    }
  } finally {
    db.close();
  }
}

function getAllTemplates() {
  const db = openDatabase();
  try {
    return db
      .prepare("SELECT * FROM excel_templates ORDER BY module ASC")
      .all();
  } finally {
    db.close();
  }
}

// ── getTemplate ───────────────────────────────────────────────────────────────

/**
 * Returns the template row for a given module, or null if not found.
 * @param {string} module  e.g. "heat-treatment"
 * @returns {object|null}
 */
function getTemplate(module) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(`SELECT * FROM excel_templates WHERE module = ?`)
        .get(module) ?? null
    );
  } finally {
    db.close();
  }
}

// ── upsertTemplate ────────────────────────────────────────────────────────────

/**
 * Insert or replace a template record.
 * On replace, preserves uploaded_at from the existing row.
 *
 * @param {object} data
 * @param {string} data.module
 * @param {string} data.template_name
 * @param {string} data.template_path
 * @param {string} [data.sheet_name="Sheet1"]
 * @param {number} [data.start_row=3]
 * @param {string} [data.status="active"]
 * @returns {{ ok: true }}
 */
function upsertTemplate({
  module,
  template_name,
  template_path,
  sheet_name = "Sheet1",
  start_row = 3,
  status = "active",
}) {
  const db = openDatabase();
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const existing = db
      .prepare(`SELECT uploaded_at FROM excel_templates WHERE module = ?`)
      .get(module);

    const uploaded_at = existing ? existing.uploaded_at : now;

    db.prepare(
      `
      INSERT INTO excel_templates (module, template_name, template_path, sheet_name, start_row, uploaded_at, updated_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(module) DO UPDATE SET
        template_name = excluded.template_name,
        template_path = excluded.template_path,
        sheet_name    = excluded.sheet_name,
        start_row     = excluded.start_row,
        updated_at    = excluded.updated_at,
        status        = excluded.status
    `,
    ).run(
      module,
      template_name,
      template_path,
      sheet_name,
      start_row,
      uploaded_at,
      now,
      status,
    );

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

// ── deleteTemplate ────────────────────────────────────────────────────────────

/**
 * Deletes the template record for the given module.
 * @param {string} module
 * @returns {{ ok: true }}
 */
function deleteTemplate(module) {
  const db = openDatabase();
  try {
    db.prepare(`DELETE FROM excel_templates WHERE module = ?`).run(module);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

// ── updateTemplateStatus ──────────────────────────────────────────────────────

/**
 * Updates only the status field (e.g. "active" → "missing" if file was deleted externally).
 */
function updateTemplateStatus(module, status) {
  const db = openDatabase();
  try {
    db.prepare(`UPDATE excel_templates SET status = ? WHERE module = ?`).run(
      status,
      module,
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureExcelTemplatesTable,
  getAllTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  updateTemplateStatus,
};
