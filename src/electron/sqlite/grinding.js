const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Creates the grinding table if it does not exist.
 * We include a UNIQUE constraint to avoid duplicate imports.
 * The uniqueness is determined by a composite key (report_date, work_order_number, item_name, completed_quantity)
 * which helps prevent double-importing the same Excel row.
 */
function ensureGrindingTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS grinding_production (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date             TEXT,
        customer_order_number   TEXT,
        work_order_number       TEXT,
        material_code           TEXT,
        item_name               TEXT,
        specification           TEXT,
        completed_quantity      INTEGER,
        employee_name           TEXT,
        scrap_quantity          INTEGER,
        unit_weight             REAL,
        completed_weight        REAL,
        imported_at             TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        
        -- Prevent duplicate imports for the same record
        UNIQUE(report_date, work_order_number, item_name, completed_quantity)
      )
    `);
  } finally {
    db.close();
  }
}

/**
 * Creates the import_history table to track all imports for auditing.
 */
function ensureImportHistoryTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS import_history (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name               TEXT NOT NULL,
        imported_at             TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        record_count            INTEGER NOT NULL,
        status                  TEXT NOT NULL
      )
    `);
  } finally {
    db.close();
  }
}

/**
 * Returns all grinding production records ordered by import time descending.
 */
function getAllGrindingData() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT *
         FROM grinding_production
         ORDER BY imported_at DESC`
      )
      .all();
  } catch (err) {
    const { dialog } = require("electron");
    dialog.showErrorBox("getAllGrindingData error", err.message + "\n\n" + err.stack);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Inserts multiple grinding records using a transaction.
 * Ignores duplicate rows based on the UNIQUE constraint.
 * Records the import history in the same transaction.
 * Returns the number of newly inserted rows.
 */
function importGrindingData(records, fileName) {
  const db = openDatabase();
  try {
    const insertData = db.prepare(`
      INSERT OR IGNORE INTO grinding_production (
        report_date, customer_order_number, work_order_number, material_code,
        item_name, specification, completed_quantity, employee_name,
        scrap_quantity, unit_weight, completed_weight
      ) VALUES (
        @report_date, @customer_order_number, @work_order_number, @material_code,
        @item_name, @specification, @completed_quantity, @employee_name,
        @scrap_quantity, @unit_weight, @completed_weight
      )
    `);

    const insertHistory = db.prepare(`
      INSERT INTO import_history (file_name, record_count, status)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((rows, name) => {
      let insertedCount = 0;
      for (const row of rows) {
        const result = insertData.run(row);
        insertedCount += result.changes;
      }
      
      insertHistory.run(name, rows.length, insertedCount > 0 ? "SUCCESS" : "NO_NEW_DATA");
      return insertedCount;
    });

    const insertedCount = insertMany(records, fileName || "Unknown File");
    return { ok: true, insertedCount };
  } catch (error) {
    // If it fails, attempt to log the failure (outside the failed transaction)
    try {
      const dbError = openDatabase();
      dbError.prepare(`
        INSERT INTO import_history (file_name, record_count, status)
        VALUES (?, ?, ?)
      `).run(fileName || "Unknown File", records ? records.length : 0, "ERROR: " + error.message);
      dbError.close();
    } catch (e) {
      console.error("Failed to log import error", e);
    }
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Checks if any records exist for a specific date.
 * @param {string} date - The date to check (e.g., "DD/MM/YYYY")
 * @returns {boolean} True if records exist, false otherwise.
 */
function checkGrindingDataExistsByDate(date) {
  const db = openDatabase();
  try {
    const row = db
      .prepare(`SELECT 1 FROM grinding_production WHERE report_date = ? LIMIT 1`)
      .get(date);
    return !!row;
  } finally {
    db.close();
  }
}

/**
 * Deletes all records for a specific date.
 * @param {string} date - The date to delete records for
 */
function deleteGrindingDataByDate(date) {
  const db = openDatabase();
  try {
    db.prepare(`DELETE FROM grinding_production WHERE report_date = ?`).run(date);
  } finally {
    db.close();
  }
}

module.exports = {
  ensureGrindingTable,
  ensureImportHistoryTable,
  getAllGrindingData,
  importGrindingData,
  checkGrindingDataExistsByDate,
  deleteGrindingDataByDate,
};
