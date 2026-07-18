const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { getDatabasePath, getAppDataRoot } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

function listBackups() {
  const backupsDir = path.join(getAppDataRoot(), "backups");
  if (!fs.existsSync(backupsDir)) return [];
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith(".db"))
    .map(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createBackup() {
  try {
    const srcPath = getDatabasePath();
    const backupsDir = path.join(getAppDataRoot(), "backups");
    
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:T.]/g, "-").slice(0, 19);
    const backupFileName = `production_backup_${timestamp}.db`;
    const destPath = path.join(backupsDir, backupFileName);
    
    fs.copyFileSync(srcPath, destPath);
    
    return {
      ok: true,
      backupPath: destPath,
      backupName: backupFileName,
    };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function restoreBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { ok: false, message: "Backup file not found" };
    }
    
    const dbPath = getDatabasePath();
    const tempPath = `${dbPath}.tmp`;
    
    const db = openDatabase();
    db.close();
    
    fs.copyFileSync(backupPath, tempPath);
    fs.renameSync(tempPath, dbPath);
    
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function exportDatabase(exportPath) {
  try {
    const srcPath = getDatabasePath();
    fs.copyFileSync(srcPath, exportPath);
    return { ok: true, exportPath };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function importDatabase(importPath) {
  return restoreBackup(importPath);
}

module.exports = {
  listBackups,
  createBackup,
  restoreBackup,
  exportDatabase,
  importDatabase,
};
