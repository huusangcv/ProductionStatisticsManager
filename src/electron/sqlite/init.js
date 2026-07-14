const { ensureAppAccount } = require("./account");
const { ensureEmployeesTable, seedEmployeesIfEmpty } = require("./employees");
const { ensureGrindingTable } = require("./grinding");
const { ensureCuttingTable } = require("./cutting");
const { ensureImportSessionsTable } = require("./importSessions");
const { getDatabasePath, ensureDirectories } = require("./paths");
const Database = require("better-sqlite3");

function initializeDatabase() {
  // Create all required application subdirectories if they don't exist.
  ensureDirectories();

  // Open the SQLite database to apply pragmas, then close.
  const databasePath = getDatabasePath();
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.close();

  // Seed single application account on first startup.
  ensureAppAccount();

  // Create employees table and seed initial data if empty.
  ensureEmployeesTable();
  seedEmployeesIfEmpty();
  
  ensureGrindingTable();
  ensureCuttingTable();
  ensureImportSessionsTable();

  return databasePath;
}

module.exports = {
  initializeDatabase,
};
