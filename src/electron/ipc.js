const { app, ipcMain, BrowserWindow, dialog, shell } = require("electron");
const { applyLoginMode, applyApplicationMode } = require("./windowModes");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { initializeDatabase } = require("./sqlite/init");
const {
  validateLogin,
  getAccount,
  updateAccount,
} = require("./sqlite/account");
const { getRecentUpdateLogs } = require("./sqlite/updateLogs");
const { checkForUpdates, downloadUpdate, quitAndInstall } = require("./services/update/updateService");
const {
  getAllEmployees,
  getEmployeeByCode,
  getEmployeeByRepresentativeCode,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./sqlite/employees");
const {
  getAllRoles,
  getRoleById,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole,
} = require("./sqlite/roles");
const {
  getAllPositions,
  getPositionById,
  getPositionByCode,
  createPosition,
  updatePosition,
  deletePosition,
} = require("./sqlite/positions");
const {
  getAllGrindingData,
  getGrindingDataById,
  updateGrindingData,
  deleteGrindingDataById,
  importGrindingData,
  checkGrindingDataExistsByDate,
  deleteGrindingDataByDate,
} = require("./sqlite/grinding");
const {
  getAllCuttingData,
  getCuttingDataById,
  updateCuttingData,
  deleteCuttingDataById,
  importCuttingData,
  checkCuttingDataExistsByDate,
  deleteCuttingDataByDate,
} = require("./sqlite/cutting");
const {
  getDashboardKPIs,
  getTopEmployees,
  getTopWorkOrders,
  getProductionByDate,
  getDashboardGridData,
} = require("./sqlite/dashboard");
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
const { generateCastingDefectExcel } = require("./castingDefectReturn/excelEngine");
const { resolveExportPath: resolveCastingExportPath } = require("./castingDefectReturn/exportPaths");
const { getDefectRowsByDate, mapRowToExcel } = require("./castingDefectReturn/defectRules");
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
  getAllDetailJoints,
  getDetailJointById,
  createDetailJoint,
  updateDetailJoint,
  deleteDetailJoint,
  deleteAllDetailJoints,
  bulkInsertDetailJoints,
} = require("./sqlite/detail_joint");
const {
  getAllTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  updateTemplateStatus,
  updatePrintColumns,
  updatePrintConfig,
} = require("./sqlite/excelTemplates");
const {
  getAllActiveTemplateTypes,
  getAllTemplateTypes,
  createTemplateType,
  updateTemplateType,
  deleteTemplateType,
} = require("./sqlite/templateTypes");
const {
  getAllPrices,
  getPriceByMaterialCode,
  createPrice,
  updatePrice,
  deletePrice,
  importPricesFromExcel,
  exportPricesToExcel
} = require("./sqlite/prices");
const {
  getHistory,
  saveHistory,
  deleteHistory,
  clearHistory,
} = require("./sqlite/overtime");
const backupDAO = require("./sqlite/backup");
const printerService = require("./services/printerService");
const templateService = require("./services/templateService");
const personalProductionService = require("./personalProduction/personalProductionService");

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

/**
 * Collect unique representative codes from records that don't exist in employees table for a given role.
 */
function collectUnmappedCodes(db, records, roleCode) {
  const codes = [...new Set(records.map((r) => r.representative_code).filter(Boolean))];
  const unmapped = [];
  for (const code of codes) {
    const emp = db
      .prepare(`
        SELECT e.id 
        FROM employees e
        JOIN roles r ON e.role_id = r.id
        WHERE e.representative_code = ? AND r.code = ?
        LIMIT 1
      `)
      .get(code, roleCode);
    if (!emp) unmapped.push(code);
  }
  return unmapped;
}

