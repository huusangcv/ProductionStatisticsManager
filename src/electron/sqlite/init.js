const { ensureAppAccount } = require("./account");
const { ensureEmployeesTable, seedEmployeesIfEmpty } = require("./employees");
const { ensureGrindingTable } = require("./grinding");
const { ensureCuttingTable } = require("./cutting");
const { ensureImportSessionsTable } = require("./importSessions");
const { ensureExcelTemplatesTable } = require("./excelTemplates");
const {
  ensurePrintersTable,
  ensureSettingsTable,
  ensurePrintLogsTable,
} = require("./printers");
const {
  getDatabasePath,
  ensureDirectories,
  writeAppConfig,
} = require("./paths");
const Database = require("better-sqlite3");

// Read version from package.json at startup (safe — sync, small file)
let APP_VERSION = "0.1.0";
try {
  const pkg = require("../../../package.json");
  APP_VERSION = pkg.version || APP_VERSION;
} catch {
  // Fallback to default if package.json is not accessible
}

function initializeDatabase() {
  // 1. Create all required application subdirectories if they don't exist.
  ensureDirectories();

  // 2. Write default config/app.json on first launch (never overwrites).
  writeAppConfig(APP_VERSION);

  // 3. Open the SQLite database to apply pragmas, then close.
  const databasePath = getDatabasePath();
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.close();

  // 4. Seed single application account on first startup.
  ensureAppAccount();

  // 5. Create all tables and seed initial data if empty.
  ensureEmployeesTable();
  seedEmployeesIfEmpty();
  ensureGrindingTable();
  ensureCuttingTable();
  ensureImportSessionsTable();
  ensureExcelTemplatesTable();
  ensurePrintersTable();
  ensureSettingsTable();
  ensurePrintLogsTable();

  return databasePath;
}

module.exports = {
  initializeDatabase,
};
