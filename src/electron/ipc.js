const { ipcMain, BrowserWindow } = require("electron");
const { initializeDatabase } = require("./sqlite/init");
const { validateLogin, getAccount, updateAccount } = require("./sqlite/account");
const {
  getAllEmployees,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./sqlite/employees");


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

  // --- Employee handlers ---
  ipcMain.handle("employee:getAll", () => {
    return getAllEmployees();
  });

  ipcMain.handle("employee:getByCode", (_event, employeeCode) => {
    return getEmployeeByCode(employeeCode);
  });

  ipcMain.handle("employee:create", (_event, data) => {
    return createEmployee(data);
  });

  ipcMain.handle("employee:update", (_event, { employeeCode, data }) => {
    return updateEmployee(employeeCode, data);
  });

  ipcMain.handle("employee:delete", (_event, employeeCode) => {
    return deleteEmployee(employeeCode);
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
