const { app, ipcMain, BrowserWindow, dialog, shell } = require("electron");
const { applyLoginMode, applyApplicationMode } = require("./windowModes");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { initializeDatabase } = require("./sqlite/init");
const {
  validateLogin,
  getAccount,
  updateAccount,
} = require("./sqlite/account");
const {
  getAllEmployees,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./sqlite/employees");
const {
  getAllGrindingData,
  importGrindingData,
  checkGrindingDataExistsByDate,
  deleteGrindingDataByDate,
} = require("./sqlite/grinding");
const {
  getAllCuttingData,
  importCuttingData,
  checkCuttingDataExistsByDate,
  deleteCuttingDataByDate,
} = require("./sqlite/cutting");
const {
  createSession,
  finishSession,
  getAllSessions,
  getSessionById,
  deleteSession,
  rollbackSession,
} = require("./sqlite/importSessions");
const {
  applyHeatTreatmentRules,
} = require("./heatTreatment/heatTreatmentRules");
const {
  generateHeatTreatmentExcel,
  previewTemplate,
} = require("./heatTreatment/excelEngine");
const { resolveExportPath } = require("./heatTreatment/exportPaths");
const {
  getAllPrinters,
  getDefaultPrinter,
  saveDefaultPrinter,
  deletePrinter,
  getSettings,
  saveSettings,
  addPrintLog,
  getPrintLogs,
} = require("./sqlite/printers");
const {
  getAllTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  updateTemplateStatus,
} = require("./sqlite/excelTemplates");
const backupDAO = require("./sqlite/backup");
const printerService = require("./services/printerService");
const templateService = require("./services/templateService");

// ============================================================================
// Shared Excel Parse Engine
// Accepts a columnSpec (array of { excelHeader, databaseField, type? })
// Returns { ok, records, fileName, reportDate } or { ok: false, message }
// ============================================================================

const WORK_ORDER_EXCEL_HEADER = "Mã công đơn工单号";
const REPORT_DATE_HEADERS = [
  "Ngày báo sản lượng",
  "Ngày báo sản lượng报产日期",
];

// Helper function to parse Excel date values into Date object
function parseExcelDate(rawValue, cell) {
  let parsedDate;
  try {
    // Case 1: Already a Date object
    if (rawValue instanceof Date) {
      parsedDate = rawValue;
    }
    // Case 2: Excel serial number
    else if (typeof rawValue === "number" && cell && cell.t === "n") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      parsedDate = new Date(excelEpoch.getTime() + rawValue * 86400000);
    }
    // Case 3: String value
    else {
      const strValue = String(rawValue).trim();
      if (!strValue) {
        console.error("parseExcelDate: empty string value", { rawValue });
        throw new Error("Không đọc được cột 'Ngày báo sản lượng'.");
      }

      // Try dd/MM/yyyy or d/M/yyyy or dd-MM-yyyy
      let match = strValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-based
        const year = parseInt(match[3], 10);
        parsedDate = new Date(year, month, day);
      } else {
        // Try ISO yyyy-MM-dd or yyyy/MM/dd
        match = strValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (match) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          parsedDate = new Date(year, month, day);
        } else {
          // Try generic Date parsing as fallback
          parsedDate = new Date(strValue);
        }
      }
    }

    // Verify parsedDate is valid
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      console.error("parseExcelDate failed to parse date", { rawValue });
      throw new Error("Không đọc được cột 'Ngày báo sản lượng'.");
    }

    return parsedDate;
  } catch (error) {
    console.error("parseExcelDate error", { rawValue, error: error.message });
    throw new Error("Không đọc được cột 'Ngày báo sản lượng'.");
  }
}

