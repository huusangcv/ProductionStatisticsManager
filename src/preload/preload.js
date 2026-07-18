const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  app: {
    ping: () => ipcRenderer.invoke("app:ping"),
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
  },
  auth: {
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
    getAccount: () => ipcRenderer.invoke("auth:getAccount"),
    updateAccount: (data) => ipcRenderer.invoke("auth:updateAccount", data),
  },
  employees: {
    getAll: () => ipcRenderer.invoke("employee:getAll"),
    getByCode: (code) => ipcRenderer.invoke("employee:getByCode", code),
    create: (data) => ipcRenderer.invoke("employee:create", data),
    update: (code, data) =>
      ipcRenderer.invoke("employee:update", { employeeCode: code, data }),
    delete: (code) => ipcRenderer.invoke("employee:delete", code),
  },
  grinding: {
    getAll: () => ipcRenderer.invoke("grinding:getAll"),
    selectFile: () => ipcRenderer.invoke("grinding:selectFile"),
    parseExcel: (filePath) =>
      ipcRenderer.invoke("grinding:parseExcel", filePath),
    save: (payload) => ipcRenderer.invoke("grinding:save", payload),
  },
  cutting: {
    getAll: () => ipcRenderer.invoke("cutting:getAll"),
    selectFile: () => ipcRenderer.invoke("cutting:selectFile"),
    parseExcel: (filePath) =>
      ipcRenderer.invoke("cutting:parseExcel", filePath),
    save: (payload) => ipcRenderer.invoke("cutting:save", payload),
  },
  importSessions: {
    getAll: () => ipcRenderer.invoke("import-session:getAll"),
    getById: (id) => ipcRenderer.invoke("import-session:getById", id),
    delete: (id) => ipcRenderer.invoke("import-session:delete", id),
    rollback: (id) => ipcRenderer.invoke("import-session:rollback", id),
  },
  template: {
    get: (module) => ipcRenderer.invoke("template:get", module),
    getAll: () => ipcRenderer.invoke("template:getAll"),
    selectFile: (defaultPath) => ipcRenderer.invoke("template:selectFile", defaultPath),
    upload: (params) => ipcRenderer.invoke("template:upload", params),
    replace: (params) => ipcRenderer.invoke("template:replace", params),
    preview: (filePath) => ipcRenderer.invoke("template:preview", filePath),
    delete: (module) => ipcRenderer.invoke("template:delete", module),
    openFolder: () => ipcRenderer.invoke("template:openFolder"),
    checksum: (filePath) => ipcRenderer.invoke("template:checksum", filePath),
    printTest: (params) => ipcRenderer.invoke("template:printTest", params),
  },
  heatTreatment: {
    getGrindingByDate: (date) =>
      ipcRenderer.invoke("heatTreatment:getGrindingByDate", date),
    generate: (params) => ipcRenderer.invoke("heatTreatment:generate", params),
    openFolder: (filePath) =>
      ipcRenderer.invoke("heatTreatment:openFolder", filePath),
    openFile: (filePath) =>
      ipcRenderer.invoke("heatTreatment:openFile", filePath),
    print: (filePath) => ipcRenderer.invoke("heatTreatment:print", filePath),
  },
  report: {
    printExcel: (filePath) =>
      ipcRenderer.invoke("report:printExcel", { filePath }),
  },
  printer: {
    getAll: () => ipcRenderer.invoke("printer:getAll"),
    refresh: () => ipcRenderer.invoke("printer:refresh"),
    getDefault: () => ipcRenderer.invoke("printer:getDefault"),
    save: (printerName) => ipcRenderer.invoke("printer:save", printerName),
    check: (printerName) => ipcRenderer.invoke("printer:check", printerName),
    test: (printerName) => ipcRenderer.invoke("printer:test", printerName),
    printExcel: (filePath) =>
      ipcRenderer.invoke("printer:printExcel", filePath),
    printPdf: (filePath) => ipcRenderer.invoke("printer:printPdf", filePath),
    getLogs: (limit) => ipcRenderer.invoke("printer:getLogs", limit),
    getSettings: () => ipcRenderer.invoke("printer:getSettings"),
    saveSettings: (settings) =>
      ipcRenderer.invoke("printer:saveSettings", settings),
  },
  backup: {
    list: () => ipcRenderer.invoke("backup:list"),
    create: () => ipcRenderer.invoke("backup:create"),
    restore: (backupPath) => ipcRenderer.invoke("backup:restore", backupPath),
    export: (exportPath) => ipcRenderer.invoke("backup:export", exportPath),
    import: (importPath) => ipcRenderer.invoke("backup:import", importPath),
  },
  db: {
    initialize: () => ipcRenderer.invoke("db:initialize"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximizeToggle: () => ipcRenderer.invoke("window:maximize-toggle"),
    close: () => ipcRenderer.invoke("window:close"),
    setLoginMode: () => ipcRenderer.invoke("window:setLoginMode"),
    setApplicationMode: () => ipcRenderer.invoke("window:setApplicationMode"),
  },
});
