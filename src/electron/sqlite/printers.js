const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

function ensurePrintersTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS printers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_name TEXT NOT NULL UNIQUE,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

function ensureSettingsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_name TEXT,
        printer_driver TEXT,
        printer_port TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
    // Ensure there is always one record
    const existing = db.prepare("SELECT * FROM settings").get();
    if (!existing) {
      db.prepare(
        "INSERT INTO settings (printer_name, printer_driver, printer_port) VALUES (?, ?, ?)",
      ).run(null, null, null);
    }
  } finally {
    db.close();
  }
}

function ensurePrintLogsTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS print_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_name TEXT,
        file_name TEXT,
        file_path TEXT,
        status TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // Add new columns for tracking
    const columns = db.pragma("table_info(print_logs)");
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('error_code')) db.exec("ALTER TABLE print_logs ADD COLUMN error_code TEXT");
    if (!columnNames.includes('exception')) db.exec("ALTER TABLE print_logs ADD COLUMN exception TEXT");
    if (!columnNames.includes('execution_time')) db.exec("ALTER TABLE print_logs ADD COLUMN execution_time INTEGER");
    if (!columnNames.includes('command')) db.exec("ALTER TABLE print_logs ADD COLUMN command TEXT");
    if (!columnNames.includes('version')) db.exec("ALTER TABLE print_logs ADD COLUMN version TEXT");

  } finally {
    db.close();
  }
}

function getAllPrinters() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        "SELECT * FROM printers ORDER BY is_default DESC, printer_name ASC",
      )
      .all();
  } finally {
    db.close();
  }
}

function getDefaultPrinter() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM printers WHERE is_default = 1").get();
  } finally {
    db.close();
  }
}

function getSettings() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM settings LIMIT 1").get();
  } finally {
    db.close();
  }
}

function saveSettings(settings) {
  const db = openDatabase();
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    db.prepare(
      `
      UPDATE settings 
      SET printer_name = ?, printer_driver = ?, printer_port = ?, updated_at = ?
    `,
    ).run(
      settings.printer_name || null,
      settings.printer_driver || null,
      settings.printer_port || null,
      now,
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function saveDefaultPrinter(printerName) {
  const db = openDatabase();
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.prepare("UPDATE printers SET is_default = 0, updated_at = ?").run(now);

    const existing = db
      .prepare("SELECT * FROM printers WHERE printer_name = ?")
      .get(printerName);
    if (existing) {
      db.prepare(
        "UPDATE printers SET is_default = 1, updated_at = ? WHERE printer_name = ?",
      ).run(now, printerName);
    } else {
      db.prepare(
        "INSERT INTO printers (printer_name, is_default, created_at, updated_at) VALUES (?, 1, ?, ?)",
      ).run(printerName, now, now);
    }

    // Also update settings table
    db.prepare("UPDATE settings SET printer_name = ?, updated_at = ?").run(
      printerName,
      now,
    );

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deletePrinter(printerName) {
  const db = openDatabase();
  try {
    db.prepare("DELETE FROM printers WHERE printer_name = ?").run(printerName);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function addPrintLog(log) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `
      INSERT INTO print_logs (
        printer_name, file_name, file_path, status, error_message,
        error_code, exception, execution_time, command, version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        log.printer_name || null,
        log.file_name || null,
        log.file_path || null,
        log.status,
        log.error_message || null,
        log.error_code || null,
        log.exception || null,
        log.execution_time || null,
        log.command || null,
        log.version || null
      );
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function getPrintLogs(limit = 50) {
  const db = openDatabase();
  try {
    return db
      .prepare("SELECT * FROM print_logs ORDER BY created_at DESC LIMIT ?")
      .all(limit);
  } finally {
    db.close();
  }
}

module.exports = {
  ensurePrintersTable,
  ensureSettingsTable,
  ensurePrintLogsTable,
  getAllPrinters,
  getDefaultPrinter,
  getSettings,
  saveSettings,
  saveDefaultPrinter,
  deletePrinter,
  addPrintLog,
  getPrintLogs,
};
