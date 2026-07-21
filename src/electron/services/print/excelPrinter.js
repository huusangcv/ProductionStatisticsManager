/**
 * excelPrinter.js — Main Print Engine orchestrator.
 *
 * Workflow (per print job):
 *   1. Validate file (exists, correct extension, readable)
 *   2. Resolve printer name (override → DB settings)
 *   3. Verify printer exists in system
 *   4. Load per-module print config (sheet index, header repeat rows)
 *   5. Build PowerShell script:
 *        a. Open Workbook via Excel COM
 *        b. Select Worksheet
 *        c. Detect actual UsedRange  →  set PrintArea (printArea.js)
 *        d. Configure PageSetup     →  A4 / Landscape / FitWidth (pageSetup.js)
 *        e. Set ActivePrinter
 *        f. PrintOut (1 copy, no preview)
 *        g. Close Workbook (SaveChanges = $false)
 *        h. Release all COM objects + GC
 *   6. Execute script (printExecutor.js)
 *   7. Log result (printerLogger.js)
 *   8. Return { ok, message, code, details }
 *
 * This module NEVER modifies cell values or saves the workbook.
 *
 * Dependencies:
 *   - printConfig.js      per-module configuration
 *   - printArea.js        UsedRange detection PowerShell snippet
 *   - pageSetup.js        PageSetup PowerShell snippet
 *   - printExecutor.js    PowerShell execution + output parsing
 *   - printerLogger.js    SQLite logging
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { getTemplatePrintConfig } = require("./printConfig");
const { executePowerShell } = require("./printExecutor");
const { logSuccess, logFailure } = require("./printerLogger");
const { getSettings } = require("../../sqlite/printers");
const { getTemplate } = require("../../sqlite/excelTemplates");

// ── printExcelFile ─────────────────────────────────────────────────────────────

/**
 * Main entry point for the Print Engine.
 *
 * @param {object} options
 * @param {string}      options.filePath          Absolute path to the .xlsx / .xls file
 * @param {string|null} [options.printerName]     Override printer name; null → read from DB settings
 * @param {string|null} [options.module]          Module key, e.g. "heat-treatment"; null → use default config
 * @param {Function}    [options.checkPrinterFn]  Injected checker (to avoid circular dep); signature: async (name) => { printerFound }
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   message: string,
 *   code?: string,
 *   details: {
 *     printer: string|null,
 *     file: string,
 *     executionTime: number,
 *     logs: string[],
 *     printArea: string|null,
 *     stdout: string,
 *     stderr: string,
 *     exception: string|null,
 *     errorCode: string|null,
 *   }
 * }>}
 */
async function printExcelFile({
  filePath,
  module = null,
}) {
  console.log("[excelPrinter] Starting native print job", { filePath, module });

  // ── Step 1: Validate file ──────────────────────────────────────────────────
  const fileValidation = _validateFile(filePath);
  if (!fileValidation.ok) {
    return _buildError(fileValidation.message, "FILE_INVALID", { file: filePath, printer: null });
  }

  // ── Step 2: Load print configuration from DB (via printConfig.js) ────────
  let printCfg = null;
  try {
    printCfg = getTemplatePrintConfig(module);
  } catch (err) {
    console.warn("[excelPrinter] Failed to load print config (non-fatal):", err.message);
    printCfg = require("./printConfig").DEFAULT_PRINT_CONFIG;
  }

  // Print config not strictly needed if we just print the file natively,
  // but kept for compatibility/logging if needed.
  
  console.log("[excelPrinter] Print config:", printCfg);

  // ── Step 4: Execute PowerShell script ──────────────────────────────────────
  const psScript = _buildPrintScript(filePath);
  console.log("[excelPrinter] Executing PowerShell...");
  const execResult = await executePowerShell(psScript);

  console.log("[excelPrinter] Exec result:", {
    ok: execResult.ok,
    executionTime: execResult.executionTime,
    logs: execResult.logs,
  });

  const details = {
    printer: "Windows Default",
    file: filePath,
    executionTime: execResult.executionTime,
    logs: execResult.logs,
    printArea: null,
    stdout: execResult.stdout,
    stderr: execResult.stderr,
    exception: execResult.ok ? null : (execResult.errorMessage || null),
    errorCode: execResult.ok ? null : (execResult.errorCode || null),
  };

  // ── Step 5: Log result ─────────────────────────────────────────────────────
  if (execResult.ok) {
    logSuccess({
      printer: "Windows Default",
      file: filePath,
      executionTime: execResult.executionTime,
      command: execResult.encodedCmd,
      logs: execResult.logs,
    });

    return {
      ok: true,
      message: "Đã gửi lệnh in thành công bằng máy in mặc định.",
      details,
    };
  } else {
    const userMessage = _buildUserMessage(execResult.errorMessage, execResult.errorCode);

    logFailure({
      printer: "Windows Default",
      file: filePath,
      executionTime: execResult.executionTime,
      command: execResult.encodedCmd,
      errorMessage: userMessage,
      errorCode: execResult.errorCode,
      exception: [
        execResult.errorMessage,
        ...execResult.logs,
        execResult.stderr,
      ].filter(Boolean).join("\n"),
    });

    return {
      ok: false,
      message: userMessage,
      code: execResult.errorCode || "PRINT_FAILED",
      details,
    };
  }
}

// ── _buildPrintScript ─────────────────────────────────────────────────────────

/**
 * Assembles the full PowerShell print script from composable snippets.
 *
 * @param {string} filePath
 * @param {object} config Print configuration from getTemplatePrintConfig
 * @returns {string}
 */
