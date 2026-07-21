/**
 * excelEngine.js — Heat Treatment Excel generation engine.
 *
 * Workflow:
 *   1. Load stored template (read-only)
 *   2. Create a new workbook by copying the template
 *   3. Fill data rows starting at `startRow` in `sheetName`
 *   4. Save to `outputPath`
 *
 * The original template file is NEVER modified.
 * All values are pre-calculated — no Excel formulas are written.
 *
 * Dependencies: exceljs (already in package.json)
 */

const ExcelJS = require("exceljs");
const path = require("path");

const COLUMN_MAPPING = {
  stt: 1,                   // A
  customer_order_number: 2, // B
  work_order_number: 3,     // C
  material_code: 4,         // D
  item_name: 5,             // E
  specification: 6,         // F
  completed_quantity: 7,    // G
  unit_weight: 8,           // H
  completed_weight: 9,      // I
  classification: 10,       // J
  material_type: 11,        // K
}// ── generateHeatTreatmentExcel ────────────────────────────────────────────────

/**
 * Loads the template, fills data rows, saves output.
 *
 * @param {object} options
 * @param {string}   options.templatePath  Absolute path to the stored template file
 * @param {string}   options.outputPath    Absolute path where the new file will be saved
 * @param {object[]} options.rows          Pre-calculated output rows from heatTreatmentRules
 * @param {string}   options.reportDate    Date of the report (YYYY-MM-DD)
 * @param {string}   [options.sheetName]   Worksheet to fill (default: from template or first sheet)
 * @param {number}   [options.startRow]    1-based row where data begins (default: 6)
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
async function generateHeatTreatmentExcel({ templatePath, outputPath, rows, sheetName, startRow = 6, reportDate }) {
  try {
    // ── Load workbook ─────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    let worksheet = sheetName ? workbook.getWorksheet(sheetName) : null;
    if (!worksheet) worksheet = workbook.worksheets[0];
    if (!worksheet) return { ok: false, message: "Không tìm thấy worksheet trong template." };

    // ── Write report date ─────────────────────────────────────────────────────
    if (reportDate) {
      let fmt = reportDate;
      if (reportDate.includes("-")) {
        const [y, m, d] = reportDate.split("-");
        fmt = `${d}/${m}/${y}`;
      }
      const dr = worksheet.getRow(3);
      dr.getCell(3).value = fmt;
      dr.commit();
    }

    // ── Helper: read text value from any cell type ────────────────────────────
    function getCellText(cell) {
      const v = cell.value;
      if (!v && v !== 0) return "";
      if (typeof v === "object" && v.richText) return v.richText.map(t => t.text).join("").trim();
      if (typeof v === "object" && v.result !== undefined) return String(v.result ?? "").trim();
      return String(v).trim();
    }

    // ── Step 1: Snapshot Row startRow BEFORE any modification ─────────────────
    // This is the ONE template data row that defines formatting for all data rows.
    const tmplRow = worksheet.getRow(startRow);

    // Capture row height
    const tmplHeight = tmplRow.height;

    // Capture per-column styles (deep-clone so later mutations don't affect snapshot)
    const colCount = Math.max(worksheet.columnCount || 0, Object.keys(COLUMN_MAPPING).reduce((m, k) => Math.max(m, COLUMN_MAPPING[k]), 0) + 2);
    const tmplStyles = {}; // colIndex -> cloned style
    for (let c = 1; c <= colCount; c++) {
      const s = tmplRow.getCell(c).style;
      tmplStyles[c] = s ? JSON.parse(JSON.stringify(s)) : {};
    }

    // Capture merge ranges that span exactly startRow (horizontal merges within the data row)
    const tmplMerges = []; // [{startCol, endCol}] as letter refs
    if (worksheet._merges) {
      Object.keys(worksheet._merges).forEach(key => {
        const m = key.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (m && parseInt(m[2], 10) === startRow && parseInt(m[4], 10) === startRow) {
          tmplMerges.push({ startCol: m[1], endCol: m[3] });
        }
      });
    }

    // ── Step 2: Find summary start row (bottom-up scan) ───────────────────────
    // The summary section is always at the END of the template.
    // Any row containing "tổng / total / ghi chú / người lập / trưởng" is part of summary.
    const SUMMARY_KEYWORDS = ["tổng", "total", "ghi chú", "người lập", "người ký", "trưởng phòng", "giám đốc"];
    const totalTemplateRows = worksheet.rowCount;
    let summaryStartRow = null;

    for (let r = totalTemplateRows; r > startRow; r--) {
      const row = worksheet.getRow(r);
      let isSummaryRow = false;
      for (let c = 1; c <= Math.min(colCount, 12); c++) {
        const txt = getCellText(row.getCell(c)).toLowerCase();
        if (SUMMARY_KEYWORDS.some(kw => txt.includes(kw))) {
          isSummaryRow = true;
          break;
        }
      }
      if (isSummaryRow) {
        summaryStartRow = r;
        // continue upward to find the topmost summary row
      } else if (summaryStartRow !== null) {
        break; // hit a non-summary row while going up — stop
      }
    }

    // dataEndRow = last row of the template data region
    const dataEndRow = summaryStartRow !== null ? summaryStartRow - 1 : totalTemplateRows;

    // ── Step 3: Neutralize ALL formulas in the data region ────────────────────
    // Converts formula cells to static cached values to prevent shared-formula corruption.
    for (let r = startRow; r <= dataEndRow; r++) {
      worksheet.getRow(r).eachCell({ includeEmpty: true }, cell => {
        if (cell.type === ExcelJS.ValueType.Formula) {
          cell.value = cell.result !== undefined ? cell.result : null;
        }
      });
    }

    // ── Step 4: Delete all extra template data rows ───────────────────────────
    // The data region is [startRow, dataEndRow].
    // Row startRow (Row 6) is the style reference — keep it.
    // Rows startRow+1 through dataEndRow are surplus blank template rows — delete them.
    // This collapses the data region to a single row and slides the summary up.
    const surplusRows = dataEndRow - startRow; // number of rows after startRow to delete
    if (surplusRows > 0) {
      // Unmerge cells in the rows being deleted to avoid stale merge refs in the output
      if (worksheet._merges) {
        const toUnmerge = [];
        Object.keys(worksheet._merges).forEach(key => {
          const m = key.match(/[A-Z]+(\d+)/);
          if (m) {
            const rn = parseInt(m[1], 10);
            if (rn > startRow && rn <= dataEndRow) toUnmerge.push(key);
          }
        });
        toUnmerge.forEach(key => { try { worksheet.unMergeCells(key); } catch (_) {} });
      }
      // Physically remove rows — summary shifts upward automatically
      worksheet.spliceRows(startRow + 1, surplusRows);
    }

    // After deletion, summary is now at startRow+1 (if it existed)
    const insertBeforeRow = summaryStartRow !== null ? startRow + 1 : null;

    // ── Step 5: Insert N-1 new rows after startRow ────────────────────────────
    // Row startRow already exists as the first data row.
    // We need N data rows total → insert N-1 more.
    const N = rows.length;
    if (N > 1) {
      // Insert N-1 blank rows immediately after startRow (before summary or end of sheet)
      worksheet.spliceRows(startRow + 1, 0, ...Array.from({ length: N - 1 }, () => []));
    }

    // ── Step 6: Apply template style to all N data rows and write values ──────
    for (let i = 0; i < N; i++) {
      const rowNum = startRow + i;
      const wsRow  = worksheet.getRow(rowNum);

      // Row startRow already carries the original template style.
      // Every inserted row (i > 0) needs the style cloned onto it.
      if (i > 0) {
        wsRow.height = tmplHeight;
        for (let c = 1; c <= colCount; c++) {
          wsRow.getCell(c).style = JSON.parse(JSON.stringify(tmplStyles[c]));
        }
        // Replicate horizontal merges from the template row
        tmplMerges.forEach(mg => {
          try { worksheet.mergeCells(`${mg.startCol}${rowNum}:${mg.endCol}${rowNum}`); } catch (_) {}
        });
      }

      // Write data values — only into mapped columns, never touching other cells
      const rowData = rows[i];
      Object.entries(COLUMN_MAPPING).forEach(([field, col]) => {
        const cell = wsRow.getCell(col);
        const val  = rowData[field];
        if (val === undefined || val === null) {
          cell.value = "";
        } else if (typeof val === "number") {
          cell.value = val;
        } else {
          cell.value = String(val);
        }
      });

      wsRow.commit();
    }

    // Edge case: N === 0 — clear the template row values but keep formatting
    if (N === 0) {
      const wsRow = worksheet.getRow(startRow);
      Object.values(COLUMN_MAPPING).forEach(col => {
        wsRow.getCell(col).value = "";
      });
      wsRow.commit();
    }

    // ── Step 7: Expand Summary formula ranges to cover all data rows ─────────
    //
    // The Summary section contains SUMIFS / SUMIF formulas whose ranges were
    // originally anchored to the single template row:
    //   =ROUND(SUMIFS($I$6:$I$6, $J$6:$J$6, "XLN", K6:$K$6, "WCB"), 2)
    //   =ROUND(SUMIF(J6:J6, "XLN", I6:I6), 2)
    //
    // After inserting N data rows, the ranges must cover row 6 through lastDataRow.
    // We rewrite every formula in the summary section by replacing any range pattern
    // that ends at startRow with a range that ends at lastDataRow.
    //
    // Pattern matched:   $X$6:$X$6   X6:$X$6   X6:X6   $X$6:X6  (any combination)
    // Replaced with:     $X$6:$X${lastDataRow}  etc.
    //
    // Only the END row of each range is updated; the start row is left alone.

    if (N > 0 && summaryStartRow !== null) {
      const lastDataRow = startRow + N - 1;
      // After Step 4 (delete surplus) + Step 5 (insert N-1), the summary now sits
      // immediately after the last data row.
      const newSummaryStart = lastDataRow + 1;
      const finalRowCount   = worksheet.rowCount;
      const offset          = newSummaryStart - summaryStartRow;

      // Regex: matches any A1-style range like  $COL$ROW:$COL$ROW
      // where the end row equals startRow (the original template row number).
      const startRowStr = String(startRow);
      const rangeRe = new RegExp(
        `(\\$?[A-Z]+\\$?${startRowStr}):(\\$?[A-Z]+)\\$?${startRowStr}\\b`,
        "g"
      );
      
      // Regex: matches any single cell reference (e.g., H7, $C$7, AA10)
      const singleCellRe = /(\$?[A-Z]{1,3}\$?)(\d+)\b/gi;

      for (let r = newSummaryStart; r <= finalRowCount; r++) {
        const row = worksheet.getRow(r);
        let rowChanged = false;

        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.type !== ExcelJS.ValueType.Formula) return;
          const fv = cell.value; // { formula: string, result?: any }
          if (!fv || typeof fv !== "object" || typeof fv.formula !== "string") return;

          const original = fv.formula;
          let updated = original;

          // 1. Shift references that belong to the original summary block (e.g. H7 -> H126)
          if (offset !== 0) {
            updated = updated.replace(singleCellRe, (match, prefix, rowStr) => {
              const rowNum = parseInt(rowStr, 10);
              // Only shift if the row belonged to the original summary section
              if (rowNum >= summaryStartRow) {
                return `${prefix}${rowNum + offset}`;
              }
              return match;
            });
          }

          // 2. Expand data ranges that anchored to the single template row (e.g. $I$6:$I$6 -> $I$6:$I$125)
          updated = updated.replace(rangeRe, (_, startRef, endCol) => {
            return `${startRef}:${endCol}$${lastDataRow}`;
          });

          if (updated !== original) {
            cell.value = { formula: updated, date1904: false };
            rowChanged = true;
          }
        });

        if (rowChanged) row.commit();
      }
    }

    // ── Get Template DB config for printArea ───────────────────────────────────
    const { getTemplate } = require("../sqlite/excelTemplates");
    const tplConfig = getTemplate("heat-treatment");
    if (tplConfig && tplConfig.print_start_column && tplConfig.print_end_column) {
      const startCol = tplConfig.print_start_column;
      const endCol = tplConfig.print_end_column;
      worksheet.pageSetup.printArea = `${startCol}1:${endCol}${worksheet.rowCount}`;
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    await workbook.xlsx.writeFile(outputPath);
    return { ok: true };

  } catch (error) {
    return { ok: false, message: "Lỗi tạo file Excel: " + error.message };
  }
}




// ── previewTemplate ───────────────────────────────────────────────────────────

/**
 * Reads a template file and returns preview data for the renderer.
 *
 * Returns up to `maxRows` rows from each worksheet.
 * Does NOT modify the workbook.
 *
 * @param {string} templatePath   Absolute path to the template file
 * @param {number} [maxRows=100]  Maximum rows to read per sheet
 * @returns {Promise<{
 *   ok: boolean,
 *   sheetNames: string[],
 *   sheets: { [sheetName]: { headers: string[], rows: (string|number)[][] } },
 *   message?: string
 * }>}
 */
async function previewTemplate(templatePath, maxRows = 100) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    const sheets     = {};

    for (const ws of workbook.worksheets) {
      const headers = [];
      const rows    = [];
      let   rowCount = 0;

      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowCount >= maxRows) return;

        const values = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          const v = cell.value;
          if (v === null || v === undefined) {
            values.push("");
          } else if (typeof v === "object" && v.richText) {
            values.push(v.richText.map((r) => r.text).join(""));
          } else if (typeof v === "object" && v.result !== undefined) {
            // Formula cell — use cached result
            values.push(v.result ?? "");
          } else {
            values.push(v);
          }
        });

        if (rowNumber === 1) {
          headers.push(...values.map((v) => String(v)));
        } else {
          rows.push(values);
        }
        rowCount++;
      });

      sheets[ws.name] = { headers, rows };
    }

    return { ok: true, sheetNames, sheets };
  } catch (error) {
    return { ok: false, message: "Lỗi đọc template: " + error.message };
  }
}

module.exports = { generateHeatTreatmentExcel, previewTemplate };
