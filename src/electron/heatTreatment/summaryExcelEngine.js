/**
 * summaryExcelEngine.js — Engine tạo file tổng hợp kỳ Hàng Xử lý Nhiệt.
 *
 * File output có cấu trúc:
 *   Row 1: Header công ty (copy từ template)
 *   Row 2: "KHỐI LƯỢNG HÀNG XỬ LÝ NHIỆT THÁNG MM/YYYY"
 *   Row 3: "Đơn vị tính: Kg"
 *   Row 4: Header cột
 *   Row 5..N: Dữ liệu từng ngày trong kỳ
 *   Row N+1: Tổng tháng
 */

const ExcelJS = require("exceljs");

// ── buildPeriodDates ──────────────────────────────────────────────────────────

/**
 * Builds the list of dates for a kỳ xử lý nhiệt (26th prev month → 25th current month).
 * @param {number} periodYear
 * @param {number} periodMonth  1-based month (e.g. 7 for tháng 7)
 * @returns {string[]}  Array of YYYY-MM-DD strings in ascending order
 */
function buildPeriodDates(periodYear, periodMonth) {
  const dates = [];

  // Start: 26th of previous month
  let startYear = periodYear;
  let startMonth = periodMonth - 1;
  if (startMonth === 0) {
    startMonth = 12;
    startYear -= 1;
  }

  // End: 25th of current month
  const endYear = periodYear;
  const endMonth = periodMonth;

  const start = new Date(startYear, startMonth - 1, 26);
  const end = new Date(endYear, endMonth - 1, 25);

  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }

  return dates;
}

// ── generateSummaryExcel ──────────────────────────────────────────────────────

/**
 * Generates the period summary Excel file.
 *
 * @param {object} options
 * @param {string}   options.templatePath  Absolute path to the stored summary template file
 * @param {string}   options.outputPath    Absolute path where the output file will be saved
 * @param {number}   options.periodYear
 * @param {number}   options.periodMonth
 * @param {Map<string,object>}  options.dataByDate  Map of YYYY-MM-DD → { wcbWeight, otherWeight, totalWeight }
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
/**
 * Converts all shared formulas in a worksheet to standalone formulas (or plain values).
 * ExcelJS's spliceRows can corrupt shared-formula references (throws "Shared Formula
 * master must exist above and or left of clone for cell Xxx"). Calling this right after
 * readFile eliminates the problem before any row manipulation occurs.
 */
function stripSharedFormulas(worksheet, maxRow) {
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.type === ExcelJS.ValueType.Formula) {
        if (rowNumber > maxRow) {
          cell.value = null; // Clear formulas for garbage rows
        } else {
          const f = cell.formula;
          const sf = cell.sharedFormula;
          // If either formula field is populated, make it a standalone formula.
          const formulaStr = f || sf;
          if (formulaStr) {
            cell.value = { formula: formulaStr, result: cell.result };
            // Explicitly clear the sharedFormula flag so ExcelJS stops tracking it.
            cell.sharedFormula = undefined;
          }
        }
      }
    });
  });
}

