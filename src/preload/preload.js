const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  app: {
    ping: () => ipcRenderer.invoke("app:ping"),
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
    update: (code, data) => ipcRenderer.invoke("employee:update", { employeeCode: code, data }),
    delete: (code) => ipcRenderer.invoke("employee:delete", code),
  },
  grinding: {
    getAll: () => ipcRenderer.invoke("grinding:getAll"),
    selectFile: () => ipcRenderer.invoke("grinding:selectFile"),
    parseExcel: (filePath) => ipcRenderer.invoke("grinding:parseExcel", filePath),
    save: (payload) => ipcRenderer.invoke("grinding:save", payload),
  },
  db: {
    initialize: () => ipcRenderer.invoke("db:initialize"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximizeToggle: () => ipcRenderer.invoke("window:maximize-toggle"),
    close: () => ipcRenderer.invoke("window:close"),
  },
});


