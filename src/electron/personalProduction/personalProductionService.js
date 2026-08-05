const XlsxPopulate = require("xlsx-populate");
const fs = require("fs");
const path = require("path");
const { app, shell } = require("electron");

const { getAppDataRoot } = require("../sqlite/paths");
const { getCuttingDataByDateRange } = require("../sqlite/cutting");
const { getGrindingDataByDateRange } = require("../sqlite/grinding");
const { getAllEmployees } = require("../sqlite/employees");
const personalProductionDAO = require("../sqlite/personalProduction");
const logger = require("../logger");

/**
 * Ensures the export directory exists
 */
function ensureExportDir(year, month) {
  const root = getAppDataRoot();
  const dirPath = path.join(
    root,
    "exports",
    "SanLuongCaNhan",
    String(year),
    String(month).padStart(2, "0")
  );
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Returns the path to the template file.
 * Prioritizes D:\ProductionStatisticsManager\templates (factory deployment).
 * Falls back to local dev path if in development.
 */
function getTemplatePath() {
  const dTemplatePath = path.join(getAppDataRoot(), "templates", "personal-production.xlsx");
  if (fs.existsSync(dTemplatePath)) {
    return dTemplatePath;
  }

  const devPath = path.join(app.getAppPath(), "src/excels/personal-production.xlsx");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  return dTemplatePath;
}

/**
 * Generate Personal Production Report
 */
async function generate(startDate, endDate) {
  try {
    const templatePath = getTemplatePath();
    if (!fs.existsSync(templatePath)) {
      return { ok: false, message: "Không tìm thấy file template gốc: " + templatePath };
    }

    // Fetch data from personal_production table first, fallback to direct if empty
    const managedData = personalProductionDAO.getByDateRange(startDate, endDate);
    let cuttingData = managedData.filter(r => r.sheet_name === "CẮT" || r.source_type === "cutting");
    let grindingData = managedData.filter(r => r.sheet_name === "MÀI" || r.source_type === "grinding");

    if (managedData.length === 0) {
      cuttingData = getCuttingDataByDateRange(startDate, endDate);
      grindingData = getGrindingDataByDateRange(startDate, endDate);
    }

    if (cuttingData.length === 0 && grindingData.length === 0) {
      return { ok: false, message: "Không có dữ liệu để xuất." };
    }

    // Load workbook using xlsx-populate to preserve Excel Table structure perfectly
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    const cuttingSheet = workbook.sheet("CẮT");
    const grindingSheet = workbook.sheet("MÀI");

    if (!cuttingSheet || !grindingSheet) {
      return { ok: false, message: "Template không đúng định dạng (thiếu sheet CẮT hoặc MÀI)." };
    }

    const START_ROW = 4;

    // Format date for B2
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const [y, m, d] = dateString.split("-");
      return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    };
    const uiDate = formatDate(startDate);


    // Helper to write rows
    const writeSheet = (sheet, data, isCutting = false) => {
      // 1. Ghi ngày báo cáo vào B2
      sheet.cell("B2").value(uiDate);

      const N = data.length;

      // 3. Fill data into the fixed template rows
      let totalQty = 0;
      let totalJoints = 0;

      for (let i = 0; i < N; i++) {
        const row = data[i];
        const rowIdx = START_ROW + i;
        const wsRow = sheet.row(rowIdx);

        const qty = Number(row.quantity ?? row.completed_quantity) || 0;
        const joints = Number(row.joint_count) || 0;

        totalQty += qty;
        totalJoints += joints;

        wsRow.cell(2).value(row.customer_order_number || "");
        wsRow.cell(3).value(row.job_code || row.work_order_number || "");
        wsRow.cell(4).value(row.material_code || "");
        wsRow.cell(5).value(row.product_name || row.item_name || "");
        wsRow.cell(6).value(row.specification || "");
        wsRow.cell(7).value(qty);
        let empCodeVal = row.employee_code;
        if (empCodeVal === null || empCodeVal === undefined) {
          empCodeVal = row.representative_code || "";
        }
        if (empCodeVal) {
          empCodeVal = String(empCodeVal)
            .trim()
            .split(/[\s,;]+/)
            .map((c) => c.trim().replace(/^[Vv]/, ""))
            .filter(Boolean)
            .join(" ");
        }
        wsRow.cell(8).value(empCodeVal);
        wsRow.cell(9).value(row.remark || "");

        if (isCutting) {
          wsRow.cell(10).value(row.detail || row.joint_detail || "");
          wsRow.cell(11).value(joints);
        }
      }

      // Edge case: N === 0 (Xóa dữ liệu mẫu nhưng giữ style)
      if (N === 0) {
        const wsRow = sheet.row(START_ROW);
        for (let c = 1; c <= 11; c++) {
          wsRow.cell(c).value("");
        }
      }
    };

    writeSheet(cuttingSheet, cuttingData, true);
    writeSheet(grindingSheet, grindingData, false);

    // Save File
    const reportDateObj = new Date(startDate);
    const yyyy = reportDateObj.getFullYear();
    const mm = reportDateObj.getMonth() + 1;
    const dateStr = startDate === endDate
      ? startDate.replace(/-/g, "")
      : `${startDate.replace(/-/g, "")}_to_${endDate.replace(/-/g, "")}`;

    const fileName = `SanLuongTXL_${dateStr}.xlsx`;
    const exportDir = ensureExportDir(yyyy, mm);
    const filePath = path.join(exportDir, fileName);

    await workbook.toFileAsync(filePath);

    // Log success
    logger.info("Xuất Sản lượng cá nhân thành công", {
      startDate,
      endDate,
      cuttingCount: cuttingData.length,
      grindingCount: grindingData.length,
      filePath,
    });

    return {
      ok: true,
      fileName,
      filePath,
      cuttingCount: cuttingData.length,
      grindingCount: grindingData.length
    };

  } catch (error) {
    logger.error("Lỗi xuất Sản lượng cá nhân", error);
    return { ok: false, message: error.message };
  }
}

