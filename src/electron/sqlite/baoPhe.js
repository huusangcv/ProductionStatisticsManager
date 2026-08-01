const { openDatabase } = require("./connection");
const { getDatabasePath } = require("./paths");



const DEFECT_DB_COLUMNS = {
  catPham: 'cat_pham', maiPham: 'mai_pham', xiHo: 'xi_ho', ducThieu: 'duc_thieu',
  loCat: 'lo_cat', loKhi: 'lo_khi', lungLo: 'lung_lo', bienDang: 'bien_dang',
  matNet: 'mat_net', kepCat: 'kep_cat', vetNut: 'vet_nut', saiKichThuoc: 'sai_kich_thuoc',
  kepSat: 'kep_sat', lanhNgat: 'lanh_ngat', loXi: 'lo_xi', khac: 'khac',
};
const DB_COLS = Object.values(DEFECT_DB_COLUMNS);
const APP_KEYS = Object.keys(DEFECT_DB_COLUMNS);

function ensureBaoPheTables() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bao_phe_duc (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ngay            TEXT NOT NULL UNIQUE,
        trang_thai      TEXT NOT NULL DEFAULT 'nhap',
        file_full_path  TEXT,
        file_qc_path    TEXT,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        exported_at     DATETIME
      );

      CREATE TABLE IF NOT EXISTS bao_phe_duc_dong (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        bao_phe_duc_id          INTEGER NOT NULL REFERENCES bao_phe_duc(id) ON DELETE CASCADE,
        grinding_production_id  INTEGER NOT NULL REFERENCES grinding_production(id),

        cat_pham        INTEGER NOT NULL DEFAULT 0,
        mai_pham        INTEGER NOT NULL DEFAULT 0,
        xi_ho           INTEGER NOT NULL DEFAULT 0,
        duc_thieu       INTEGER NOT NULL DEFAULT 0,
        lo_cat          INTEGER NOT NULL DEFAULT 0,
        lo_khi          INTEGER NOT NULL DEFAULT 0,
        lung_lo         INTEGER NOT NULL DEFAULT 0,
        bien_dang       INTEGER NOT NULL DEFAULT 0,
        mat_net         INTEGER NOT NULL DEFAULT 0,
        kep_cat         INTEGER NOT NULL DEFAULT 0,
        vet_nut         INTEGER NOT NULL DEFAULT 0,
        sai_kich_thuoc  INTEGER NOT NULL DEFAULT 0,
        kep_sat         INTEGER NOT NULL DEFAULT 0,
        lanh_ngat       INTEGER NOT NULL DEFAULT 0,
        lo_xi           INTEGER NOT NULL DEFAULT 0,
        khac            INTEGER NOT NULL DEFAULT 0,

        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (bao_phe_duc_id, grinding_production_id)
      );

      CREATE INDEX IF NOT EXISTS idx_bpd_dong_grinding_id ON bao_phe_duc_dong(grinding_production_id);
      CREATE INDEX IF NOT EXISTS idx_bpd_dong_header ON bao_phe_duc_dong(bao_phe_duc_id);
    `);
  } finally {
    db.close();
  }
}

function getOrCreateHeader(db, ngay) {
  // Try to insert
  db.prepare(`
    INSERT INTO bao_phe_duc (ngay)
    VALUES (?)
    ON CONFLICT(ngay) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
  `).run(ngay);

  // Return the row
  return db.prepare(`SELECT * FROM bao_phe_duc WHERE ngay = ?`).get(ngay);
}

function loadSavedRows(ngay) {
  const db = openDatabase();
  try {
    const rows = db.prepare(`
      SELECT d.grinding_production_id, ${DB_COLS.join(', ')}
      FROM bao_phe_duc_dong d
      JOIN bao_phe_duc h ON h.id = d.bao_phe_duc_id
      WHERE h.ngay = ?
    `).all(ngay);

    const byGrindingId = {};
    for (const r of rows) {
      const defects = {};
      APP_KEYS.forEach((key, i) => { defects[key] = r[DB_COLS[i]]; });
      byGrindingId[r.grinding_production_id] = defects;
    }
    return byGrindingId;
  } catch (error) {
    console.error("Error loading saved rows:", error);
    return {};
  } finally {
    db.close();
  }
}

function saveAllRows(ngay, gridRows) {
  const db = openDatabase();
  try {
    // Run in transaction for performance and safety
    const transaction = db.transaction(() => {
      const header = getOrCreateHeader(db, ngay);

      const placeholders = DB_COLS.map(() => '?').join(', ');
      const updateSet = DB_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ');

      const stmt = db.prepare(`
        INSERT INTO bao_phe_duc_dong (bao_phe_duc_id, grinding_production_id, ${DB_COLS.join(', ')})
        VALUES (?, ?, ${placeholders})
        ON CONFLICT(bao_phe_duc_id, grinding_production_id)
        DO UPDATE SET ${updateSet}, updated_at = CURRENT_TIMESTAMP
      `);

      for (const row of gridRows) {
        // row.id corresponds to grinding_production.id
        const values = APP_KEYS.map(k => Number(row.defects[k]) || 0);
        stmt.run(header.id, row.id, ...values);
      }
      return header.id;
    });

    return transaction();
  } catch (error) {
    console.error("Error saving rows:", error);
    throw error;
  } finally {
    db.close();
  }
}

function markExported(ngay, fullPath, qcPath) {
  const db = openDatabase();
  try {
    db.prepare(`
      UPDATE bao_phe_duc
      SET trang_thai = 'da_in', 
          file_full_path = ?, 
          file_qc_path = ?, 
          exported_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE ngay = ?
    `).run(fullPath, qcPath, ngay);
  } catch (error) {
    console.error("Error marking exported:", error);
  } finally {
    db.close();
  }
}

module.exports = {
  ensureBaoPheTables,
  loadSavedRows,
  saveAllRows,
  markExported,
};
