/**
 * paths.js — Central data directory and database path resolution.
 *
 * Factory deployment: all data is stored on D:\ProductionStatisticsManager
 *
 * This is the ONLY supported data location.
 * All production computers are required to have drive D:.
 */

const fs   = require("fs");
const path = require("path");

// ── Constants ─────────────────────────────────────────────────────────────────

const DATA_ROOT = "D:\\ProductionStatisticsManager";

const SUBDIRECTORIES = [
  "database",
  "exports",
  "backups",
  "logs",
  "templates",
  "config",
  "temp",
];

// ── getAppDataRoot ────────────────────────────────────────────────────────────

/**
 * Returns the application root data directory.
 * Always D:\ProductionStatisticsManager on factory machines.
 */
function getAppDataRoot() {
  return DATA_ROOT;
}

// ── ensureDirectories ─────────────────────────────────────────────────────────

/**
 * Ensures all required subdirectories exist under the app data root.
 * Safe to call multiple times — uses recursive: true.
 */
function ensureDirectories() {
  const root = getAppDataRoot();
  for (const sub of SUBDIRECTORIES) {
    const dir = path.join(root, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ── getDatabasePath ───────────────────────────────────────────────────────────

/**
 * Returns the absolute path to the SQLite database file.
 */
function getDatabasePath() {
  return path.join(getAppDataRoot(), "database", "production.db");
}

// ── writeAppConfig ────────────────────────────────────────────────────────────

/**
 * Writes config/app.json on first launch.
 * Never overwrites an existing config file.
 *
 * @param {string} version  Application version string (from package.json).
 */
function writeAppConfig(version) {
  const configPath = path.join(getAppDataRoot(), "config", "app.json");

  if (fs.existsSync(configPath)) {
    return; // Never overwrite
  }

  const root    = getAppDataRoot();
  const config  = {
    version,
    dataRoot:       root,
    databasePath:   path.join(root, "database", "production.db"),
    exportPath:     path.join(root, "exports"),
    templatePath:   path.join(root, "templates"),
    logPath:        path.join(root, "logs"),
    generatedAt:    new Date().toISOString(),
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    // Log-only: do not crash the application if config write fails
    const logger = require("./logger");
    logger.error("Failed to write app.json", err);
  }
}

module.exports = {
  getAppDataRoot,
  getDatabasePath,
  ensureDirectories,
  writeAppConfig,
};
