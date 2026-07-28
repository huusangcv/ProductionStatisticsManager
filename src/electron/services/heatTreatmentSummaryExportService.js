/**
 * heatTreatmentSummaryExportService.js — Service tạo file tổng hợp kỳ Hàng Xử lý Nhiệt.
 *
 * Orchestrates:
 *   1. Load template "heat-treatment-summary"
 *   2. Get all daily records for the period from heat_treatment_summary
 *   3. Build a map of date → weights
 *   4. Call summaryExcelEngine to generate Excel
 *   5. Return result with filePath
 */

const fs = require("fs");
const path = require("path");
const { getTemplate } = require("../sqlite/excelTemplates");
const { getAppDataRoot } = require("../sqlite/paths");
const { getSummaryByPeriod } = require("./heatTreatmentSummaryService");
const { generateSummaryExcel } = require("../heatTreatment/summaryExcelEngine");

// ── resolveOutputPath ─────────────────────────────────────────────────────────

/**
 * Resolves the output path for the period summary file.
 * Structure: <appDataRoot>/exports/HeatTreatmentSummary/YYYY/MM/TongKLXuLyNhiet_YYYYMM.xlsx
 */
function resolveSummaryOutputPath(periodYear, periodMonth) {
  const mm = String(periodMonth).padStart(2, "0");
  const folderPath = path.join(
    getAppDataRoot(),
    "exports",
    "HeatTreatmentSummary",
    String(periodYear),
    mm
  );

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `TongKLXuLyNhiet_${periodYear}${mm}.xlsx`;
  const filePath = path.join(folderPath, fileName);

  return { filePath, folderPath, fileName };
}

// ── generatePeriodSummaryExport ───────────────────────────────────────────────

/**
 * Generates the period summary Excel file for a given kỳ xử lý nhiệt.
 * @param {object} params
 * @param {number} params.periodYear
 * @param {number} params.periodMonth  1-based (e.g. 7 = tháng 7)
 * @returns {Promise<object>}
 */
async function generatePeriodSummaryExport({ periodYear, periodMonth }) {
  try {
    // 1. Load template
    const tmpl = getTemplate("heat-treatment-summary");
    if (!tmpl) {
      return {
        ok: false,
        message: "Chưa cấu hình template tổng hợp. Vui lòng upload template trong Cài đặt.",
      };
    }
    if (!fs.existsSync(tmpl.template_path)) {
      return {
        ok: false,
        message: "File template tổng hợp không tồn tại. Vui lòng upload lại.",
      };
    }

    // 2. Get all daily records for this period from heat_treatment_summary
    const records = getSummaryByPeriod(periodYear, periodMonth);

    // 3. Build a Map: report_date (YYYY-MM-DD) → record
    const dataByDate = new Map();
    for (const rec of records) {
      dataByDate.set(rec.report_date, rec);
    }

    // 4. Resolve output path
    const { filePath, folderPath, fileName } = resolveSummaryOutputPath(periodYear, periodMonth);

    // 5. Generate Excel
    const genResult = await generateSummaryExcel({
      templatePath: tmpl.template_path,
      outputPath: filePath,
      periodYear,
      periodMonth,
      dataByDate,
    });

    if (!genResult.ok) return genResult;

    const mm = String(periodMonth).padStart(2, "0");
    const logger = require("../logger");
    logger.info(
      `Heat Treatment Period Summary Generated\nPeriod: ${periodYear}-${mm}\nTotal records: ${records.length}\nOutput: ${filePath}`
    );

    return {
      ok: true,
      filePath,
      folderPath,
      fileName,
      periodYear,
      periodMonth,
      recordCount: records.length,
    };
  } catch (error) {
    return { ok: false, message: "Lỗi tạo file tổng hợp kỳ: " + error.message };
  }
}

module.exports = {
  generatePeriodSummaryExport,
};
