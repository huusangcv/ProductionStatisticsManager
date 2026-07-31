// export-bao-phe.js
// Chạy trong main process của Electron (cần fs, nên KHÔNG import trong renderer).
//
// Dùng xlsx-populate thay ExcelJS để tránh lỗi "Shared Formula master must
// exist above and or left of clone" — xlsx-populate được thiết kế cho use-case
// "fill values vào template có sẵn", không tự tạo shared formula khi ghi file,
// và giữ nguyên 100% merge cells / ảnh / print area / công thức của template.

const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// 1. HẰNG SỐ VỊ TRÍ — khớp với template P-029-06.01 đã chèn đủ dòng trống
//    Nếu template thay đổi, chỉ cần sửa 4 dòng này.
// ---------------------------------------------------------------------------
const SHEET_NAME = 'ĐÚC P-029-06.01 A0)';
const DATA_START_ROW = 6;
const DATA_MAX_ROW = 99;               // dòng dữ liệu cuối cùng có sẵn trong template
const ROW_SUM = DATA_MAX_ROW + 1; // 95 — dòng "合计 Tổng"
const ROW_MATERIAL_HEADER = DATA_MAX_ROW + 2; // 96 — dòng header bảng chất liệu
const ROW_MATERIAL_SUM = DATA_MAX_ROW + 3; // 97 — dòng tổng theo ỐNG/VAN x chất liệu

// Cột nguyên nhân không đạt, đúng thứ tự G → V trong template
const DEFECT_COLUMNS = [
  { key: 'catPham', col: 'G' }, // Cắt phạm
  { key: 'maiPham', col: 'H' }, // Mài phạm
  { key: 'xiHo', col: 'I' }, // Xì hồ
  { key: 'ducThieu', col: 'J' }, // Đúc thiếu
  { key: 'loCat', col: 'K' }, // Lổ cát
  { key: 'loKhi', col: 'L' }, // Lổ khí
  { key: 'lungLo', col: 'M' }, // Lủng lổ
  { key: 'bienDang', col: 'N' }, // Biến dạng
  { key: 'matNet', col: 'O' }, // Mất nét
  { key: 'kepCat', col: 'P' }, // Kẹp cát
  { key: 'vetNut', col: 'Q' }, // Vết nứt
  { key: 'saiKichThuoc', col: 'R' }, // Sai kích thước
  { key: 'kepSat', col: 'S' }, // Kẹp sắt
  { key: 'lanhNgat', col: 'T' }, // Lạnh ngắt
  { key: 'loXi', col: 'U' }, // Lỗ xỉ
  { key: 'khac', col: 'V' }, // Khác
];

// Danh sách ưu tiên tra chất liệu — mã dài/đặc thù trước, mã ngắn/dễ trùng substring sau
const MATERIAL_PRIORITY = [
  'CF3M', 'CF8M', 'WCB', 'CW12MW', 'CX2MW', 'CD3MN',
  'CD3MWCuN', 'CN7M', 'LCC', 'M35', 'CF8', '316', '304',
];

// ---------------------------------------------------------------------------
// 2. LOGIC TÍNH TOÁN
// ---------------------------------------------------------------------------

/**
 * Tra chất liệu từ chuỗi quy_cach theo thứ tự ưu tiên.
 * @param {string} quyCach
 * @returns {string}
 */
function getChatLieu(quyCach) {
  const s = String(quyCach || '');
  for (const m of MATERIAL_PRIORITY) {
    if (s.includes(m)) return m;
  }
  return '';
}

/**
 * Xác định loại sản phẩm: "ỐNG" hoặc "VAN".
 * @param {string} tenSanPham
 * @param {string} quyCach
 * @returns {'ỐNG'|'VAN'}
 */
function getLoai(tenSanPham, quyCach) {
  const ten = String(tenSanPham || '');
  const qc = String(quyCach || '');
  if (ten.includes('OM-06')) return 'ỐNG';
  if (qc.startsWith('DN') || qc.startsWith('NPS') || ten.includes('LADISH')) return 'VAN';
  return 'ỐNG';
}

/**
 * Tính đầy đủ một dòng từ candidate.
 * @param {object} candidate - { maCongDon, tenSanPham, quyCach, trongLuongDonVi, defects: {...} }
 * @returns {object} candidate mở rộng với chatLieu, loai, tongCong, tongTrongLuong
 */
