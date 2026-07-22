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
    
    // Clear the formulas from data rows to prevent ExcelJS issues
    for (let i = 0; i < N; i++) {
      const wsRow = worksheet.getRow(startRow + i);
      wsRow.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.type === ExcelJS.ValueType.Formula) {
          cell.value = cell.result ?? null;
        }
      });
    }

    // ── Fill Data ───────────────────────────────────────────────────────────────
    let totalScrapPCS = 0;
    
    // Accumulators for Footer
    const footerSums = {
      VAN: { "CF8M": 0, "CF8": 0, "CF3M": 0, "WCB": 0, "total": 0 },
      ỐNG: { "CF8M": 0, "CF8": 0, "total": 0 }
    };
    
    // For 316 and 304, map them to CF8M and CF8 for the footer
    const mapMaterial = (mat) => {
      if (mat === "316") return "CF8M";
      if (mat === "304") return "CF8";
      return mat;
    };

    if (rows.length > 0) {
      for (let i = 0; i < N; i++) {
        const rowNum = startRow + i;
        const wsRow = worksheet.getRow(rowNum);
        const rowData = rows[i];

        // A (STT)
        wsRow.getCell(1).value = i + 1;
        
        // Data columns
        Object.entries(rowData).forEach(([colKey, val]) => {
          const colIdx = getColNumber(colKey);
          if (val !== undefined && val !== null) {
            wsRow.getCell(colIdx).value = val;
          }
        });

        // Accumulate for footer
        const type = rowData.Z; // VAN / ỐNG
        const mat = mapMaterial(rowData.E); // Material
        const totalWeight = rowData.AA || 0; // Total weight
        const totalScrap = rowData.W || 0; // Total PCS

        totalScrapPCS += totalScrap;

        if (type === "VAN") {
          footerSums.VAN.total += totalWeight;
          if (footerSums.VAN[mat] !== undefined) footerSums.VAN[mat] += totalWeight;
        } else if (type === "ỐNG") {
          footerSums.ỐNG.total += totalWeight;
          if (footerSums.ỐNG[mat] !== undefined) footerSums.ỐNG[mat] += totalWeight;
        }

        wsRow.commit();
      }
    } else {
      // No data, clear the single row
      const wsRow = worksheet.getRow(startRow);
      wsRow.getCell(1).value = "";
      wsRow.commit();
    }

    // ── Update Footer ─────────────────────────────────────────────────────────
    const footerRow = startRow + N;
    
    // Row 7: Total PCS
    const r7 = worksheet.getRow(footerRow);
    r7.getCell(22).value = totalScrapPCS > 0 ? totalScrapPCS : ""; // V
    r7.getCell(23).value = totalScrapPCS > 0 ? totalScrapPCS : ""; // W
    for (let c = 7; c <= 23; c++) {
       if (c !== 22 && c !== 23) {
         r7.getCell(c).value = { formula: `""`, result: "" }; // preserve cell structure if needed, or just clear
         r7.getCell(c).value = ""; 
       }
    }
    r7.commit();

    // Row 9: Overall Total Weight
    const r9 = worksheet.getRow(footerRow + 2);
    r9.getCell(19).value = footerSums.ỐNG.total + footerSums.VAN.total;
    r9.commit();

    // Row 10: Breakdowns
    const r10 = worksheet.getRow(footerRow + 3);
    
    // Clear formula tags to avoid corruptions before setting static values
    r10.eachCell({ includeEmpty: true }, (c) => {
      if (c.type === ExcelJS.ValueType.Formula) {
         c.value = c.result ?? null;
      }
    });

    r10.getCell(3).value = footerSums.ỐNG["CF8M"];
    r10.getCell(4).value = footerSums.ỐNG["CF8"];
    r10.getCell(5).value = footerSums.ỐNG.total - footerSums.ỐNG["CF8M"] - footerSums.ỐNG["CF8"];
    
    r10.getCell(7).value = footerSums.VAN["CF8M"];
    r10.getCell(9).value = footerSums.VAN["CF8"];
    r10.getCell(11).value = footerSums.VAN["CF3M"];
    r10.getCell(13).value = footerSums.VAN["WCB"];
    r10.getCell(15).value = footerSums.VAN.total - footerSums.VAN["CF8M"] - footerSums.VAN["CF8"] - footerSums.VAN["CF3M"] - footerSums.VAN["WCB"];
    
    r10.commit();

    // ── Update Print Area ───────────────────────────────────────────────────
    const { getTemplate } = require("../sqlite/excelTemplates");
    const tplConfig = getTemplate("casting-defect-return");
    const printEndRow = footerRow + 7;
    
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
