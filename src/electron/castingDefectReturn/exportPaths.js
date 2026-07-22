/**
 * exportPaths.js — Resolves and manages export file paths for Casting Defect Return.
 *
 * Export structure:
 *   <userData>/exports/BaoPhe/YYYY/MM/P-029-06.01_DD.MM.YYYY铸造车间不良品回炉申请单A3.xlsx
 */

const fs   = require("fs");
const path = require("path");
const { getAppDataRoot } = require("../sqlite/paths");

function ensureExportFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

/**
 * Returns the export file path for a given date string.
 *
 * @param {string} dateStr  Date string in "YYYY-MM-DD" or "DD/MM/YYYY" format
 * @returns {{ filePath: string, folderPath: string, fileName: string }}
 */
function resolveExportPath(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    throw new Error(`Ngày không hợp lệ: ${dateStr}`);
  }

  let dd, mm, yyyy;
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) throw new Error(`Định dạng ngày không hợp lệ: ${dateStr}`);
    yyyy = parts[0];
    mm   = parts[1];
    dd   = parts[2];
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) throw new Error(`Định dạng ngày không hợp lệ: ${dateStr}`);
    dd   = parts[0];
    mm   = parts[1];
    yyyy = parts[2];
  } else {
    throw new Error(`Định dạng ngày không hợp lệ: ${dateStr}`);
  }

  const folderPath = path.join(getAppDataRoot(), "exports", "BaoPhe", yyyy, mm);
  ensureExportFolder(folderPath);

  const fileName = `P-029-06.01_${dd}.${mm}.${yyyy}铸造车间不良品回炉申请单A3.xlsx`;
  const filePath = path.join(folderPath, fileName);

  return { filePath, folderPath, fileName };
}

module.exports = { resolveExportPath, ensureExportFolder };
