/**
 * grinding.js — Thin wrapper around productionBase for grinding_production.
 *
 * The column spec is kept in-sync with grindingColumns.js (CommonJS copy
 * since grindingColumns.js is an ES Module used by the renderer).
 */

const { createProductionModule } = require("./productionBase");

const GRINDING_COLUMN_SPEC = [
  { databaseField: "report_date",           type: "text"    },
  { databaseField: "customer_order_number", type: "text"    },
  { databaseField: "work_order_number",     type: "text"    },
  { databaseField: "material_code",         type: "text"    },
  { databaseField: "item_name",             type: "text"    },
  { databaseField: "specification",         type: "text"    },
  { databaseField: "completed_quantity",    type: "integer" },
  { databaseField: "representative_code",   type: "text"    },
  { databaseField: "scrap_quantity",        type: "integer" },
  { databaseField: "unit_weight",           type: "float"   },
  { databaseField: "completed_weight",      type: "float"   },
  { databaseField: "grinding_price",        type: "float"   },
  { databaseField: "total_price",           type: "float"   },
];

const grindingDAO = createProductionModule("grinding_production", GRINDING_COLUMN_SPEC, "GRIND");

module.exports = {
  ensureGrindingTable:            grindingDAO.ensureTable,
  getAllGrindingData:              grindingDAO.getAll,
  getGrindingDataByDateRange:      grindingDAO.getByDateRange,
  getGrindingDataById:             grindingDAO.getById,
  updateGrindingData:              grindingDAO.update,
  deleteGrindingDataById:          grindingDAO.deleteById,
  checkGrindingDataExistsByDate:  grindingDAO.checkExistsByDate,
  deleteGrindingDataByDate:       grindingDAO.deleteByDate,
  importGrindingData:             grindingDAO.importData,
};
