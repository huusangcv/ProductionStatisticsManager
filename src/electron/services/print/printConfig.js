/**
 * printConfig.js — Per-module print configuration.
 *
 * Centralises all template-specific settings that the Print Engine needs.
 * Each module key must match the `module` field in the excel_templates table
 * (e.g. "heat-treatment") OR a semantic alias passed by the IPC caller.
 *
 * Fields:
 *   sheetIndex       {number}      1-based worksheet index to print.
 *   repeatHeaderRows {string|null} Excel row-repeat syntax, e.g. "1:5"
 *                                  → PrintTitleRows. null = no repeat.
 */

"use strict";

/** @type {Record<string, { sheetIndex: number, repeatHeaderRows: string|null }>} */
const MODULE_PRINT_CONFIGS = {
  "heat-treatment": {
    sheetIndex: 1,
    repeatHeaderRows: "1:5", // Rows 1–5 contain the report header
  },
  grinding: {
    sheetIndex: 1,
    repeatHeaderRows: "1:4",
  },
  cutting: {
    sheetIndex: 1,
    repeatHeaderRows: "1:4",
  },
};

/** Fallback when module is unknown or not provided. */
const DEFAULT_PRINT_CONFIG = {
  sheetIndex: 1,
  repeatHeaderRows: null,
};

/**
 * Returns the print config for a given module key.
 * Always returns a complete config object (never null).
 *
 * @param {string|null|undefined} module  Module key, e.g. "heat-treatment"
 * @returns {{ sheetIndex: number, repeatHeaderRows: string|null }}
 */
function getPrintConfig(module) {
  if (module && MODULE_PRINT_CONFIGS[module]) {
    return { ...MODULE_PRINT_CONFIGS[module] };
  }
  return { ...DEFAULT_PRINT_CONFIG };
}

module.exports = { getPrintConfig, MODULE_PRINT_CONFIGS, DEFAULT_PRINT_CONFIG };
