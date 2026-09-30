const { net } = require("electron");
const logger = require("../../logger");

// ============================================================================
// Remote Lock Service
// Checks lock status from remote backend on app startup.
// If the app is locked, prevents usage and shows a lock message.
// ============================================================================

// Default configuration - override via environment or config
const REMOTE_LOCK_CONFIG = {
  // The URL of the remote lock backend API
  // Change this to your Vercel deployment URL
  apiUrl: "https://backendremotelock.vercel.app",
  // Endpoint to check lock status
  statusEndpoint: "/api/lock/status",
  // App identifier
  appId: "production-statistics-manager",
  // Timeout for the HTTP request (ms)
  timeout: 10000,
  // If the server is unreachable, should the app be allowed to run?
  // true = allow app when server is down (fail-open)
  // false = block app when server is down (fail-closed)
  allowOnNetworkError: true,
};

/**
 * Check the remote lock status for this application.
 * Makes an HTTP GET request to the remote lock backend.
 *
 * @returns {Promise<{isLocked: boolean, lockMessage: string, lockReason: string, error: string|null}>}
 */
function checkRemoteLockStatus() {
  return new Promise((resolve) => {
    const url = `${REMOTE_LOCK_CONFIG.apiUrl}${REMOTE_LOCK_CONFIG.statusEndpoint}/${REMOTE_LOCK_CONFIG.appId}`;

    logger.info("Checking remote lock status", { url });

    const request = net.request({
      method: "GET",
      url,
    });

    let responseData = "";
    let timedOut = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      request.abort();
      logger.warn("Remote lock check timed out", {
        timeout: REMOTE_LOCK_CONFIG.timeout,
      });

      if (REMOTE_LOCK_CONFIG.allowOnNetworkError) {
        resolve({
          isLocked: false,
          lockMessage: "",
          lockReason: "",
          error: "Connection timed out",
        });
      } else {
        resolve({
          isLocked: true,
          lockMessage:
            "Không thể kết nối đến máy chủ kiểm tra.\nVui lòng kiểm tra kết nối mạng và thử lại.",
          lockReason: "network_error",
          error: "Connection timed out",
        });
      }
    }, REMOTE_LOCK_CONFIG.timeout);

    request.on("response", (response) => {
      clearTimeout(timeoutId);

      response.on("data", (chunk) => {
        responseData += chunk.toString();
      });

      response.on("end", () => {
        try {
          const result = JSON.parse(responseData);

          if (result.success && result.data) {
            logger.info("Remote lock status received", {
              isLocked: result.data.isLocked,
            });

            resolve({
              isLocked: result.data.isLocked,
              lockMessage: result.data.lockMessage || "",
              lockReason: result.data.lockReason || "",
              error: null,
            });
          } else {
            logger.warn("Unexpected remote lock response", { result });
            resolve({
              isLocked: false,
              lockMessage: "",
              lockReason: "",
              error: "Unexpected response format",
            });
          }
        } catch (parseError) {
          logger.error("Failed to parse remote lock response", parseError);
          resolve({
            isLocked: false,
            lockMessage: "",
            lockReason: "",
            error: "Failed to parse response",
          });
        }
      });
    });

    request.on("error", (error) => {
      if (timedOut) return;
      clearTimeout(timeoutId);

      logger.warn("Remote lock check failed", { error: error.message });

      if (REMOTE_LOCK_CONFIG.allowOnNetworkError) {
        resolve({
          isLocked: false,
          lockMessage: "",
          lockReason: "",
          error: error.message,
        });
      } else {
        resolve({
          isLocked: true,
          lockMessage:
            "Không thể kết nối đến máy chủ kiểm tra.\nVui lòng kiểm tra kết nối mạng và thử lại.",
          lockReason: "network_error",
          error: error.message,
        });
      }
    });

    request.end();
  });
}

/**
 * Start polling the remote lock status periodically.
 * If locked during runtime, it will show a dialog and forcefully quit the app.
 *
 * @param {number} intervalMs Polling interval in milliseconds
 */
function startRemoteLockPolling(intervalMs = 60000) {
  setInterval(async () => {
    try {
      const lockStatus = await checkRemoteLockStatus();
      if (lockStatus.isLocked) {
        const { app, dialog } = require("electron");
        logger.warn("Application remotely locked during runtime", {
          reason: lockStatus.lockReason,
          message: lockStatus.lockMessage,
        });

        dialog.showMessageBoxSync({
          type: "error",
          title: "Ứng dụng bị khóa",
          message: "Ứng dụng đã bị khóa do hết hạn sử dụng",
          detail: lockStatus.lockMessage || "Vui lòng liên hệ quản trị viên để gia hạn sử dụng.\nỨng dụng sẽ tự động đóng ngay lập tức.",
          buttons: ["Đóng"],
          defaultId: 0,
        });

        app.quit();
      }
    } catch (error) {
      logger.error("Error polling remote lock status", error);
    }
  }, intervalMs);
}

module.exports = {
  checkRemoteLockStatus,
  startRemoteLockPolling,
  REMOTE_LOCK_CONFIG,
};
