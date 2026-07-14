const { ipcMain, BrowserWindow, dialog } = require("electron");
const XLSX = require("xlsx");
const fs = require("fs");
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
  deleteGrindingDataByDate 
} = require("./sqlite/grinding");


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
  ipcMain.handle("employee:getAll", () => {
    return getAllEmployees();
  });

  ipcMain.handle("employee:getByCode", (_event, employeeCode) => {
    return getEmployeeByCode(employeeCode);
  });

  ipcMain.handle("employee:create", (_event, data) => {
    return createEmployee(data);
  });

  ipcMain.handle("employee:update", (_event, { employeeCode, data }) => {
    return updateEmployee(employeeCode, data);
  });

  ipcMain.handle("employee:delete", (_event, employeeCode) => {
    return deleteEmployee(employeeCode);
  });

  // --- Grinding handlers ---
  ipcMain.handle("grinding:getAll", () => {
    return getAllGrindingData();
  });

  // Responsibility: Open native file dialog and return the selected file path.
  ipcMain.handle("grinding:selectFile", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: "Chọn file Excel sản lượng Mài",
      filters: [{ name: "Excel Files", extensions: ["xls", "xlsx"] }],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, filePath: filePaths[0] };
  });

  // Responsibility: Parse the Excel file and return preview records using the column spec.
  ipcMain.handle("grinding:parseExcel", (_event, filePath) => {
    // Require GRINDING_COLUMNS at call time (CommonJS-compatible bridge to ESM constants)
    // grindingColumns.js is an ES Module so we use a static copy of the spec here
    const GRINDING_COLUMNS = [
      { excelHeader: "Ngày báo sản lượng报产日期", databaseField: "report_date" },
      { excelHeader: "Đơn đặt hàng của khách hàng客户订单号", databaseField: "customer_order_number" },
      { excelHeader: "Mã công đơn工单号", databaseField: "work_order_number" },
      { excelHeader: "Mã liệu料号", databaseField: "material_code" },
      { excelHeader: "Tên hàng品名", databaseField: "item_name" },
      { excelHeader: "Quy cách规格", databaseField: "specification" },
      { excelHeader: "Số lượng hoàn thành完工数量", databaseField: "completed_quantity", type: "integer" },
      { excelHeader: "Họ tên nhân viên员工名称", databaseField: "employee_name" },
      { excelHeader: "Số lượng báo phế报废数量", databaseField: "scrap_quantity", type: "integer" },
      { excelHeader: "Đơn vị trọng lượng单位重量", databaseField: "unit_weight", type: "float" },
      { excelHeader: "Trọng lượng hoàn thành完成重量", databaseField: "completed_weight", type: "float" },
    ];

    try {
      const workbook = XLSX.readFile(filePath, { cellText: true, raw: false });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const range = XLSX.utils.decode_range(ws["!ref"]);

      // Build header -> column index map from row 0
      const headerMap = {};
      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
        const val = cell ? String(cell.v || "").trim() : "";
        if (val) headerMap[val] = c;
      }

      // Validate all required headers are present
      const missing = GRINDING_COLUMNS.filter(col => headerMap[col.excelHeader] === undefined);
      if (missing.length > 0) {
        return { ok: false, message: "Thiếu cột bắt buộc:\n" + missing.map(c => c.excelHeader).join("\n") };
      }

      // Compute report_date once as today's date (DD/MM/YYYY)
      const today = new Date();
      const currentDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

      // Map rows to records using databaseField names
      const getVal = (ws, r, colIndex) => {
        const cell = ws[XLSX.utils.encode_cell({ r, c: colIndex })];
        return cell ? String(cell.v ?? "").trim() : "";
      };

      const records = [];
      for (let r = 1; r <= range.e.r; r++) {
        const workOrderCol = headerMap["Mã công đơn工单号"];
        const workOrder = getVal(ws, r, workOrderCol);
        if (!workOrder) continue; // Skip empty rows

        const record = { report_date: currentDate };
        for (const col of GRINDING_COLUMNS) {
          if (col.databaseField === "report_date") continue;
          const rawVal = getVal(ws, r, headerMap[col.excelHeader]);
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

      const fileName = require("path").basename(filePath);
      return { ok: true, records, fileName, reportDate: currentDate };
    } catch (error) {
      return { ok: false, message: "Lỗi đọc file Excel: " + error.message };
    }
  });

  // Responsibility: Duplicate check (with native dialog if needed) then persist to SQLite.
  ipcMain.handle("grinding:save", async (event, { records, fileName, reportDate }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    try {
      if (checkGrindingDataExistsByDate(reportDate)) {
        const result = await dialog.showMessageBox(window, {
          type: "warning",
          title: "Cảnh báo ghi đè",
          message: `Dữ liệu sản lượng mài cho ngày ${reportDate} đã tồn tại. Bạn có muốn ghi đè toàn bộ (xoá dữ liệu cũ của ngày này) không?`,
          buttons: ["Ghi đè toàn bộ", "Hủy"],
          defaultId: 1,
          cancelId: 1,
        });

        if (result.response === 0) {
          deleteGrindingDataByDate(reportDate);
        } else {
          return { ok: false, message: "Đã hủy thao tác lưu để giữ nguyên dữ liệu cũ." };
        }
      }

      return importGrindingData(records, fileName);
    } catch (error) {
      return { ok: false, message: "Lỗi khi lưu dữ liệu: " + error.message };
    }
  });

  // --- Window handlers ---
  ipcMain.handle("window:minimize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
    return { ok: true };
  });

  ipcMain.handle("window:maximize-toggle", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { ok: false };
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }

    return { ok: true, maximized: window.isMaximized() };
  });

  ipcMain.handle("window:close", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
