const backupService = {
  list: async () => {
    return await window.electronAPI.backup.list();
  },
  create: async () => {
    return await window.electronAPI.backup.create();
  },
  restore: async (backupPath) => {
    return await window.electronAPI.backup.restore(backupPath);
  },
  export: async (exportPath) => {
    return await window.electronAPI.backup.export(exportPath);
  },
  import: async (importPath) => {
    return await window.electronAPI.backup.import(importPath);
  },
};

export default backupService;
