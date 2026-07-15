/**
 * heatTreatmentRules.js — Business logic engine for Heat Treatment.
 *
 * This module converts raw grinding_production rows into Heat Treatment
 * template output rows. ALL values are calculated here in JavaScript —
 * no Excel formulas are written to the workbook.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CUSTOMIZATION GUIDE
 * ─────────────────────────────────────────────────────────────────────────────
 * The company's statistician should adjust the field mapping in `mapRow()`
 * and the classification logic in `classifyRow()` to match the actual
 * Heat Treatment Excel template columns.
 *
 * Common Heat Treatment classifications:
 *   - XLN (Xử lý nhiệt — Heat Treated):  items that went through heat treatment
 *   - NO  (Không nhiệt luyện — Not HT):  items excluded from heat treatment
 *
 * The current implementation classifies by item_name keyword.
 * Replace this with the actual business rule as needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Determines the Heat Treatment type based on business rules.
 * Translated directly from the company's Excel formula.
 *
 * @param {string} productName   (Excel Column E)
 * @param {string} specification (Excel Column F)
 * @returns {"XLN"|"NO"}
 */
function getHeatTreatmentType(productName, specification) {
  const name = String(productName || "").toUpperCase();
  const spec = String(specification || "").toUpperCase();

  if (name.includes("OM") || spec.includes("M35")) return "NO";

  if (name.includes("热处理") || name.includes("114") || name.includes("试棒毛坯") || name.includes("LADISH")) {
    return "XLN";
  }

  if (spec.startsWith("DN") || spec.startsWith("NPS")) {
    return "XLN";
  }

  return "NO";
}

function getMaterialType(specification) {
  if (!specification) return "";
  const spec = String(specification).toUpperCase();
  
  if (spec.includes("304")) return "304";
  if (spec.includes("316")) return "316";
  if (spec.includes("CF8M")) return "316";
  if (spec.includes("WCB")) return "WCB";
  if (spec.includes("CD3MN")) return "CD3MN";
  if (spec.includes("CN7M")) return "CN7M";
  if (spec.includes("M35")) return "M35";
  if (spec.includes("CF3M")) return "CF3M";
  if (spec.includes("CD3MWCUN")) return "CD3MWCuN";
  if (spec.includes("CW12MW")) return "CW12MW";
  if (spec.includes("CF8")) return "304";
  
  return "";
}

// ── classifyRow ───────────────────────────────────────────────────────────────

/**
 * Returns "XLN" or "NO" for a grinding row.
 * @param {object} row  A grinding_production row from SQLite
 * @returns {"XLN"|"NO"}
 */
function classifyRow(row) {
  return getHeatTreatmentType(row.item_name, row.specification);
}

// ── mapRow ────────────────────────────────────────────────────────────────────

/**
 * Maps one grinding_production SQLite row to one Heat Treatment output row.
 *
 * Output row fields correspond directly to template columns (by position).
 * Adjust the field names/formulas to match the actual template.
 *
 * TODO: Update column mapping to match the company's Heat Treatment template.
 *
 * @param {object} row         SQLite grinding_production row
 * @param {number} rowIndex    0-based index within this date's data (for row numbering)
 * @returns {object}           Output row ready to be written to Excel
 */
function mapRow(row, rowIndex) {
  const classification = classifyRow(row);
  const materialType = getMaterialType(row.specification);

  // Total weight produced (unit_weight × completed_quantity)
  const totalWeight = (row.unit_weight || 0) * (row.completed_quantity || 0);

  return {
    stt:                  rowIndex + 1,                     // STT (Row number)
    report_date:          row.report_date,                  // Ngày
    work_order_number:    row.work_order_number,            // Mã công đơn
    customer_order_number: row.customer_order_number,      // Đơn đặt hàng KH
    material_code:        row.material_code,                // Mã liệu
    item_name:            row.item_name,                    // Tên hàng
    specification:        row.specification,                // Quy cách
    employee_name:        row.employee_name,                // Nhân viên
    completed_quantity:   row.completed_quantity || 0,      // SL hoàn thành
    scrap_quantity:       row.scrap_quantity || 0,          // SL báo phế
    unit_weight:          row.unit_weight || 0,             // Đơn vị trọng lượng
    completed_weight:     row.completed_weight || totalWeight, // TL hoàn thành
    classification,                                         // XLN / NO
    material_type:        materialType,                     // K
  };
}

// ── applyHeatTreatmentRules ───────────────────────────────────────────────────

/**
 * Main entry point. Processes a list of grinding_production rows for one date.
 *
 * @param {object[]} grindingRows  Raw rows from grinding_production SQLite table
 * @returns {{
 *   rows: object[],          — Mapped output rows (one per grinding row)
 *   xlnCount: number,        — Number of XLN rows
 *   noCount: number,         — Number of NO rows
 *   totalRows: number,
 *   totalCompletedQty: number,
 *   totalScrapQty: number,
 *   totalWeight: number,
 * }}
 */
function applyHeatTreatmentRules(grindingRows) {
  if (!Array.isArray(grindingRows) || grindingRows.length === 0) {
    return {
      rows: [],
      xlnCount: 0,
      noCount: 0,
      totalRows: 0,
      totalCompletedQty: 0,
      totalScrapQty: 0,
      totalWeight: 0,
    };
  }

  // Step 1: Only rows with completedQuantity > 0
  const withQty = grindingRows.filter(
    (row) => Number(row.completed_quantity) > 0
  );

  // Step 2: Classify all rows first so we can capture noCount for stats
  const allMapped = withQty.map((row) => ({
    raw: row,
    classification: classifyRow(row),
  }));

  const noCount = allMapped.filter((r) => r.classification === "NO").length;

  // Step 3: Keep only XLN rows, then map with regenerated STT from 1..N
  const xlnRows = allMapped
    .filter((r) => r.classification === "XLN")
    .map((r, idx) => mapRow(r.raw, idx)); // idx is 0-based → STT = idx + 1

  const xlnCount = xlnRows.length;

  const totalCompletedQty = xlnRows.reduce((sum, r) => sum + (r.completed_quantity || 0), 0);
  const totalScrapQty     = xlnRows.reduce((sum, r) => sum + (r.scrap_quantity || 0), 0);
  const totalWeight       = xlnRows.reduce((sum, r) => sum + (r.completed_weight || 0), 0);

  return {
    rows: xlnRows,
    xlnCount,
    noCount,
    totalRows: xlnRows.length,
    totalCompletedQty,
    totalScrapQty,
    totalWeight: Math.round(totalWeight * 1000) / 1000,
  };
}

module.exports = { applyHeatTreatmentRules, classifyRow, mapRow, getHeatTreatmentType, getMaterialType };
