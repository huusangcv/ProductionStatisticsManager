/**
 * printConfig.js — Per-module print configuration.
 *
 * Reads template-specific print settings from the excel_templates table.
 */

"use strict";

const { getTemplate } = require("../../sqlite/excelTemplates");

/** Fallback when module is unknown or DB row is missing/incomplete. */
const DEFAULT_PRINT_CONFIG = {
  sheetName: "Sheet1",
  startColumn: "A",
  endColumn: "Z",
  repeatHeaderRows: null,
  orientation: "landscape",
  paperSize: "A4",
  fitWidth: 1,
  fitHeight: null,
  marginLeft: 1.5,
  marginRight: 1.5,
  marginTop: 1.5,
  marginBottom: 1.5,
  headerMargin: 0.8,
  footerMargin: 0.8,
};

/**
 * Returns the print config for a given module key by querying the database.
 * Falls back to DEFAULT_PRINT_CONFIG for any missing fields.
 *
 * @param {string|null|undefined} module  Module key, e.g. "heat-treatment"
 * @returns {typeof DEFAULT_PRINT_CONFIG}
 */
function getTemplatePrintConfig(module) {
  const config = { ...DEFAULT_PRINT_CONFIG };

  if (module) {
    try {
      const tmpl = getTemplate(module);
      if (tmpl) {
        if (tmpl.sheet_name) config.sheetName = tmpl.sheet_name;
        if (tmpl.print_start_column) config.startColumn = tmpl.print_start_column.toUpperCase().trim();
        if (tmpl.print_end_column) config.endColumn = tmpl.print_end_column.toUpperCase().trim();
        if (tmpl.repeat_header_rows) config.repeatHeaderRows = tmpl.repeat_header_rows.trim();
        if (tmpl.orientation) config.orientation = tmpl.orientation.toLowerCase().trim();
        if (tmpl.paper_size) config.paperSize = tmpl.paper_size.toUpperCase().trim();
        
        // fitWidth / fitHeight
        if (tmpl.fit_width !== undefined && tmpl.fit_width !== null) config.fitWidth = tmpl.fit_width;
        if (tmpl.fit_height !== undefined && tmpl.fit_height !== null) config.fitHeight = tmpl.fit_height;
        
        // Margins
        if (tmpl.margin_left_cm !== undefined && tmpl.margin_left_cm !== null) config.marginLeft = tmpl.margin_left_cm;
        if (tmpl.margin_right_cm !== undefined && tmpl.margin_right_cm !== null) config.marginRight = tmpl.margin_right_cm;
        if (tmpl.margin_top_cm !== undefined && tmpl.margin_top_cm !== null) config.marginTop = tmpl.margin_top_cm;
        if (tmpl.margin_bottom_cm !== undefined && tmpl.margin_bottom_cm !== null) config.marginBottom = tmpl.margin_bottom_cm;
        if (tmpl.header_margin_cm !== undefined && tmpl.header_margin_cm !== null) config.headerMargin = tmpl.header_margin_cm;
        if (tmpl.footer_margin_cm !== undefined && tmpl.footer_margin_cm !== null) config.footerMargin = tmpl.footer_margin_cm;
      }
    } catch (dbErr) {
      console.warn("[printConfig] Could not read template config from DB:", dbErr.message);
    }
  }

  return config;
}

module.exports = { getTemplatePrintConfig, DEFAULT_PRINT_CONFIG };
