const { autoUpdater } = require("electron-updater");
const { logUpdateEvent } = require("../../sqlite/updateLogs");
const { createUpdateNotification } = require("../notification/notificationService");
const { app } = require("electron");
const logger = require("../../logger");

// Reference to mainWindow for pushing IPC events
let _mainWindow = null;

function initializeUpdateService(mainWindow) {
  _mainWindow = mainWindow;

  // We don't want it to automatically download without user action
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:status", { status: "checking" });
    }
  });

  autoUpdater.on("update-available", (info) => {
    logUpdateEvent(info.version, "update_available", info.releaseNotes || "");

    // Create persistent notification (deduplicates automatically)
    const currentVersion = app.getVersion();
    createUpdateNotification(currentVersion, info.version, _mainWindow);

    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:available", {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:not-available", info);
    }
  });

  autoUpdater.on("error", (err) => {
    logger.error("AutoUpdate error:", err);
    logUpdateEvent("unknown", "error", err.message);
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:error", err.message);
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:progress", progressObj);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    logUpdateEvent(info.version, "download_completed", info.releaseNotes || "");
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send("update:downloaded", info);
    }
  });

  // Auto check update in background after app is ready (5s delay to not block startup)
  setTimeout(() => {
    checkForUpdates().catch((err) => {
      logger.warn("Auto update check failed (background):", err.message);
    });
  }, 5000);
}

async function checkForUpdates() {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    logger.error("Check for update failed", error);
    throw error;
  }
}

async function downloadUpdate() {
  try {
    logUpdateEvent("unknown", "download_started");
    return await autoUpdater.downloadUpdate();
  } catch (error) {
    logger.error("Download update failed", error);
    throw error;
  }
}

function quitAndInstall() {
  logUpdateEvent("unknown", "install_started");
  autoUpdater.quitAndInstall();
}

module.exports = {
  initializeUpdateService,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
};

