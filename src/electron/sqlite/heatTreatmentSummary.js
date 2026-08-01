/**
 * heatTreatmentSummary.js — Repository for heat_treatment_summary SQLite table.
 * Handles database schema and CRUD operations (upsert / get) for daily export summaries.
 */

const { getDatabasePath } = require("./paths");
const { openDatabase } = require("./connection");



// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function ensureHeatTreatmentSummaryTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS heat_treatment_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date TEXT NOT NULL UNIQUE,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        wcb_weight REAL NOT NULL DEFAULT 0,
        other_weight REAL NOT NULL DEFAULT 0,
        total_weight REAL NOT NULL DEFAULT 0,
        exported_file TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Repository Methods
// ---------------------------------------------------------------------------

/**
 * Upserts a heat treatment export summary into the SQLite database.
 * If reportDate already exists, UPDATE. Otherwise, INSERT.
 * One report per day.
 *
 * @param {object} summary - { reportDate, periodYear, periodMonth, wcbWeight, otherWeight, totalWeight, exportedFile }
 * @returns {object} { ok: true, action: "insert"|"update", id, summary }
 */
function upsert(summary) {
  const db = openDatabase();
  try {
    const existing = db
      .prepare(`SELECT id, created_at FROM heat_treatment_summary WHERE report_date = ?`)
      .get(summary.reportDate);

    const now = new Date().toISOString().replace("T", " ").replace("Z", "").substring(0, 19);

    if (existing) {
      db.prepare(`
        UPDATE heat_treatment_summary
        SET period_year = ?,
            period_month = ?,
            wcb_weight = ?,
            other_weight = ?,
            total_weight = ?,
            exported_file = ?,
            updated_at = datetime('now', 'localtime')
        WHERE report_date = ?
      `).run(
        summary.periodYear,
        summary.periodMonth,
        summary.wcbWeight,
        summary.otherWeight,
        summary.totalWeight,
        summary.exportedFile,
        summary.reportDate
      );
      return {
        ok: true,
        action: "update",
        id: existing.id,
        summary: {
          ...summary,
          createdAt: existing.created_at,
          updatedAt: now,
        },
      };
    } else {
      const res = db.prepare(`
        INSERT INTO heat_treatment_summary (
          report_date, period_year, period_month, wcb_weight, other_weight, total_weight, exported_file, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
        )
      `).run(
        summary.reportDate,
        summary.periodYear,
        summary.periodMonth,
        summary.wcbWeight,
        summary.otherWeight,
        summary.totalWeight,
        summary.exportedFile
      );
      return {
        ok: true,
        action: "insert",
        id: res.lastInsertRowid,
        summary: {
          ...summary,
          createdAt: now,
          updatedAt: now,
        },
      };
    }
  } catch (error) {
    console.error("Failed to upsert heat treatment summary:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Repository method to save export summary. Internally calls upsert().
 */
function saveExportSummary(summary) {
  return upsert(summary);
}

/**
 * Retrieves a summary by its report date.
 * @param {string} reportDate 
 * @returns {object|undefined}
 */
function getSummaryByDate(reportDate) {
  const db = openDatabase();
  try {
    return db
      .prepare(`SELECT * FROM heat_treatment_summary WHERE report_date = ?`)
      .get(reportDate);
  } finally {
    db.close();
  }
}

/**
 * Upserts a heat treatment summary using period (year+month) as the key.
 * One record per reporting period (26th prev month → 25th current month).
 * Uses report_date to store the most recent export date within the period.
 *
 * @param {object} summary - { reportDate, periodYear, periodMonth, wcbWeight, otherWeight, totalWeight, exportedFile }
 * @returns {object} { ok: true, action: "insert"|"update", id, summary }
 */
function upsertByPeriod(summary) {
  const db = openDatabase();
  try {
    const existing = db
      .prepare(`SELECT id, created_at FROM heat_treatment_summary WHERE period_year = ? AND period_month = ?`)
      .get(summary.periodYear, summary.periodMonth);

    const now = new Date().toISOString().replace("T", " ").replace("Z", "").substring(0, 19);

    if (existing) {
      db.prepare(`
        UPDATE heat_treatment_summary
        SET report_date = ?,
            wcb_weight = ?,
            other_weight = ?,
            total_weight = ?,
            exported_file = ?,
            updated_at = datetime('now', 'localtime')
        WHERE period_year = ? AND period_month = ?
      `).run(
        summary.reportDate,
        summary.wcbWeight,
        summary.otherWeight,
        summary.totalWeight,
        summary.exportedFile,
        summary.periodYear,
        summary.periodMonth
      );
      return {
        ok: true,
        action: "update",
        id: existing.id,
        summary: {
          ...summary,
          createdAt: existing.created_at,
          updatedAt: now,
        },
      };
    } else {
      const res = db.prepare(`
        INSERT INTO heat_treatment_summary (
          report_date, period_year, period_month, wcb_weight, other_weight, total_weight, exported_file, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
        )
      `).run(
        summary.reportDate,
        summary.periodYear,
        summary.periodMonth,
        summary.wcbWeight,
        summary.otherWeight,
        summary.totalWeight,
        summary.exportedFile
      );
      return {
        ok: true,
        action: "insert",
        id: res.lastInsertRowid,
        summary: {
          ...summary,
          createdAt: now,
          updatedAt: now,
        },
      };
    }
  } catch (error) {
    console.error("Failed to upsertByPeriod heat treatment summary:", error);
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Retrieves all summary records for a given period (year + month).
 * Returns an array (may be empty if no export done yet).
 * @param {number} periodYear
 * @param {number} periodMonth
 * @returns {object[]}
 */
function getSummaryByPeriod(periodYear, periodMonth) {
  const db = openDatabase();
  try {
    return db
      .prepare(`SELECT * FROM heat_treatment_summary WHERE period_year = ? AND period_month = ? ORDER BY report_date ASC`)
      .all(periodYear, periodMonth);
  } finally {
    db.close();
  }
}

module.exports = {
  ensureHeatTreatmentSummaryTable,
  upsert,
  upsertByPeriod,
  saveExportSummary,
  getSummaryByDate,
  getSummaryByPeriod,
};
