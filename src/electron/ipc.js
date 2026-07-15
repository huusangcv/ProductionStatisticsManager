const { ipcMain, BrowserWindow, dialog, shell } = require("electron");
const XLSX = require("xlsx");
const path = require("path");
const fs   = require("fs");
const Database = require("better-sqlite3");
const { initializeDatabase } = require("./sqlite/init");
const { validateLogin, getAccount, updateAccount } = require("./sqlite/account");
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
  getTemplate,
  upsertTemplate,
  deleteTemplate,
} = require("./sqlite/excelTemplates");
const { applyHeatTreatmentRules } = require("./heatTreatment/heatTreatmentRules");
const { generateHeatTreatmentExcel, previewTemplate } = require("./heatTreatment/excelEngine");
const { resolveExportPath } = require("./heatTreatment/exportPaths");

// ============================================================================
// Shared Excel Parse Engine
// Accepts a columnSpec (array of { excelHeader, databaseField, type? })
// Returns { ok, records, fileName, reportDate } or { ok: false, message }
// ============================================================================

const WORK_ORDER_EXCEL_HEADER = "Mã công đơn工单号";

function parseExcelFile(filePath, columnSpec) {
  try {
    const workbook = XLSX.readFile(filePath, { cellText: true, raw: false });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // Build header → column index map from row 0 (by name, never by index)
    const headerMap = {};
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      const val = cell ? String(cell.v || "").trim() : "";
      if (val) headerMap[val] = c;
    }

    // Validate all required headers are present
    const missing = columnSpec.filter(
      (col) => col.databaseField !== "report_date" && headerMap[col.excelHeader] === undefined
    );
    if (missing.length > 0) {
      return {
        ok: false,
        message: "Thiếu cột bắt buộc:\n" + missing.map((c) => c.excelHeader).join("\n"),
      };
    }

    // Use today's date as report_date (DD/MM/YYYY)
    const today = new Date();
    const currentDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    const getVal = (r, colIndex) => {
      const cell = ws[XLSX.utils.encode_cell({ r, c: colIndex })];
      return cell ? String(cell.v ?? "").trim() : "";
    };

    const records = [];
    const workOrderColIndex = headerMap[WORK_ORDER_EXCEL_HEADER];

    for (let r = 1; r <= range.e.r; r++) {
      const workOrder = getVal(r, workOrderColIndex);
      if (!workOrder) continue; // Skip empty / summary rows

      const record = { report_date: currentDate };
      for (const col of columnSpec) {
        if (col.databaseField === "report_date") continue;
        const rawVal = getVal(r, headerMap[col.excelHeader]);
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
      return { ok: false, message: "Không tìm thấy dữ liệu hợp lệ trong file." };
    }

    return { ok: true, records, fileName: path.basename(filePath), reportDate: currentDate };
  } catch (error) {
    return { ok: false, message: "Lỗi đọc file Excel: " + error.message };
  }
}

// ============================================================================
// Shared Save Handler Factory
// Builds a grinding:save / cutting:save handler with duplicate detection dialog
// ============================================================================

function makeSaveHandler(moduleName, tableName, checkExistsFn, deleteByDateFn, importFn) {
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
          return { ok: false, message: "Đã hủy thao tác lưu để giữ nguyên dữ liệu cũ." };
        }
      }

      // Create import session
      const startTime = Date.now();
      const sessionId = createSession(moduleName, tableName, fileName, records.length);
      
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
  { excelHeader: "Ngày báo sản lượng报产日期",          databaseField: "report_date" },
  { excelHeader: "Đơn đặt hàng của khách hàng客户订单号", databaseField: "customer_order_number" },
  { excelHeader: "Mã công đơn工单号",                   databaseField: "work_order_number" },
  { excelHeader: "Mã liệu料号",                         databaseField: "material_code" },
  { excelHeader: "Tên hàng品名",                        databaseField: "item_name" },
  { excelHeader: "Quy cách规格",                        databaseField: "specification" },
  { excelHeader: "Số lượng hoàn thành完工数量",          databaseField: "completed_quantity", type: "integer" },
  { excelHeader: "Họ tên nhân viên员工名称",             databaseField: "employee_name" },
  { excelHeader: "Số lượng báo phế报废数量",             databaseField: "scrap_quantity",    type: "integer" },
  { excelHeader: "Đơn vị trọng lượng单位重量",           databaseField: "unit_weight",       type: "float" },
  { excelHeader: "Trọng lượng hoàn thành完成重量",       databaseField: "completed_weight",  type: "float" },
];

