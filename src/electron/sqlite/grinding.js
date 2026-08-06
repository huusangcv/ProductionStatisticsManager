/**
 * grinding.js — Thin wrapper around productionBase for grinding_production.
 *
 * The column spec is kept in-sync with grindingColumns.js (CommonJS copy
 * since grindingColumns.js is an ES Module used by the renderer).
 */

const { createProductionModule, enrichWithEmployeeData } = require("./productionBase");
const { openDatabase } = require("./connection");
const { getDatabasePath } = require("./paths");



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

/**
 * Xóa toàn bộ dữ liệu sản lượng mài theo ngày, bao gồm cascade thủ công sang
 * bảng bao_phe_duc_dong (vì FOREIGN KEY không có ON DELETE CASCADE).
 *
 * Thứ tự xóa:
 *   1. Lấy danh sách grinding_production.id của ngày đó
 *   2. Xóa các dòng trong bao_phe_duc_dong tham chiếu những id trên
 *   3. Xóa các bao_phe_duc header nào không còn dòng nào (tránh rác)
 *   4. Xóa grinding_production theo ngày
 *
 * @param {string} date - "YYYY-MM-DD"
 */
function deleteGrindingDataByDate(date) {
  const db = openDatabase();
  try {
    db.transaction(() => {
      // 1. Lấy id của các dòng sản lượng mài ngày đó
      const grindingIds = db
        .prepare(`SELECT id FROM grinding_production WHERE report_date = ?`)
        .all(date)
        .map((r) => r.id);

      if (grindingIds.length > 0) {
        const placeholders = grindingIds.map(() => "?").join(", ");

        // 2. Xóa các dòng báo phế liên quan
        db.prepare(
          `DELETE FROM bao_phe_duc_dong WHERE grinding_production_id IN (${placeholders})`
        ).run(...grindingIds);

        // 3. Cleanup bao_phe_duc header nếu không còn dòng nào
        db.prepare(`
          DELETE FROM bao_phe_duc
          WHERE id NOT IN (SELECT DISTINCT bao_phe_duc_id FROM bao_phe_duc_dong)
        `).run();
      }

      // 4. Xóa dữ liệu mài theo ngày
      db.prepare(`DELETE FROM grinding_production WHERE report_date = ?`).run(date);
    })();
  } finally {
    db.close();
  }
}

function getDefectsByDate(date) {
  const db = openDatabase();
  try {
    const rows = db
      .prepare(`SELECT * FROM grinding_production WHERE completed_quantity = 0 AND report_date = ?`)
      .all(date);
    return enrichWithEmployeeData(db, rows, "GRIND");
  } catch (error) {
    console.error("Error in getDefectsByDate:", error);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Lấy tất cả các dòng phế (completed_quantity = 0) trong ngày để hiển thị
 * trên grid nhập liệu Báo Phế. Kết quả giống getDefectsByDate nhưng trả về
 * thêm trường cần thiết cho grid (work_order_number, item_name, specification,
 * unit_weight, scrap_quantity).
 *
 * @param {string} date - "YYYY-MM-DD"
 * @returns {object[]}
 */
function getAllDefectCandidatesByDate(date) {
  const db = openDatabase();
  try {
    const rows = db
      .prepare(`
        SELECT
          id,
          work_order_number,
          item_name,
          specification,
          unit_weight,
          scrap_quantity,
          completed_quantity,
          report_date
        FROM grinding_production
        WHERE completed_quantity = 0
          AND report_date = ?
        ORDER BY imported_at ASC
      `)
      .all(date);
    return rows;
  } catch (error) {
    console.error("Error in getAllDefectCandidatesByDate:", error);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Tóm tắt số liệu phế trong ngày cho băng đối soát:
 * - totalRows: số dòng có completed_quantity = 0
 * - totalScrap: tổng scrap_quantity của các dòng đó
 *
 * @param {string} date - "YYYY-MM-DD"
 * @returns {{ totalRows: number, totalScrap: number }}
 */
function getScrapSummaryByDate(date) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(`
        SELECT
          COUNT(*) AS totalRows,
          COALESCE(SUM(scrap_quantity), 0) AS totalScrap
        FROM grinding_production
        WHERE completed_quantity = 0
          AND report_date = ?
      `)
      .get(date);
    return result || { totalRows: 0, totalScrap: 0 };
  } catch (error) {
    console.error("Error in getScrapSummaryByDate:", error);
    return { totalRows: 0, totalScrap: 0 };
  } finally {
    db.close();
  }
}

/**
 * Lấy ngày gần nhất có dữ liệu phế (completed_quantity = 0)
 */
function getLatestDefectDate() {
  const db = openDatabase();
  try {
    const result = db.prepare(`
      SELECT MAX(report_date) AS maxDate
      FROM grinding_production
      WHERE completed_quantity = 0
    `).get();
    return result && result.maxDate ? result.maxDate : null;
  } catch (error) {
    console.error("Error in getLatestDefectDate:", error);
    return null;
  } finally {
    db.close();
  }
}

module.exports = {
  ensureGrindingTable:            grindingDAO.ensureTable,
  getAllGrindingData:              grindingDAO.getAll,
  getGrindingDataByDateRange:      grindingDAO.getByDateRange,
  getGrindingDataById:             grindingDAO.getById,
  updateGrindingData:              grindingDAO.update,
  deleteGrindingDataById:          grindingDAO.deleteById,
  checkGrindingDataExistsByDate:  grindingDAO.checkExistsByDate,
  deleteGrindingDataByDate,       // override: cascade-xóa bao_phe_duc_dong trước
  importGrindingData:             grindingDAO.importData,
  getLatestGrindingDate:          grindingDAO.getLatestDate,
  getDefectsByDate,
  getAllDefectCandidatesByDate,
  getScrapSummaryByDate,
  getLatestDefectDate,
};
