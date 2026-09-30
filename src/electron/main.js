const path = require("path");
const { app, BrowserWindow, Menu } = require("electron");
const { registerIpcHandlers } = require("./ipc");
const { initializeDatabase } = require("./sqlite/init");
const { applyLoginMode, LOGIN_MODE } = require("./windowModes");
const logger = require("./logger");
const { initializeUpdateService } = require("./services/update/updateService");
const {
  checkRemoteLockStatus,
  startRemoteLockPolling,
} = require("./services/remoteLock/remoteLockService");

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

  initializeUpdateService(mainWindow);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    initializeDatabase();
    logger.info("Application started", { version: app.getVersion(), isDev });

    // ── Remote Lock Check ───────────────────────────────────────────────
    // Check if the application is remotely locked before creating the window.
    // If locked, show a dialog and exit immediately.
    const lockStatus = await checkRemoteLockStatus();
    if (lockStatus.isLocked) {
      logger.warn("Application is remotely locked", {
        reason: lockStatus.lockReason,
        message: lockStatus.lockMessage,
      });

      const { dialog } = require("electron");
      await dialog.showMessageBox({
        type: "error",
        title: "Ứng dụng bị khóa",
        message: "Ứng dụng đã bị khóa do hết hạn sử dụng",
        detail: lockStatus.lockMessage || "Vui lòng liên hệ quản trị viên để gia hạn sử dụng.",
        buttons: ["Đóng"],
        defaultId: 0,
      });

      app.quit();
      return;
    }

    if (lockStatus.error) {
      logger.warn("Remote lock check encountered an error (allowing app)", {
        error: lockStatus.error,
      });
    }

    createWindow();

    // Bắt đầu quá trình kiểm tra ngầm (polling) định kỳ mỗi 1 phút (60000ms)
    // Nếu app bị khóa trong lúc đang sử dụng, nó sẽ ép đóng ngay lập tức.
    startRemoteLockPolling(60000);
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