const CUTTING_SPEC = [
  { excelHeader: "Ngày báo sản lượng报产日期",          databaseField: "report_date" },
  { excelHeader: "Đơn đặt hàng của khách hàng客户订单号", databaseField: "customer_order_number" },
  { excelHeader: "Mã công đơn工单号",                   databaseField: "work_order_number" },
  { excelHeader: "Mã liệu料号",                         databaseField: "material_code" },
  { excelHeader: "Tên hàng品名",                        databaseField: "item_name" },
  { excelHeader: "Quy cách规格",                        databaseField: "specification" },
  { excelHeader: "Số lượng hoàn thành完工数量",          databaseField: "completed_quantity", type: "integer" },
  { excelHeader: "Họ tên nhân viên员工名称",             databaseField: "employee_name" },
  // No scrap_quantity in Cutting
  { excelHeader: "Đơn vị trọng lượng单位重量",           databaseField: "unit_weight",       type: "float" },
  { excelHeader: "Trọng lượng hoàn thành完成重量",       databaseField: "completed_weight",  type: "float" },
];

// ============================================================================
// IPC Registration
// ============================================================================

function registerIpcHandlers() {
  ipcMain.handle("app:ping", () => ({ ok: true }));

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
  ipcMain.handle("employee:getByCode", (_event, employeeCode) => getEmployeeByCode(employeeCode));
  ipcMain.handle("employee:create", (_event, data) => createEmployee(data));
  ipcMain.handle("employee:update", (_event, { employeeCode, data }) => updateEmployee(employeeCode, data));
  ipcMain.handle("employee:delete", (_event, employeeCode) => deleteEmployee(employeeCode));

  // --- Grinding handlers ---
  ipcMain.handle("grinding:getAll", () => getAllGrindingData());

  ipcMain.handle("grinding:selectFile", (event) =>
    selectProductionFile(event, "Chọn file Excel sản lượng Mài")
  );

  ipcMain.handle("grinding:parseExcel", (_event, filePath) =>
    parseExcelFile(filePath, GRINDING_SPEC)
  );

  ipcMain.handle(
    "grinding:save",
    makeSaveHandler(
      "Sản lượng Mài",
      "grinding_production",
      checkGrindingDataExistsByDate,
      deleteGrindingDataByDate,
      importGrindingData
    )
  );

  // --- Cutting handlers ---
  ipcMain.handle("cutting:getAll", () => getAllCuttingData());

  ipcMain.handle("cutting:selectFile", (event) =>
    selectProductionFile(event, "Chọn file Excel sản lượng Cắt")
  );

  ipcMain.handle("cutting:parseExcel", (_event, filePath) =>
    parseExcelFile(filePath, CUTTING_SPEC)
  );

  ipcMain.handle(
    "cutting:save",
    makeSaveHandler(
      "Sản lượng Cắt",
      "cutting_production",
      checkCuttingDataExistsByDate,
      deleteCuttingDataByDate,
      importCuttingData
    )
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
    if (!win) return { ok: false };
    win.isMaximized() ? win.unmaximize() : win.maximize();
    return { ok: true, maximized: win.isMaximized() };
  });

  ipcMain.handle("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
    return { ok: true };
  });

  // ── Template handlers ─────────────────────────────────────────────────────

  ipcMain.handle("template:get", (_event, module) => {
    return getTemplate(module);
  });

  ipcMain.handle("template:upload", async (event, module) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Chọn file Excel template",
      filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };

    const srcPath = filePaths[0];
    const { getAppDataRoot } = require("./sqlite/paths");
    const templatesDir = path.join(getAppDataRoot(), "templates");
    if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

    const destFileName = module.replace(/[^a-z0-9-]/gi, "-") + ".xlsx";
    const destPath     = path.join(templatesDir, destFileName);

    try {
      fs.copyFileSync(srcPath, destPath);

      const result = upsertTemplate({
        module,
        template_name: path.basename(srcPath),
        template_path: destPath,
        sheet_name:    "Sheet1",
        start_row:     6,
        status:        "active",
      });

      if (!result.ok) return result;
      return { ok: true, template: getTemplate(module) };
    } catch (err) {
      return { ok: false, message: "Lỗi sao chép file: " + err.message };
    }
  });

  ipcMain.handle("template:preview", async (_event, module) => {
    const tmpl = getTemplate(module);
    if (!tmpl) return { ok: false, message: "Chưa upload template." };
    if (!fs.existsSync(tmpl.template_path)) {
      return { ok: false, message: "File template không tồn tại trên ổ đĩa." };
    }
    return previewTemplate(tmpl.template_path);
  });

  ipcMain.handle("template:delete", (_event, module) => {
    const tmpl = getTemplate(module);
    if (tmpl && fs.existsSync(tmpl.template_path)) {
      try { fs.unlinkSync(tmpl.template_path); } catch (_) { /* ignore */ }
    }
    return deleteTemplate(module);
  });

  // ── Heat Treatment handlers ───────────────────────────────────────────────

  ipcMain.handle("heatTreatment:getGrindingByDate", (_event, reportDate) => {
    const { getDatabasePath } = require("./sqlite/paths");
    const db = new Database(getDatabasePath());
    try {
      return db
        .prepare(`SELECT * FROM grinding_production WHERE report_date = ? ORDER BY id ASC`)
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
      if (!tmpl) return { ok: false, message: "Chưa cấu hình template. Vui lòng upload template trong Cài đặt." };
      if (!fs.existsSync(tmpl.template_path)) {
        return { ok: false, message: "File template không tồn tại. Vui lòng upload lại." };
      }

      // 2. Load grinding data for date
      const { getDatabasePath } = require("./sqlite/paths");
      const db = new Database(getDatabasePath());
      let grindingRows;
      try {
        grindingRows = db
          .prepare(`SELECT * FROM grinding_production WHERE report_date = ? ORDER BY id ASC`)
          .all(reportDate);
      } finally {
        db.close();
      }

      if (!grindingRows || grindingRows.length === 0) {
        return { ok: false, message: `Không có dữ liệu Mài cho ngày ${reportDate}.` };
      }

      // 3. Apply business rules
      const result = applyHeatTreatmentRules(grindingRows);

      // 4. Resolve output path
      const { filePath, folderPath, fileName } = resolveExportPath(reportDate);

      // 5. Generate Excel
      const genResult = await generateHeatTreatmentExcel({
        templatePath: tmpl.template_path,
        outputPath:   filePath,
        rows:         result.rows,
        sheetName:    tmpl.sheet_name,
        startRow:     6,
        reportDate,
      });

      if (!genResult.ok) return genResult;

      const durationMs = Date.now() - startTime;
      return {
        ok: true,
        filePath,
        folderPath,
        fileName,
        totalRows:         result.totalRows,
        xlnCount:          result.xlnCount,
        noCount:           result.noCount,
        totalCompletedQty: result.totalCompletedQty,
        totalScrapQty:     result.totalScrapQty,
        totalWeight:       result.totalWeight,
        durationMs,
      };
    } catch (error) {
      return { ok: false, message: "Lỗi xuất Excel: " + error.message };
    }
  });

  ipcMain.handle("heatTreatment:openFolder", (_event, folderPath) => {
    shell.openPath(folderPath);
    return { ok: true };
  });

  ipcMain.handle("heatTreatment:openFile", (_event, filePath) => {
    shell.openPath(filePath);
    return { ok: true };
  });

  ipcMain.handle("heatTreatment:print", (_event, filePath) => {
    // Opens the file in the default application (Excel) which handles printing.
    // On Windows this triggers the associated app; user sends to printer from there.
    shell.openPath(filePath);
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
