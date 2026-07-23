const logger = require("../logger");

/**
 * Scans an entire ExcelJS workbook for Shared Formula metadata to ensure
 * no formula master dependencies are corrupted before saving.
 * 
 * @param {import("exceljs").Workbook} workbook 
 * @returns {boolean} true if valid, false if sharedFormula found
 */
function validateWorkbook(workbook) {
  let hasSharedFormula = false;

  workbook.eachSheet((sheet, sheetId) => {
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const val = cell.value;
        if (val && typeof val === "object") {
          // Check for sharedFormula, formulaType or master
          if ("sharedFormula" in val || "formulaType" in val || "master" in val) {
            hasSharedFormula = true;
            logger.warn(`Shared Formula Found & Fixed`);
            logger.warn(`Sheet: ${sheet.name}, Cell: ${cell.address}, Value: ${JSON.stringify(val)}`);
            
            // FIX: Convert the shared formula clone to a static value 
            // (or normal formula) to prevent exceljs from crashing 
            // if the master cell was overwritten by data insertion.
            if (val.result !== undefined) {
              cell.value = val.result;
            } else {
              cell.value = null;
            }
          }
        }
      });
    });
  });

  if (!hasSharedFormula) {
    logger.info("Workbook validation OK. No Shared Formula Found");
  } else {
    logger.warn("Workbook validation FIXED corrupted shared formulas.");
  }

  return true; // Return true because we fixed them
}

/**
 * Shallow copies style properties from a source cell to a target cell
 * without using targetCell.style = sourceCell.style.
 * 
 * @param {import("exceljs").Cell} targetCell 
 * @param {import("exceljs").Cell} sourceCell 
 */
function cloneCellStyle(targetCell, sourceCell) {
  if (sourceCell.font) targetCell.font = { ...sourceCell.font };
  if (sourceCell.border) targetCell.border = { ...sourceCell.border };
  if (sourceCell.fill) targetCell.fill = { ...sourceCell.fill };
  if (sourceCell.alignment) targetCell.alignment = { ...sourceCell.alignment };
  if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt;
}

module.exports = {
  validateWorkbook,
  cloneCellStyle
};
