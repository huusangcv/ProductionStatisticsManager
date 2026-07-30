/**
 * export-bao-phe.test.js
 *
 * Unit tests cho module export-bao-phe.js:
 * 1. Logic tính toán (getChatLieu, getLoai, computeRow)
 * 2. Kiểm tra layout file xuất ra so với template gốc:
 *    - Số merge cells bằng nhau
 *    - Số ảnh (images) bằng nhau
 *    - Sheet name đúng
 *    - pageSetup không bị xóa
 *
 * Cách chạy:
 *   node src/electron/castingDefectReturn/__tests__/export-bao-phe.test.js <path-to-template.xlsx>
 *
 * Nếu không truyền path template, chỉ chạy unit test logic (không test Excel).
 */

const assert = require("assert");
const path   = require("path");
const os     = require("os");
const fs     = require("fs");

const {
  getChatLieu,
  getLoai,
  computeRow,
  exportBaoPhe,
  DEFECT_COLUMNS,
  DATA_START_ROW,
  DATA_MAX_ROW,
} = require("../export-bao-phe");

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. Unit tests — getChatLieu
// ---------------------------------------------------------------------------

console.log("\n── getChatLieu() ────────────────────────────────────────────");

test("CF8M xuất hiện trước CF8 trong 'DN 50 CF8M WCB'", () => {
  assert.strictEqual(getChatLieu("DN 50 CF8M WCB"), "CF3M" === "CF8M" ? "CF3M" : "CF8M");
  // CF3M không có trong chuỗi, nên phải trả về CF8M
  assert.strictEqual(getChatLieu("DN 50 CF8M WCB"), "CF8M");
});

test("CF3M ưu tiên hơn CF8M khi cả 2 đều có", () => {
  assert.strictEqual(getChatLieu("CF3M/CF8M"), "CF3M");
});

test("316 → trả về '316'", () => {
  assert.strictEqual(getChatLieu("DN 100 316 PN16"), "316");
});

test("304 → trả về '304'", () => {
  assert.strictEqual(getChatLieu("DN 50 304L"), "304");
});

test("Không khớp → trả về ''", () => {
  assert.strictEqual(getChatLieu("DN 80 INOX"), "");
});

test("Chuỗi rỗng → trả về ''", () => {
  assert.strictEqual(getChatLieu(""), "");
});

test("null → trả về ''", () => {
  assert.strictEqual(getChatLieu(null), "");
});

test("WCB (index 2) đứng trước CW12MW (index 3) trong MATERIAL_PRIORITY", () => {
  // MATERIAL_PRIORITY: ['CF3M','CF8M','WCB','CW12MW',...]
  // WCB xuất hiện trước → kết quả là WCB dù chuỗi chứa cả 2
  assert.strictEqual(getChatLieu("CW12MW WCB"), "WCB");
  // Nếu chỉ có CW12MW → trả về CW12MW
  assert.strictEqual(getChatLieu("CW12MW A216"), "CW12MW");
});

// ---------------------------------------------------------------------------
// 2. Unit tests — getLoai
// ---------------------------------------------------------------------------

console.log("\n── getLoai() ────────────────────────────────────────────────");

test("Tên có 'OM-06' → 'ỐNG'", () => {
  assert.strictEqual(getLoai("KHỚP NỐI OM-06 DN50", "WCB"), "ỐNG");
});

test("Quy cách bắt đầu 'DN' → 'VAN'", () => {
  assert.strictEqual(getLoai("VAN CẦU", "DN 50 CF8M"), "VAN");
});

test("Quy cách bắt đầu 'NPS' → 'VAN'", () => {
  assert.strictEqual(getLoai("GATE VALVE", "NPS 2 WCB"), "VAN");
});

test("Tên chứa 'LADISH' → 'VAN'", () => {
  assert.strictEqual(getLoai("LADISH GATE VALVE", "CF8M"), "VAN");
});

test("Không khớp → 'ỐNG' (mặc định)", () => {
  assert.strictEqual(getLoai("KHỚP NỐI", "CF8M 100x100"), "ỐNG");
});

