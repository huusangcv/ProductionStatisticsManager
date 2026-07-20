const path = require("path");
const { app, BrowserWindow, Menu } = require("electron");
const { registerIpcHandlers } = require("./ipc");
const { initializeDatabase } = require("./sqlite/init");
const { applyLoginMode, LOGIN_MODE } = require("./windowModes");
const logger = require("./logger");

// ── isDev ─────────────────────────────────────────────────────────────────────

const isDev = !app.isPackaged;

// ── resolveIconPath ───────────────────────────────────────────────────────────
// In development:  resources/ is at project root, two levels above __dirname
// In production:   electron-builder places extraResources into process.resourcesPath

function resolveIconPath() {
  if (isDev) {
    return path.join(__dirname, "..", "..", "resources", "icon.png");
  }
  return path.join(process.resourcesPath, "icon.png");
}

// ── createWindow ──────────────────────────────────────────────────────────────

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: LOGIN_MODE.width,
    height: LOGIN_MODE.height,
    minWidth: LOGIN_MODE.minWidth,
    minHeight: LOGIN_MODE.minHeight,
    backgroundColor: "#f5f7fb",
    frame: true,
    resizable: false,
    maximizable: false,
    icon: resolveIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  applyLoginMode(mainWindow);

  // F11 → toggle maximize / restore (only when maximizable)
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      event.preventDefault();
      if (!mainWindow.isMaximizable()) return;
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  try {
    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    initializeDatabase();
    logger.info("Application started", { version: app.getVersion(), isDev });
    createWindow();
  } catch (err) {
    logger.error("Fatal error during startup", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    logger.info("Application closed");
    app.quit();
  }
});
