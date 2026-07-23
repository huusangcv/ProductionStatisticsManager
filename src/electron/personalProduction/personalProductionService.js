const XlsxPopulate = require("xlsx-populate");
const fs = require("fs");
const path = require("path");
const { app, shell } = require("electron");

const { getAppDataRoot } = require("../sqlite/paths");
const { getCuttingDataByDateRange } = require("../sqlite/cutting");
const { getGrindingDataByDateRange } = require("../sqlite/grinding");
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
 * In development, it points to src/excels/...
 * In production (asar), it points to the packaged resources.
 */
function getTemplatePath() {
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    return path.join(process.resourcesPath, "src/excels/personal-production.xlsx");
  } else {
    return path.join(app.getAppPath(), "src/excels/personal-production.xlsx");
  }
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

    // Fetch data
    const cuttingData = getCuttingDataByDateRange(startDate, endDate);
    const grindingData = getGrindingDataByDateRange(startDate, endDate);

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

        const qty = Number(row.completed_quantity) || 0;
        const joints = Number(row.joint_count) || 0;

        totalQty += qty;
        totalJoints += joints;

        // Bỏ qua cột 1 (STT), 10 (Chi tiết), 11 (Số xâu) vì template đã cài sẵn công thức (Formula).
        // Chỉ ghi các cột dữ liệu thật.
        wsRow.cell(2).value(row.customer_order_number || "");
        wsRow.cell(3).value(row.work_order_number || "");
        wsRow.cell(4).value(row.material_code || "");
        wsRow.cell(5).value(row.item_name || "");
        wsRow.cell(6).value(row.specification || "");
        wsRow.cell(7).value(qty);
        wsRow.cell(8).value(row.representative_code || "");
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

module.exports = {
  generate,
  openFolder,
};
