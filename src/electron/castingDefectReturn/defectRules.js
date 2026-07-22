/**
 * defectRules.js — Queries grinding_production and maps to Excel rows
 * for the Casting Defect Return report (P-029-06.01 A3).
 *
 * Mapping:
 *   work_order_number  → Col B
 *   item_name          → Col C
 *   specification      → Col D
 *   scrap_quantity     → Col V (其他/Khác — dump all scrap into "Other" column)
 *   unit_weight        → Col Y
 *
 * Only rows with scrap_quantity > 0 are included.
 * Max 34 rows (fixed template size).
 */

const Database = require("better-sqlite3");
const { getDatabasePath } = require("../sqlite/paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Gets grinding_production rows with scrap for a given report_date.
 *
 * @param {string} reportDate  "YYYY-MM-DD" format
 * @returns {{ rows: object[], total: number }}
 */
function getDefectRowsByDate(reportDate) {
  const db = openDatabase();
  try {
    const all = db.prepare(`
      SELECT
        work_order_number,
        item_name,
        specification,
        scrap_quantity,
        unit_weight,
        completed_quantity
      FROM grinding_production
      WHERE report_date = ?
        AND scrap_quantity > 0
        AND (completed_quantity IS NULL OR completed_quantity = 0)
      ORDER BY imported_at ASC
    `).all(reportDate);

    return { rows: all, total: all.length };
  } finally {
    db.close();
  }
}

const KNOWN_MATERIALS = [
  "CF3M", "CF8M", "WCB", "CW12MW", "CX2MW", "CD3MN", "CD3MWCuN", "CN7M", 
  "LCC", "M35", "CF8", "316", "304"
];

function getScrapMaterial(specification) {
  if (!specification) return "";
  const specUpper = specification.toUpperCase();
  // Sort by length descending to match 'CF8M' before 'CF8'
  const sortedMaterials = [...KNOWN_MATERIALS].sort((a, b) => b.length - a.length);
  for (const mat of sortedMaterials) {
    if (specUpper.includes(mat.toUpperCase())) {
      return mat;
    }
  }
  return "";
}

function getScrapType(productName, specification) {
  const name = (productName || "").toUpperCase();
  const spec = (specification || "").toUpperCase();

  if (name.includes("OM-06")) return "ỐNG";

  if (spec.startsWith("DN") || spec.startsWith("NPS") || name.includes("LADISH")) {
    return "VAN";
  }

  return "ỐNG";
}

/**
 * Transforms a DB row into the Excel column map.
 * @param {object} row
 * @returns {object}
 */
function mapRowToExcel(row) {
  const material = getScrapMaterial(row.specification);
  const type = getScrapType(row.item_name, row.specification);
  const scrapQty = row.scrap_quantity || 0;
  const unitWeight = row.unit_weight || 0;
  const totalWeight = scrapQty * unitWeight;

  return {
    B: row.work_order_number || "",
    C: row.item_name         || "",
    D: row.specification     || "",
    E: material,
    F: material,
    V: scrapQty,
    W: scrapQty,
    Y: unitWeight,
    Z: type,
    AA: totalWeight,
    AB: material,
  };
}

module.exports = { getDefectRowsByDate, mapRowToExcel, getScrapMaterial, getScrapType };