function _buildPrintScript(filePath) {
  // Escape backslashes for embedding in a PS double-quoted string
  const psFilePath = filePath.replace(/\\/g, "\\\\");

  return `$ErrorActionPreference = "Stop"
$xl = $null
$wb = $null
$ws = $null

try {
  # ── Open Excel Application ────────────────────────────────────────────────
  Write-Output "LOG:Opening Excel Application..."
  try {
    $xl = New-Object -ComObject Excel.Application
    $xl.Visible        = $false
    $xl.DisplayAlerts  = $false
  } catch {
    $err = @{ code="EXCEL_NOT_INSTALLED"; message=$_.Exception.Message }
    Write-Output "FAILED_JSON:$($err | ConvertTo-Json -Compress)"
    exit 1
  }
  Write-Output "LOG:Excel Application Ready"

  # ── Open Workbook ─────────────────────────────────────────────────────────
  Write-Output "LOG:Opening Workbook: ${psFilePath}"
  try {
    $wb = $xl.Workbooks.Open("${psFilePath}")
  } catch {
    $err = @{ code="WORKBOOK_OPEN_FAILED"; message=$_.Exception.Message }
    Write-Output "FAILED_JSON:$($err | ConvertTo-Json -Compress)"
    exit 1
  }
  Write-Output "LOG:Workbook Opened"

  # ── Select Worksheet ──────────────────────────────────────────────────────
  try {
    $ws = $wb.Worksheets.Item(1)
  } catch {
    $err = @{ code="WORKSHEET_NOT_FOUND"; message=$_.Exception.Message }
    Write-Output "FAILED_JSON:$($err | ConvertTo-Json -Compress)"
    exit 1
  }
  Write-Output "LOG:Template Loaded: $($ws.Name)"

  # ── Print (Native Excel via Windows Default Printer) ──────────────────────
  Write-Output "LOG:Print Started"
  try {
    $wb.PrintOut([System.Type]::Missing, [System.Type]::Missing, 1, $false)
    Write-Output "SUCCESS"
    Write-Output "LOG:Print Success"
  } catch {
    $err = @{ code="PRINT_FAILED"; message=$_.Exception.Message }
    Write-Output "FAILED_JSON:$($err | ConvertTo-Json -Compress)"
    exit 1
  }

} catch {
  # Catch-all for unexpected errors
  $errMsg = $_.Exception.Message
  Write-Output "LOG:ERROR: $errMsg"
  $err = @{ code="PRINT_FAILED"; message=$errMsg }
  Write-Output "FAILED_JSON:$($err | ConvertTo-Json -Compress)"
  exit 1

} finally {
  # ── Release COM Objects ───────────────────────────────────────────────────
  if ($wb -ne $null) {
    try { $wb.Close($false) } catch {}
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null } catch {}
    $wb = $null
  }
  if ($ws -ne $null) {
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ws) | Out-Null } catch {}
    $ws = $null
  }
  if ($xl -ne $null) {
    try { $xl.Quit() } catch {}
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($xl) | Out-Null } catch {}
    $xl = $null
  }
  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
  Write-Output "LOG:COM Released and GC completed"
}
`;
}

// ── _validateFile ──────────────────────────────────────────────────────────────

function _validateFile(filePath) {
  if (!filePath || !path.isAbsolute(filePath)) {
    return { ok: false, message: "Đường dẫn file không hợp lệ (phải là đường dẫn tuyệt đối)." };
  }
  if (!fs.existsSync(filePath)) {
    return { ok: false, message: "Không tìm thấy file cần in. File có thể đã bị xóa hoặc di chuyển." };
  }
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".xlsx" && ext !== ".xls") {
    return { ok: false, message: "Định dạng file không hỗ trợ. Chỉ hỗ trợ .xlsx và .xls." };
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    return { ok: false, message: "Không có quyền đọc file hoặc file đang bị khóa bởi tiến trình khác." };
  }
  return { ok: true };
}

// ── _buildUserMessage ─────────────────────────────────────────────────────────

function _buildUserMessage(rawMessage, errorCode) {
  if (errorCode === "EXCEL_NOT_INSTALLED") {
    return "Không tìm thấy Microsoft Excel. Vui lòng cài đặt MS Excel để sử dụng chức năng in.";
  }
  if (errorCode === "WORKBOOK_OPEN_FAILED") {
    return "Không thể mở file Excel. File đang bị khóa hoặc định dạng không đúng.";
  }
  if (errorCode === "WORKSHEET_NOT_FOUND") {
    return "Không tìm thấy Sheet cần in trong file Excel.";
  }
  if (errorCode === "PRINT_FAILED") {
    return `Lệnh in bị lỗi hoặc từ chối trên máy in mặc định.`;
  }
  if (rawMessage) {
    const truncated = String(rawMessage).substring(0, 150);
    return `Không thể in: ${truncated}`;
  }
  return "In thất bại do lỗi không xác định. Vui lòng kiểm tra log để biết thêm chi tiết.";
}

// ── _buildError ────────────────────────────────────────────────────────────────

function _buildError(message, code, partialDetails = {}) {
  console.error("[excelPrinter] Error:", code, message);
  return {
    ok: false,
    message,
    code,
    details: {
      printer: partialDetails.printer || null,
      file: partialDetails.file || null,
      executionTime: 0,
      logs: [],
      printArea: null,
      stdout: "",
      stderr: "",
      exception: message,
      errorCode: code,
    },
  };
}

module.exports = { printExcelFile };