function makeSaveHandler(
  moduleName,
  tableName,
  checkExistsFn,
  deleteByDateFn,
  importFn,
  roleCode
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

      // Check unmapped representative codes before import
      const { getDatabasePath } = require("./sqlite/paths");
      const dbCheck = new Database(getDatabasePath());
      let unmappedCodes = [];
      try {
        unmappedCodes = collectUnmappedCodes(dbCheck, records, roleCode);
      } finally {
        dbCheck.close();
      }

      // Populate prices from price_list
      for (const record of records) {
        if (record.material_code) {
          const priceRec = getPriceByMaterialCode(record.material_code);
          if (priceRec) {
            if (roleCode === "CUT") {
               record.cutting_price = priceRec.cutting_price || 0;
               record.total_price = (record.completed_quantity || 0) * record.cutting_price;
            } else if (roleCode === "GRIND") {
               record.grinding_price = priceRec.grinding_price || 0;
               record.total_price = (record.completed_quantity || 0) * record.grinding_price;
            }
          } else {
             if (roleCode === "CUT") {
               record.cutting_price = 0;
               record.total_price = 0;
             } else if (roleCode === "GRIND") {
               record.grinding_price = 0;
               record.total_price = 0;
             }
          }
        }
      }

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

      return { ...result, unmappedCodes };
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
  // "Họ tên nhân viên员工名称" is actually the representative_code (mã đại diện)
  { excelHeader: "Họ tên nhân viên员工名称", databaseField: "representative_code" },
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
  // "Họ tên nhân viên员工名称" is actually the representative_code (mã đại diện)
  { excelHeader: "Họ tên nhân viên员工名称", databaseField: "representative_code" },
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
  // ── Employee IPC handlers ──────────────────────────────────────────────────────────
  ipcMain.handle("employee:getAll", () => getAllEmployees());
  ipcMain.handle("employee:getByCode", (_event, employeeCode) =>
    getEmployeeByCode(employeeCode),
  );
  ipcMain.handle("employee:getByRepresentativeCode", (_event, repCode) =>
    getEmployeeByRepresentativeCode(repCode),
  );
  ipcMain.handle("employee:getByRepresentativeCodeAndRole", (_event, repCode, roleCode) =>
    getEmployeeByRepresentativeCodeAndRole(repCode, roleCode),
  );
  ipcMain.handle("employee:getById", (_event, id) => getEmployeeById(id));
  ipcMain.handle("employee:create", (_event, data) => createEmployee(data));
  ipcMain.handle("employee:update", (_event, { id, data }) =>
    updateEmployee(id, data),
  );
  ipcMain.handle("employee:delete", (_event, id) => deleteEmployee(id));

  ipcMain.handle("employee:importExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Chọn file Excel nhân viên",
      filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };

    const filePath = filePaths[0];
    try {
      const workbook = XLSX.readFile(filePath);
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (rows.length === 0) {
        return { ok: false, message: "File Excel không có dữ liệu." };
      }

      const allRoles = getAllRoles();
      const allPositions = getAllPositions();

      // Build lookup maps by name
      const roleByName = new Map(allRoles.map((r) => [r.name.trim().toLowerCase(), r.id]));
      const posByName = new Map(allPositions.map((p) => [p.name.trim().toLowerCase(), p.id]));

      let importedCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const employee_code = String(row["Mã số"] || row["employee_code"] || "").trim();
        const representative_code = String(row["Mã đại diện"] || row["representative_code"] || "").trim();
        const full_name = String(row["Họ tên"] || row["full_name"] || "").trim();
        const roleName = String(row["Vai trò"] || row["role"] || "").trim();
        const posName = String(row["Chức vụ"] || row["position"] || "").trim();
        const phone = String(row["Điện thoại"] || row["phone"] || "").trim();
        const hire_date = String(row["Ngày vào làm"] || row["hire_date"] || "").trim();
        const status = String(row["Trạng thái"] || row["status"] || "Đang làm việc").trim();

        if (!employee_code || !full_name) {
          errors.push(`Dòng ${rowNum}: Thiếu Mã số hoặc Họ tên.`);
          continue;
        }

        if (!representative_code) {
          errors.push(`Dòng ${rowNum} (${employee_code}): Thiếu Mã đại diện.`);
          continue;
        }

        const role_id = roleByName.get(roleName.toLowerCase());
        if (!role_id) {
          errors.push(`Dòng ${rowNum} (${employee_code}): Không tìm thấy vai trò "${roleName}". Vui lòng khai báo trong Danh mục → Vai trò.`);
          continue;
        }

        const position_id = posByName.get(posName.toLowerCase());
        if (!position_id) {
          errors.push(`Dòng ${rowNum} (${employee_code}): Không tìm thấy chức vụ "${posName}". Vui lòng khai báo trong Danh mục → Chức vụ.`);
          continue;
        }

        // Try create first; if exists, update
        const createResult = createEmployee({
          employee_code,
          representative_code,
          full_name,
          role_id,
          position_id,
          phone,
          hire_date,
          status,
        });

        if (createResult.ok) {
          importedCount++;
        } else if (createResult.message && createResult.message.includes("đã tồn tại")) {
          // Update existing by employee_code
          const existing = getEmployeeByCode(employee_code);
          if (existing) {
            const upd = updateEmployee(existing.id, {
              representative_code,
              full_name,
              role_id,
              position_id,
              phone,
              hire_date,
              status,
              note: existing.note,
            });
            if (upd.ok) importedCount++;
            else errors.push(`Dòng ${rowNum} (${employee_code}): ${upd.message}`);
          }
        } else {
          errors.push(`Dòng ${rowNum} (${employee_code}): ${createResult.message}`);
        }
      }

      return { ok: true, imported: importedCount, errors };
    } catch (err) {
      return { ok: false, message: "Lỗi đọc file Excel: " + err.message };
    }
  });

  ipcMain.handle("employee:exportExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Xuất danh sách nhân viên",
      defaultPath: "DanhSachNhanVien.xlsx",
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    try {
      const employees = getAllEmployees();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Nhân viên");

      sheet.addRow(["Mã số", "Mã đại diện", "Họ tên", "Vai trò", "Chức vụ", "Điện thoại", "Trạng thái", "Ngày vào làm"]);

      for (const emp of employees) {
        sheet.addRow([
          emp.employee_code,
          emp.representative_code,
          emp.full_name,
          emp.role_name || "",
          emp.position_name || "",
          emp.phone || "",
          emp.status || "",
          emp.hire_date || "",
        ]);
      }

      await workbook.xlsx.writeFile(filePath);
      return { ok: true, filePath };
    } catch (err) {
      return { ok: false, message: "Lỗi xuất file: " + err.message };
    }
  });

  // ── Role IPC handlers ─────────────────────────────────────────────────────────────
  ipcMain.handle("role:getAll", () => getAllRoles());
  ipcMain.handle("role:getById", (_event, id) => getRoleById(id));
  ipcMain.handle("role:getByCode", (_event, code) => getRoleByCode(code));
  ipcMain.handle("role:create", (_event, data) => createRole(data));
  ipcMain.handle("role:update", (_event, { id, data }) => updateRole(id, data));
  ipcMain.handle("role:delete", (_event, id) => deleteRole(id));

  // ── Position IPC handlers ─────────────────────────────────────────────────────────
  ipcMain.handle("position:getAll", () => getAllPositions());
  ipcMain.handle("position:getById", (_event, id) => getPositionById(id));
  ipcMain.handle("position:getByCode", (_event, code) => getPositionByCode(code));
  ipcMain.handle("position:create", (_event, data) => createPosition(data));
  ipcMain.handle("position:update", (_event, { id, data }) =>
    updatePosition(id, data),
  );
  ipcMain.handle("position:delete", (_event, id) => deletePosition(id));

  // --- Grinding handlers ---
  ipcMain.handle("grinding:getAll", () => getAllGrindingData());
  ipcMain.handle("grinding:getById", (_event, id) => getGrindingDataById(id));
  ipcMain.handle("grinding:update", (_event, id, data) =>
    updateGrindingData(id, data),
  );
  ipcMain.handle("grinding:delete", (_event, id) => deleteGrindingDataById(id));

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
      "GRIND"
    ),
  );

  // --- Cutting handlers ---
  ipcMain.handle("cutting:getAll", () => getAllCuttingData());
  ipcMain.handle("cutting:getById", (_event, id) => getCuttingDataById(id));
  ipcMain.handle("cutting:update", (_event, id, data) =>
    updateCuttingData(id, data),
  );
  ipcMain.handle("cutting:delete", (_event, id) => deleteCuttingDataById(id));

  ipcMain.handle("cutting:selectFile", (event) =>
    selectProductionFile(event, "Chọn file Excel sản lượng Cắt"),
  );

  // --- Overtime handlers ---
  ipcMain.handle("overtime:getHistory", (_event, departmentId) => getHistory(departmentId));
  ipcMain.handle("overtime:saveHistory", (_event, snapshotData) => saveHistory(snapshotData));
  ipcMain.handle("overtime:deleteHistory", (_event, id) => deleteHistory(id));
  ipcMain.handle("overtime:clearHistory", (_event, departmentId) => clearHistory(departmentId));

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
      "CUT"
    ),
  );

  // --- Import Session handlers ---
  ipcMain.handle("import-session:getAll", () => getAllSessions());
  ipcMain.handle("import-session:getById", (_event, id) => getSessionById(id));
  ipcMain.handle("import-session:delete", (_event, id) => deleteSession(id));

  // --- Prices handlers ---
  ipcMain.handle("price:getAll", () => getAllPrices());
  ipcMain.handle("price:create", (_event, data) => createPrice(data));
  ipcMain.handle("price:update", (_event, { id, data }) => updatePrice(id, data));
  ipcMain.handle("price:delete", (_event, id) => deletePrice(id));
  ipcMain.handle("price:importExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Chọn file Đơn giá gia công",
      filters: [{ name: "Excel Files", extensions: ["xls", "xlsx"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };
    return importPricesFromExcel(filePaths[0]);
  });
  ipcMain.handle("price:exportExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Xuất danh sách đơn giá",
      defaultPath: "DanhSachDonGia.xlsx",
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    return exportPricesToExcel(filePath);
  });

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
    return await printerService.printExcel(filePath, null, "heat-treatment");
  });

  ipcMain.handle("report:printExcel", async (_event, { filePath, module: moduleKey }) => {
    return await printerService.printExcel(filePath, null, moduleKey || null);
  });

  // ── Casting Defect Return handlers ────────────────────────────────────────────────

  ipcMain.handle("castingDefect:getByDate", async (_event, reportDate) => {
    try {
      return getDefectRowsByDate(reportDate);
    } catch (error) {
      return { rows: [], truncated: false, total: 0, error: error.message };
    }
  });

  // DEBUG — xem raw data không filter scrap/completed
  ipcMain.handle("castingDefect:debugDate", async (_event, reportDate) => {
    const { getDatabasePath } = require("./sqlite/paths");
    const Database = require("better-sqlite3");
    const db = new Database(getDatabasePath());
    try {
      const all = db.prepare(`
        SELECT work_order_number, completed_quantity, scrap_quantity
        FROM grinding_production
        WHERE report_date = ?
        LIMIT 30
      `).all(reportDate);
      return { total: all.length, rows: all };
    } finally {
      db.close();
    }
  });

  ipcMain.handle("castingDefect:generate", async (_event, { reportDate }) => {
    const startTime = Date.now();
    try {
      // 1. Load template metadata
      const tmpl = getTemplate("casting-defect-return");
      if (!tmpl)
        return {
          ok: false,
          message: "Chưa cấu hình template. Vui lòng upload template P-029-06.01 trong Cài đặt.",
        };
      if (!fs.existsSync(tmpl.template_path))
        return { ok: false, message: "File template không tồn tại. Vui lòng upload lại." };

      // 2. Query grinding_production (scrap_quantity > 0 only)
      const { rows: dbRows, total } = getDefectRowsByDate(reportDate);
      if (!dbRows || dbRows.length === 0)
        return { ok: false, message: `Không có dữ liệu phế (Mài) cho ngày ${reportDate}.` };

      // 3. Map to Excel column format
      const excelRows = dbRows.map(mapRowToExcel);

      // 4. Resolve output path
      const { filePath, folderPath, fileName } = resolveCastingExportPath(reportDate);

      // 5. Generate Excel
      const genResult = await generateCastingDefectExcel({
        templatePath: tmpl.template_path,
        outputPath: filePath,
        rows: excelRows,
        reportDate,
        startRow: Number(tmpl.start_row) || 6,
      });

      if (!genResult.ok) return genResult;

      const durationMs = Date.now() - startTime;
      return {
        ok: true,
        filePath,
        folderPath,
        fileName,
        totalRows: dbRows.length,
        durationMs,
      };
    } catch (error) {
      return { ok: false, message: "Lỗi xuất Excel báo phế: " + error.message };
    }
  });

  ipcMain.handle("castingDefect:openFolder", (_event, filePath) => {
    shell.showItemInFolder(filePath);
    return { ok: true };
  });

  ipcMain.handle("castingDefect:openFile", (_event, filePath) => {
    shell.openPath(filePath);
    return { ok: true };
  });

  ipcMain.handle("castingDefect:print", async (_event, filePath) => {
    return await printerService.printExcel(filePath, null, "casting-defect-return");
  });

  // ── Personal Production (Sản lượng Cá nhân) ─────────────────────────────
  ipcMain.handle("personal-production:generate", async (event, params) => {
    return await personalProductionService.generate(params.startDate, params.endDate);
  });
  ipcMain.handle("personal-production:openFolder", async (event, filePath) => {
    return personalProductionService.openFolder(filePath);
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

  ipcMain.handle("printer:printExcel", async (_event, { filePath, module: moduleKey }) => {
    return await printerService.printExcel(filePath, null, moduleKey || null);
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
    async (event, { module, sourcePath, overwrite = false, sheetName, startColumn, endColumn }) => {
      return await templateService.copyTemplate(sourcePath, module, { overwrite, sheetName, startColumn, endColumn });
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

  ipcMain.handle("template:getSheets", async (_event, filePath) => {
    return await templateService.getExcelSheets(filePath);
  });

  ipcMain.handle(
    "template:printTest",
    async (_event, { filePath, printerName }) => {
      return await printerService.printExcel(filePath, printerName);
    },
  );

  ipcMain.handle(
    "template:updatePrintColumns",
    async (_event, { module: moduleKey, startColumn, endColumn }) => {
      const result = updatePrintColumns(moduleKey, startColumn, endColumn);
      return result;
    },
  );

  ipcMain.handle(
    "template:updatePrintConfig",
    async (_event, { module: moduleKey, ...config }) => {
      const result = updatePrintConfig(moduleKey, config);
      return result;
    },
  );

  // ── Template Types IPC handlers ─────────────────────────────────────────────────

  ipcMain.handle("templateType:getAll", async () => {
    return getAllTemplateTypes();
  });

  ipcMain.handle("templateType:getActive", async () => {
    return getAllActiveTemplateTypes();
  });

  ipcMain.handle("templateType:create", async (_event, data) => {
    return createTemplateType(data);
  });

  ipcMain.handle("templateType:update", async (_event, { id, data }) => {
    return updateTemplateType(id, data);
  });

  ipcMain.handle("templateType:delete", async (_event, id) => {
    return deleteTemplateType(id);
  });

  // ── DetailJoint IPC handlers ────────────────────────────────────────────────────

  ipcMain.handle("detailJoint:getAll", async () => {
    return getAllDetailJoints();
  });

  ipcMain.handle("detailJoint:getById", async (_event, id) => {
    return getDetailJointById(id);
  });

  ipcMain.handle("detailJoint:create", async (_event, data) => {
    return createDetailJoint(data);
  });

  ipcMain.handle("detailJoint:update", async (_event, { id, data }) => {
    return updateDetailJoint(id, data);
  });

  ipcMain.handle("detailJoint:delete", async (_event, id) => {
    return deleteDetailJoint(id);
  });

  ipcMain.handle("detailJoint:importExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Chọn file Excel nhập dữ liệu",
      filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) {
      return { ok: false, canceled: true };
    }

    const filePath = filePaths[0];
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.getWorksheet("QUY UOC MOI");

      if (!sheet) {
        return {
          ok: false,
          message: "Không tìm thấy sheet 'QUY UOC MOI' trong file Excel.",
        };
      }

      const items = [];
      let rowCount = 0;

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const materialCode = String(row.getCell(1).value || "").trim();
        const productName = String(row.getCell(2).value || "").trim();
        const specification = String(row.getCell(3).value || "").trim();
        const detail = String(row.getCell(4).value || "").trim();

        if (materialCode && productName) {
          items.push({
            material_code: materialCode,
            product_name: productName,
            specification: specification,
            detail: detail,
          });
          rowCount++;
        }
      });

      // Delete all existing data, then bulk insert new data
      deleteAllDetailJoints();
      const result = bulkInsertDetailJoints(items);

      if (result.ok) {
        return { ok: true, count: result.count };
      } else {
        return result;
      }
    } catch (error) {
      console.error("Error importing detail joint Excel:", error);
      return { ok: false, message: "Lỗi nhập file Excel: " + error.message };
    }
  });

  ipcMain.handle("detailJoint:exportExcel", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Lưu file Excel",
      defaultPath: "ChiTietKetXau.xlsx",
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });

    if (canceled || !filePath) {
      return { ok: false, canceled: true };
    }

    try {
      const data = getAllDetailJoints();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("QUY UOC MOI");

      // Add header row
      sheet.addRow(["Mã liệu料号", "Tên hàng品名", "Quy cách规格", "Chi tiết"]);

      // Add data rows
      data.forEach((item) => {
        sheet.addRow([
          item.material_code,
          item.product_name,
          item.specification,
          item.detail,
        ]);
      });

      await workbook.xlsx.writeFile(filePath);
      return { ok: true, filePath };
    } catch (error) {
      console.error("Error exporting detail joint Excel:", error);
      return { ok: false, message: "Lỗi xuất file Excel: " + error.message };
    }
  });

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

  // --- Dashboard handlers ---
  ipcMain.handle("dashboard:getKPIs", (_event, { type, fromDate, toDate }) =>
    getDashboardKPIs(type, fromDate, toDate),
  );
  ipcMain.handle("dashboard:getTopEmployees", (_event, { type, fromDate, toDate }) =>
    getTopEmployees(type, fromDate, toDate),
  );
  ipcMain.handle("dashboard:getTopWorkOrders", (_event, { type, fromDate, toDate }) =>
    getTopWorkOrders(type, fromDate, toDate),
  );
  ipcMain.handle("dashboard:getProductionByDate", (_event, { type, fromDate, toDate }) =>
    getProductionByDate(type, fromDate, toDate),
  );
  ipcMain.handle("dashboard:getGridData", (_event, { type, fromDate, toDate }) =>
    getDashboardGridData(type, fromDate, toDate),
  );

  // --- Auto Update Handlers ---
  ipcMain.handle("update:check", async () => {
    return await checkForUpdates();
  });
  
  ipcMain.handle("update:download", async () => {
    return await downloadUpdate();
  });
  
  ipcMain.handle("update:install", () => {
    quitAndInstall();
    return { ok: true };
  });

  ipcMain.handle("update:getLogs", () => {
    return getRecentUpdateLogs();
  });
}

module.exports = { registerIpcHandlers };
