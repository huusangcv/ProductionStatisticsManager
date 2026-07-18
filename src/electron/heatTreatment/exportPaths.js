/**
 * exportPaths.js — Resolves and manages export file paths for Heat Treatment.
 *
 * Export structure:
 *   <userData>/exports/HeatTreatment/YYYY/MM/HT_YYYYMMDD.xlsx
 *
 * If the file already exists, a numeric suffix is appended:
 *   HT_YYYYMMDD_01.xlsx, HT_YYYYMMDD_02.xlsx, ...
 */

const fs   = require("fs");
const path = require("path");
const { getAppDataRoot } = require("../sqlite/paths");

// ── ensureExportFolder ────────────────────────────────────────────────────────

/**
 * Creates the folder (and all parents) if it does not already exist.
 * @param {string} folderPath
 */
function ensureExportFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

// ── resolveExportPath ─────────────────────────────────────────────────────────

/**
 * Returns the next available export file path for a given date string.
 *
 * @param {string} dateStr  Date string in "DD/MM/YYYY" format
 * @returns {{ filePath: string, folderPath: string, fileName: string }}
 */
function resolveExportPath(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    throw new Error(`Ngày không hợp lệ: ${dateStr}`);
  }

  let dd, mm, yyyy;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) {
      throw new Error(`Định dạng ngày không hợp lệ (yêu cầu DD/MM/YYYY hoặc YYYY-MM-DD): ${dateStr}`);
    }
    dd = parts[0];
    mm = parts[1];
    yyyy = parts[2];
  } else if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      throw new Error(`Định dạng ngày không hợp lệ (yêu cầu DD/MM/YYYY hoặc YYYY-MM-DD): ${dateStr}`);
    }
    yyyy = parts[0];
    mm = parts[1];
    dd = parts[2];
  } else {
    throw new Error(`Định dạng ngày không hợp lệ (yêu cầu DD/MM/YYYY hoặc YYYY-MM-DD): ${dateStr}`);
  }

  if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) {
    throw new Error(`Ngày chứa giá trị không hợp lệ: ${dateStr}`);
  }

  const folderPath = path.join(
    getAppDataRoot(),
    "exports",
    "HeatTreatment",
    yyyy,
    mm
  );

  ensureExportFolder(folderPath);

  const baseName = `HangXuLyNhiet_${yyyy}${mm}${dd}`;
  const fileName = `${baseName}.xlsx`;
  const filePath = path.join(folderPath, fileName);

  // Always use the base name, overwrite existing file
  return { filePath, folderPath, fileName };
}

module.exports = { resolveExportPath, ensureExportFolder };
