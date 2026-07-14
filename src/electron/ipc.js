const { ipcMain, BrowserWindow, dialog } = require("electron");
const XLSX = require("xlsx");
const path = require("path");
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

function makeSaveHandler(moduleName, checkExistsFn, deleteByDateFn, importFn) {
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
      return importFn(records, fileName);
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
      "sản lượng mài",
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
      "sản lượng cắt",
      checkCuttingDataExistsByDate,
      deleteCuttingDataByDate,
      importCuttingData
    )
  );

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
}

module.exports = { registerIpcHandlers };
