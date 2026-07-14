const { ipcMain, BrowserWindow } = require("electron");
const { initializeDatabase } = require("./sqlite/init");
const { validateLogin, getAccount, updateAccount } = require("./sqlite/account");

function registerIpcHandlers() {
  ipcMain.handle("app:ping", () => ({ ok: true }));

  ipcMain.handle("db:initialize", () => {
    initializeDatabase();
    return { ok: true };
  });

  // --- Auth handlers ---
  ipcMain.handle("auth:login", (_event, { username, password }) => {
    return validateLogin(username, password);
  });

  ipcMain.handle("auth:getAccount", () => {
    return getAccount();
  });

  ipcMain.handle("auth:updateAccount", (_event, { username, password }) => {
    return updateAccount({ username, password });
  });

  // --- Window handlers ---
  ipcMain.handle("window:minimize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
    return { ok: true };
  });

  ipcMain.handle("window:maximize-toggle", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { ok: false };
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }

    return { ok: true, maximized: window.isMaximized() };
  });

  ipcMain.handle("window:close", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