async function generateSummaryExcel({ templatePath, outputPath, periodYear, periodMonth, dataByDate }) {
  try {
    // ── Load template ─────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return { ok: false, message: "Không tìm thấy worksheet trong template." };

    // ── Identify exact total row ──────────────────────────────────────────────
    const DATA_START_ROW = 5;
    let originalTotalRowIndex = DATA_START_ROW + 1;

    for (let r = DATA_START_ROW; r <= worksheet.rowCount; r++) {
      const cell = worksheet.getRow(r).getCell(1);
      const val = cell.value;
      let text = "";
      if (typeof val === 'string') text = val;
      else if (val && val.richText) text = val.richText.map(rt => rt.text).join("");

      if (text.toLowerCase().includes("tổng tháng")) {
        originalTotalRowIndex = r;
        break;
      }
    }

    // ── Strip shared formulas before any row manipulation ────────────────────
    stripSharedFormulas(worksheet, originalTotalRowIndex);

    // ── Helper: deep-clone a row's styles ────────────────────────────────────
    function cloneRowStyles(srcRow, colCount) {
      const styles = {};
      for (let c = 1; c <= colCount; c++) {
        const s = srcRow.getCell(c).style;
        styles[c] = s ? JSON.parse(JSON.stringify(s)) : {};
      }
      return styles;
    }

    const colCount = Math.max(worksheet.columnCount || 0, 4);

    // Capture style of the data template row (row 5) and total row
    const tmplDataRow = worksheet.getRow(DATA_START_ROW);
    const dataRowStyles = cloneRowStyles(tmplDataRow, colCount);
    const dataRowHeight = tmplDataRow.height;

    const tmplTotalRow = worksheet.getRow(originalTotalRowIndex);
    const totalRowStyles = cloneRowStyles(tmplTotalRow, colCount);
    const totalRowHeight = tmplTotalRow.height;

    // ── Build dates for this period ──────────────────────────────────────────
    const periodDates = buildPeriodDates(periodYear, periodMonth);
    const N = periodDates.length;

    // ── Insert rows BEFORE Total Row ──────────────────────────────────────────
    // This perfectly matches "Chỉ thêm các dòng trước Tổng tháng"
    const currentPlaceholders = originalTotalRowIndex - DATA_START_ROW;
    if (N > currentPlaceholders) {
      const rowsToAdd = N - currentPlaceholders;
      worksheet.spliceRows(originalTotalRowIndex, 0, ...Array.from({ length: rowsToAdd }, () => []));
    } else if (N < currentPlaceholders) {
      const rowsToDelete = currentPlaceholders - N;
      worksheet.spliceRows(DATA_START_ROW, rowsToDelete);
    }

    const newTotalRowNum = DATA_START_ROW + N;

    // ── Row 2: Update period title ───────────────────────────────────────────
    const titleRow = worksheet.getRow(2);
    const mStr = String(periodMonth).padStart(2, "0");
    titleRow.getCell(1).value = `KHỐI LƯỢNG HÀNG XỬ LÝ NHIỆT THÁNG ${mStr}/${periodYear}`;
    titleRow.commit();

    // ── Fill data rows ────────────────────────────────────────────────────────
    let totalWcb = 0;
    let totalOther = 0;
    let totalAll = 0;

    for (let i = 0; i < N; i++) {
      const dateStr = periodDates[i];
      const rowNum = DATA_START_ROW + i;
      const wsRow = worksheet.getRow(rowNum);

      // Apply style from template data row
      wsRow.height = dataRowHeight;
      for (let c = 1; c <= colCount; c++) {
        wsRow.getCell(c).style = JSON.parse(JSON.stringify(dataRowStyles[c]));
      }

      // Get data for this date (0 if not exported yet)
      const dayData = dataByDate.get(dateStr);
      const wcb = dayData ? Number(dayData.wcb_weight || 0) : 0;
      const other = dayData ? Number(dayData.other_weight || 0) : 0;
      const total = dayData ? Number(dayData.total_weight || 0) : 0;

      totalWcb += wcb;
      totalOther += other;
      totalAll += total;

      // Column A: Date (as a Date object for proper Excel date formatting)
      const [y, m, d] = dateStr.split("-").map(Number);
      wsRow.getCell(1).value = new Date(y, m - 1, d);
      wsRow.getCell(1).numFmt = "dd/mm/yyyy";

      // Column B: WCB weight
      const cellB = wsRow.getCell(2);
      cellB.value = wcb;
      cellB.numFmt = '#,##0.00';

      // Column C: Other weight
      const cellC = wsRow.getCell(3);
      cellC.value = other;
      cellC.numFmt = '#,##0.00';

      // Column D: Total weight
      const cellD = wsRow.getCell(4);
      cellD.value = total;
      cellD.numFmt = '#,##0.00';

      wsRow.commit();
    }

    // ── Fill total row ────────────────────────────────────────────────────────
    const wsTotalRow = worksheet.getRow(newTotalRowNum);

    wsTotalRow.height = totalRowHeight;
    for (let c = 1; c <= colCount; c++) {
      wsTotalRow.getCell(c).style = JSON.parse(JSON.stringify(totalRowStyles[c]));
    }

    wsTotalRow.getCell(1).value = "Tổng tháng";
    
    const cellT2 = wsTotalRow.getCell(2);
    cellT2.value = totalWcb;
    cellT2.numFmt = '#,##0.00';
    
    const cellT3 = wsTotalRow.getCell(3);
    cellT3.value = totalOther;
    cellT3.numFmt = '#,##0.00';
    
    const cellT4 = wsTotalRow.getCell(4);
    cellT4.value = totalAll;
    cellT4.numFmt = '#,##0.00';
    
    wsTotalRow.commit();

    // ── Cleanup trailing ghost rows ───────────────────────────────────────────
    for (let r = worksheet.rowCount; r > newTotalRowNum; r--) {
      let hasContent = false;
      const row = worksheet.getRow(r);
      row.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value;
        if (val !== null && val !== undefined && val !== "") {
          if (cell.type === ExcelJS.ValueType.Formula) {
            // Ignore formulas (like the ones from shared formula dragging)
          } else {
            hasContent = true;
          }
        }
      });
      if (!hasContent) {
        worksheet.spliceRows(r, 1);
      } else {
        break; // Stop at first row with actual content
      }
    }

    // ── Apply Print Configuration ─────────────────────────────────────────────
    const { getTemplate } = require("../sqlite/excelTemplates");
    const tplConfig = getTemplate("heat-treatment-summary");
    
    if (tplConfig) {
      if (tplConfig.print_start_column && tplConfig.print_end_column) {
        const startCol = tplConfig.print_start_column;
        const endCol = tplConfig.print_end_column;
        worksheet.pageSetup.printArea = `${startCol}1:${endCol}${worksheet.rowCount}`;
      }
      
      // Page setup margins (ExcelJS uses inches, 1 inch = 2.54 cm)
      worksheet.pageSetup.margins = {
        left: (tplConfig.margin_left_cm !== null ? tplConfig.margin_left_cm : 1.5) / 2.54,
        right: (tplConfig.margin_right_cm !== null ? tplConfig.margin_right_cm : 1.5) / 2.54,
        top: (tplConfig.margin_top_cm !== null ? tplConfig.margin_top_cm : 1.5) / 2.54,
        bottom: (tplConfig.margin_bottom_cm !== null ? tplConfig.margin_bottom_cm : 1.5) / 2.54,
        header: (tplConfig.header_margin_cm !== null ? tplConfig.header_margin_cm : 0.8) / 2.54,
        footer: (tplConfig.footer_margin_cm !== null ? tplConfig.footer_margin_cm : 0.8) / 2.54
      };

      if (tplConfig.fit_width !== null && tplConfig.fit_width !== undefined) {
        worksheet.pageSetup.fitToPage = true;
        worksheet.pageSetup.fitToWidth = tplConfig.fit_width;
      }
      if (tplConfig.fit_height !== null && tplConfig.fit_height !== undefined) {
        worksheet.pageSetup.fitToPage = true;
        worksheet.pageSetup.fitToHeight = tplConfig.fit_height;
      }
      if (tplConfig.orientation) {
        worksheet.pageSetup.orientation = tplConfig.orientation;
      }
      if (tplConfig.paper_size === 'A4') {
        worksheet.pageSetup.paperSize = 9;
      }
      if (tplConfig.repeat_header_rows) {
        worksheet.pageSetup.printTitlesRow = tplConfig.repeat_header_rows;
      }
    }

    // ── Save output ───────────────────────────────────────────────────────────
    await workbook.xlsx.writeFile(outputPath);

    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Lỗi tạo file tổng hợp: " + error.message };
  }
}

module.exports = { generateSummaryExcel, buildPeriodDates };
