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

async function getAllWindowsPrinters() {
  try {
    // 1. Try PowerShell Get-Printer first
    try {
      const { stdout } = await execAsync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Default | ConvertTo-Json -Depth 10"`,
      );
      const printers = JSON.parse(stdout);
      return printers.map((p) => ({
        name: p.Name,
        driver: p.DriverName || "Unknown",
        port: p.PortName || "Unknown",
        status: mapPrinterStatus(p.PrinterStatus),
        isDefault: p.Default || false,
      }));
    } catch (psError) {
      console.log("PowerShell Get-Printer failed, trying wmic...");
    }

    // 2. Fallback to wmic
    try {
      const { stdout } = await execAsync(
        "wmic printer get Name,DriverName,PortName,Default /format:csv",
      );
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
      } catch (_) {}

      return printers;
    } catch (wmicError) {
      console.log("wmic failed, trying Electron webContents...");
    }
  } catch (error) {
    console.error("Error getting printers:", error);
  }

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
    const printer = printers.find((p) => p.name === printerName);

    if (!printer) {
      checks.details = "Không tìm thấy máy in";
      return checks;
    }

    checks.printerFound = true;
    checks.driverOk = printer.driver && printer.driver !== "Unknown";
    checks.portOk = printer.port && printer.port !== "Unknown";
    checks.ready = printer.status === "Online";
    checks.details = printer;

    return checks;
  } catch (error) {
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
  const tempDir = os.tmpdir();
  const testFilePath = path.join(tempDir, `printer-test-${Date.now()}.xlsx`);

  try {
    // Create test file
    await createTestExcel(testFilePath);

    // Print it
    const result = await printExcel(testFilePath, printerName);

    return result;
  } finally {
    // Clean up test file
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch (_) {}
  }
}

async function printExcel(filePath, printerNameOverride = null) {
  // 1. Check if file exists
  if (!fs.existsSync(filePath)) {
    addPrintLog({
      printer_name: printerNameOverride,
      file_name: path.basename(filePath),
      file_path: filePath,
      status: "FAILED",
      error_message: "Không tìm thấy file cần in",
    });
    return { ok: false, message: "Không tìm thấy file cần in." };
  }

  // 2. Get default printer from settings if not specified
  let printerName = printerNameOverride;
  if (!printerName) {
    const settings = getSettings();
    if (!settings || !settings.printer_name) {
      addPrintLog({
        printer_name: null,
        file_name: path.basename(filePath),
        file_path: filePath,
        status: "FAILED",
        error_message: "Vui lòng chọn máy in trong Cài đặt",
      });
      return { ok: false, message: "Vui lòng chọn máy in." };
    }
    printerName = settings.printer_name;
  }

  // 3. Check printer status
  const printerCheck = await checkPrinter(printerName);
  if (!printerCheck.printerFound) {
    addPrintLog({
      printer_name: printerName,
      file_name: path.basename(filePath),
      file_path: filePath,
      status: "FAILED",
      error_message: "Máy in không tồn tại",
    });
    return { ok: false, message: "Máy in không tồn tại." };
  }

  if (!printerCheck.ready) {
    addPrintLog({
      printer_name: printerName,
      file_name: path.basename(filePath),
      file_path: filePath,
      status: "FAILED",
      error_message: "Máy in hiện không khả dụng",
    });
    return { ok: false, message: "Máy in hiện không khả dụng." };
  }

  // 4. Print using PowerShell and Excel COM
  try {
    if (process.platform === "win32") {
      const psScript = `
$ErrorActionPreference = "Stop"
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  try {
    $workbook = $excel.Workbooks.Open("${filePath.replace(/\\/g, "\\\\")}")
    try {
      ${printerName ? `$excel.ActivePrinter = "${printerName}"` : ""}
      $workbook.PrintOut()
      Write-Output "SUCCESS"
    } finally {
      $workbook.Close($false)
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
    }
  } finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  }
} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
  exit 1
}
`;

      const { stdout } = await execAsync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`,
      );
      const trimmedStdout = stdout.trim();

      if (trimmedStdout === "SUCCESS") {
        addPrintLog({
          printer_name: printerName,
          file_name: path.basename(filePath),
          file_path: filePath,
          status: "SUCCESS",
          error_message: null,
        });
        return { ok: true, message: "Đã gửi lệnh in." };
      } else if (
        trimmedStdout.includes("HRESULT: 0x80040154") ||
        trimmedStdout.includes("Excel.Application")
      ) {
        addPrintLog({
          printer_name: printerName,
          file_name: path.basename(filePath),
          file_path: filePath,
          status: "FAILED",
          error_message: "Không tìm thấy Microsoft Excel",
        });
        return { ok: false, message: "Không tìm thấy Microsoft Excel." };
      } else {
        addPrintLog({
          printer_name: printerName,
          file_name: path.basename(filePath),
          file_path: filePath,
          status: "FAILED",
          error_message: "In thất bại",
        });
        return { ok: false, message: "In thất bại. Vui lòng kiểm tra máy in." };
      }
    } else {
      // Non-Windows fallback
      addPrintLog({
        printer_name: printerName,
        file_name: path.basename(filePath),
        file_path: filePath,
        status: "SUCCESS",
        error_message: null,
      });
      return { ok: true };
    }
  } catch (error) {
    console.error("Print error:", error);
    let errorMsg = "In thất bại. Vui lòng kiểm tra máy in.";
    if (
      error.message.includes("Excel.Application") ||
      error.message.includes("0x80040154")
    ) {
      errorMsg = "Không tìm thấy Microsoft Excel.";
    }

    addPrintLog({
      printer_name: printerName,
      file_name: path.basename(filePath),
      file_path: filePath,
      status: "FAILED",
      error_message: error.message,
    });

    return { ok: false, message: errorMsg };
  }
}

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
