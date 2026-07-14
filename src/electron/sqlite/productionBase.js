/**
 * productionBase.js — Generic DAO factory for production modules.
 *
 * Usage:
 *   const grindingDAO = createProductionModule('grinding_production', columnSpec);
 *   grindingDAO.ensureTable();
 *   grindingDAO.importData(records, fileName);
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
          imported_at                   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          UNIQUE(report_date, work_order_number, item_name, completed_quantity)
        )
      `);
    } finally {
      db.close();
    }
  }

  // ── ensureImportHistoryTable ─────────────────────────────────────────────
  function ensureImportHistoryTable() {
    const db = openDatabase();
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS import_history (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          file_name    TEXT NOT NULL,
          module       TEXT NOT NULL,
          imported_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          record_count INTEGER NOT NULL,
          status       TEXT NOT NULL
        )
      `);
      
      // Migration: Add module column if it doesn't exist (from previous version)
      const columns = db.prepare("PRAGMA table_info(import_history)").all();
      const hasModuleColumn = columns.some((col) => col.name === "module");
      
      if (!hasModuleColumn) {
        db.exec("ALTER TABLE import_history ADD COLUMN module TEXT NOT NULL DEFAULT 'grinding_production'");
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
  function importData(records, fileName) {
    const db = openDatabase();
    try {
      const placeholders = dbFields.map((f) => `@${f}`).join(", ");
      const insertData = db.prepare(`
        INSERT OR IGNORE INTO ${tableName} (${dbFields.join(", ")})
        VALUES (${placeholders})
      `);

      const insertHistory = db.prepare(`
        INSERT INTO import_history (file_name, module, record_count, status)
        VALUES (?, ?, ?, ?)
      `);

      const insertMany = db.transaction((rows, name) => {
        let insertedCount = 0;
        for (const row of rows) {
          const result = insertData.run(row);
          insertedCount += result.changes;
        }
        insertHistory.run(
          name,
          tableName,
          rows.length,
          insertedCount > 0 ? "SUCCESS" : "NO_NEW_DATA"
        );
        return insertedCount;
      });

      const insertedCount = insertMany(records, fileName || "Unknown File");
      return { ok: true, insertedCount };
    } catch (error) {
      // Log failure outside of the failed transaction
      try {
        const dbErr = openDatabase();
        dbErr
          .prepare(
            `INSERT INTO import_history (file_name, module, record_count, status) VALUES (?, ?, ?, ?)`
          )
          .run(
            fileName || "Unknown File",
            tableName,
            records ? records.length : 0,
            "ERROR: " + error.message
          );
        dbErr.close();
      } catch (_) {}
      return { ok: false, message: error.message };
    } finally {
      db.close();
    }
  }

  return {
    ensureTable,
    ensureImportHistoryTable,
    getAll,
    checkExistsByDate,
    deleteByDate,
    importData,
  };
}

module.exports = { createProductionModule };
