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
    "PersonalProduction",
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
    const writeSheet = (sheet, data) => {
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

        // Bỏ qua cột 1 (STT), 10 (Chi tiết), 11 (Số xâu) vì template đã cài sẵn công thức (Formula).
        // Chỉ ghi các cột dữ liệu thật.
        wsRow.cell(2).value(row.customer_order_number || "");
        wsRow.cell(3).value(row.job_code || row.work_order_number || "");
        wsRow.cell(4).value(row.material_code || "");
        wsRow.cell(5).value(row.product_name || row.item_name || "");
        wsRow.cell(6).value(row.specification || "");
        wsRow.cell(7).value(qty);
        wsRow.cell(8).value(row.employee_code || row.representative_code || "");
        wsRow.cell(9).value(row.remark || "");
      }

      // Edge case: N === 0 (Xóa dữ liệu mẫu nhưng giữ style)
      if (N === 0) {
        const wsRow = sheet.row(START_ROW);
        for (let c = 1; c <= 11; c++) {
          wsRow.cell(c).value("");
        }
      }

      // 6. Ghi tổng số lượng và xâu vào G2 và K2
      sheet.cell("G2").value(totalQty);
      sheet.cell("K2").value(totalJoints);
    };

    writeSheet(cuttingSheet, cuttingData);
    writeSheet(grindingSheet, grindingData);

    // Save File
    const reportDateObj = new Date(startDate);
    const yyyy = reportDateObj.getFullYear();
    const mm = reportDateObj.getMonth() + 1;
    const dateStr = startDate === endDate
      ? startDate.replace(/-/g, "")
      : `${startDate.replace(/-/g, "")}_to_${endDate.replace(/-/g, "")}`;

    const fileName = `SanLuong_${dateStr}.xlsx`;
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
        recordsToInsert.push({
          work_date: workDate,
          source_type: "cutting",
          source_id: row.id,
          employee_code: row.employee_code || repCode || null,
          employee_name: row.employee_full_name || row.employee_name || repCode || null,
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
        recordsToInsert.push({
          work_date: workDate,
          source_type: "grinding",
          source_id: row.id,
          employee_code: row.employee_code || repCode || null,
          employee_name: row.employee_full_name || row.employee_name || repCode || null,
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
      unmappedCodes: [],
    };
  } catch (error) {
    logger.error("Lỗi đồng bộ Sản lượng cá nhân", error);
    return { ok: false, message: error.message };
  }
}

async function updateRecord(id, data) {
  try {
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
  getByDate,
  checkExists,
  syncData,
  updateRecord,
};
