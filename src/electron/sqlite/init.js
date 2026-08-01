const { ensureAppAccount } = require("./account");
const { ensureEmployeesTable, seedEmployeesIfEmpty } = require("./employees");
const { ensureRolesTable, seedRolesIfEmpty } = require("./roles");
const { ensurePositionsTable, seedPositionsIfEmpty } = require("./positions");
const { ensureBaoPheTables } = require("./baoPhe");
const { ensureGrindingTable } = require("./grinding");
const { ensureCuttingTable } = require("./cutting");
const { ensureImportSessionsTable } = require("./importSessions");
const { ensureExcelTemplatesTable, seedExcelTemplateConfigsIfEmpty } = require("./excelTemplates");
const { ensureTemplateTypesTable, seedTemplateTypesIfEmpty } = require("./templateTypes");
const { ensureDetailJointTable } = require("./detail_joint");
const { ensurePricesTable } = require("./prices");
const { ensureOvertimeTable } = require("./overtime");
const {
  ensurePrintersTable,
  ensureSettingsTable,
  ensurePrintLogsTable,
} = require("./printers");
const { ensureUpdateLogsTable } = require("./updateLogs");
const { ensureHeatTreatmentSummaryTable } = require("./heatTreatmentSummary");
const { ensurePersonalProductionTable } = require("./personalProduction");
const { ensureNotificationsTable } = require("./notifications");
const { ensureAttendanceTable } = require("./attendance");
const {
  getDatabasePath,
  ensureDirectories,
  writeAppConfig,
} = require("./paths");
const { openDatabase } = require("./connection");
const fs = require("fs");
const logger = require("../logger");

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

  const databasePath = getDatabasePath();

  // Log Database info
  try {
    if (fs.existsSync(databasePath)) {
      const stats = fs.statSync(databasePath);
      logger.info("Database Diagnostics", {
        path: databasePath,
        exists: true,
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
        lastModified: stats.mtime
      });
    } else {
      logger.info("Database Diagnostics", {
        path: databasePath,
        exists: false,
        message: "Database will be created"
      });
    }
  } catch (err) {
    logger.error("Failed to read database stats", err);
  }

  // 3. Open the SQLite database to apply pragmas, then close.
  const database = openDatabase();
  database.close();

  // 4. Seed single application account on first startup.
  ensureAppAccount();

  // 5. Create all tables and seed initial data if empty.
  ensureRolesTable();
  seedRolesIfEmpty();
  ensurePositionsTable();
  seedPositionsIfEmpty();
  ensureEmployeesTable();
  seedEmployeesIfEmpty();
  ensureGrindingTable();
  ensureCuttingTable();
  ensureImportSessionsTable();
  ensureExcelTemplatesTable();
  seedExcelTemplateConfigsIfEmpty();
  ensureTemplateTypesTable();
  seedTemplateTypesIfEmpty();
  ensureDetailJointTable();
  ensurePricesTable();
  ensureOvertimeTable();
  ensurePrintersTable();
  ensureSettingsTable();
  ensurePrintLogsTable();
  ensureBaoPheTables();
  ensureUpdateLogsTable();
  ensureHeatTreatmentSummaryTable();
  ensurePersonalProductionTable();
  ensureNotificationsTable();
  ensureAttendanceTable();

  return databasePath;
}

module.exports = {
  initializeDatabase,
};
