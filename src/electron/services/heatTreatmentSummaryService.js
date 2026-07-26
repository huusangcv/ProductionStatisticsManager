/**
 * heatTreatmentSummaryService.js — Service layer for Heat Treatment export summary.
 * Validates summary objects, calculates total weight if necessary, and calls repository.
 * Renderer must never access SQLite directly.
 */

const heatTreatmentSummaryRepository = require("../sqlite/heatTreatmentSummary");

/**
 * Validates and saves an export summary to the database.
 * @param {object} summary
 * @returns {object} { ok: boolean, action?: string, id?: number, summary?: object, message?: string }
 */
function saveExportSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return { ok: false, message: "Dữ liệu summary không hợp lệ." };
  }

  if (!summary.reportDate) {
    return { ok: false, message: "Thiếu ngày báo cáo (reportDate)." };
  }

  if (!summary.exportedFile) {
    return { ok: false, message: "Thiếu đường dẫn file xuất (exportedFile)." };
  }

  const wcbWeight = Number(summary.wcbWeight) || 0;
  const otherWeight = Number(summary.otherWeight) || 0;
  let totalWeight =
    summary.totalWeight !== undefined && summary.totalWeight !== null
      ? Number(summary.totalWeight)
      : Number((wcbWeight + otherWeight).toFixed(2));

  if (isNaN(totalWeight)) {
    totalWeight = Number((wcbWeight + otherWeight).toFixed(2));
  }

  const now = new Date();
  const validatedSummary = {
    reportDate: String(summary.reportDate),
    periodYear: Number(summary.periodYear) || now.getFullYear(),
    periodMonth: Number(summary.periodMonth) || now.getMonth() + 1,
    wcbWeight: Number(wcbWeight.toFixed(2)),
    otherWeight: Number(otherWeight.toFixed(2)),
    totalWeight: Number(totalWeight.toFixed(2)),
    exportedFile: String(summary.exportedFile),
  };

  const res = heatTreatmentSummaryRepository.saveExportSummary(validatedSummary);
  if (!res || !res.ok) {
    return {
      ok: false,
      message: res?.message || "Lỗi lưu summary vào database.",
    };
  }

  return {
    ok: true,
    action: res.action,
    id: res.id,
    summary: res.summary || validatedSummary,
  };
}

/**
 * Upserts a summary. Alias for saveExportSummary.
 * @param {object} summary 
 * @returns {object}
 */
function upsert(summary) {
  return saveExportSummary(summary);
}

module.exports = {
  saveExportSummary,
  upsert,
};
