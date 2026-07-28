/**
 * excelEngine.js — Casting Defect Return Excel generation engine (P-029-06.01 A3).
 *
 * This version handles the new dynamic 1-row template.
 * All formulas are replaced with JS logic.
 */

const ExcelJS = require("exceljs");

const SHEET_NAME = "ĐÚC P-029-06.01 A0)";

function getColNumber(colLetter) {
  let result = 0;
  for (let i = 0; i < colLetter.length; i++) {
    result = result * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return result;
}

async function generateCastingDefectExcel({ templatePath, outputPath, rows, reportDate, startRow = 6 }) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    let worksheet = workbook.getWorksheet(SHEET_NAME);
    if (!worksheet) worksheet = workbook.worksheets[0];
    if (!worksheet) return { ok: false, message: "Không tìm thấy worksheet trong template." };

    // ── Write report date into C3 ─────────────────────────────────────────────
    if (reportDate) {
      let fmt = reportDate;
      if (reportDate.includes("-")) {
        const [y, m, d] = reportDate.split("-");
        fmt = `${d}/${m}/${y}`;
      }
      const dateRow = worksheet.getRow(3);
      const dateCell = dateRow.getCell(3); // C3
      dateCell.value = fmt;
      dateRow.commit();
    }

    const N = rows.length || 1; // At least 1 to keep the empty template row if no data
    
    // ── Ensure we have enough data rows ─────────────────────────────────────────
    if (rows.length > 1) {
      // Duplicate row 6 (N-1) times, pushing the footer down safely
      worksheet.duplicateRow(startRow, rows.length - 1, true);
    }
    
    // Remove autoFilter to prevent some corruption issues
    worksheet.autoFilter = undefined;
    
    // We rely entirely on the Excel template's formulas.
    // The user's template contains a footer with formulas that will automatically calculate totals.
    // We only duplicate rows to expand the data area, and ExcelJS will shift the footer down.
    if (rows.length > 0) {
      for (let i = 0; i < N; i++) {
        const rowNum = startRow + i;
        const wsRow = worksheet.getRow(rowNum);
        const rowData = rows[i];

        // A (STT)
        wsRow.getCell(1).value = i + 1;
        
        // Data columns (B -> U)
        Object.entries(rowData).forEach(([colKey, val]) => {
          const colIdx = getColNumber(colKey);
          if (val !== undefined && val !== null) {
            wsRow.getCell(colIdx).value = val;
          }
        });

        wsRow.commit();
      }
    } else {
      // No data, clear the single row
      const wsRow = worksheet.getRow(startRow);
      wsRow.getCell(1).value = "";
      wsRow.commit();
    }

    // ── Update Print Area ───────────────────────────────────────────────────
    const footerRow = startRow + N;
    const printEndRow = footerRow + 7;
    
    const { getTemplate } = require("../sqlite/excelTemplates");
    const tplConfig = getTemplate("casting-defect-return");
    
    if (tplConfig && tplConfig.print_start_column && tplConfig.print_end_column) {
      worksheet.pageSetup.printArea = `${tplConfig.print_start_column}1:${tplConfig.print_end_column}${printEndRow}`;
    } else {
      worksheet.pageSetup.printArea = `$A$1:$W${printEndRow}`;
    }

    // ── Save ────────────────────────────────────────────────────────────────
    await workbook.xlsx.writeFile(outputPath);
    return { ok: true };

  } catch (error) {
    return { ok: false, message: "Lỗi tạo file Excel báo phế: " + error.message };
  }
}

module.exports = { generateCastingDefectExcel };