test("Cả 2 rỗng → 'ỐNG'", () => {
  assert.strictEqual(getLoai("", ""), "ỐNG");
});

// ---------------------------------------------------------------------------
// 3. Unit tests — computeRow
// ---------------------------------------------------------------------------

console.log("\n── computeRow() ─────────────────────────────────────────────");

test("tongCong = sum of all defect values", () => {
  const candidate = {
    maCongDon: "WO001",
    tenSanPham: "VAN CẦU",
    quyCach: "DN 50 CF8M PN16",
    trongLuongDonVi: 5.2,
    defects: {
      catPham: 2, maiPham: 1, xiHo: 0, ducThieu: 3,
      loCat: 0, loKhi: 0, lungLo: 0, bienDang: 0,
      matNet: 0, kepCat: 0, vetNut: 0, saiKichThuoc: 0,
      kepSat: 0, lanhNgat: 0, loXi: 0, khac: 1,
    },
  };
  const result = computeRow(candidate);
  assert.strictEqual(result.tongCong, 7);
});

test("tongTrongLuong = round(tongCong * unitWeight * 100) / 100", () => {
  const candidate = {
    maCongDon: "WO001",
    tenSanPham: "VAN CẦU",
    quyCach: "DN 50 CF8M PN16",
    trongLuongDonVi: 3.333,
    defects: { catPham: 3, maiPham: 0, xiHo: 0, ducThieu: 0, loCat: 0, loKhi: 0, lungLo: 0, bienDang: 0, matNet: 0, kepCat: 0, vetNut: 0, saiKichThuoc: 0, kepSat: 0, lanhNgat: 0, loXi: 0, khac: 0 },
  };
  const result = computeRow(candidate);
  // 3 * 3.333 = 9.999 → round = 10.0
  assert.strictEqual(result.tongTrongLuong, 10.0);
});

test("chatLieu và loai được tính đúng trong computeRow", () => {
  const candidate = {
    maCongDon: "WO002",
    tenSanPham: "LADISH FLANGE",
    quyCach: "NPS 3 WCB",
    trongLuongDonVi: 2.0,
    defects: { catPham: 1, maiPham: 0, xiHo: 0, ducThieu: 0, loCat: 0, loKhi: 0, lungLo: 0, bienDang: 0, matNet: 0, kepCat: 0, vetNut: 0, saiKichThuoc: 0, kepSat: 0, lanhNgat: 0, loXi: 0, khac: 0 },
  };
  const result = computeRow(candidate);
  assert.strictEqual(result.chatLieu, "WCB");
  assert.strictEqual(result.loai, "VAN");
});

test("defects rỗng → tongCong = 0, tongTrongLuong = 0", () => {
  const candidate = {
    maCongDon: "WO003",
    tenSanPham: "KHỚP NỐI",
    quyCach: "CF8M 100",
    trongLuongDonVi: 1.5,
    defects: { catPham: 0, maiPham: 0, xiHo: 0, ducThieu: 0, loCat: 0, loKhi: 0, lungLo: 0, bienDang: 0, matNet: 0, kepCat: 0, vetNut: 0, saiKichThuoc: 0, kepSat: 0, lanhNgat: 0, loXi: 0, khac: 0 },
  };
  const result = computeRow(candidate);
  assert.strictEqual(result.tongCong, 0);
  assert.strictEqual(result.tongTrongLuong, 0);
});

test("DEFECT_COLUMNS có đúng 16 phần tử", () => {
  assert.strictEqual(DEFECT_COLUMNS.length, 16);
});

test("DATA_START_ROW = 6", () => {
  assert.strictEqual(DATA_START_ROW, 6);
});

test("DATA_MAX_ROW = 94", () => {
  assert.strictEqual(DATA_MAX_ROW, 94);
});

// ---------------------------------------------------------------------------
// 4. Layout integrity test — chỉ chạy khi có template
// ---------------------------------------------------------------------------

const templatePath = process.argv[2];

