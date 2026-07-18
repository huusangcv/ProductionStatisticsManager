const printerService = {
  getAll: async () => {
    return await window.electronAPI.printer.getAll();
  },
  refresh: async () => {
    return await window.electronAPI.printer.refresh();
  },
  getDefault: async () => {
    return await window.electronAPI.printer.getDefault();
  },
  save: async (printerName) => {
    return await window.electronAPI.printer.save(printerName);
  },
  check: async (printerName) => {
    return await window.electronAPI.printer.check(printerName);
  },
  test: async (printerName) => {
    return await window.electronAPI.printer.test(printerName);
  },
  printExcel: async (filePath) => {
    return await window.electronAPI.printer.printExcel(filePath);
  },
  printPdf: async (filePath) => {
    return await window.electronAPI.printer.printPdf(filePath);
  },
  getLogs: async (limit) => {
    return await window.electronAPI.printer.getLogs(limit);
  },
  getSettings: async () => {
    return await window.electronAPI.printer.getSettings();
  },
  saveSettings: async (settings) => {
    return await window.electronAPI.printer.saveSettings(settings);
  },
};

export default printerService;
