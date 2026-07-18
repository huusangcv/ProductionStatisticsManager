const backupDAO = require("../sqlite/backup");

const backupService = {
  listBackups: () => backupDAO.listBackups(),
  createBackup: () => backupDAO.createBackup(),
  restoreBackup: (backupPath) => backupDAO.restoreBackup(backupPath),
  exportDatabase: (exportPath) => backupDAO.exportDatabase(exportPath),
  importDatabase: (importPath) => backupDAO.importDatabase(importPath),
};

module.exports = backupService;
