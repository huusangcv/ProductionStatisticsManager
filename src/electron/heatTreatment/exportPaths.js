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

  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    throw new Error(`Định dạng ngày không hợp lệ (yêu cầu DD/MM/YYYY): ${dateStr}`);
  }

  const dd = parts[0];
  const mm = parts[1];
  const yyyy = parts[2];

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

  // Try the base name first
  const primary = path.join(folderPath, `${baseName}.xlsx`);
  if (!fs.existsSync(primary)) {
    return { filePath: primary, folderPath, fileName: `${baseName}.xlsx` };
  }

  // Increment suffix until a free name is found
  for (let i = 1; i <= 99; i++) {
    const suffix   = String(i).padStart(2, "0");
    const fileName = `${baseName}_${suffix}.xlsx`;
    const filePath = path.join(folderPath, fileName);
    if (!fs.existsSync(filePath)) {
      return { filePath, folderPath, fileName };
    }
  }

  // Fallback: timestamp suffix (should never happen in practice)
  const ts       = Date.now();
  const fileName = `${baseName}_${ts}.xlsx`;
  return { filePath: path.join(folderPath, fileName), folderPath, fileName };
}

module.exports = { resolveExportPath, ensureExportFolder };
