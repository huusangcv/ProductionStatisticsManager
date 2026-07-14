/**
 * paths.js — Central data directory and database path resolution.
 *
 * All SQLite modules must import getDatabasePath() from this file.
 * Never call app.getPath("userData") directly in DAO files.
 *
 * Resolution order:
 *   1. If drive D:\ exists  →  D:\ProductionStatisticsManager
 *   2. Otherwise            →  Electron default userData
 */

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DRIVE_D_ROOT = "D:\\ProductionStatisticsManager";

const SUBDIRECTORIES = ["database", "exports", "backups", "logs", "templates"];

/**
 * Returns true if the D:\ drive is accessible.
 */
function isDriveAvailable() {
  try {
    fs.accessSync("D:\\", fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the application root data directory.
 * D:\ProductionStatisticsManager  or  %AppData%\<app-name>
 */
function getAppDataRoot() {
  if (isDriveAvailable()) {
    return DRIVE_D_ROOT;
  }
  return app.getPath("userData");
}

/**
 * Ensures all required subdirectories exist under the app data root.
 * Safe to call multiple times — uses recursive:true.
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

/**
 * Returns the absolute path to the SQLite database file.
 */
function getDatabasePath() {
  return path.join(getAppDataRoot(), "database", "production.db");
}

module.exports = {
  getAppDataRoot,
  getDatabasePath,
  ensureDirectories,
};