/**
 * Open folder containing the exported file
 */
function openFolder(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, message: "Không tìm thấy file" };
    }
    shell.showItemInFolder(filePath);
    return { ok: true };
  } catch (error) {
    logger.error("Error opening folder", error);
    return { ok: false, message: error.message };
  }
}

/**
 * Open the exported file directly
 */
function openFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, message: "Không tìm thấy file" };
    }
    shell.openPath(filePath);
    return { ok: true };
  } catch (error) {
    logger.error("Error opening file", error);
    return { ok: false, message: error.message };
  }
}

/**
 * Open export folder for a given date (year/month)
 * @param {string} date - "YYYY-MM-DD"
 */
function openExportFolder(date) {
  try {
    const root = getAppDataRoot();
    let folderPath = path.join(root, "exports", "SanLuongCaNhan");
    if (date) {
      const d = new Date(date);
      if (!isNaN(d)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const monthFolder = path.join(folderPath, String(yyyy), mm);
        if (fs.existsSync(monthFolder)) {
          folderPath = monthFolder;
        } else if (fs.existsSync(path.join(folderPath, String(yyyy)))) {
          folderPath = path.join(folderPath, String(yyyy));
        }
      }
    }
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    shell.openPath(folderPath);
    return { ok: true, folderPath };
  } catch (error) {
    logger.error("Error opening export folder", error);
    return { ok: false, message: error.message };
  }
}

async function getByDate(workDate) {
  try {
    const records = personalProductionDAO.getByDate(workDate);
    return { ok: true, records };
  } catch (error) {
    logger.error("Lỗi getByDate Sản lượng cá nhân", error);
    return { ok: false, message: error.message, records: [] };
  }
}

async function checkExists(workDate, sources) {
  try {
    const exists = personalProductionDAO.checkExists(workDate, sources);
    return { ok: true, exists };
  } catch (error) {
    logger.error("Lỗi checkExists Sản lượng cá nhân", error);
    return { ok: false, message: error.message, exists: false };
  }
}

