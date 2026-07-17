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

function buildCreateTableSql(tableName, columnSpec) {
  const colDefs = buildColumnDefinitions(columnSpec);
  return `
        CREATE TABLE ${tableName} (
          id                            INTEGER PRIMARY KEY AUTOINCREMENT,
${colDefs},
          import_session_id             INTEGER,
          imported_at                   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
      `;
}

function hasDedupUniqueIndex(db, tableName) {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
  return indexes.some((idx) => idx.unique === 1 && idx.origin === "u");
}

/**
 * Existing databases may still carry the old dedup UNIQUE constraint.
 * Recreate the table without it so every Excel row can be inserted.
 */
function migrateRemoveDedupConstraint(db, tableName, columnSpec) {
  if (!hasDedupUniqueIndex(db, tableName)) return;

  const tempTable = `${tableName}_no_dedup`;
  const columns = [
    "id",
    ...columnSpec.map((c) => c.databaseField),
    "import_session_id",
    "imported_at",
  ].join(", ");

  db.exec(`DROP TABLE IF EXISTS ${tempTable}`);
  db.exec(buildCreateTableSql(tempTable, columnSpec));
  db.exec(`INSERT INTO ${tempTable} (${columns}) SELECT ${columns} FROM ${tableName}`);
  db.exec(`DROP TABLE ${tableName}`);
  db.exec(`ALTER TABLE ${tempTable} RENAME TO ${tableName}`);
}

/**
 * Creates a production DAO module for a given table and column specification.
 * @param {string} tableName - e.g. "grinding_production" or "cutting_production"
 * @param {Array}  columnSpec - from grindingColumns.js / cuttingColumns.js
 */
function createProductionModule(tableName, columnSpec) {
  const dbFields = columnSpec.map((c) => c.databaseField);

  // ── ensureTable ──────────────────────────────────────────────────────────
  function ensureTable() {
    const db = openDatabase();
    try {
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName);

      if (tableExists) {
        migrateRemoveDedupConstraint(db, tableName, columnSpec);
      } else {
        db.exec(buildCreateTableSql(tableName, columnSpec));
      }

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
      const placeholders = dbFields.map((f) => `@${f}`).join(", ");

      const insertData = db.prepare(`
        INSERT INTO ${tableName} (${dbFields.join(", ")}, import_session_id)
        VALUES (${placeholders}, @import_session_id)
      `);

      const insertMany = db.transaction((rows) => {
        let insertedCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          try {
            const rowWithSession = { ...row, import_session_id: sessionId };
            const result = insertData.run(rowWithSession);
            insertedCount += result.changes;
          } catch {
            failedCount++;
          }
        }

        return { insertedCount, duplicateCount: 0, failedCount };
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
