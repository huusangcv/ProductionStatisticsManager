const ExcelJS = require("exceljs");
const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

function ensurePricesTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS price_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT UNIQUE,
        product_name TEXT,
        specification TEXT,
        cutting_price REAL,
        grinding_price REAL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // Ensure index
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_price_material ON price_list(material_code)`);
  } finally {
    db.close();
  }
}

function getAllPrices() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM price_list ORDER BY updated_at DESC").all();
  } finally {
    db.close();
  }
}

function getPriceByMaterialCode(materialCode) {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM price_list WHERE material_code = ?").get(materialCode);
  } finally {
    db.close();
  }
}

function searchPrices(keyword) {
  const db = openDatabase();
  try {
    const term = `%${keyword}%`;
    return db
      .prepare(`
        SELECT * FROM price_list 
        WHERE material_code LIKE ? 
           OR product_name LIKE ? 
           OR specification LIKE ?
        ORDER BY updated_at DESC
      `)
      .all(term, term, term);
  } finally {
    db.close();
  }
}

function createPrice(data) {
  const db = openDatabase();
  try {
    const existing = db.prepare("SELECT id FROM price_list WHERE material_code = ?").get(data.material_code);
    if (existing) {
      return { ok: false, message: "Mã liệu đã tồn tại." };
    }

    const info = db
      .prepare(`
        INSERT INTO price_list (material_code, product_name, specification, cutting_price, grinding_price)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        data.material_code,
        data.product_name,
        data.specification,
        data.cutting_price || 0,
        data.grinding_price || 0
      );

    return { ok: true, id: info.lastInsertRowid };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updatePrice(id, data) {
  const db = openDatabase();
  try {
    const info = db
      .prepare(`
        UPDATE price_list
        SET product_name = ?, specification = ?, cutting_price = ?, grinding_price = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `)
      .run(
        data.product_name,
        data.specification,
        data.cutting_price || 0,
        data.grinding_price || 0,
        id
      );

    if (info.changes === 0) return { ok: false, message: "Không tìm thấy bản ghi." };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deletePrice(id) {
  const db = openDatabase();
  try {
    const info = db.prepare("DELETE FROM price_list WHERE id = ?").run(id);
    if (info.changes === 0) return { ok: false, message: "Không tìm thấy bản ghi." };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

async function importPricesFromExcel(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return { ok: false, message: "File Excel không có dữ liệu." };
    }

    let headerRowIndex = -1;
    let colMap = {};

    // Find header row by scanning first 10 rows
    sheet.eachRow((row, rowNumber) => {
      if (headerRowIndex !== -1) return; // already found
      
      let tempMap = {};
      row.eachCell((cell, colNumber) => {
        const text = cell.text ? String(cell.text).trim().toLowerCase() : "";
        if (text.includes("mã số sản phẩm")) { tempMap.material_code = colNumber; }
        else if (text.includes("tên hàng")) { tempMap.product_name = colNumber; }
        else if (text.includes("quy cách")) { tempMap.specification = colNumber; }
        else if (text.includes("cắt")) { tempMap.cutting_price = colNumber; }
        else if (text.includes("mài")) { tempMap.grinding_price = colNumber; }
      });

      // If we find at least Mã số sản phẩm, Tên hàng, Cắt, Mài
      if (tempMap.material_code && tempMap.product_name && tempMap.cutting_price && tempMap.grinding_price) {
        headerRowIndex = rowNumber;
        colMap = tempMap;
      }
    });

    if (headerRowIndex === -1) {
      return { ok: false, message: "Thiếu cột bắt buộc: Mã số sản phẩm, Tên hàng, Cắt, Mài." };
    }

    const records = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const material_code = row.getCell(colMap.material_code).text?.trim();
      if (!material_code) return; // Bỏ qua nếu Mã trống

      const product_name = colMap.product_name ? row.getCell(colMap.product_name).text?.trim() : "";
      const specification = colMap.specification ? row.getCell(colMap.specification).text?.trim() : "";
      
      const getNum = (col) => {
          if(!col) return 0;
          const cell = row.getCell(col);
          const val = cell.value;
          if (typeof val === 'number') return val;
          if (val && typeof val === 'object' && typeof val.result === 'number') return val.result;
          const parsed = parseFloat(cell.text?.trim()?.replace(/,/g, ''));
          return isNaN(parsed) ? 0 : parsed;
      };

      records.push({
        material_code,
        product_name,
        specification,
        cutting_price: getNum(colMap.cutting_price),
        grinding_price: getNum(colMap.grinding_price)
      });
    });

    if (records.length === 0) {
       return { ok: false, message: "Không có dữ liệu để import." };
    }

    // DB Insert/Update Transaction
    const db = openDatabase();
    try {
      let inserted = 0;
      let updated = 0;

      const checkStmt = db.prepare(`SELECT id FROM price_list WHERE material_code = ?`);
      const insertStmt = db.prepare(`
          INSERT INTO price_list (material_code, product_name, specification, cutting_price, grinding_price, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
      `);
      const updateStmt = db.prepare(`
          UPDATE price_list
          SET product_name = ?, specification = ?, cutting_price = ?, grinding_price = ?, updated_at = datetime('now', 'localtime')
          WHERE material_code = ?
      `);

      const tx = db.transaction((recs) => {
          for (const r of recs) {
            const existing = checkStmt.get(r.material_code);
            if (existing) {
                updateStmt.run(r.product_name, r.specification, r.cutting_price, r.grinding_price, r.material_code);
                updated++;
            } else {
                insertStmt.run(r.material_code, r.product_name, r.specification, r.cutting_price, r.grinding_price);
                inserted++;
            }
          }
      });

      tx(records);
      return { ok: true, inserted, updated, total: inserted + updated };
    } finally {
      db.close();
    }
  } catch (error) {
    return { ok: false, message: "Lỗi import: " + error.message };
  }
}

async function exportPricesToExcel(exportPath) {
   try {
      const prices = getAllPrices();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Danh sách đơn giá");

      sheet.addRow(["Mã số sản phẩm", "Tên hàng", "Quy cách", "Cắt", "Mài"]);

      for (const p of prices) {
         sheet.addRow([
            p.material_code,
            p.product_name,
            p.specification,
            p.cutting_price,
            p.grinding_price
         ]);
      }

      await workbook.xlsx.writeFile(exportPath);
      return { ok: true };
   } catch (error) {
      return { ok: false, message: error.message };
   }
}

module.exports = {
  ensurePricesTable,
  getAllPrices,
  getPriceByMaterialCode,
  searchPrices,
  createPrice,
  updatePrice,
  deletePrice,
  importPricesFromExcel,
  exportPricesToExcel
};
