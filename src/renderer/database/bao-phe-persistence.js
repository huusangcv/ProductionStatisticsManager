// bao-phe-persistence.js
// Chạy trong main process (dùng chung pool/client kết nối DB hiện có của app).
// Giả định `db` là 1 client hỗ trợ query(text, params) trả về { rows }.

const DEFECT_DB_COLUMNS = {
  catPham: 'cat_pham', maiPham: 'mai_pham', xiHo: 'xi_ho', ducThieu: 'duc_thieu',
  loCat: 'lo_cat', loKhi: 'lo_khi', lungLo: 'lung_lo', bienDang: 'bien_dang',
  matNet: 'mat_net', kepCat: 'kep_cat', vetNut: 'vet_nut', saiKichThuoc: 'sai_kich_thuoc',
  kepSat: 'kep_sat', lanhNgat: 'lanh_ngat', loXi: 'lo_xi', khac: 'khac',
};
const DB_COLS = Object.values(DEFECT_DB_COLUMNS);       // ['cat_pham', 'mai_pham', ...]
const APP_KEYS = Object.keys(DEFECT_DB_COLUMNS);        // ['catPham', 'maiPham', ...]

// -----------------------------------------------------------------------
// 1. Lấy (hoặc tạo mới) phiếu header theo ngày
// -----------------------------------------------------------------------
async function getOrCreateHeader(db, ngay) {
  const { rows } = await db.query(
    `INSERT INTO bao_phe_duc (ngay)
     VALUES ($1)
     ON CONFLICT (ngay) DO UPDATE SET updated_at = now()
     RETURNING id, trang_thai, file_full_path, file_qc_path, exported_at`,
    [ngay]
  );
  return rows[0];
}

// -----------------------------------------------------------------------
// 2. Nạp lại dữ liệu đã lưu cho 1 ngày -> map theo mai_id để merge vào grid
//    Dùng khi mở màn hình / đổi ngày, để KHÔI PHỤC dữ liệu đã nhập trước đó.
// -----------------------------------------------------------------------
async function loadSavedRows(db, ngay) {
  const { rows } = await db.query(
    `SELECT d.mai_id, ${DB_COLS.join(', ')}
     FROM bao_phe_duc_dong d
     JOIN bao_phe_duc h ON h.id = d.bao_phe_duc_id
     WHERE h.ngay = $1`,
    [ngay]
  );

  const byMaiId = {};
  for (const r of rows) {
    const defects = {};
    APP_KEYS.forEach((key, i) => { defects[key] = r[DB_COLS[i]]; });
    byMaiId[r.mai_id] = defects;
  }
  return byMaiId; // { [mai_id]: { catPham, maiPham, ... } }
}

// -----------------------------------------------------------------------
// 3. Lưu toàn bộ dòng hiện có trên grid (dùng cho autosave lẫn khi bấm "In")
//    Upsert theo (bao_phe_duc_id, mai_id) -> gọi lại nhiều lần vẫn an toàn.
// -----------------------------------------------------------------------
async function saveAllRows(db, ngay, gridRows) {
  const header = await getOrCreateHeader(db, ngay);

  const placeholders = DB_COLS.map((_, i) => `$${i + 3}`).join(', ');
  const updateSet = DB_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ');

  for (const row of gridRows) {
    const values = APP_KEYS.map(k => Number(row.defects[k]) || 0);
    await db.query(
      `INSERT INTO bao_phe_duc_dong (bao_phe_duc_id, mai_id, ${DB_COLS.join(', ')})
       VALUES ($1, $2, ${placeholders})
       ON CONFLICT (bao_phe_duc_id, mai_id)
       DO UPDATE SET ${updateSet}, updated_at = now()`,
      [header.id, row.maiId, ...values]
    );
  }
  return header.id;
}

// -----------------------------------------------------------------------
// 4. Đánh dấu đã in/xuất file — gọi SAU khi export file thành công
// -----------------------------------------------------------------------
async function markExported(db, ngay, { fullPath, qcPath }) {
  await db.query(
    `UPDATE bao_phe_duc
     SET trang_thai = 'da_in', file_full_path = $2, file_qc_path = $3, exported_at = now()
     WHERE ngay = $1`,
    [ngay, fullPath, qcPath]
  );
}

module.exports = { getOrCreateHeader, loadSavedRows, saveAllRows, markExported };
