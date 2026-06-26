const { ipcMain } = require("electron");
const { initializeDatabase } = require("./sqlite/init");

function registerIpcHandlers() {
  ipcMain.handle("app:ping", () => ({ ok: true }));

  ipcMain.handle("db:initialize", () => {
    initializeDatabase();
    return { ok: true };
  });

  ipcMain.handle("window:minimize", (event) => {
    event.sender.getOwnerWindow()?.minimize();
    return { ok: true };
  });

  ipcMain.handle("window:maximize-toggle", (event) => {
    const window = event.sender.getOwnerWindow();
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
    event.sender.getOwnerWindow()?.close();
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
