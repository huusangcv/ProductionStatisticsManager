/**
 * productionBase.js — Generic DAO factory for production modules.
 */

const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Builds a comma-separated SQL column definition string from a column spec.
 * Maps column type to SQLite type (TEXT, INTEGER, REAL).
 */
function buildColumnDefinitions(columnSpec) {
  return columnSpec
    .map((col) => {
      let sqlType = "TEXT";
      if (col.type === "number" || col.type === "integer") sqlType = "INTEGER";
      if (col.type === "float") sqlType = "REAL";
      return `        ${col.databaseField.padEnd(30)} ${sqlType}`;
    })
    .join(",\n");
}

/**
 * Creates a production DAO module for a given table and column specification.
 * @param {string} tableName - e.g. "grinding_production" or "cutting_production"
 * @param {Array}  columnSpec - from grindingColumns.js / cuttingColumns.js
 */
function createProductionModule(tableName, columnSpec) {
  const colDefs = buildColumnDefinitions(columnSpec);
  const dbFields = columnSpec.map((c) => c.databaseField);

  // ── ensureTable ──────────────────────────────────────────────────────────
  function ensureTable() {
    const db = openDatabase();
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id                            INTEGER PRIMARY KEY AUTOINCREMENT,
${colDefs},
          import_session_id             INTEGER,
          imported_at                   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          UNIQUE(report_date, work_order_number, item_name, completed_quantity)
        )
      `);

      // Migration: Add import_session_id to existing tables
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const hasSessionId = columns.some((col) => col.name === "import_session_id");
      if (!hasSessionId) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN import_session_id INTEGER`);
      }
    } finally {
      db.close();
    }
  }

  // ── getAll ───────────────────────────────────────────────────────────────
  function getAll() {
    const db = openDatabase();
    try {
      return db
        .prepare(`SELECT * FROM ${tableName} ORDER BY imported_at DESC`)
        .all();
    } finally {
      db.close();
    }
  }

  // ── checkExistsByDate ────────────────────────────────────────────────────
  function checkExistsByDate(date) {
    const db = openDatabase();
    try {
      const row = db
        .prepare(`SELECT 1 FROM ${tableName} WHERE report_date = ? LIMIT 1`)
        .get(date);
      return !!row;
    } finally {
      db.close();
    }
  }

  // ── deleteByDate ─────────────────────────────────────────────────────────
  function deleteByDate(date) {
    const db = openDatabase();
    try {
      db.prepare(`DELETE FROM ${tableName} WHERE report_date = ?`).run(date);
    } finally {
      db.close();
    }
  }

  // ── importData ───────────────────────────────────────────────────────────
  function importData(records, sessionId) {
    const db = openDatabase();
    try {
      // Create placeholders like: @report_date, @work_order_number
      const placeholders = dbFields.map((f) => `@${f}`).join(", ");
      
      const insertData = db.prepare(`
        INSERT OR IGNORE INTO ${tableName} (${dbFields.join(", ")}, import_session_id)
        VALUES (${placeholders}, @import_session_id)
      `);

      const insertMany = db.transaction((rows) => {
        let insertedCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          try {
            // Include import_session_id in the row object for the parameter binding
            const rowWithSession = { ...row, import_session_id: sessionId };
            const result = insertData.run(rowWithSession);
            
            if (result.changes > 0) {
              insertedCount++;
            } else {
              duplicateCount++;
            }
          } catch (e) {
            failedCount++;
          }
        }
        
        return { insertedCount, duplicateCount, failedCount };
      });

      const counts = insertMany(records);
      return { ok: true, ...counts };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      db.close();
    }
  }

  return {
    ensureTable,
    getAll,
    checkExistsByDate,
    deleteByDate,
    importData,
  };
}

module.exports = { createProductionModule };
