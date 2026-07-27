const {
  createNotification,
  existsUpdateNotification,
} = require("../../sqlite/notifications");

const logger = require("../../logger");

/**
 * Create an UPDATE notification when a new version is detected.
 * Deduplicates by version — will not create if already exists.
 * @param {string} currentVersion - Running app version
 * @param {string} latestVersion  - Available update version
 * @param {BrowserWindow} mainWindow - Electron window to push IPC event
 * @returns {{ ok: boolean, created: boolean }}
 */
function createUpdateNotification(currentVersion, latestVersion, mainWindow) {
  try {
    if (existsUpdateNotification(latestVersion)) {
      logger.info(`Update notification for v${latestVersion} already exists, skipping`);
      return { ok: true, created: false };
    }

    const result = createNotification({
      type: "UPDATE",
      title: "Có phiên bản mới",
      message: `Phiên bản ${latestVersion} đã sẵn sàng. Nhấn để xem chi tiết.`,
      icon: "update",
      level: "info",
      route: "/settings",
      payload: { current: currentVersion, latest: latestVersion },
      version: latestVersion,
    });

    if (result.ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification:new", result.data);
      mainWindow.webContents.send("notification:unreadCount", null); // signal re-fetch
    }

    logger.info(`Created update notification for v${latestVersion}`);
    return { ok: true, created: true };
  } catch (error) {
    logger.error("Failed to create update notification", error);
    return { ok: false, created: false };
  }
}

/**
 * Create any type of notification from the main process.
 * Sends notification:new IPC event to renderer.
 */
function createAndPushNotification(notifData, mainWindow) {
  try {
    const result = createNotification(notifData);
    if (result.ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification:new", result.data);
    }
    return result;
  } catch (error) {
    logger.error("Failed to create notification", error);
    return { ok: false, message: error.message };
  }
}

module.exports = {
  createUpdateNotification,
  createAndPushNotification,
};