// Helper function to format Date as dd/MM/yyyy for UI
function formatDateForUI(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Helper function to format Date as yyyy-MM-dd for SQLite database
function formatDateForDB(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

function parseExcelFile(filePath, columnSpec) {
  try {
    const workbook = XLSX.readFile(filePath, { cellText: true, raw: true }); // Use raw to get Excel date serials
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // Build header → column index map from row 0 (by name, never by index)
    const headerMap = {};
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      const val = cell ? String(cell.v || "").trim() : "";
      if (val) headerMap[val] = c;
    }

    // Validate required headers: find first matching report date column
    let reportDateColIndex = undefined;
    let foundReportDateHeader = undefined;
    for (const h of REPORT_DATE_HEADERS) {
      if (headerMap[h] !== undefined) {
        reportDateColIndex = headerMap[h];
        foundReportDateHeader = h;
        break;
      }
    }

    if (reportDateColIndex === undefined) {
      return {
        ok: false,
        message: `Không tìm thấy cột 'Ngày báo sản lượng' hoặc 'Ngày báo sản lượng报产日期' trong file Excel.`,
      };
    }

    const missing = columnSpec.filter(
      (col) =>
        col.databaseField !== "report_date" &&
        headerMap[col.excelHeader] === undefined,
    );
    if (missing.length > 0) {
      return {
        ok: false,
        message:
          "Thiếu cột bắt buộc:\n" +
          missing.map((c) => c.excelHeader).join("\n"),
      };
    }
    const getCell = (r, colIndex) => {
      return ws[XLSX.utils.encode_cell({ r, c: colIndex })];
    };
    const getVal = (cell) => {
      return cell ? String(cell.v ?? "").trim() : "";
    };

    // Extract reportDate from first valid row
    let reportDateForDB = null;
    let reportDateForUI = null;
    let parsedDate = null;
    let rawValue = null;
    const workOrderColIndex = headerMap[WORK_ORDER_EXCEL_HEADER];
    for (let r = 1; r <= range.e.r; r++) {
      const workOrder = getVal(getCell(r, workOrderColIndex));
      if (!workOrder) continue; // Skip empty / summary rows

      const dateCell = getCell(r, reportDateColIndex);
      rawValue = dateCell ? dateCell.v : null;
      try {
        parsedDate = parseExcelDate(rawValue, dateCell);
        reportDateForDB = formatDateForDB(parsedDate);
        reportDateForUI = formatDateForUI(parsedDate);

        // Debug log
        console.log({
          rawValue,
          parsedDate,
          reportDateForDB,
          reportDateForUI,
        });

        break;
      } catch (error) {
        continue; // Try next row if parse fails
      }
    }

    if (!reportDateForDB) {
      return {
        ok: false,
        message: `Không thể đọc giá trị ngày báo sản lượng từ cột '${foundReportDateHeader}'. Vui lòng kiểm tra định dạng ngày trong file Excel.`,
      };
    }

    const records = [];

    for (let r = 1; r <= range.e.r; r++) {
      const workOrder = getVal(getCell(r, workOrderColIndex));
      if (!workOrder) continue; // Skip empty / summary rows

      const record = { report_date: reportDateForDB };
      for (const col of columnSpec) {
        if (col.databaseField === "report_date") continue;
        const rawVal = getVal(getCell(r, headerMap[col.excelHeader]));
        if (col.type === "integer") {
          record[col.databaseField] = parseInt(rawVal, 10) || 0;
        } else if (col.type === "float") {
          record[col.databaseField] = parseFloat(rawVal) || 0;
        } else {
          record[col.databaseField] = rawVal;
        }
      }
      records.push(record);
    }

    if (records.length === 0) {
      return {
        ok: false,
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      };
    }

    return {
      ok: true,
      records,
      fileName: path.basename(filePath),
      reportDate: reportDateForDB, // Send DB format to rest of pipeline
    };
  } catch (error) {
    return { ok: false, message: "Lỗi đọc file Excel: " + error.message };
  }
}

// ============================================================================
// Shared Save Handler Factory
// Builds a grinding:save / cutting:save handler with duplicate detection dialog
// ============================================================================

function makeSaveHandler(
  moduleName,
  tableName,
  checkExistsFn,
  deleteByDateFn,
  importFn,
) {
  return async (event, { records, fileName, reportDate }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      if (checkExistsFn(reportDate)) {
        const { response } = await dialog.showMessageBox(win, {
          type: "warning",
          title: "Cảnh báo ghi đè",
          message: `Dữ liệu ${moduleName} cho ngày ${reportDate} đã tồn tại. Bạn có muốn ghi đè toàn bộ (xoá dữ liệu cũ của ngày này) không?`,
          buttons: ["Ghi đè toàn bộ", "Hủy"],
          defaultId: 1,
          cancelId: 1,
        });
        if (response === 0) {
          deleteByDateFn(reportDate);
        } else {
          return {
            ok: false,
            message: "Đã hủy thao tác lưu để giữ nguyên dữ liệu cũ.",
          };
        }
      }

      // Create import session
      const startTime = Date.now();
      const sessionId = createSession(
        moduleName,
        tableName,
        fileName,
        records.length,
        reportDate,
      );

      // Execute import linked to session
      const result = importFn(records, sessionId);
      const durationMs = Date.now() - startTime;

      if (result.ok) {
        // Update session on success
        finishSession(sessionId, {
          importedRows: result.insertedCount,
          duplicateRows: result.duplicateCount,
          failedRows: result.failedCount,
          status: result.insertedCount > 0 ? "SUCCESS" : "NO_NEW_DATA",
          durationMs,
        });
      } else {
        // Update session on failure
        finishSession(sessionId, {
          status: "FAILED",
          note: result.message,
          durationMs,
        });
      }

      return result;
    } catch (error) {
      return { ok: false, message: "Lỗi khi lưu dữ liệu: " + error.message };
    }
  };
}