function computeRow(candidate, autoFillKhac = false) {
  const chatLieu = getChatLieu(candidate.quyCach);
  const loai = getLoai(candidate.tenSanPham, candidate.quyCach);

  // Clone defects để không thay đổi object gốc của candidate
  const defects = { ...candidate.defects };

  let tongCong = DEFECT_COLUMNS.reduce(
    (sum, d) => sum + (Number(defects[d.key]) || 0), 0
  );

  if (autoFillKhac) {
    // Tự động bù phần phế còn thiếu vào cột Khác
    const refScrap = Number(candidate.scrapQuantity) || 0;
    if (tongCong < refScrap) {
      const remaining = refScrap - tongCong;
      defects.khac = (Number(defects.khac) || 0) + remaining;
      tongCong = refScrap; // Cập nhật lại tổng
    }
  }

  const tongTrongLuong = Math.round(tongCong * (candidate.trongLuongDonVi || 0) * 100) / 100;
  return { ...candidate, chatLieu, loai, tongCong, tongTrongLuong, defects };
}

// ---------------------------------------------------------------------------
// 3. GHI DỮ LIỆU VÀO SHEET (xlsx-populate API)
//    - Chỉ set giá trị, không insert/delete dòng
//    - Dùng ws.cell(addr).value(val) thay vì ws.getCell(addr).value = val
// ---------------------------------------------------------------------------

/**
 * Ghi các dòng dữ liệu vào worksheet đã có sẵn đủ dòng trong template.
 * Dòng dư (không có data) sẽ được xóa giá trị và ẩn đi.
 * @param {XlsxPopulate.Sheet} ws
 * @param {object[]} rows - mảng đã qua computeRow()
 */
