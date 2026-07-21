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
    if (!columns.includes("print_start_column")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN print_start_column TEXT DEFAULT 'A'");
    }
    if (!columns.includes("print_end_column")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN print_end_column TEXT DEFAULT 'Z'");
    }
    if (!columns.includes("repeat_header_rows")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN repeat_header_rows TEXT");
    }
    if (!columns.includes("orientation")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN orientation TEXT DEFAULT 'landscape'");
    }
    if (!columns.includes("paper_size")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN paper_size TEXT DEFAULT 'A4'");
    }
    if (!columns.includes("fit_width")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN fit_width INTEGER DEFAULT 1");
    }
    if (!columns.includes("fit_height")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN fit_height INTEGER");
    }
    if (!columns.includes("margin_left_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN margin_left_cm REAL DEFAULT 1.5");
    }
    if (!columns.includes("margin_right_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN margin_right_cm REAL DEFAULT 1.5");
    }
    if (!columns.includes("margin_top_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN margin_top_cm REAL DEFAULT 1.5");
    }
    if (!columns.includes("margin_bottom_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN margin_bottom_cm REAL DEFAULT 1.5");
    }
    if (!columns.includes("header_margin_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN header_margin_cm REAL DEFAULT 0.8");
    }
    if (!columns.includes("footer_margin_cm")) {
      db.exec("ALTER TABLE excel_templates ADD COLUMN footer_margin_cm REAL DEFAULT 0.8");
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

// ── updatePrintColumns ────────────────────────────────────────────────────────────────

/**
 * Updates only the print column range for a given module.
 * Does NOT touch template_path, checksum, file_size, or any other field.
 *
 * @param {string} module       e.g. "heat-treatment"
 * @param {string} startColumn  e.g. "A"
 * @param {string} endColumn    e.g. "W"
 * @returns {{ ok: boolean, message?: string }}
 */
function updatePrintColumns(module, startColumn, endColumn) {
  const db = openDatabase();
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const result = db
      .prepare(
        `UPDATE excel_templates
         SET print_start_column = ?, print_end_column = ?, updated_at = ?
         WHERE module = ?`,
      )
      .run(
        (startColumn || "A").toUpperCase().trim(),
        (endColumn   || "Z").toUpperCase().trim(),
        now,
        module,
      );
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy template "${module}".` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

// ── updatePrintConfig ─────────────────────────────────────────────────────────

/**
 * Updates all print configuration fields for a given module.
 */
function updatePrintConfig(module, config) {
  const db = openDatabase();
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const result = db
      .prepare(
        `UPDATE excel_templates
         SET print_start_column = ?,
             print_end_column = ?,
             repeat_header_rows = ?,
             orientation = ?,
             paper_size = ?,
             fit_width = ?,
             fit_height = ?,
             margin_left_cm = ?,
             margin_right_cm = ?,
             margin_top_cm = ?,
             margin_bottom_cm = ?,
             header_margin_cm = ?,
             footer_margin_cm = ?,
             updated_at = ?
         WHERE module = ?`
      )
      .run(
        (config.startColumn || "A").toUpperCase().trim(),
        (config.endColumn || "Z").toUpperCase().trim(),
        config.repeatHeaderRows || null,
        config.orientation || 'landscape',
        config.paperSize || 'A4',
        config.fitWidth !== '' ? config.fitWidth : null,
        config.fitHeight !== '' ? config.fitHeight : null,
        config.marginLeft !== '' ? config.marginLeft : 1.5,
        config.marginRight !== '' ? config.marginRight : 1.5,
        config.marginTop !== '' ? config.marginTop : 1.5,
        config.marginBottom !== '' ? config.marginBottom : 1.5,
        config.headerMargin !== '' ? config.headerMargin : 0.8,
        config.footerMargin !== '' ? config.footerMargin : 0.8,
        now,
        module
      );
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy template "${module}".` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

// ── seedExcelTemplateConfigsIfEmpty ─────────────────────────────────────────

function seedExcelTemplateConfigsIfEmpty() {
  const db = openDatabase();
  try {
    const templates = [
      {
        module: "heat-treatment",
        start: "A", end: "W", repeat: "1:5",
        orientation: "landscape", paper: "A4",
        fitWidth: 1, fitHeight: null,
      },
      {
        module: "grinding",
        start: "A", end: "T", repeat: "1:4",
        orientation: "portrait", paper: "A4",
        fitWidth: 1, fitHeight: null,
      },
      {
        module: "cutting",
        start: "A", end: "V", repeat: "1:4",
        orientation: "landscape", paper: "A4",
        fitWidth: 1, fitHeight: null,
      },
    ];

    const stmt = db.prepare(`
      UPDATE excel_templates
      SET print_start_column = ?, print_end_column = ?, repeat_header_rows = ?,
          orientation = ?, paper_size = ?, fit_width = ?, fit_height = ?
      WHERE module = ? AND (repeat_header_rows IS NULL OR repeat_header_rows = '')
    `);

    for (const t of templates) {
      stmt.run(t.start, t.end, t.repeat, t.orientation, t.paper, t.fitWidth, t.fitHeight, t.module);
    }
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
  updatePrintColumns,
  updatePrintConfig,
  seedExcelTemplateConfigsIfEmpty,
};
