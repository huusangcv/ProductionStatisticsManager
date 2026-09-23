/**
 * remoteLockConfig.js
 *
 * Centralised GitHub remote-lock configuration.
 * Only this file contains the GitHub URL / coordinates.
 *
 * Remote URL used at runtime:
 *   https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filePath}
 */

"use strict";

const REMOTE_LOCK_CONFIG = {
  owner: "huusangcv",
  repo: "ProductionStatisticsManager",
  branch: "main",
  filePath: "remote-config.json",

  /** HTTP fetch timeout in ms */
  checkTimeoutMs: 10_000,
};

module.exports = REMOTE_LOCK_CONFIG;
