const templateService = {
  getAll: async () => {
    return await window.electronAPI.template.getAll();
  },
  selectFile: async (defaultPath) => {
    return await window.electronAPI.template.selectFile(defaultPath);
  },
  upload: async (params) => {
    return await window.electronAPI.template.upload(params);
  },
  replace: async (params) => {
    return await window.electronAPI.template.replace(params);
  },
  preview: async (filePath) => {
    return await window.electronAPI.template.preview(filePath);
  },
  delete: async (module) => {
    return await window.electronAPI.template.delete(module);
  },
  openFolder: async () => {
    return await window.electronAPI.template.openFolder();
  },
  printTest: async (params) => {
    return await window.electronAPI.template.printTest(params);
  },
  checksum: async (filePath) => {
    return await window.electronAPI.template.checksum(filePath);
  },
  getSheets: async (filePath) => {
    return await window.electronAPI.template.getSheets(filePath);
  },
  updatePrintColumns: async ({ module, startColumn, endColumn }) => {
    return await window.electronAPI.template.updatePrintColumns({ module, startColumn, endColumn });
  },
  updatePrintConfig: async (params) => {
    return await window.electronAPI.template.updatePrintConfig(params);
  },
};

export default templateService;
