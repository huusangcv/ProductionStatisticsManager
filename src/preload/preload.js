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
  db: {
    initialize: () => ipcRenderer.invoke("db:initialize"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximizeToggle: () => ipcRenderer.invoke("window:maximize-toggle"),
    close: () => ipcRenderer.invoke("window:close"),
  },
});