function writeDataRows(ws, rows) {
  const capacity = DATA_MAX_ROW - DATA_START_ROW + 1;
  if (rows.length > capacity) {
    throw new Error(
      `Số dòng (${rows.length}) vượt quá sức chứa template (${capacity}). ` +
      `Cần mở rộng template hoặc tách trang.`
    );
  }

  for (let i = 0; i < capacity; i++) {
    const r = DATA_START_ROW + i;
    const row = rows[i]; // undefined nếu vượt số dòng thực tế → xóa trắng + ẩn

    // Cột B–E, AB
    ws.cell(`B${r}`).value(row ? row.maCongDon : undefined);
    ws.cell(`C${r}`).value(row ? row.tenSanPham : undefined);
    ws.cell(`D${r}`).value(row ? row.quyCach : undefined);
    ws.cell(`E${r}`).value(row ? row.chatLieu : undefined);
    ws.cell(`AB${r}`).value(row ? row.chatLieu : undefined); // cột phụ cho SUMIFS

    // 16 cột nguyên nhân G–V
    DEFECT_COLUMNS.forEach(({ key, col }) => {
      const v = row ? (Number(row.defects[key]) || 0) : 0;
      // Ghi undefined (xóa ô) thay vì 0 để giữ ô trống — không hiển thị số 0
      ws.cell(`${col}${r}`).value((v > 0) ? v : undefined);
    });

    // Tổng cộng, TL đơn vị, Loại, Tổng TL
    ws.cell(`W${r}`).value(row ? (row.tongCong > 0 ? row.tongCong : undefined) : undefined);
    ws.cell(`Y${r}`).value(row ? row.trongLuongDonVi : undefined);
    ws.cell(`Z${r}`).value(row ? row.loai : undefined);
    ws.cell(`AA${r}`).value(row ? (row.tongTrongLuong > 0 ? row.tongTrongLuong : undefined) : undefined);

    // Cột A (STT): giữ nguyên công thức =ROW()-5 có sẵn trong template, không đụng vào.

    // Ẩn dòng dư — không xóa, không dịch chuyển, chỉ ẩn khi xem/in
    const wsRow = ws.row(r);
    if (!row) {
      wsRow.hidden(true);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. GHI KHỐI TỔNG KẾT
// ---------------------------------------------------------------------------

/**
 * Ghi dòng "合计 Tổng" (cộng dọc từng cột nguyên nhân) và
 * bảng ỐNG/VAN × chất liệu ở cuối template.
 * @param {XlsxPopulate.Sheet} ws
 * @param {object[]} rows - mảng đã qua computeRow()
 */
function writeFooterSummary(ws, rows) {
  // 4a. Dòng "合计 Tổng" — cộng dọc từng cột nguyên nhân
  DEFECT_COLUMNS.forEach(({ key, col }) => {
    const total = rows.reduce((s, r) => s + (Number(r.defects[key]) || 0), 0);
    ws.cell(`${col}${ROW_SUM}`).value(total > 0 ? total : undefined);
  });

  // 4b. Tổng TL theo Loại và Chất liệu — SUMIFS làm bằng JS
  const sumBy = (loai, chatLieu) =>
    rows
      .filter(r => r.loai === loai && (!chatLieu || r.chatLieu === chatLieu))
      .reduce((s, r) => s + (r.tongTrongLuong || 0), 0);

  const round2 = n => Math.round(n * 100) / 100;

  // ỐNG
  // const ongCF8M316 = round2(sumBy('ỐNG', 'CF8M') + sumBy('ỐNG', '316'));
  // const ongCF8_304 = round2(sumBy('ỐNG', 'CF8') + sumBy('ỐNG', '304'));
  // const ongTotal = round2(rows.filter(r => r.loai === 'ỐNG').reduce((s, r) => s + (r.tongTrongLuong || 0), 0));
  // const ongKhac = round2(ongTotal - ongCF8M316 - ongCF8_304);

  // VAN
  // const vanCF8M = round2(sumBy('VAN', 'CF8M'));
  // const vanCF8 = round2(sumBy('VAN', 'CF8'));
  // const vanCF3M = round2(sumBy('VAN', 'CF3M'));
  // const vanWCB = round2(sumBy('VAN', 'WCB'));
  // const vanTotal = round2(rows.filter(r => r.loai === 'VAN').reduce((s, r) => s + (r.tongTrongLuong || 0), 0));
  // const vanKhac = round2(vanTotal - vanCF8M - vanCF8 - vanCF3M - vanWCB);

  // const r = ROW_MATERIAL_SUM;
  // ws.cell(`C${r}`).value(ongCF8M316 || undefined);
  // ws.cell(`D${r}`).value(ongCF8_304 || undefined);
  // ws.cell(`E${r}`).value(ongKhac || undefined);
  // ws.cell(`G${r}`).value(vanCF8M || undefined);
  // ws.cell(`I${r}`).value(vanCF8 || undefined);
  // ws.cell(`K${r}`).value(vanCF3M || undefined);
  // ws.cell(`M${r}`).value(vanWCB || undefined);
  // ws.cell(`O${r}`).value(vanKhac || undefined);
  // ws.cell(`S${ROW_MATERIAL_HEADER}`).value(round2(ongTotal + vanTotal) || undefined);
}

// ---------------------------------------------------------------------------
// 5. RESOLVE ĐƯỜNG DẪN OUTPUT
// ---------------------------------------------------------------------------

/**
 * Đảm bảo thư mục tồn tại.
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Sinh đường dẫn output cho 2 file theo ngày.
 * Thư mục: <outputDir>/YYYY/MM/
 * @param {string} outputDir - thư mục gốc xuất file
 * @param {string} dateLabel - nhãn ngày, vd "30.07.2026"
 * @returns {{ fullPath: string, qcPath: string, folderPath: string }}
 */
function resolveOutputPaths(outputDir, dateLabel, isDraft = false) {
  let yyyy = '', mm = '';
  const parts = dateLabel.split('.');
  if (parts.length === 3) {
    yyyy = parts[2];
    mm = parts[1];
  } else {
    const now = new Date();
    yyyy = String(now.getFullYear());
    mm = String(now.getMonth() + 1).padStart(2, '0');
  }

  const baseFolder = path.join(outputDir, yyyy, mm);
  const baoCaoFolder = path.join(baseFolder, 'BaoCao');
  const phieuNhapFolder = path.join(baseFolder, 'PhieuNhap');
  const qcFolder = path.join(baseFolder, 'GiaoQC');

  ensureDir(baoCaoFolder);
  ensureDir(phieuNhapFolder);
  ensureDir(qcFolder);

  const prefix = isDraft ? "P-029-06.01_Nhap_Bao_Phe_" : "P-029-06.01_";
  const targetFolder = isDraft ? phieuNhapFolder : baoCaoFolder;

  return {
    fullPath: path.join(targetFolder, `${prefix}${dateLabel}铸造车间不良品回炉申请单A3.xlsx`),
    qcPath: path.join(qcFolder, `P-029-06.02_QC_Giao_Phe_${dateLabel}铸造车间废料发QC表A3.xlsx`),
    folderPath: baseFolder,
  };
}

// ---------------------------------------------------------------------------
// 6. HÀM CHÍNH — xuất 2 file từ cùng một bộ dữ liệu grid
// ---------------------------------------------------------------------------

/**
 * Xuất 2 file Excel báo phế từ cùng 1 template, 1 bộ dữ liệu.
 *
 * Dùng xlsx-populate để đảm bảo:
 *   - Giữ nguyên toàn bộ merge cells, ảnh logo, print area, công thức gốc
 *   - Không có lỗi "Shared Formula master" (vốn là bug của ExcelJS)
 *   - Không insert/delete dòng — chỉ ghi giá trị vào ô cố định
 *
 * @param {object} params
 * @param {string} params.templatePath   - Đường dẫn tới file template gốc
 * @param {object[]} params.allCandidates - Mảng candidate từ grid renderer
 * @param {string} params.outputDir      - Thư mục gốc để lưu file
 * @param {string} params.dateLabel      - Nhãn ngày dùng trong tên file, vd "30.07.2026"
 * @param {boolean} params.isDraft     - True nếu xuất phiếu nháp
 *
 * @returns {Promise<{ full: string, qc: string, folderPath: string }>}
 */
async function exportBaoPhe({ templatePath, allCandidates, outputDir, dateLabel, isDraft = false }) {
  // Kiểm tra template
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Không tìm thấy file template tại: ${templatePath}`);
  }

  // Tính toán dòng cho File Báo Cáo (autoFillKhac = true trừ khi là Phiếu nháp,
  // nhưng Phiếu nháp đã tự truyền r.scrap_quantity vào Khác ở frontend, nên để true cũng không ảnh hưởng, vì tongCong == refScrap)
  const fullRows = allCandidates.map(c => computeRow(c, true));

  // File QC chỉ giữ dòng có ít nhất 1 nguyên nhân được nhập và KHÔNG bù phế (autoFillKhac = false)
  const qcRows = allCandidates.map(c => computeRow(c, false)).filter(r => r.tongCong > 0);

  // Tính toán paths
  const { fullPath, qcPath, folderPath } = resolveOutputPaths(outputDir, dateLabel, isDraft);

  // --- BƯỚC 1: GHI FILE FULL (TẤT CẢ CÁC DÒNG) ---
  const wbFull = await XlsxPopulate.fromFileAsync(templatePath);
  const wsFull = wbFull.sheet(SHEET_NAME) ?? wbFull.sheet(0);
  if (!wsFull) throw new Error(`Không tìm thấy worksheet "${SHEET_NAME}"`);
  writeDataRows(wsFull, fullRows);
  writeFooterSummary(wsFull, fullRows);
  await wbFull.toFileAsync(fullPath);

  // Nếu là phiếu nháp thì không cần xuất file QC, trả về luôn
  if (isDraft) {
    return { full: fullPath, qc: null, folderPath };
  }

  // --- BƯỚC 3: GHI FILE QC (Chỉ các dòng có nguyên nhân phế > 0) ---
  const wbQC = await XlsxPopulate.fromFileAsync(templatePath);
  const wsQC = wbQC.sheet(SHEET_NAME) ?? wbQC.sheet(0);
  writeDataRows(wsQC, qcRows);
  writeFooterSummary(wsQC, qcRows);
  await wbQC.toFileAsync(qcPath);

  return { full: fullPath, qc: qcPath, folderPath };
}

module.exports = {
  exportBaoPhe,
  computeRow,
  getChatLieu,
  getLoai,
  DEFECT_COLUMNS,
  DATA_START_ROW,
  DATA_MAX_ROW,
  ROW_SUM,
  ROW_MATERIAL_HEADER,
  ROW_MATERIAL_SUM,
};
