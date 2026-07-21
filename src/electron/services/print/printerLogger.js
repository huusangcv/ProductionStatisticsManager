/**
 * printerLogger.js — Thin wrapper around the print_logs SQLite table.
 *
 * Decouples logging from the orchestrator so that excelPrinter.js
 * never imports SQLite directly.
 *
 * Log entry shape:
 *   printer_name   {string|null}
 *   file_path      {string|null}
 *   status         {"SUCCESS"|"FAILED"}
 *   error_message  {string|null}
 *   error_code     {string|null}
 *   exception      {string|null}    full stack / PS output on failure
 *   execution_time {number|null}    milliseconds
 *   command        {string|null}    encoded PS command (first 500 chars)
 *   version        {string}
 */

"use strict";

const path = require("path");
const { addPrintLog } = require("../../sqlite/printers");

const VERSION = "2.0.0";

/**
 * Log a successful print job.
 * @param {{ printer: string, file: string, executionTime: number, command: string, logs: string[] }} info
 */
function logSuccess({ printer, file, executionTime, command, logs }) {
  console.log("[printerLogger] SUCCESS", { printer, file, executionTime });

  addPrintLog({
    printer_name: printer || null,
    file_name: file ? path.basename(file) : null,
    file_path: file || null,
    status: "SUCCESS",
    error_message: null,
    error_code: null,
    exception: logs && logs.length ? logs.join("\n") : null,
    execution_time: executionTime || null,
    command: command ? command.substring(0, 500) : null,
    version: VERSION,
  });
}

/**
 * Log a failed print job.
 * @param {{ printer: string, file: string, executionTime: number, command: string, errorMessage: string, errorCode: string, exception: string }} info
 */
function logFailure({
  printer,
  file,
  executionTime,
  command,
  errorMessage,
  errorCode,
  exception,
}) {
  console.error("[printerLogger] FAILED", {
    printer,
    file,
    errorMessage,
    errorCode,
    exception,
  });

  addPrintLog({
    printer_name: printer || null,
    file_name: file ? path.basename(file) : null,
    file_path: file || null,
    status: "FAILED",
    error_message: errorMessage || null,
    error_code: errorCode || null,
    exception: exception ? String(exception).substring(0, 2000) : null,
    execution_time: executionTime || null,
    command: command ? command.substring(0, 500) : null,
    version: VERSION,
  });
}

module.exports = { logSuccess, logFailure };
