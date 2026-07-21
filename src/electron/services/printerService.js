const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const fs = require("fs");
const path = require("path");
const os = require("os");
const XLSX = require("xlsx");
const {
  getDefaultPrinter,
  getSettings,
  addPrintLog,
  saveSettings,
} = require("../sqlite/printers");
const { printExcelFile } = require("./print/excelPrinter");

async function getAllWindowsPrinters() {
  console.log("[getAllWindowsPrinters] Starting printer detection...");
  try {
    // 1. Try PowerShell Get-Printer first
    try {
      console.log("[getAllWindowsPrinters] Trying PowerShell Get-Printer...");
      const { stdout } = await execAsync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Default | ConvertTo-Json -Depth 10"`,
      );
      console.log(
        "[getAllWindowsPrinters] PowerShell Get-Printer stdout:",
        stdout,
      );
      const printers = JSON.parse(stdout);
      const result = printers.map((p) => ({
        name: p.Name,
        driver: p.DriverName || "Unknown",
        port: p.PortName || "Unknown",
        status: mapPrinterStatus(p.PrinterStatus),
        isDefault: p.Default || false,
      }));
      console.log(
        "[getAllWindowsPrinters] Found printers (PowerShell):",
        result,
      );
      return result;
    } catch (psError) {
      console.error(
        "[getAllWindowsPrinters] PowerShell Get-Printer failed:",
        psError.stack,
      );
    }

    // 2. Fallback to wmic
    try {
      console.log("[getAllWindowsPrinters] Trying wmic...");
      const { stdout } = await execAsync(
        "wmic printer get Name,DriverName,PortName,Default /format:csv",
      );
      console.log("[getAllWindowsPrinters] wmic stdout:", stdout);
      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      const printers = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length >= 4 && parts[1]) {
          printers.push({
            name: parts[1],
            driver: parts[2] || "Unknown",
            port: parts[3] || "Unknown",
            status: "Unknown",
            isDefault: false,
          });
        }
      }

      // Get default printer separately
      try {
        const { stdout: defaultStdout } = await execAsync(
          "wmic printer where Default=TRUE get Name",
        );
        const defaultLines = defaultStdout
          .split("\n")
          .filter((line) => line.trim() !== "");
        if (defaultLines.length > 1) {
          const defaultName = defaultLines[1].trim();
          const printer = printers.find((p) => p.name === defaultName);
          if (printer) printer.isDefault = true;
        }
      } catch (defaultError) {
        console.error(
          "[getAllWindowsPrinters] Failed to get default printer via wmic:",
          defaultError.stack,
        );
      }

      console.log("[getAllWindowsPrinters] Found printers (wmic):", printers);
      return printers;
    } catch (wmicError) {
      console.error("[getAllWindowsPrinters] wmic failed:", wmicError.stack);
    }
  } catch (error) {
    console.error(
      "[getAllWindowsPrinters] Error getting printers:",
      error.stack,
    );
  }

  console.log("[getAllWindowsPrinters] Returning empty printer list");
  return [];
}

function mapPrinterStatus(status) {
  if (!status) return "Unknown";
  const statusStr = String(status).toLowerCase();
  if (
    statusStr.includes("idle") ||
    statusStr.includes("normal") ||
    statusStr === "0" ||
    statusStr === "3"
  )
    return "Online";
  if (statusStr.includes("error") || statusStr.includes("failed"))
    return "Error";
  if (statusStr.includes("offline")) return "Offline";
  return "Unknown";
}

