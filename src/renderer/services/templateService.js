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
};

export default templateService;
