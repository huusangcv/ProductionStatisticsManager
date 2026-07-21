/**
 * printExecutor.js — Executes a PowerShell script and returns structured output.
 *
 * Responsibilities:
 *   - Encode the script as UTF-16LE Base64 for -EncodedCommand (avoids all
 *     quoting/escaping issues with special characters in file paths).
 *   - Run powershell.exe via execFile (not exec) to avoid shell injection.
 *   - Parse stdout for LOG: lines, SUCCESS marker, and FAILED_JSON: payload.
 *   - Return a structured result, never throw.
 *
 * Return value shape:
 *   {
 *     ok:            boolean,
 *     stdout:        string,
 *     stderr:        string,
 *     executionTime: number,   // milliseconds
 *     logs:          string[], // lines starting with "LOG:"
 *     encodedCmd:    string,   // first 200 chars of the base64 command
 *     errorMessage:  string|null,
 *     errorCode:     string|null,
 *   }
 */

"use strict";

const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

/**
 * Executes a PowerShell script string.
 *
 * @param {string} psScript  Complete PowerShell script.
 * @returns {Promise<{
 *   ok: boolean,
 *   stdout: string,
 *   stderr: string,
 *   executionTime: number,
 *   logs: string[],
 *   encodedCmd: string,
 *   errorMessage: string|null,
 *   errorCode: string|null,
 * }>}
 */
async function executePowerShell(psScript) {
  const startTime = performance.now();

  // Encode as UTF-16LE → Base64 so PowerShell receives it verbatim
  const encodedCmd = Buffer.from(psScript, "utf16le").toString("base64");
  const encodedCmdPreview = encodedCmd.substring(0, 200);

  let rawStdout = "";
  let rawStderr = "";
  let ok = false;
  let errorMessage = null;
  let errorCode = null;

  try {
    const { stdout, stderr } = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodedCmd,
    ]);

    rawStdout = stdout || "";
    rawStderr = stderr || "";

    const trimmed = rawStdout.trim();

    if (trimmed.includes("SUCCESS")) {
      ok = true;
    } else {
      // Try to parse FAILED_JSON payload
      errorMessage = _extractFailedMessage(trimmed);
      errorCode = _detectErrorCode(errorMessage || "");
    }
  } catch (execError) {
    rawStdout = execError.stdout || "";
    rawStderr = execError.stderr || "";
    errorCode = String(execError.code || "EXEC_ERROR");

    // Try to extract PS error message from stdout (our FAILED_JSON pattern)
    const combinedOutput = rawStdout + "\n" + rawStderr;
    errorMessage = _extractFailedMessage(combinedOutput) || execError.message;
    errorCode = _detectErrorCode(errorMessage) || errorCode;
  }

  const executionTime = Math.round(performance.now() - startTime);
  const logs = _extractLogs(rawStdout);

  return {
    ok,
    stdout: rawStdout,
    stderr: rawStderr,
    executionTime,
    logs,
    encodedCmd: encodedCmdPreview,
    errorMessage,
    errorCode,
  };
}

// ── Private helpers ────────────────────────────────────────────────────────────

/**
 * Extracts the human-readable error message from stdout that contains
 * our FAILED_JSON: marker.
 */
function _extractFailedMessage(text) {
  if (!text) return null;
  const marker = "FAILED_JSON:";
  const idx = text.indexOf(marker);
  if (idx === -1) return text.trim().substring(0, 300) || null;

  try {
    const jsonPart = text.substring(idx + marker.length).trim();
    return JSON.parse(jsonPart);
  } catch {
    return text.substring(idx + marker.length).trim().substring(0, 300) || null;
  }
}

/**
 * Maps well-known HRESULT / keywords to short error codes.
 */
function _detectErrorCode(message) {
  if (!message) return null;
  const m = String(message);
  if (m.includes("0x80040154") || m.includes("Excel.Application"))
    return "EXCEL_NOT_INSTALLED";
  if (m.includes("0x800A03EC") || m.includes("cannot open"))
    return "WORKBOOK_OPEN_FAILED";
  if (m.includes("ActivePrinter") || m.includes("printer"))
    return "PRINTER_ERROR";
  return "PRINT_FAILED";
}

/**
 * Extracts all LOG: lines from stdout for diagnostic purposes.
 */
function _extractLogs(stdout) {
  if (!stdout) return [];
  return stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("LOG:"));
}

module.exports = { executePowerShell };