async function checkPrinter(printerName) {
  console.log("[checkPrinter] Checking printer:", printerName);
  const checks = {
    printerFound: false,
    driverOk: false,
    portOk: false,
    ready: false,
    details: null,
  };

  try {
    // Get all printers to verify existence
    const printers = await getAllWindowsPrinters();
    console.log("[checkPrinter] All printers:", printers);
    const printer = printers.find((p) => p.name === printerName);

    if (!printer) {
      checks.details = "Không tìm thấy máy in";
      console.log("[checkPrinter] Printer not found");
      return checks;
    }

    checks.printerFound = true;
    checks.driverOk = printer.driver && printer.driver !== "Unknown";
    checks.portOk = printer.port && printer.port !== "Unknown";
    checks.ready = true; // Don't use status to determine ready!
    checks.details = printer;

    console.log("[checkPrinter] Printer check result:", checks);
    return checks;
  } catch (error) {
    console.error("[checkPrinter] Error checking printer:", error.stack);
    checks.details = error.message;
    return checks;
  }
}

async function refreshPrinters() {
  return await getAllWindowsPrinters();
}

async function createTestExcel(filePath) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN");

  const settings = getSettings();
  const printerName = settings?.printer_name || "Chưa chọn máy in";

  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Production Statistics Manager"],
    ["Printer Test Page"],
    [""],
    ["Ngày:", dateStr],
    ["Giờ:", timeStr],
    ["Máy in:", printerName],
    [""],
    ["Đây là trang in thử nghiệm để kiểm tra kết nối máy in."],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Test");
  XLSX.writeFile(wb, filePath);

  return filePath;
}

async function printTest(printerName) {
  console.log("[printTest] Starting print test for printer:", printerName);
  const tempDir = os.tmpdir();
  const testFilePath = path.join(tempDir, `printer-test-${Date.now()}.xlsx`);
  console.log("[printTest] Test file path:", testFilePath);

  try {
    // Create test file
    console.log("[printTest] Creating test Excel file...");
    await createTestExcel(testFilePath);
    console.log("[printTest] Test Excel file created");

    // Print it
    console.log("[printTest] Sending file to print...");
    const result = await printExcel(testFilePath, printerName);
    console.log("[printTest] Print result:", result);

    return result;
  } catch (error) {
    console.error("[printTest] Print test failed:", error.stack);
    throw error;
  } finally {
    // Clean up test file
    try {
      if (fs.existsSync(testFilePath)) {
        console.log("[printTest] Cleaning up test file...");
        fs.unlinkSync(testFilePath);
        console.log("[printTest] Test file cleaned up");
      }
    } catch (cleanupError) {
      console.error(
        "[printTest] Failed to clean up test file:",
        cleanupError.stack,
      );
    }
  }
}

/**
 * printExcel — delegates to the new modular Print Engine.
 *
 * @param {string}      filePath            Absolute path to the workbook.
 * @param {string|null} printerNameOverride Override the default printer from DB settings.
 * @param {string|null} moduleKey           Module key for per-template config (e.g. "heat-treatment").
 * @returns {Promise<{ ok: boolean, message: string, details: object }>}
 */
async function printExcel(filePath, printerNameOverride = null, moduleKey = null) {
  console.log("[printExcel] Delegating to new Print Engine", { filePath, moduleKey });

  if (process.platform !== "win32") {
    return { ok: true, message: "Bỏ qua in trên hệ điều hành không phải Windows.", details: {} };
  }

  return await printExcelFile({
    filePath,
    printerName:    printerNameOverride,
    module:         moduleKey,
    checkPrinterFn: checkPrinter,
  });
}

// logAndReturnError and logSuccess have been moved to printerLogger.js (v2.0.0).
// Kept as no-ops here to avoid breaking any future callers that may reference them.
function logAndReturnError(result) { return result; }
function logSuccess(_result) {}

async function printPdf(filePath, printerNameOverride = null) {
  // PDF printing would be similar, using appropriate PDF viewer COM object
  // For now, we can use the same Excel approach if Excel is available, or add PDF-specific logic
  // For this implementation, let's treat it similarly but note it's PDF
  return await printExcel(filePath, printerNameOverride);
}

module.exports = {
  getAllWindowsPrinters,
  checkPrinter,
  refreshPrinters,
  printTest,
  printExcel,
  printPdf,
};
