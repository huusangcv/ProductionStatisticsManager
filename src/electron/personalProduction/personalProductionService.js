const ExcelJS = require("exceljs");
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

    // Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const cuttingSheet = workbook.getWorksheet("CẮT");
    const grindingSheet = workbook.getWorksheet("MÀI");

    if (!cuttingSheet || !grindingSheet) {
      return { ok: false, message: "Template không đúng định dạng (thiếu sheet CẮT hoặc MÀI)." };
    }

    // Neutralize all formulas to prevent "Shared Formula master must exist above and or left of clone" error
    const neutralizeFormulas = (sheet) => {
      sheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          if (cell.type === ExcelJS.ValueType.Formula) {
            cell.value = cell.result !== undefined ? cell.result : null;
          }
        });
      });
    };

    neutralizeFormulas(cuttingSheet);
    neutralizeFormulas(grindingSheet);

    const START_ROW = 4;

    // Format date for B2
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const [y, m, d] = dateString.split("-");
      return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    };
    const uiDate = formatDate(startDate);


    // Helper to write rows with exact style cloning (prevents lost design)
    const writeSheet = (sheet, data) => {
      // 1. Ghi ngày báo cáo vào B2
      const dateCell = sheet.getRow(2).getCell(2);
      dateCell.value = uiDate;
      sheet.getRow(2).commit();

      const N = data.length;

      // 2. Snapshot Row 4 style
      const tmplRow = sheet.getRow(START_ROW);
      const tmplHeight = tmplRow.height;
      const colCount = 15; // Scan up to 15 columns for styling
      const tmplStyles = {};
      for (let c = 1; c <= colCount; c++) {
        const s = tmplRow.getCell(c).style;
        tmplStyles[c] = s ? JSON.parse(JSON.stringify(s)) : {};
      }

      // 3. Xóa các dòng rỗng thừa của template bên dưới dòng bắt đầu
      const totalRows = sheet.rowCount;
      if (totalRows > START_ROW) {
        sheet.spliceRows(START_ROW + 1, totalRows - START_ROW);
      }

      // 4. Chèn số dòng tương ứng với lượng dữ liệu
      if (N > 1) {
        sheet.spliceRows(START_ROW + 1, 0, ...Array.from({ length: N - 1 }, () => []));
      }

      let totalQty = 0;
      let totalJoints = 0;

      // 5. Fill data and apply cloned styles
      for (let i = 0; i < N; i++) {
        const row = data[i];
        const rowIdx = START_ROW + i;
        const wsRow = sheet.getRow(rowIdx);

        // Apply cloned style for newly inserted rows
        if (i > 0) {
          wsRow.height = tmplHeight;
          for (let c = 1; c <= colCount; c++) {
            wsRow.getCell(c).style = JSON.parse(JSON.stringify(tmplStyles[c]));
          }
        }

        const qty = Number(row.completed_quantity) || 0;
        const joints = Number(row.joint_count) || 0;

        totalQty += qty;
        totalJoints += joints;

        wsRow.getCell(1).value = i + 1; // STT
        wsRow.getCell(2).value = row.customer_order_number || "";
        wsRow.getCell(3).value = row.work_order_number || "";
        wsRow.getCell(4).value = row.material_code || "";
        wsRow.getCell(5).value = row.item_name || "";
        wsRow.getCell(6).value = row.specification || "";
        wsRow.getCell(7).value = qty;
        wsRow.getCell(8).value = row.representative_code || "";
        wsRow.getCell(9).value = row.remark || "";
        wsRow.getCell(10).value = row.joint_detail || ""; // Chi tiết
        wsRow.getCell(11).value = joints || "";  // Số xâu
        wsRow.commit();
      }

      // Edge case: N === 0 (Xóa dữ liệu mẫu nhưng giữ style)
      if (N === 0) {
        const wsRow = sheet.getRow(START_ROW);
        for (let c = 1; c <= 11; c++) {
          wsRow.getCell(c).value = "";
        }
        wsRow.commit();
      }

      // 6. Ghi tổng số lượng và xâu vào G2 và K2
      const sumRow = sheet.getRow(2);
      sumRow.getCell(7).value = totalQty;
      sumRow.getCell(11).value = totalJoints;
      sumRow.commit();
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

    await workbook.xlsx.writeFile(filePath);

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