if (templatePath) {
  if (!fs.existsSync(templatePath)) {
    console.error(`\n⚠️  Template không tồn tại: ${templatePath}`);
    process.exit(1);
  }

  console.log(`\n── Layout Integrity Test (template: ${path.basename(templatePath)}) ──`);

  const ExcelJS = require("exceljs");

  (async () => {
    // Đọc template gốc để lấy baseline
    const templateWb = new ExcelJS.Workbook();
    await templateWb.xlsx.readFile(templatePath);
    const templateWs = templateWb.getWorksheet("ĐÚC P-029-06.01 A0)") || templateWb.worksheets[0];

    const tmplMergeCount  = Object.keys(templateWs.model?.merges || {}).length;
    const tmplImageCount  = (templateWs.getImages ? templateWs.getImages() : []).length;
    const tmplPageSetup   = JSON.stringify(templateWs.pageSetup || {});

    console.log(`   Template: ${tmplMergeCount} merges, ${tmplImageCount} images`);

    // Tạo dữ liệu test tối thiểu
    const testCandidates = [
      {
        maCongDon: "WO-TEST-001",
        tenSanPham: "VAN CẦU TEST",
        quyCach: "DN 50 CF8M PN16",
        trongLuongDonVi: 3.5,
        defects: { catPham: 1, maiPham: 0, xiHo: 0, ducThieu: 0, loCat: 0, loKhi: 0, lungLo: 0, bienDang: 0, matNet: 0, kepCat: 0, vetNut: 0, saiKichThuoc: 0, kepSat: 0, lanhNgat: 0, loXi: 0, khac: 0 },
      },
    ];

    const outputDir = os.tmpdir();
    const dateLabel = "01.01.2026";

    let result;
    await testAsync("exportBaoPhe() chạy không có lỗi", async () => {
      result = await exportBaoPhe({ templatePath, allCandidates: testCandidates, outputDir, dateLabel });
    });

    if (result) {
      for (const [variant, filePath] of [["full", result.full], ["qc", result.qc]]) {
        await testAsync(`[${variant}] Số merge cells = template (${tmplMergeCount})`, async () => {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.readFile(filePath);
          const ws = wb.getWorksheet("ĐÚC P-029-06.01 A0)") || wb.worksheets[0];
          const mergeCount = Object.keys(ws.model?.merges || {}).length;
          assert.strictEqual(
            mergeCount, tmplMergeCount,
            `Mong đợi ${tmplMergeCount} merges, nhận được ${mergeCount}`
          );
        });

        await testAsync(`[${variant}] Số ảnh = template (${tmplImageCount})`, async () => {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.readFile(filePath);
          const ws = wb.getWorksheet("ĐÚC P-029-06.01 A0)") || wb.worksheets[0];
          const imgCount = (ws.getImages ? ws.getImages() : []).length;
          assert.strictEqual(
            imgCount, tmplImageCount,
            `Mong đợi ${tmplImageCount} ảnh, nhận được ${imgCount}`
          );
        });

        await testAsync(`[${variant}] pageSetup không bị xóa`, async () => {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.readFile(filePath);
          const ws = wb.getWorksheet("ĐÚC P-029-06.01 A0)") || wb.worksheets[0];
          assert.ok(
            ws.pageSetup && Object.keys(ws.pageSetup).length > 0,
            "pageSetup bị xóa hoặc rỗng"
          );
        });

        await testAsync(`[${variant}] Sheet name đúng`, async () => {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.readFile(filePath);
          const ws = wb.getWorksheet("ĐÚC P-029-06.01 A0)");
          assert.ok(ws, 'Không tìm thấy worksheet "ĐÚC P-029-06.01 A0)"');
        });

        // Dọn file test
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    printSummary();
  })();
} else {
  console.log("\n⚠️  Không có path template — bỏ qua layout integrity test.");
  console.log("   Để chạy đầy đủ: node export-bao-phe.test.js <path/to/template.xlsx>\n");
  printSummary();
}

function printSummary() {
  console.log(`\n${"─".repeat(52)}`);
  console.log(`Kết quả: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}
