/**
 * remoteLockService.js
 *
 * Manages remote application lock state by reading a JSON config
 * file hosted publicly on GitHub.
 *
 * Responsibilities:
 *  - fetch remote-config.json from GitHub raw URL
 *  - persist a local cache to userData so the lock survives offline sessions
 *  - expose isLocked() for IPC guard usage
 *  - expose check() for the IPC handler (called when user navigates to Điểm danh)
 *
 * Cache policy:
 *  Case A — GitHub OK, appLocked=false → update memory + cache, return unlocked
 *  Case B — GitHub OK, appLocked=true  → update memory + cache, return locked
 *  Case C — GitHub unreachable          → use last cached status (no change)
 *           If cache is absent          → do NOT auto-lock (fail open)
 *
 * DEV mode override:
 *  Only when !app.isPackaged AND process.env.DEV_REMOTE_LOCK === "true"
 *  → pretend locked=true (useful for UI testing without touching GitHub)
 */

"use strict";

const { app }    = require("electron");
const path       = require("path");
const fs         = require("fs");
const logger     = require("../../logger");
const CONFIG     = require("./remoteLockConfig");

// ── Internal state ─────────────────────────────────────────────────────────────

/** In-memory lock state. Initialised from cache on startup. */
let _locked    = false;
let _lockScreen = null;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Path to local cache file stored in Electron's userData directory.
 * e.g. C:\Users\<user>\AppData\Roaming\<appName>\remote-lock-cache.json
 */
function _getCachePath() {
  return path.join(app.getPath("userData"), "remote-lock-cache.json");
}

/**
 * Build the raw GitHub URL from config.
 */
function _buildUrl() {
  const { owner, repo, branch, filePath } = CONFIG;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

/**
 * Read cache from disk. Returns null if file does not exist or is invalid.
 * @returns {{ locked: boolean, lockScreen: object|null, lastSuccessfulCheck: string }|null}
 */
function _readCache() {
  try {
    const cachePath = _getCachePath();
    if (!fs.existsSync(cachePath)) return null;
    const raw  = fs.readFileSync(cachePath, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.locked !== "boolean") return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Persist current lock status to disk.
 */
function _writeCache(locked, lockScreen) {
  try {
    const cachePath = _getCachePath();
    const data = {
      locked,
      lockScreen: lockScreen || null,
      lastSuccessfulCheck: new Date().toISOString(),
    };
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    logger.warn("remoteLockService: failed to write cache", err.message);
  }
}

/**
 * Validate that the parsed config has the required shape.
 * We only need appLocked to be a boolean.
 */
function _isValidConfig(parsed) {
  return parsed && typeof parsed.appLocked === "boolean";
}

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * initialize()
 * Call once inside app.whenReady().
 * Loads the cached status into memory so IPC guards work immediately,
 * without blocking app startup with a network request.
 */
function initialize() {
  const cache = _readCache();
  if (cache) {
    _locked     = cache.locked;
    _lockScreen = cache.lockScreen || null;
    logger.info("remoteLockService: initialized from cache", { locked: _locked });
  } else {
    logger.info("remoteLockService: no cache found — starting unlocked");
  }
}

/**
 * isLocked()
 * Returns the current in-memory lock state.
 * Used by assertApplicationUnlocked() in IPC guards.
 */
function isLocked() {
  return _locked;
}

/**
 * check()
 * Fetches remote-config.json from GitHub and returns the lock status.
 *
 * In DEV mode (!app.isPackaged && DEV_REMOTE_LOCK=true) returns a mock locked
 * result so you can test the lock screen without touching GitHub.
 *
 * @returns {Promise<{ locked: boolean, lockScreen: object|null }>}
 */
async function check() {
  // ── DEV override ──────────────────────────────────────────────────────────
  if (!app.isPackaged && process.env.DEV_REMOTE_LOCK === "true") {
    logger.info("remoteLockService: DEV_REMOTE_LOCK=true → returning locked=true");
    const mockLockScreen = {
      title:          "Ứng dụng đã hết hạn sử dụng",
      message:        "Vui lòng gia hạn để tiếp tục sử dụng.",
      price:          2500000,
      currency:       "VNĐ",
      period:         "12 tháng",
      contactMessage: "Vui lòng liên hệ quản trị viên để gia hạn.",
    };
    _locked     = true;
    _lockScreen = mockLockScreen;
    return { locked: true, lockScreen: mockLockScreen };
  }

  // ── Remote fetch ─────────────────────────────────────────────────────────
  const url = _buildUrl();
  logger.info("remoteLockService: checking remote lock status", { url });

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), CONFIG.checkTimeoutMs);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        // Prevent stale CDN cache
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text   = await response.text();
    const parsed = JSON.parse(text);

    if (!_isValidConfig(parsed)) {
      throw new Error("remote-config.json has unexpected shape");
    }

    const locked     = parsed.appLocked === true;
    const lockScreen = parsed.lockScreen || null;

    // Update memory + cache
    _locked     = locked;
    _lockScreen = lockScreen;
    _writeCache(locked, lockScreen);

    logger.info("remoteLockService: remote check successful", { locked });
    return { locked, lockScreen };

  } catch (err) {
    // ── Network / parse error — fall back to cache ────────────────────────
    logger.warn("remoteLockService: remote check failed, falling back to cache", err.message);

    const cache = _readCache();
    if (cache !== null) {
      logger.info("remoteLockService: using cached status", { locked: cache.locked });
      // Update memory from cache (already consistent, but keep them in sync)
      _locked     = cache.locked;
      _lockScreen = cache.lockScreen;
      return { locked: cache.locked, lockScreen: cache.lockScreen || null };
    }

    // No cache at all → fail open (do not lock on first-run network error)
    logger.info("remoteLockService: no cache available — allowing access (fail open)");
    return { locked: false, lockScreen: null };
  }
}

/**
 * getStatus()
 * Returns the current in-memory state without hitting the network.
 */
function getStatus() {
  return { locked: _locked, lockScreen: _lockScreen };
}

module.exports = {
  initialize,
  isLocked,
  check,
  getStatus,
};
