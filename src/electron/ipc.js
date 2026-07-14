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

  ipcMain.handle("grinding:import", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: "Chọn file Excel sản lượng Mài",
      filters: [{ name: "Excel Files", extensions: ["xls", "xlsx"] }],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) {
      return { ok: false, message: "Đã hủy chọn file." };
    }

    const filePath = filePaths[0];
    try {
      const workbook = XLSX.readFile(filePath, { type: "buffer", cellText: true, raw: false });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(ws["!ref"]);
      
      // Find header row (usually row 0)
      let headerRowIndex = 0;
      let headers = {};
      
      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
        const val = cell ? String(cell.v || "").trim() : "";
        if (val) headers[val] = c;
      }

      // Check required columns up to "Trọng lượng hoàn thành"
      const requiredColumns = [
        "Ngày báo sản lượng报产日期",
        "Đơn đặt hàng của khách hàng客户订单号",
        "Mã công đơn工单号",
        "Mã liệu料号",
        "Tên hàng品名",
        "Quy cách规格",
        "Số lượng hoàn thành完工数量",
        "Họ tên nhân viên员工名称",
        "Số lượng báo phế报废数量",
        "Đơn vị trọng lượng单位重量",
        "Trọng lượng hoàn thành完成重量"
      ];

      const missing = requiredColumns.filter((col) => headers[col] === undefined);
      if (missing.length > 0) {
        return { ok: false, message: "Thiếu cột bắt buộc:\n" + missing.join("\n") };
      }

      // Use the current date for report_date instead of the raw Excel serial number
      const today = new Date();
      const currentDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

      // Parse data
      const records = [];
      for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
        const getVal = (colName) => {
          const colIndex = headers[colName];
          const cell = ws[XLSX.utils.encode_cell({ r, c: colIndex })];
          return cell ? String(cell.v || "").trim() : "";
        };

        const work_order = getVal("Mã công đơn工单号");
        if (!work_order) continue; // Skip empty rows

        records.push({
          report_date: currentDate,
          customer_order_number: getVal("Đơn đặt hàng của khách hàng客户订单号"),
          work_order_number: work_order,
          material_code: getVal("Mã liệu料号"),
          item_name: getVal("Tên hàng品名"),
          specification: getVal("Quy cách规格"),
          completed_quantity: parseInt(getVal("Số lượng hoàn thành完工数量"), 10) || 0,
          employee_name: getVal("Họ tên nhân viên员工名称"),
          scrap_quantity: parseInt(getVal("Số lượng báo phế报废数量"), 10) || 0,
          unit_weight: parseFloat(getVal("Đơn vị trọng lượng单位重量")) || 0,
          completed_weight: parseFloat(getVal("Trọng lượng hoàn thành完成重量")) || 0,
        });
      }

      if (records.length === 0) {
        return { ok: false, message: "Không tìm thấy dữ liệu hợp lệ trong file." };
      }

      // Check if data for currentDate already exists
      if (checkGrindingDataExistsByDate(currentDate)) {
        const result = await dialog.showMessageBox(window, {
          type: "warning",
          title: "Cảnh báo ghi đè",
          message: `Dữ liệu sản lượng mài cho ngày ${currentDate} đã tồn tại. Bạn có muốn ghi đè toàn bộ (xoá dữ liệu cũ của ngày này) không?`,
          buttons: ["Ghi đè toàn bộ", "Hủy"],
          defaultId: 1,
          cancelId: 1,
        });

        if (result.response === 0) {
          // Ghi đè toàn bộ
          deleteGrindingDataByDate(currentDate);
        } else {
          // Hủy
          return { ok: false, message: "Đã hủy thao tác import để giữ nguyên dữ liệu cũ." };
        }
      }

      return importGrindingData(records);
    } catch (error) {
      return { ok: false, message: "Lỗi đọc file Excel: " + error.message };
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
