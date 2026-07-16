/**
 * logger.js — Simple file-based logging service for the main process.
 *
 * Writes to D:\ProductionStatisticsManager\logs\
 *   - app.log   : info, warn, debug
 *   - error.log : error
 *   - excel.log : excel-related operations
 *
 * Usage:
 *   const logger = require("./logger");
 *   logger.info("Message");
 *   logger.error("Something failed", err);
 *   logger.excel("Generated file", { rows: 99 });
 */

const fs   = require("fs");
const path = require("path");

const DATA_ROOT = "D:\\ProductionStatisticsManager";
const LOGS_DIR  = path.join(DATA_ROOT, "logs");

// ── Internal helpers ──────────────────────────────────────────────────────────

function getTimestamp() {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

function formatLine(level, message, meta) {
  const ts   = getTimestamp();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    const extra = typeof meta === "object" ? JSON.stringify(meta) : String(meta);
    return `${base} ${extra}\n`;
  }
  return `${base}\n`;
}

function writeToFile(fileName, line) {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    fs.appendFileSync(path.join(LOGS_DIR, fileName), line, "utf8");
  } catch {
    // Never crash the application due to a logging failure
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

function info(message, meta) {
  const line = formatLine("INFO", message, meta);
  writeToFile("app.log", line);
}

function warn(message, meta) {
  const line = formatLine("WARN", message, meta);
  writeToFile("app.log", line);
}

function debug(message, meta) {
  const line = formatLine("DEBUG", message, meta);
  writeToFile("app.log", line);
}

function error(message, err) {
  const meta = err instanceof Error
    ? { message: err.message, stack: err.stack }
    : err;
  const line = formatLine("ERROR", message, meta);
  writeToFile("app.log",   line);
  writeToFile("error.log", line);
}

function excel(message, meta) {
  const line = formatLine("EXCEL", message, meta);
  writeToFile("app.log",   line);
  writeToFile("excel.log", line);
}

module.exports = { info, warn, debug, error, excel };
