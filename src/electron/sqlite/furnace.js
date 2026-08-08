const { openDatabase } = require("./connection");
const XLSX = require("xlsx");

function ensureFurnaceTable() {
  const db = openDatabase();
  try {
    // 1. Table for Furnace Production
    db.exec(`
      CREATE TABLE IF NOT EXISTS furnace_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date TEXT NOT NULL,
        customer_order_number TEXT,
        work_order_number TEXT NOT NULL UNIQUE,
        material_code TEXT,
        item_name TEXT,
        specification TEXT,
        completed_quantity INTEGER NOT NULL DEFAULT 0,
        scrap_quantity INTEGER NOT NULL DEFAULT 0,
        total_strings INTEGER,
        furnace_number TEXT,
        employee_name TEXT,
        group_team TEXT,
        furnace_unit TEXT,
        furnace_batch TEXT,
        unit_weight REAL,
        completed_weight REAL,
        department TEXT,
        product_category TEXT,
        product_spec TEXT,
        yield_rate TEXT,
        material_type TEXT,
        erp_order_number TEXT,
        imported_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 2. View for Production Progress
    db.exec(`
      DROP VIEW IF EXISTS v_production_progress;
      CREATE VIEW v_production_progress AS
      WITH CuttingTotal AS (
        SELECT work_order_number, MAX(report_date) as last_cutting_date, SUM(completed_quantity) as total_cutting
        FROM cutting_production
        GROUP BY work_order_number
      ),
      GrindingTotal AS (
        SELECT work_order_number, SUM(completed_quantity + scrap_quantity) as total_grinding
        FROM grinding_production
        GROUP BY work_order_number
      ),
      JointDetail AS (
        SELECT material_code, MAX(detail) as joint_detail
        FROM detail_joint
        GROUP BY material_code
      )
      SELECT 
        f.report_date as furnace_date,
        f.work_order_number,
        f.customer_order_number,
        f.material_code,
        f.item_name,
        f.specification,
        f.completed_quantity as furnace_qty,
        COALESCE(c.total_cutting, 0) as cutting_qty,
        MAX(0, f.completed_quantity - COALESCE(c.total_cutting, 0)) as missing_cutting,
        
        COALESCE(g.total_grinding, 0) as grinding_qty,
        MAX(0, COALESCE(c.total_cutting, 0) - COALESCE(g.total_grinding, 0)) as missing_grinding,
        
        CAST(COALESCE(j.joint_detail, 1) AS REAL) as joint_ratio,
        
        -- Số xâu chưa cắt
        ROUND(
          MAX(0, f.completed_quantity - COALESCE(c.total_cutting, 0)) / CAST(COALESCE(j.joint_detail, 1) AS REAL), 
          1
        ) as pending_cutting_strings,
        
        -- Số xâu chưa mài
        ROUND(
          MAX(0, COALESCE(c.total_cutting, 0) - COALESCE(g.total_grinding, 0)) / CAST(COALESCE(j.joint_detail, 1) AS REAL), 
          1
        ) as pending_grinding_strings,
        
        CAST(julianday('now', 'localtime') - julianday(f.report_date) AS INTEGER) as days_since_furnace,
        CAST(julianday('now', 'localtime') - julianday(c.last_cutting_date) AS INTEGER) as days_since_last_cutting
      FROM furnace_production f
      LEFT JOIN CuttingTotal c ON f.work_order_number = c.work_order_number
      LEFT JOIN GrindingTotal g ON f.work_order_number = g.work_order_number
      LEFT JOIN JointDetail j ON f.material_code = j.material_code;
    `);
  } finally {
    db.close();
  }
}

/**
 * Import dữ liệu Lò từ Excel.
 * Cập nhật đè (UPSERT) dựa trên work_order_number.
 */
function importFurnaceData(filePath) {
  const db = openDatabase();
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let count = 0;

    const stmt = db.prepare(`
      INSERT INTO furnace_production (
        report_date, customer_order_number, work_order_number, material_code,
        item_name, specification, completed_quantity, scrap_quantity, total_strings,
        furnace_number, employee_name, group_team, furnace_unit, furnace_batch,
        unit_weight, completed_weight, department, product_category, product_spec,
        yield_rate, material_type, erp_order_number
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(work_order_number) DO UPDATE SET
        report_date = excluded.report_date,
        customer_order_number = excluded.customer_order_number,
        material_code = excluded.material_code,
        item_name = excluded.item_name,
        specification = excluded.specification,
        completed_quantity = excluded.completed_quantity,
        scrap_quantity = excluded.scrap_quantity,
        total_strings = excluded.total_strings,
        furnace_number = excluded.furnace_number,
        employee_name = excluded.employee_name,
        group_team = excluded.group_team,
        furnace_unit = excluded.furnace_unit,
        furnace_batch = excluded.furnace_batch,
        unit_weight = excluded.unit_weight,
        completed_weight = excluded.completed_weight,
        department = excluded.department,
        product_category = excluded.product_category,
        product_spec = excluded.product_spec,
        yield_rate = excluded.yield_rate,
        material_type = excluded.material_type,
        erp_order_number = excluded.erp_order_number,
        imported_at = datetime('now', 'localtime')
    `);

    db.transaction(() => {
      for (const row of rows) {
        const workOrder = (row["Mã công đơn工单号"] || row["Mã công đơn"] || "").toString().trim();
        if (!workOrder) continue;

        let rDate = row["Ngày báo sản lượng报产日期"] || row["Ngày báo sản lượng"];
        if (typeof rDate === "number") {
          // Convert excel serial date
          const d = new Date((rDate - (25567 + 2)) * 86400 * 1000); // SQLite format needs YYYY-MM-DD
          rDate = d.toISOString().split('T')[0];
        } else if (rDate instanceof Date) {
          rDate = rDate.toISOString().split('T')[0];
        }

        stmt.run(
          rDate,
          row["Đơn đặt hàng của khách hàng客户订单号"] || row["Đơn đặt hàng của khách hàng"] || "",
          workOrder,
          row["Mã liệu料号"] || row["Mã liệu"] || "",
          row["Tên hàng品名"] || row["Tên hàng"] || "",
          row["Quy cách规格"] || row["Quy cách"] || "",
          Number(row["Số lượng hoàn thành完工数量"] || row["Số lượng hoàn thành"]) || 0,
          Number(row["Số lượng báo phế报废数量"] || row["Số lượng báo phế"]) || 0,
          Number(row["Tổng số xâu总串数"] || row["Tổng số xâu"]) || 0,
          row["Số lò炉号"] || row["Số lò"] || "",
          row["Họ tên nhân viên员工名称"] || row["Họ tên nhân viên"] || "",
          row["Nhóm tổ班组"] || row["Nhóm tổ"] || "",
          row["Lò số mấy炉台"] || row["Lò số mấy"] || "",
          row["Lò mấy lần炉次"] || row["Lò mấy lần"] || "",
          Number(row["Đơn vị trọng lượng单位重量"] || row["Đơn vị trọng lượng"]) || 0,
          Number(row["Trọng lượng hoàn thành完成重量"] || row["Trọng lượng hoàn thành"]) || 0,
          row["Bộ phận部门"] || row["Bộ phận"] || "",
          row["Phân loại sản phẩm产品分类"] || row["Phân loại sản phẩm"] || "",
          row["Quy cách sản phẩm产品规格"] || row["Quy cách sản phẩm"] || "",
          row["Tỉ lệ năng suất(%)得料率(%)"] || row["Tỉ lệ năng suất(%)"] || "",
          row["Chất liệu材质"] || row["Chất liệu"] || "",
          row["Số đơn báo công erpERP报工单号"] || row["Số đơn báo công erp"] || ""
        );
        count++;
      }
    })();

    return { success: true, count };
  } catch (error) {
    console.error("Lỗi khi import file Lò:", error);
    return { success: false, message: error.message };
  } finally {
    db.close();
  }
}

function getProductionProgress() {
  const db = openDatabase();
  try {
    // We add the logic for status string in JS instead of pure SQL for flexibility, or we can do it here.
    // Let's do it in JS.
    const records = db.prepare("SELECT * FROM v_production_progress ORDER BY furnace_date DESC").all();
    
    // Process status for each record based on rules:
    records.forEach(r => {
      if (r.grinding_qty >= r.cutting_qty && r.cutting_qty >= r.furnace_qty) {
        r.status = "Hoàn thành";
      } else if (r.missing_cutting > 0 && r.days_since_furnace > 3) {
        r.status = "Quá hạn Cắt";
      } else if (r.missing_grinding > 0 && r.days_since_last_cutting > 3) {
        r.status = "Quá hạn Mài";
      } else if (r.grinding_qty > 0 && r.missing_grinding > 0) {
        r.status = "Đang Mài";
      } else if (r.missing_cutting === 0 && r.grinding_qty === 0) {
        r.status = "Chờ Mài";
      } else if (r.cutting_qty > 0 && r.missing_cutting > 0) {
        r.status = "Đang Cắt";
      } else {
        r.status = "Chưa Cắt";
      }
    });

    return records;
  } finally {
    db.close();
  }
}

module.exports = {
  ensureFurnaceTable,
  importFurnaceData,
  getProductionProgress
};