// ============================================================================
// Shared Select File Handler
// ============================================================================

async function selectProductionFile(event, title) {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title,
    filters: [{ name: "Excel Files", extensions: ["xls", "xlsx"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0) return { ok: false, canceled: true };
  return { ok: true, filePath: filePaths[0] };
}

// ============================================================================
// Column Specs (CommonJS bridge — grindingColumns.js / cuttingColumns.js are ESM)
// ============================================================================

const GRINDING_SPEC = [
  { excelHeader: "Ngày báo sản lượng报产日期", databaseField: "report_date" },
  {
    excelHeader: "Đơn đặt hàng của khách hàng客户订单号",
    databaseField: "customer_order_number",
  },
  { excelHeader: "Mã công đơn工单号", databaseField: "work_order_number" },
  { excelHeader: "Mã liệu料号", databaseField: "material_code" },
  { excelHeader: "Tên hàng品名", databaseField: "item_name" },
  { excelHeader: "Quy cách规格", databaseField: "specification" },
  {
    excelHeader: "Số lượng hoàn thành完工数量",
    databaseField: "completed_quantity",
    type: "integer",
  },
  { excelHeader: "Họ tên nhân viên员工名称", databaseField: "employee_name" },
  {
    excelHeader: "Số lượng báo phế报废数量",
    databaseField: "scrap_quantity",
    type: "integer",
  },
  {
    excelHeader: "Đơn vị trọng lượng单位重量",
    databaseField: "unit_weight",
    type: "float",
  },
  {
    excelHeader: "Trọng lượng hoàn thành完成重量",
    databaseField: "completed_weight",
    type: "float",
  },
];

const CUTTING_SPEC = [
  { excelHeader: "Ngày báo sản lượng报产日期", databaseField: "report_date" },
  {
    excelHeader: "Đơn đặt hàng của khách hàng客户订单号",
    databaseField: "customer_order_number",
  },
  { excelHeader: "Mã công đơn工单号", databaseField: "work_order_number" },
  { excelHeader: "Mã liệu料号", databaseField: "material_code" },
  { excelHeader: "Tên hàng品名", databaseField: "item_name" },
  { excelHeader: "Quy cách规格", databaseField: "specification" },
  {
    excelHeader: "Số lượng hoàn thành完工数量",
    databaseField: "completed_quantity",
    type: "integer",
  },
  { excelHeader: "Họ tên nhân viên员工名称", databaseField: "employee_name" },
  // No scrap_quantity in Cutting
  {
    excelHeader: "Đơn vị trọng lượng单位重量",
    databaseField: "unit_weight",
    type: "float",
  },
  {
    excelHeader: "Trọng lượng hoàn thành完成重量",
    databaseField: "completed_weight",
    type: "float",
  },
];

// ============================================================================
// IPC Registration
// ============================================================================

function registerIpcHandlers() {
  ipcMain.handle("app:ping", () => ({ ok: true }));
  ipcMain.handle("app:getVersion", () => ({ version: app.getVersion() }));

  ipcMain.handle("db:initialize", () => {
    initializeDatabase();
    return { ok: true };
  });

  // --- Auth handlers ---
  ipcMain.handle("auth:login", (_event, { username, password }) => {
    return validateLogin(username, password);
  });

  ipcMain.handle("auth:getAccount", () => {
    return getAccount();
  });

  ipcMain.handle("auth:updateAccount", (_event, { username, password }) => {
    return updateAccount({ username, password });
  });

  // --- Employee handlers ---
  ipcMain.handle("employee:getAll", () => getAllEmployees());
  ipcMain.handle("employee:getByCode", (_event, employeeCode) =>
    getEmployeeByCode(employeeCode),
  );
  ipcMain.handle("employee:create", (_event, data) => createEmployee(data));
  ipcMain.handle("employee:update", (_event, { employeeCode, data }) =>
    updateEmployee(employeeCode, data),
  );
  ipcMain.handle("employee:delete", (_event, employeeCode) =>
    deleteEmployee(employeeCode),
  );

  // --- Grinding handlers ---
  ipcMain.handle("grinding:getAll", () => getAllGrindingData());

  ipcMain.handle("grinding:selectFile", (event) =>
    selectProductionFile(event, "Chọn file Excel sản lượng Mài"),
  );

  ipcMain.handle("grinding:parseExcel", (_event, filePath) =>
    parseExcelFile(filePath, GRINDING_SPEC),
  );

  ipcMain.handle(
    "grinding:save",
    makeSaveHandler(
      "Sản lượng Mài",
      "grinding_production",
      checkGrindingDataExistsByDate,
      deleteGrindingDataByDate,
      importGrindingData,
    ),
  );

  // --- Cutting handlers ---
  ipcMain.handle("cutting:getAll", () => getAllCuttingData());

  ipcMain.handle("cutting:selectFile", (event) =>
    selectProductionFile(event, "Chọn file Excel sản lượng Cắt"),
  );

  ipcMain.handle("cutting:parseExcel", (_event, filePath) =>
    parseExcelFile(filePath, CUTTING_SPEC),
  );

  ipcMain.handle(
    "cutting:save",
    makeSaveHandler(
      "Sản lượng Cắt",
      "cutting_production",
      checkCuttingDataExistsByDate,
      deleteCuttingDataByDate,
      importCuttingData,
    ),
  );

  // --- Import Session handlers ---
  ipcMain.handle("import-session:getAll", () => getAllSessions());
  ipcMain.handle("import-session:getById", (_event, id) => getSessionById(id));
  ipcMain.handle("import-session:delete", (_event, id) => deleteSession(id));

  ipcMain.handle("import-session:rollback", async (event, sessionId) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { response } = await dialog.showMessageBox(win, {
      type: "warning",
      title: "Xác nhận Rollback",
      message: `Bạn có chắc chắn muốn hoàn tác (xoá toàn bộ dữ liệu) của phiên Import này không? Thao tác này không thể phục hồi.`,
      buttons: ["Đồng ý Rollback", "Hủy"],
      defaultId: 1,
      cancelId: 1,
    });

    if (response === 0) {
      return rollbackSession(sessionId);
    } else {
      return { ok: false, canceled: true, message: "Đã hủy rollback." };
    }
  });

  // --- Window handlers ---
  ipcMain.handle("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
    return { ok: true };
  });

  ipcMain.handle("window:maximize-toggle", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || !win.isMaximizable()) return { ok: false };
    win.isMaximized() ? win.unmaximize() : win.maximize();
    return { ok: true, maximized: win.isMaximized() };
  });

  ipcMain.handle("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
    return { ok: true };
  });

  ipcMain.handle("window:setLoginMode", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return applyLoginMode(win);
  });

  ipcMain.handle("window:setApplicationMode", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return applyApplicationMode(win);
  });

  // ── Heat Treatment handlers ───────────────────────────────────────────────

  ipcMain.handle("heatTreatment:getGrindingByDate", (_event, reportDate) => {
    const { getDatabasePath } = require("./sqlite/paths");
    const db = new Database(getDatabasePath());
    try {
      return db
        .prepare(
          `SELECT * FROM grinding_production WHERE report_date = ? ORDER BY id ASC`,
        )
        .all(reportDate);
    } finally {
      db.close();
    }
  });

  ipcMain.handle("heatTreatment:generate", async (_event, { reportDate }) => {
    const startTime = Date.now();
    try {
      // 1. Load template metadata
      const tmpl = getTemplate("heat-treatment");
      if (!tmpl)
        return {
          ok: false,
          message:
            "Chưa cấu hình template. Vui lòng upload template trong Cài đặt.",
        };
      if (!fs.existsSync(tmpl.template_path)) {
        return {
          ok: false,
          message: "File template không tồn tại. Vui lòng upload lại.",
        };
      }

      // 2. Load grinding data for date
      const { getDatabasePath } = require("./sqlite/paths");
      const db = new Database(getDatabasePath());
      let grindingRows;
      try {
        grindingRows = db
          .prepare(
            `SELECT * FROM grinding_production WHERE report_date = ? ORDER BY id ASC`,
          )
          .all(reportDate);
      } finally {
        db.close();
      }

      if (!grindingRows || grindingRows.length === 0) {
        return {
          ok: false,
          message: `Không có dữ liệu Mài cho ngày ${reportDate}.`,
        };
      }

      // 3. Apply business rules
      const result = applyHeatTreatmentRules(grindingRows);

      // 4. Resolve output path
      const { filePath, folderPath, fileName } = resolveExportPath(reportDate);

      // 5. Generate Excel
      const genResult = await generateHeatTreatmentExcel({
        templatePath: tmpl.template_path,
        outputPath: filePath,
        rows: result.rows,
        sheetName: tmpl.sheet_name,
        startRow: 6,
        reportDate,
      });

      if (!genResult.ok) return genResult;

      const durationMs = Date.now() - startTime;
      return {
        ok: true,
        filePath,
        folderPath,
        fileName,
        totalRows: result.totalRows,
        xlnCount: result.xlnCount,
        noCount: result.noCount,
        totalCompletedQty: result.totalCompletedQty,
        totalScrapQty: result.totalScrapQty,
        totalWeight: result.totalWeight,
        durationMs,
      };
    } catch (error) {
      return { ok: false, message: "Lỗi xuất Excel: " + error.message };
    }
  });

  ipcMain.handle("heatTreatment:openFolder", (_event, filePath) => {
    shell.showItemInFolder(filePath);
    return { ok: true };
  });

  ipcMain.handle("heatTreatment:openFile", (_event, filePath) => {
    shell.openPath(filePath);
    return { ok: true };
  });

  ipcMain.handle("heatTreatment:print", async (_event, filePath) => {
    return await printExcelFile(filePath);
  });

  ipcMain.handle("report:printExcel", async (_event, { filePath }) => {
    return await printExcelFile(filePath);
  });

  // ── Printer IPC handlers ──────────────────────────────────────────────────────────

  ipcMain.handle("printer:getAll", async () => {
    return await printerService.getAllWindowsPrinters();
  });

  ipcMain.handle("printer:refresh", async () => {
    return await printerService.refreshPrinters();
  });

  ipcMain.handle("printer:getDefault", async () => {
    return getSettings();
  });

  ipcMain.handle("printer:save", async (_event, printerName) => {
    return saveDefaultPrinter(printerName);
  });

  ipcMain.handle("printer:check", async (_event, printerName) => {
    return await printerService.checkPrinter(printerName);
  });

  ipcMain.handle("printer:test", async (_event, printerName) => {
    return await printerService.printTest(printerName);
  });

  ipcMain.handle("printer:printExcel", async (_event, filePath) => {
    return await printerService.printExcel(filePath);
  });

  ipcMain.handle("printer:printPdf", async (_event, filePath) => {
    return await printerService.printPdf(filePath);
  });

  ipcMain.handle("printer:getLogs", async (_event, limit) => {
    return getPrintLogs(limit);
  });

  ipcMain.handle("printer:getSettings", async () => {
    return getSettings();
  });

  ipcMain.handle("printer:saveSettings", async (_event, settings) => {
    return saveSettings(settings);
  });

  // ── Template IPC handlers (updated) ───────────────────────────────────────────────

  ipcMain.handle("template:getAll", async () => {
    return { success: true, data: templateService.getAllTemplates() };
  });

  ipcMain.handle("template:get", async (_event, module) => {
    const template = templateService.getTemplate(module);
    return { success: true, data: template };
  });

  ipcMain.handle("template:selectFile", async (event, defaultPath) => {
    return await templateService.selectFile(event, defaultPath);
  });

  ipcMain.handle(
    "template:upload",
    async (event, { module, sourcePath, overwrite = false }) => {
      return await templateService.copyTemplate(sourcePath, module, overwrite);
    },
  );

  ipcMain.handle("template:replace", async (event, { module, sourcePath }) => {
    return await templateService.copyTemplate(sourcePath, module, true);
  });

  ipcMain.handle("template:preview", async (_event, filePath) => {
    return await templateService.openFile(filePath);
  });

  ipcMain.handle("template:delete", async (_event, module) => {
    return await templateService.deleteTemplate(module);
  });

  ipcMain.handle("template:openFolder", async () => {
    return await templateService.openFolder();
  });

  ipcMain.handle("template:checksum", async (_event, filePath) => {
    return {
      success: true,
      checksum: templateService.calculateChecksum(filePath),
    };
  });

  ipcMain.handle(
    "template:printTest",
    async (_event, { filePath, printerName }) => {
      return await printerService.printExcel(filePath, printerName);
    },
  );

  // ── Backup/Restore IPC handlers ───────────────────────────────────────────────────

  ipcMain.handle("backup:list", async () => {
    return backupDAO.listBackups();
  });

  ipcMain.handle("backup:create", async () => {
    return backupDAO.createBackup();
  });

  ipcMain.handle("backup:restore", async (_event, backupPath) => {
    return backupDAO.restoreBackup(backupPath);
  });

  ipcMain.handle("backup:export", async (_event, exportPath) => {
    return backupDAO.exportDatabase(exportPath);
  });

  ipcMain.handle("backup:import", async (_event, importPath) => {
    return backupDAO.importDatabase(importPath);
  });
}

async function printExcelFile(filePath) {
  return await printerService.printExcel(filePath);
}

module.exports = { registerIpcHandlers };
