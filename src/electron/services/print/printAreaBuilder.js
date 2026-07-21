/**
 * printAreaBuilder.js — Pure helper for building Excel Print Area strings.
 *
 * This module has NO side effects and NO external dependencies.
 * It can be unit-tested in isolation.
 *
 * Excel column naming:
 *   A=1, B=2, …, Z=26, AA=27, AB=28, …, XFD=16384
 */

"use strict";

// ── columnLetterToIndex ────────────────────────────────────────────────────────

/**
 * Converts an Excel column letter string to a 1-based column index.
 * e.g. "A"→1, "Z"→26, "AA"→27, "XFD"→16384
 *
 * @param {string} letter  Column letters (case-insensitive)
 * @returns {number}  1-based column index, or 0 if invalid
 */
function columnLetterToIndex(letter) {
  if (!letter || typeof letter !== "string") return 0;
  const upper = letter.toUpperCase().trim();
  if (!/^[A-Z]{1,3}$/.test(upper)) return 0;
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index;
}

// ── columnIndexToLetter ────────────────────────────────────────────────────────

/**
 * Converts a 1-based column index to an Excel column letter string.
 * e.g. 1→"A", 26→"Z", 27→"AA", 16384→"XFD"
 *
 * @param {number} index  1-based column index
 * @returns {string}  Column letters
 */
function columnIndexToLetter(index) {
  if (!index || index < 1) return "A";
  let result = "";
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ── validateColumnRange ────────────────────────────────────────────────────────

/**
 * Validates that startColumn <= endColumn.
 *
 * @param {string} startColumn
 * @param {string} endColumn
 * @returns {{ valid: boolean, message?: string }}
 */
function validateColumnRange(startColumn, endColumn) {
  const startIdx = columnLetterToIndex(startColumn);
  const endIdx   = columnLetterToIndex(endColumn);
  if (startIdx === 0) return { valid: false, message: `Cột bắt đầu không hợp lệ: "${startColumn}"` };
  if (endIdx   === 0) return { valid: false, message: `Cột kết thúc không hợp lệ: "${endColumn}"` };
  if (startIdx > endIdx) {
    return {
      valid: false,
      message: `Cột bắt đầu (${startColumn}) phải nhỏ hơn hoặc bằng cột kết thúc (${endColumn})`,
    };
  }
  return { valid: true };
}

// ── buildPrintArea ─────────────────────────────────────────────────────────────

/**
 * Builds an Excel Print Area string from configured columns and detected last row.
 *
 * @param {object} options
 * @param {string} options.startColumn  e.g. "A"
 * @param {string} options.endColumn    e.g. "W"
 * @param {number} options.lastRow      e.g. 138
 * @returns {string}  e.g. "A1:W138"
 */
function buildPrintArea({ startColumn, endColumn, lastRow }) {
  const start = (startColumn || "A").toUpperCase().trim();
  const end   = (endColumn   || "Z").toUpperCase().trim();
  const row   = Math.max(1, Math.floor(lastRow) || 1);
  return `${start}1:${end}${row}`;
}

// ── generateColumnList ─────────────────────────────────────────────────────────

/**
 * Generates an array of Excel column letters from "A" up to maxColumns.
 * Used by the UI combobox to populate the column selector.
 *
 * @param {number} [maxColumns=702]  Default covers A–ZZ (702 columns)
 * @returns {string[]}
 */
function generateColumnList(maxColumns = 702) {
  const list = [];
  for (let i = 1; i <= maxColumns; i++) {
    list.push(columnIndexToLetter(i));
  }
  return list;
}

module.exports = {
  columnLetterToIndex,
  columnIndexToLetter,
  validateColumnRange,
  buildPrintArea,
  generateColumnList,
};
