/**
 * heatTreatmentExportService.js — Refactored Export Service for Heat Treatment.
 * Orchestrates: Process Rows -> Calculate Summary -> Generate Excel -> Write File -> Save Summary -> Return Success.
 */

const fs = require("fs");
const Database = require("better-sqlite3");
const { getTemplate } = require("../sqlite/excelTemplates");
const { getDatabasePath } = require("../sqlite/paths");
const { applyHeatTreatmentRules, getHeatTreatmentPeriod } = require("../heatTreatment/heatTreatmentRules");
const { resolveExportPath } = require("../heatTreatment/exportPaths");
const { generateHeatTreatmentExcel } = require("../heatTreatment/excelEngine");

/**
 * Generates the Heat Treatment Excel export and auto-saves the production summary upon successful file write.
 * @param {object} params
 * @param {string} params.reportDate Date of the report in YYYY-MM-DD format
 * @returns {Promise<object>}
 */
async function generateExport({ reportDate }) {
  const startTime = Date.now();
  try {
    // 1. Load template metadata
    const tmpl = getTemplate("heat-treatment");
    if (!tmpl) {
      return {
        ok: false,
        message: "Chưa cấu hình template. Vui lòng upload template trong Cài đặt.",
      };
    }
    if (!fs.existsSync(tmpl.template_path)) {
      return {
        ok: false,
        message: "File template không tồn tại. Vui lòng upload lại.",
      };
    }

    // 2. Load grinding data for date
    const db = new Database(getDatabasePath());
    let grindingRows;
    try {
      grindingRows = db
        .prepare(`SELECT * FROM grinding_production WHERE report_date = ? ORDER BY id ASC`)
        .all(reportDate);
    } finally {
      db.close();
    }

    if (!grindingRows || grindingRows.length === 0) {
      return {
        ok: false,
        message: `Không có dữ liệu Mài cho ngày ${reportDate}.`,
      };
    }

    // 3. Process Rows (Apply business rules & perform single calculation of weights in memory)
    const result = applyHeatTreatmentRules(grindingRows);

    // 4. Calculate Summary (reusing values from export process without re-reading or parsing Excel)
    const periodInfo = getHeatTreatmentPeriod(reportDate);
    const summary = {
      reportDate: reportDate,
      periodYear: periodInfo.periodYear,
      periodMonth: periodInfo.periodMonth,
      wcbWeight: result.wcbWeight,
      otherWeight: result.otherWeight,
      totalWeight: result.totalWeight,
      exportedFile: "",
    };

    // 5. Resolve output path
    const { filePath, folderPath, fileName } = resolveExportPath(reportDate);
    summary.exportedFile = filePath;

    // 6. Generate Excel & Write File (engine only writes file, no DB access)
    const genResult = await generateHeatTreatmentExcel({
      templatePath: tmpl.template_path,
      outputPath: filePath,
      rows: result.rows,
      sheetName: tmpl.sheet_name,
      startRow: 6,
      reportDate,
    });

    if (!genResult.ok) return genResult;

    // 7. Auto-save summary to heat_treatment_summary (upsert by period — one record per kỳ)
    const heatTreatmentSummaryService = require("./heatTreatmentSummaryService");
    const saveRes = heatTreatmentSummaryService.upsertByPeriod(summary);
    if (!saveRes || !saveRes.ok) {
      // Log warning but don't fail the export — file was already written successfully
      const logger = require("../logger");
      logger.warn("Heat Treatment Export: Failed to save summary to DB", { message: saveRes?.message });
    } else {
      const logger = require("../logger");
      const pStr = `${summary.periodYear}-${String(summary.periodMonth).padStart(2, "0")}`;
      logger.info(
        `Heat Treatment Summary Saved\nReport Date: ${summary.reportDate}\nPeriod: ${pStr}\nWCB: ${summary.wcbWeight} Kg\nOther: ${summary.otherWeight} Kg\nTotal: ${summary.totalWeight} Kg\nExport File: ${summary.exportedFile}\nAction: ${saveRes.action}`
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      ok: true,
      filePath,
      folderPath,
      fileName,
      totalRows: result.totalRows,
      xlnCount: result.xlnCount,
      noCount: result.noCount,
      totalCompletedQty: result.totalCompletedQty,
      totalScrapQty: result.totalScrapQty,
      totalWeight: result.totalWeight,
      durationMs,
    };
  } catch (error) {
    return { ok: false, message: "Lỗi xuất Excel: " + error.message };
  }
}

module.exports = {
  generateExport,
};
