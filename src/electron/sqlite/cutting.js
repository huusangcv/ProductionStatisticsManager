/**
 * cutting.js — Thin wrapper around productionBase for cutting_production.
 *
 * Note: Cutting does NOT have scrap_quantity — this is the only difference
 * from grinding.js in terms of schema.
 */

const { createProductionModule } = require("./productionBase");

const CUTTING_COLUMN_SPEC = [
  { databaseField: "report_date",           type: "text"    },
  { databaseField: "customer_order_number", type: "text"    },
  { databaseField: "work_order_number",     type: "text"    },
  { databaseField: "material_code",         type: "text"    },
  { databaseField: "item_name",             type: "text"    },
  { databaseField: "specification",         type: "text"    },
  { databaseField: "completed_quantity",    type: "integer" },
  { databaseField: "employee_name",         type: "text"    },
  { databaseField: "unit_weight",           type: "float"   },
  { databaseField: "completed_weight",      type: "float"   },
];

const cuttingDAO = createProductionModule("cutting_production", CUTTING_COLUMN_SPEC);

module.exports = {
  ensureCuttingTable:            cuttingDAO.ensureTable,
  getAllCuttingData:              cuttingDAO.getAll,
  getCuttingDataById:             cuttingDAO.getById,
  updateCuttingData:              cuttingDAO.update,
  deleteCuttingDataById:          cuttingDAO.deleteById,
  checkCuttingDataExistsByDate:  cuttingDAO.checkExistsByDate,
  deleteCuttingDataByDate:       cuttingDAO.deleteByDate,
  importCuttingData:             cuttingDAO.importData,
};
