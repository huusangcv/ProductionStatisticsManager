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

const fs   = require("fs");
const path = require("path");

const { getPrintConfig }                   = require("./printConfig");
const { buildDetectAndSetPrintAreaSnippet, parsePrintAreaLogs } = require("./printArea");
const { buildPageSetupSnippet }            = require("./pageSetup");
const { executePowerShell }                = require("./printExecutor");
const { logSuccess, logFailure }           = require("./printerLogger");
const { getSettings }                      = require("../../sqlite/printers");

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
  printerName = null,
  module      = null,
  checkPrinterFn = null,
}) {
  console.log("[excelPrinter] Starting print job", { filePath, module });

  // ── Step 1: Validate file ──────────────────────────────────────────────────
  const fileValidation = _validateFile(filePath);
  if (!fileValidation.ok) {
    return _buildError(fileValidation.message, "FILE_INVALID", { file: filePath, printer: printerName });
  }

  // ── Step 2: Resolve printer ────────────────────────────────────────────────
  let resolvedPrinter = printerName;
  if (!resolvedPrinter) {
    const settings = getSettings();
    if (!settings || !settings.printer_name) {
      return _buildError(
        "Vui lòng chọn máy in mặc định trong Cài đặt.",
        "NO_PRINTER_CONFIGURED",
        { file: filePath, printer: null }
      );
    }
    resolvedPrinter = settings.printer_name;
  }

  console.log("[excelPrinter] Using printer:", resolvedPrinter);

  // ── Step 3: Verify printer exists ──────────────────────────────────────────
  if (checkPrinterFn) {
    try {
      const printerCheck = await checkPrinterFn(resolvedPrinter);
      if (!printerCheck.printerFound) {
        return _buildError(
          `Máy in "${resolvedPrinter}" không tồn tại trong hệ thống.`,
          "PRINTER_NOT_FOUND",
          { file: filePath, printer: resolvedPrinter }
        );
      }
    } catch (checkErr) {
      console.warn("[excelPrinter] Printer check failed (non-fatal):", checkErr.message);
      // Non-fatal — proceed; the PrintOut call will surface a real error if needed
    }
  }

  // ── Step 4: Load module print config ──────────────────────────────────────
  const printCfg = getPrintConfig(module);
  console.log("[excelPrinter] Print config:", printCfg);

  // ── Step 5: Build PowerShell script ───────────────────────────────────────
  const psScript = _buildPrintScript(filePath, resolvedPrinter, printCfg);

  // ── Step 6: Execute ────────────────────────────────────────────────────────
  console.log("[excelPrinter] Executing PowerShell...");
  const execResult = await executePowerShell(psScript);

  // Parse diagnostic info from LOG: lines
  const areaInfo = parsePrintAreaLogs(execResult.stdout);

  console.log("[excelPrinter] Exec result:", {
    ok: execResult.ok,
    executionTime: execResult.executionTime,
    logs: execResult.logs,
    printArea: areaInfo.printArea,
  });

  const details = {
    printer:       resolvedPrinter,
    file:          filePath,
    executionTime: execResult.executionTime,
    logs:          execResult.logs,
    printArea:     areaInfo.printArea,
    stdout:        execResult.stdout,
    stderr:        execResult.stderr,
    exception:     execResult.ok ? null : (execResult.errorMessage || null),
    errorCode:     execResult.ok ? null : (execResult.errorCode || null),
  };

  // ── Step 7: Log result ─────────────────────────────────────────────────────
  if (execResult.ok) {
    logSuccess({
      printer:       resolvedPrinter,
      file:          filePath,
      executionTime: execResult.executionTime,
      command:       execResult.encodedCmd,
      logs:          execResult.logs,
    });

    return {
      ok: true,
      message: "Đã gửi lệnh in thành công.",
      details,
    };
  } else {
    const userMessage = _buildUserMessage(execResult.errorMessage, execResult.errorCode, resolvedPrinter);

    logFailure({
      printer:       resolvedPrinter,
      file:          filePath,
      executionTime: execResult.executionTime,
      command:       execResult.encodedCmd,
      errorMessage:  userMessage,
      errorCode:     execResult.errorCode,
      exception:     [
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
 * @param {string} printerName
 * @param {{ sheetIndex: number, repeatHeaderRows: string|null }} config
 * @returns {string}
 */
function _buildPrintScript(filePath, printerName, config) {
  // Escape backslashes for embedding in a PS double-quoted string
  const psFilePath    = filePath.replace(/\\/g, "\\\\");
  const psPrinterName = printerName.replace(/"/g, '""'); // escape double-quotes in printer name

  const detectPrintAreaSnippet = buildDetectAndSetPrintAreaSnippet();
  const pageSetupSnippet       = buildPageSetupSnippet({
    repeatHeaderRows: config.repeatHeaderRows,
  });

  return `
$ErrorActionPreference = "Stop"
$xl = $null
$wb = $null
$ws = $null

try {
  # ── Open Excel Application ────────────────────────────────────────────────
  Write-Output "LOG:Opening Excel Application..."
  $xl = New-Object -ComObject Excel.Application
  $xl.Visible        = $false
  $xl.DisplayAlerts  = $false
  Write-Output "LOG:Excel Application Ready"

  # ── Open Workbook ─────────────────────────────────────────────────────────
  Write-Output "LOG:Opening Workbook: ${psFilePath}"
  $wb = $xl.Workbooks.Open("${psFilePath}")
  Write-Output "LOG:Workbook Opened"

  # ── Select Worksheet ──────────────────────────────────────────────────────
  $ws = $wb.Worksheets.Item(${config.sheetIndex})
  Write-Output "LOG:Worksheet Loaded: $($ws.Name)"

  ${detectPrintAreaSnippet}

  ${pageSetupSnippet}

  # ── Set Printer & Print ───────────────────────────────────────────────────
  $xl.ActivePrinter = "${psPrinterName}"
  Write-Output "LOG:Printer Set: ${psPrinterName}"
  Write-Output "LOG:Printing 1 copy..."
  $wb.PrintOut(1, [System.Type]::Missing, 1, $false)
  Write-Output "SUCCESS"
  Write-Output "LOG:Print command sent successfully"

} catch {
  $errMsg = $_.Exception.Message
  Write-Output "LOG:ERROR: $errMsg"
  Write-Output "FAILED_JSON:$($errMsg | ConvertTo-Json -Compress)"
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

function _buildUserMessage(rawMessage, errorCode, printerName) {
  if (errorCode === "EXCEL_NOT_INSTALLED") {
    return "Không tìm thấy Microsoft Excel. Vui lòng cài đặt MS Excel để sử dụng chức năng in.";
  }
  if (errorCode === "WORKBOOK_OPEN_FAILED") {
    return "Không thể mở file Excel để in. File có thể bị lỗi, đang mở ở chỗ khác, hoặc định dạng không tương thích.";
  }
  if (errorCode === "PRINTER_ERROR") {
    return `Máy in "${printerName}" không khả dụng hoặc bị lỗi trong Excel. Vui lòng kiểm tra kết nối máy in.`;
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
      printer:       partialDetails.printer  || null,
      file:          partialDetails.file     || null,
      executionTime: 0,
      logs:          [],
      printArea:     null,
      stdout:        "",
      stderr:        "",
      exception:     message,
      errorCode:     code,
    },
  };
}

module.exports = { printExcelFile };
