const { autoUpdater } = require("electron-updater");
const { logUpdateEvent } = require("../../sqlite/updateLogs");

function initializeUpdateService(mainWindow) {
  // We don't want it to automatically download without user action
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false; // we control it

  // Setup logging for electron-updater internally (optional)
  // autoUpdater.logger = console;

  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("update:status", { status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    // Notify the UI that an update is available
    logUpdateEvent(info.version, "update_available", info.releaseNotes || "");
    mainWindow.webContents.send("update:available", {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    mainWindow.webContents.send("update:not-available", info);
  });

  autoUpdater.on("error", (err) => {
    console.error("AutoUpdate error: ", err);
    logUpdateEvent("unknown", "error", err.message);
    mainWindow.webContents.send("update:error", err.message);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    // progressObj = { bytesPerSecond, percent, total, transferred }
    mainWindow.webContents.send("update:progress", progressObj);
  });

  autoUpdater.on("update-downloaded", (info) => {
    logUpdateEvent(info.version, "download_completed", info.releaseNotes || "");
    mainWindow.webContents.send("update:downloaded", info);
  });
}

async function checkForUpdates() {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error("Check for update failed", error);
    throw error;
  }
}

async function downloadUpdate() {
  try {
    logUpdateEvent("unknown", "download_started");
    return await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error("Download update failed", error);
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
  quitAndInstall
};
