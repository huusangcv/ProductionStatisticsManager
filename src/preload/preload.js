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
  dashboard: {
    getKPIs: (params) => ipcRenderer.invoke("dashboard:getKPIs", params),
    getTopEmployees: (params) => ipcRenderer.invoke("dashboard:getTopEmployees", params),
    getTopWorkOrders: (params) => ipcRenderer.invoke("dashboard:getTopWorkOrders", params),
    getProductionByDate: (params) => ipcRenderer.invoke("dashboard:getProductionByDate", params),
    getGridData: (params) => ipcRenderer.invoke("dashboard:getGridData", params),
  },
  employees: {
    getAll: () => ipcRenderer.invoke("employee:getAll"),
    getByRepresentativeCode: (representativeCode) =>
      ipcRenderer.invoke("employee:getByRepresentativeCode", representativeCode),
    getByRepresentativeCodeAndRole: (representativeCode, roleCode) =>
      ipcRenderer.invoke("employee:getByRepresentativeCodeAndRole", representativeCode, roleCode),
    getByCode: (code) => ipcRenderer.invoke("employee:getByCode", code),
    getById: (id) => ipcRenderer.invoke("employee:getById", id),
    create: (data) => ipcRenderer.invoke("employee:create", data),
    update: (id, data) => ipcRenderer.invoke("employee:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("employee:delete", id),
    importExcel: () => ipcRenderer.invoke("employee:importExcel"),
    exportExcel: () => ipcRenderer.invoke("employee:exportExcel"),
  },
  roles: {
    getAll: () => ipcRenderer.invoke("role:getAll"),
    getById: (id) => ipcRenderer.invoke("role:getById", id),
    create: (data) => ipcRenderer.invoke("role:create", data),
    update: (id, data) => ipcRenderer.invoke("role:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("role:delete", id),
  },
  positions: {
    getAll: () => ipcRenderer.invoke("position:getAll"),
    getById: (id) => ipcRenderer.invoke("position:getById", id),
    create: (data) => ipcRenderer.invoke("position:create", data),
    update: (id, data) => ipcRenderer.invoke("position:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("position:delete", id),
  },
  grinding: {
    getAll: () => ipcRenderer.invoke("grinding:getAll"),
    getById: (id) => ipcRenderer.invoke("grinding:getById", id),
    update: (id, data) => ipcRenderer.invoke("grinding:update", id, data),
    delete: (id) => ipcRenderer.invoke("grinding:delete", id),
    selectFile: () => ipcRenderer.invoke("grinding:selectFile"),
    parseExcel: (filePath) =>
      ipcRenderer.invoke("grinding:parseExcel", filePath),
    save: (payload) => ipcRenderer.invoke("grinding:save", payload),
  },
  cutting: {
    getAll: () => ipcRenderer.invoke("cutting:getAll"),
    getById: (id) => ipcRenderer.invoke("cutting:getById", id),
    update: (id, data) => ipcRenderer.invoke("cutting:update", id, data),
    delete: (id) => ipcRenderer.invoke("cutting:delete", id),
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
    selectFile: (defaultPath) =>
      ipcRenderer.invoke("template:selectFile", defaultPath),
    upload: (params) => ipcRenderer.invoke("template:upload", params),
    replace: (params) => ipcRenderer.invoke("template:replace", params),
    preview: (filePath) => ipcRenderer.invoke("template:preview", filePath),
    delete: (module) => ipcRenderer.invoke("template:delete", module),
    openFolder: () => ipcRenderer.invoke("template:openFolder"),
    checksum: (filePath) => ipcRenderer.invoke("template:checksum", filePath),
    getSheets: (filePath) => ipcRenderer.invoke("template:getSheets", filePath),
    printTest: (params) => ipcRenderer.invoke("template:printTest", params),
    updatePrintColumns: (params) => ipcRenderer.invoke("template:updatePrintColumns", params),
    updatePrintConfig: (params) => ipcRenderer.invoke("template:updatePrintConfig", params),
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
    printExcel: (filePath, moduleKey) =>
      ipcRenderer.invoke("report:printExcel", { filePath, module: moduleKey }),
  },
  printer: {
    getAll: () => ipcRenderer.invoke("printer:getAll"),
    refresh: () => ipcRenderer.invoke("printer:refresh"),
    getDefault: () => ipcRenderer.invoke("printer:getDefault"),
    save: (printerName) => ipcRenderer.invoke("printer:save", printerName),
    check: (printerName) => ipcRenderer.invoke("printer:check", printerName),
    test: (printerName) => ipcRenderer.invoke("printer:test", printerName),
    printExcel: (filePath, moduleKey) =>
      ipcRenderer.invoke("printer:printExcel", { filePath, module: moduleKey }),
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
  detailJoint: {
    getAll: () => ipcRenderer.invoke("detailJoint:getAll"),
    getById: (id) => ipcRenderer.invoke("detailJoint:getById", id),
    create: (data) => ipcRenderer.invoke("detailJoint:create", data),
    update: (id, data) =>
      ipcRenderer.invoke("detailJoint:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("detailJoint:delete", id),
    importExcel: () => ipcRenderer.invoke("detailJoint:importExcel"),
    exportExcel: () => ipcRenderer.invoke("detailJoint:exportExcel"),
  },
  templateType: {
    getAll: () => ipcRenderer.invoke("templateType:getAll"),
    getActive: () => ipcRenderer.invoke("templateType:getActive"),
    create: (data) => ipcRenderer.invoke("templateType:create", data),
    update: (id, data) => ipcRenderer.invoke("templateType:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("templateType:delete", id),
  },
  price: {
    getAll: () => ipcRenderer.invoke("price:getAll"),
    create: (data) => ipcRenderer.invoke("price:create", data),
    update: (id, data) => ipcRenderer.invoke("price:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("price:delete", id),
    importExcel: () => ipcRenderer.invoke("price:importExcel"),
    exportExcel: () => ipcRenderer.invoke("price:exportExcel"),
  },
  overtime: {
    getHistory: (departmentId) => ipcRenderer.invoke("overtime:getHistory", departmentId),
    saveHistory: (snapshotData) => ipcRenderer.invoke("overtime:saveHistory", snapshotData),
    deleteHistory: (id) => ipcRenderer.invoke("overtime:deleteHistory", id),
    clearHistory: (departmentId) => ipcRenderer.invoke("overtime:clearHistory", departmentId),
  },
  castingDefect: {
    getByDate:  (date) => ipcRenderer.invoke("castingDefect:getByDate", date),
    debugDate:  (date) => ipcRenderer.invoke("castingDefect:debugDate", date),
    generate:   (reportDate) => ipcRenderer.invoke("castingDefect:generate", { reportDate }),
    openFolder: (filePath) => ipcRenderer.invoke("castingDefect:openFolder", filePath),
    openFile:   (filePath) => ipcRenderer.invoke("castingDefect:openFile", filePath),
    print:      (filePath) => ipcRenderer.invoke("castingDefect:print", filePath),
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
