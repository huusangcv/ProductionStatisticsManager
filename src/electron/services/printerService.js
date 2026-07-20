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

async function printExcel(filePath, printerNameOverride = null) {
  const startTime = performance.now();
  console.log("[printExcel] Starting print for file:", filePath);

  const result = {
    ok: false,
    message: "In thất bại",
    details: {
      printer: printerNameOverride,
      file: filePath,
      command: null,
      stdout: null,
      stderr: null,
      executionTime: 0,
      exception: null,
      errorCode: null
    }
  };

  // 1. Check file basics
  if (!filePath || !path.isAbsolute(filePath)) {
    result.message = "Đường dẫn file không hợp lệ (phải là đường dẫn tuyệt đối).";
    return logAndReturnError(result);
  }

  if (!fs.existsSync(filePath)) {
    result.message = "Không tìm thấy file cần in. File có thể đã bị xóa hoặc di chuyển.";
    return logAndReturnError(result);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".xlsx" && ext !== ".xls") {
    result.message = "Định dạng file không hỗ trợ. Chỉ hỗ trợ .xlsx và .xls.";
    return logAndReturnError(result);
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    result.message = "Không có quyền đọc file hoặc file đang bị khóa bởi tiến trình khác.";
    result.details.exception = err.message;
    return logAndReturnError(result);
  }

  // 2. Get printer
  let printerName = printerNameOverride;
  if (!printerName) {
    const settings = getSettings();
    if (!settings || !settings.printer_name) {
      result.message = "Vui lòng chọn máy in mặc định trong Cài đặt.";
      return logAndReturnError(result);
    }
    printerName = settings.printer_name;
  }
  result.details.printer = printerName;

  // 3. Check printer status
  const printerCheck = await checkPrinter(printerName);
  if (!printerCheck.printerFound) {
    result.message = `Máy in "${printerName}" không tồn tại trong hệ thống.`;
    return logAndReturnError(result);
  }
  
  // 4. Execute PowerShell
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
  Write-Output "FAILED_JSON:$($_.Exception.Message | ConvertTo-Json -Compress)"
  exit 1
}
`;
    // Base64 encode for EncodedCommand (UTF-16LE)
    const encodedCommand = Buffer.from(psScript, "utf16le").toString("base64");
    result.details.command = "powershell -EncodedCommand " + encodedCommand;

    try {
      const { execFile } = require("child_process");
      const { promisify } = require("util");
      const execFileAsync = promisify(execFile);
      
      const { stdout, stderr } = await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedCommand
      ]);

      result.details.stdout = stdout;
      result.details.stderr = stderr;
      result.details.executionTime = Math.round(performance.now() - startTime);

      const trimmedStdout = stdout.trim();
      
      if (trimmedStdout.includes("SUCCESS")) {
        result.ok = true;
        result.message = "Đã gửi lệnh in thành công.";
        logSuccess(result);
        return result;
      } else {
        // Parse custom FAILED_JSON
        let errMsg = "Lỗi không xác định từ Excel COM.";
        if (trimmedStdout.includes("FAILED_JSON:")) {
           try {
              const jsonPart = trimmedStdout.split("FAILED_JSON:")[1];
              errMsg = JSON.parse(jsonPart);
           } catch(e) {
              errMsg = trimmedStdout;
           }
        }
        
        if (errMsg.includes("HRESULT: 0x80040154") || errMsg.includes("Excel.Application")) {
           result.message = "Không tìm thấy Microsoft Excel. Vui lòng cài đặt MS Excel để sử dụng chức năng in.";
           result.details.errorCode = "EXCEL_NOT_INSTALLED";
        } else {
           result.message = "In thất bại: " + errMsg;
        }
        
        result.details.exception = errMsg;
        return logAndReturnError(result);
      }

    } catch (execError) {
      result.details.executionTime = Math.round(performance.now() - startTime);
      result.details.stdout = execError.stdout || "";
      result.details.stderr = execError.stderr || "";
      result.details.exception = execError.message;
      result.details.errorCode = execError.code || "";

      let errMsg = execError.message || "Lỗi thực thi PowerShell.";
      if (execError.stdout && execError.stdout.includes("FAILED_JSON:")) {
          try {
            const jsonPart = execError.stdout.split("FAILED_JSON:")[1].trim();
            errMsg = JSON.parse(jsonPart);
          } catch(e) {}
      }

      if (errMsg.includes("HRESULT: 0x80040154") || errMsg.includes("Excel.Application")) {
        result.message = "Không tìm thấy Microsoft Excel. Vui lòng cài đặt MS Excel.";
        result.details.errorCode = "EXCEL_NOT_INSTALLED";
      } else if (errMsg.includes("0x800A03EC") || errMsg.includes("Open")) {
        result.message = "Không thể mở file Excel. File có thể bị lỗi, bị khóa hoặc không hỗ trợ.";
      } else if (errMsg.includes("ActivePrinter")) {
        result.message = `Máy in "${printerName}" không khả dụng hoặc bị lỗi trong Excel.`;
      } else {
        result.message = "Gặp lỗi khi gọi máy in: " + (errMsg.substring(0, 100) + "...");
      }
      
      return logAndReturnError(result);
    }
  } else {
    result.ok = true;
    result.message = "Bỏ qua in trên hệ điều hành không phải Windows.";
    return result;
  }
}

function logAndReturnError(result) {
  addPrintLog({
    printer_name: result.details.printer,
    file_name: result.details.file ? path.basename(result.details.file) : null,
    file_path: result.details.file,
    status: "FAILED",
    error_message: result.message,
    error_code: String(result.details.errorCode || ""),
    exception: String(result.details.exception || result.details.stderr || ""),
    execution_time: result.details.executionTime,
    command: result.details.command,
    version: "1.1.0"
  });
  return result;
}

function logSuccess(result) {
  addPrintLog({
    printer_name: result.details.printer,
    file_name: result.details.file ? path.basename(result.details.file) : null,
    file_path: result.details.file,
    status: "SUCCESS",
    error_message: null,
    error_code: null,
    exception: null,
    execution_time: result.details.executionTime,
    command: result.details.command,
    version: "1.1.0"
  });
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