async function syncData({ workDate, syncCutting = true, syncGrinding = true }) {
  try {
    if (!workDate) {
      return { ok: false, message: "Vui lòng chọn ngày đồng bộ." };
    }

    const attendanceRepo = require("../sqlite/attendance");
    const attList = attendanceRepo.getAttendanceByDate(workDate);
    const presentCodes = new Set(
      attList
        .filter(a => a.status === "PRESENT")
        .map(a => String(a.employee_code || "").trim().replace(/^[Vv]/, ""))
    );

    const unmappedCodesSet = new Set();
    
    // Kiểm tra xem mã nào vắng mặt — KHÔNG xóa, chỉ ghi nhận để warning + highlight
    const collectAbsentCodes = (codesString) => {
      if (!codesString) return null;
      const codes = codesString.split(/[\s,;]+/).map(c => c.trim().replace(/^[Vv]/, "")).filter(Boolean);
      const absent = [];
      for (const c of codes) {
        if (c !== "23081905" && !presentCodes.has(c)) {
          unmappedCodesSet.add(c);
          absent.push(c);
        }
      }
      return absent.length > 0 ? absent.join(" ") : null;
    };

    // Lấy tên đầy đủ — giữ nguyên tất cả tên, kể cả người vắng
    const getFullNames = (codesString, originalName) => {
      if (!codesString) return originalName || "";
      const codes = codesString
        .split(/[\s,;]+/)
        .map(c => c.trim().replace(/^[Vv]/, ""))
        .filter(Boolean);
      if (codes.length === 0) return originalName || "";
      
      const names = codes.map(c => {
        if (c === "23081905") return "Báo phế hệ thống";
        const emp = attList.find(a => String(a.employee_code || "").replace(/^[Vv]/, "") === c);
        return emp ? emp.employee_name : c;
      });
      return names.filter(Boolean).join(", ") || originalName || "";
    };

    const recordsToInsert = [];
    const sourcesToDelete = [];

    if (syncCutting) {
      sourcesToDelete.push("cutting");
      const cuttingData = getCuttingDataByDateRange(workDate, workDate);
      for (const row of cuttingData) {
        const qty = Number(row.completed_quantity) || 0;
        const joints = Number(row.joint_count) || 0;
        if (qty <= 0 && joints <= 0) {
          continue; // Chỉ đồng bộ các dòng có Số lượng hoàn thành hoặc Số xâu > 0
        }
        const repCode = (row.representative_code || "").trim();
        const rawCode = row.employee_code || repCode;
        
        recordsToInsert.push({
          work_date: workDate,
          source_type: "cutting",
          source_id: row.id,
          employee_code: rawCode || null,
          employee_name: getFullNames(rawCode, row.employee_full_name || row.employee_name || repCode),
          representative_code: repCode || null,
          customer_order_number: row.customer_order_number || "",
          job_code: row.work_order_number || "",
          material_code: row.material_code || "",
          product_name: row.item_name || "",
          specification: row.specification || "",
          detail: row.joint_detail || "",
          quantity: qty,
          joint_count: joints,
          sheet_name: "CẮT",
          absent_codes: collectAbsentCodes(rawCode),
        });
      }
    }

    if (syncGrinding) {
      sourcesToDelete.push("grinding");
      const grindingData = getGrindingDataByDateRange(workDate, workDate);
      for (const row of grindingData) {
        const qty = Number(row.completed_quantity) || 0;
        if (qty <= 0) {
          continue; // Chỉ đồng bộ các dòng có Số lượng hoàn thành > 0
        }
        const repCode = (row.representative_code || "").trim();
        const rawCode = row.employee_code || repCode;
        
        recordsToInsert.push({
          work_date: workDate,
          source_type: "grinding",
          source_id: row.id,
          employee_code: rawCode || null,
          employee_name: getFullNames(rawCode, row.employee_full_name || row.employee_name || repCode),
          representative_code: repCode || null,
          customer_order_number: row.customer_order_number || "",
          job_code: row.work_order_number || "",
          material_code: row.material_code || "",
          product_name: row.item_name || "",
          specification: row.specification || "",
          detail: row.joint_detail || "",
          quantity: qty,
          joint_count: 0,
          sheet_name: "MÀI",
          absent_codes: collectAbsentCodes(rawCode),
        });
      }
    }

    if (sourcesToDelete.length > 0) {
      personalProductionDAO.deleteByDateAndSources(workDate, sourcesToDelete);
    }

    const insertResult = personalProductionDAO.insertBatch(recordsToInsert);
    if (!insertResult.ok) {
      return insertResult;
    }

    logger.info("Đồng bộ Sản lượng cá nhân thành công", {
      workDate,
      syncCutting,
      syncGrinding,
      insertedCount: insertResult.insertedCount,
    });

    return {
      ok: true,
      insertedCount: insertResult.insertedCount,
      unmappedCodes: [...unmappedCodesSet].map(c => {
        const emp = attList.find(a => String(a.employee_code || "").replace(/^[Vv]/, "") === c);
        return {
          code: c,
          name: emp ? emp.employee_name : null,
          representativeCode: emp ? emp.representative_code : null,
        };
      }),
    };
  } catch (error) {
    logger.error("Lỗi đồng bộ Sản lượng cá nhân", error);
    return { ok: false, message: error.message };
  }
}

async function updateRecord(id, data) {
  try {
    // Lấy thông tin bản ghi hiện tại để biết ngày (work_date)
    const existing = personalProductionDAO.getById?.(id) || personalProductionDAO.getRecordById?.(id);
    // Lưu ý: DAO có thể chưa có hàm getById, ta sẽ thêm nếu cần, hoặc bỏ qua nếu data đã có work_date
    // Tạm thời nếu trong data không truyền work_date, mà DAO không hỗ trợ get thì...
    // Nhưng data thường không có work_date. Ta cần lấy work_date từ SQLite.
    
    // Cách an toàn hơn: viết trực tiếp SQL lấy work_date hoặc viết hàm getById trong DAO.
    const db = require("../sqlite/connection").openDatabase();
    const currentRecord = db.prepare(`SELECT work_date FROM personal_production WHERE id = ?`).get(id);
    db.close();

    if (!currentRecord) {
      return { ok: false, message: `Không tìm thấy dòng dữ liệu ID ${id}` };
    }

    const workDate = data.work_date || currentRecord.work_date;
    const employeeCode = data.employee_code;

    // Kiểm tra điểm danh nếu có mã nhân viên và không phải tài khoản báo phế (23081905)
    if (employeeCode && employeeCode !== "23081905") {
      const attendanceRepo = require("../sqlite/attendance");
      const attList = attendanceRepo.getAttendanceByDate(workDate);
      
      const empAtt = attList.find(a => a.employee_code === employeeCode);
      if (!empAtt || empAtt.status !== "PRESENT") {
        return { ok: false, message: "Nhân viên đang vắng, không thể nhập sản lượng." };
      }
    }

    const result = personalProductionDAO.updateRecord(id, data);
    return result;
  } catch (error) {
    logger.error("Lỗi updateRecord Sản lượng cá nhân", error);
    return { ok: false, message: error.message };
  }
}

module.exports = {
  generate,
  openFolder,
  openFile,
  openExportFolder,
  getByDate,
  checkExists,
  syncData,
  updateRecord,
};
