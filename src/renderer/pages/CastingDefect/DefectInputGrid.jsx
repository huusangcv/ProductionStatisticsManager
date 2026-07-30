import { useRef, useCallback, useMemo, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";

// ── HẰNG SỐ ──────────────────────────────────────────────────────────────────

/**
 * 16 cột nguyên nhân không đạt, theo đúng thứ tự G→V trong template.
 * key  : trường trong object defects
 * label: tiêu đề hiển thị trên header (ngắn để vừa cột hẹp)
 */
export const DEFECT_COLS = [
  { key: "catPham",      label: "Cắt phạm"       },
  { key: "maiPham",      label: "Mài phạm"        },
  { key: "xiHo",         label: "Xì hồ"           },
  { key: "ducThieu",     label: "Đúc thiếu"       },
  { key: "loCat",        label: "Lổ cát"          },
  { key: "loKhi",        label: "Lổ khí"          },
  { key: "lungLo",       label: "Lủng lổ"         },
  { key: "bienDang",     label: "Biến dạng"       },
  { key: "matNet",       label: "Mất nét"         },
  { key: "kepCat",       label: "Kẹp cát"         },
  { key: "vetNut",       label: "Vết nứt"         },
  { key: "saiKichThuoc", label: "Sai KT"          },
  { key: "kepSat",       label: "Kẹp sắt"         },
  { key: "lanhNgat",     label: "Lạnh ngắt"       },
  { key: "loXi",         label: "Lỗ xỉ"           },
  { key: "khac",         label: "Khác"            },
];

/**
 * Thứ tự ưu tiên tra chất liệu — PHẢI đồng bộ với export-bao-phe.js
 */
const MATERIAL_PRIORITY = [
  "CF3M", "CF8M", "WCB", "CW12MW", "CX2MW", "CD3MN",
  "CD3MWCuN", "CN7M", "LCC", "M35", "CF8", "316", "304",
];

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Tra chất liệu từ chuỗi quy cách.
 * @param {string} quyCach
 * @returns {string}
 */
export function getChatLieu(quyCach) {
  const s = String(quyCach || "");
  for (const m of MATERIAL_PRIORITY) {
    if (s.includes(m)) return m;
  }
  return "";
}

/**
 * Xác định loại sản phẩm: "ỐNG" hoặc "VAN".
 * @param {string} tenHang
 * @param {string} quyCach
 * @returns {string}
 */
export function getLoai(tenHang, quyCach) {
  const ten = String(tenHang || "");
  const qc  = String(quyCach || "");
  if (ten.includes("OM-06")) return "ỐNG";
  if (qc.startsWith("DN") || qc.startsWith("NPS") || ten.includes("LADISH")) return "VAN";
  return "ỐNG";
}

/**
 * Tính tổng cộng 16 cột defect cho một dòng.
 * @param {object} defects
 * @returns {number}
 */
export function calcTongCong(defects) {
  return DEFECT_COLS.reduce((s, { key }) => s + (Number(defects[key]) || 0), 0);
}

/**
 * Tính tổng trọng lượng phế cho một dòng.
 * @param {number} tongCong
 * @param {number} unitWeight
 * @returns {number}
 */
export function calcTongTrongLuong(tongCong, unitWeight) {
  return Math.round(tongCong * (unitWeight || 0) * 100) / 100;
}

// ── STYLE CONSTANTS ───────────────────────────────────────────────────────────

const HEADER_BG   = "#1e2d4a";
const HEADER_TEXT = "#c8d6ef";
const ROW_EVEN    = "#ffffff";
const ROW_ODD     = "#f8fafd";
const CELL_FOCUS  = "#eef4ff";
const CELL_ACTIVE = "#dbeafe";
const INPUT_HAS_VAL = "#f0f9ff";
const BORDER_COLOR = "rgba(99,126,179,0.18)";
const READ_CELL_BG = "#f1f5f9";
const FONT_SIZE    = "11px";
const ROW_HEIGHT   = 28;

// Độ rộng cột cố định (px)
const COL_WIDTHS = {
  stt:          36,
  maCongDon:   100,
  tenHang:     160,
  quyCach:     120,
  chatLieu:     62,
  loai:         48,
  defect:       56,   // mỗi 1 trong 16 cột nguyên nhân
  tongCong:     52,
  trongLuong:   52,
  tongTL:       60,
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

/** Ô header */
function Th({ children, width, align = "center", sticky = false, stickyLeft = 0 }) {
  return (
    <th
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        background: HEADER_BG,
        color: HEADER_TEXT,
        fontSize: "10.5px",
        fontWeight: 600,
        textAlign: align,
        padding: "4px 4px",
        borderRight: `1px solid rgba(255,255,255,0.08)`,
        borderBottom: `1px solid rgba(255,255,255,0.12)`,
        position: sticky ? "sticky" : "static",
        left: sticky ? stickyLeft : undefined,
        zIndex: sticky ? 4 : 3,
        whiteSpace: "pre-line",
        lineHeight: 1.25,
        userSelect: "none",
      }}
    >
      {children}
    </th>
  );
}

/** Ô read-only */
function ReadCell({ children, width, align = "left", sticky = false, stickyLeft = 0, bg = READ_CELL_BG }) {
  return (
    <td
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        background: bg,
        color: "#334155",
        fontSize: FONT_SIZE,
        padding: "2px 5px",
        borderRight: `0.5px solid ${BORDER_COLOR}`,
        borderBottom: `0.5px solid ${BORDER_COLOR}`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        position: sticky ? "sticky" : "static",
        left: sticky ? stickyLeft : undefined,
        zIndex: sticky ? 2 : 1,
      }}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </td>
  );
}

/** Ô input số */
function NumCell({ rowIdx, colKey, value, onChange, onKeyDown, inputRef, width }) {
  const hasVal = Number(value) > 0;

  return (
    <td
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        padding: 0,
        borderRight: `0.5px solid ${BORDER_COLOR}`,
        borderBottom: `0.5px solid ${BORDER_COLOR}`,
        background: hasVal ? INPUT_HAS_VAL : "transparent",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "" : String(value)}
        placeholder=""
        onChange={(e) => {
          // Chỉ cho phép ký tự số nguyên không âm
          const raw = e.target.value.replace(/[^0-9]/g, "");
          const v = raw === "" ? 0 : parseInt(raw, 10);
          onChange(rowIdx, colKey, v < 0 ? 0 : v);
        }}
        onKeyDown={(e) => onKeyDown(e, rowIdx, colKey)}
        style={{
          width: "100%",
          height: ROW_HEIGHT - 1 + "px",
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: FONT_SIZE,
          textAlign: "right",
          padding: "0 4px",
          color: hasVal ? "#1d4ed8" : "#64748b",
          fontWeight: hasVal ? 600 : 400,
          cursor: "text",
        }}
        onFocus={(e) => { e.target.style.background = CELL_ACTIVE; }}
        onBlur={(e)  => { e.target.style.background = "transparent"; }}
      />
    </td>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

/**
 * DefectInputGrid — Lưới nhập liệu Báo Phế kiểu Excel.
 *
 * Props:
 *  - rows      : array of row objects (xem CastingDefectPage cho cấu trúc)
 *  - onRowChange(idx, defects) : callback khi defects của dòng idx thay đổi
 */
export default function DefectInputGrid({ rows, onRowChange }) {
  // ref[rowIdx][colKey] → input element
  const inputRefs = useRef([]);

  // Khởi tạo ref array khi rows thay đổi độ dài
  useEffect(() => {
    inputRefs.current = rows.map((_, ri) =>
      inputRefs.current[ri] ||
      Object.fromEntries(DEFECT_COLS.map(({ key }) => [key, null]))
    );
  }, [rows.length]);

  const setRef = useCallback((ri, key, el) => {
    if (!inputRefs.current[ri]) {
      inputRefs.current[ri] = {};
    }
    inputRefs.current[ri][key] = el;
  }, []);

  /** Xử lý thay đổi giá trị một ô */
  const handleChange = useCallback((rowIdx, colKey, numVal) => {
    const newDefects = { ...rows[rowIdx].defects, [colKey]: numVal };
    onRowChange(rowIdx, newDefects);
  }, [rows, onRowChange]);

  /** Tab / Enter / Arrow keys để di chuyển giữa các ô */
  const handleKeyDown = useCallback((e, rowIdx, colKey) => {
    const colIdx = DEFECT_COLS.findIndex((c) => c.key === colKey);
    let nextRow = rowIdx, nextCol = colIdx;

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        nextCol -= 1;
        if (nextCol < 0) { nextCol = DEFECT_COLS.length - 1; nextRow -= 1; }
      } else {
        nextCol += 1;
        if (nextCol >= DEFECT_COLS.length) { nextCol = 0; nextRow += 1; }
      }
    } else if (e.key === "ArrowRight") {
      // Chỉ di chuyển cột khi cursor ở cuối chuỗi hoặc ô rỗng
      e.preventDefault();
      nextCol += 1;
      if (nextCol >= DEFECT_COLS.length) nextCol = DEFECT_COLS.length - 1;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextCol -= 1;
      if (nextCol < 0) nextCol = 0;
    } else if (e.key === "ArrowDown") {
      // QUAN TRỌNG: preventDefault ngăn browser tự +1 vào number input
      e.preventDefault();
      nextRow += 1;
    } else if (e.key === "ArrowUp") {
      // QUAN TRỌNG: preventDefault ngăn browser tự -1 vào number input
      e.preventDefault();
      nextRow -= 1;
    } else {
      return;
    }

    nextRow = Math.max(0, Math.min(nextRow, rows.length - 1));
    nextCol = Math.max(0, Math.min(nextCol, DEFECT_COLS.length - 1));
    const nextKey = DEFECT_COLS[nextCol].key;
    inputRefs.current[nextRow]?.[nextKey]?.focus();
  }, [rows.length]);

  // Tính sticky left offsets (STT + maCongDon + tenHang + quyCach đều sticky)
  const stickyOffsets = useMemo(() => {
    const sttW     = COL_WIDTHS.stt;
    const maW      = COL_WIDTHS.maCongDon;
    const tenW     = COL_WIDTHS.tenHang;
    const qcW      = COL_WIDTHS.quyCach;
    return {
      stt:      0,
      maCongDon: sttW,
      tenHang:   sttW + maW,
      quyCach:   sttW + maW + tenW,
      chatLieu:  sttW + maW + tenW + qcW,
    };
  }, []);

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        Không có dữ liệu phế trong ngày đã chọn.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        borderRadius: "8px",
        border: `1px solid ${BORDER_COLOR}`,
        "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          tableLayout: "fixed",
          width: "max-content",
          minWidth: "100%",
        }}
      >
        {/* ── COLGROUP ── */}
        <colgroup>
          <col style={{ width: COL_WIDTHS.stt }} />
          <col style={{ width: COL_WIDTHS.maCongDon }} />
          <col style={{ width: COL_WIDTHS.tenHang }} />
          <col style={{ width: COL_WIDTHS.quyCach }} />
          <col style={{ width: COL_WIDTHS.chatLieu }} />
          <col style={{ width: COL_WIDTHS.loai }} />
          {DEFECT_COLS.map(({ key }) => (
            <col key={key} style={{ width: COL_WIDTHS.defect }} />
          ))}
          <col style={{ width: COL_WIDTHS.tongCong }} />
          <col style={{ width: COL_WIDTHS.trongLuong }} />
          <col style={{ width: COL_WIDTHS.tongTL }} />
        </colgroup>

        {/* ── THEAD ── */}
        <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
          <tr>
            <Th width={COL_WIDTHS.stt}        sticky stickyLeft={stickyOffsets.stt}      >STT</Th>
            <Th width={COL_WIDTHS.maCongDon}  sticky stickyLeft={stickyOffsets.maCongDon} align="left">Mã công đơn</Th>
            <Th width={COL_WIDTHS.tenHang}    sticky stickyLeft={stickyOffsets.tenHang}   align="left">Tên hàng</Th>
            <Th width={COL_WIDTHS.quyCach}    sticky stickyLeft={stickyOffsets.quyCach}   align="left">Quy cách</Th>
            <Th width={COL_WIDTHS.chatLieu}   sticky stickyLeft={stickyOffsets.chatLieu}  >Chất liệu</Th>
            <Th width={COL_WIDTHS.loai}                                                   >Loại</Th>
            {DEFECT_COLS.map(({ key, label }) => (
              <Th key={key} width={COL_WIDTHS.defect}>{label}</Th>
            ))}
            <Th width={COL_WIDTHS.tongCong}  >Tổng{"\n"}cộng</Th>
            <Th width={COL_WIDTHS.trongLuong}>TL{"\n"}đơn vị</Th>
            <Th width={COL_WIDTHS.tongTL}    >Tổng{"\n"}TL (kg)</Th>
          </tr>
        </thead>

        {/* ── TBODY ── */}
        <tbody>
          {rows.map((row, ri) => {
            const isOdd      = ri % 2 === 1;
            const rowBg      = isOdd ? ROW_ODD : ROW_EVEN;
            const tongCong   = calcTongCong(row.defects);
            const tongTL     = calcTongTrongLuong(tongCong, row.unit_weight);
            const chatLieu   = getChatLieu(row.specification);
            const loai       = getLoai(row.item_name, row.specification);

            return (
              <tr
                key={row.id || ri}
                style={{
                  height: ROW_HEIGHT,
                  background: rowBg,
                  transition: "background 0.1s",
                }}
              >
                {/* STT */}
                <ReadCell width={COL_WIDTHS.stt} align="center" sticky stickyLeft={stickyOffsets.stt} bg={rowBg}>
                  {ri + 1}
                </ReadCell>

                {/* Mã công đơn */}
                <ReadCell width={COL_WIDTHS.maCongDon} sticky stickyLeft={stickyOffsets.maCongDon} bg={rowBg}>
                  {row.work_order_number}
                </ReadCell>

                {/* Tên hàng */}
                <ReadCell width={COL_WIDTHS.tenHang} sticky stickyLeft={stickyOffsets.tenHang} bg={rowBg}>
                  {row.item_name}
                </ReadCell>

                {/* Quy cách */}
                <ReadCell width={COL_WIDTHS.quyCach} sticky stickyLeft={stickyOffsets.quyCach} bg={rowBg}>
                  {row.specification}
                </ReadCell>

                {/* Chất liệu */}
                <ReadCell
                  width={COL_WIDTHS.chatLieu}
                  align="center"
                  sticky
                  stickyLeft={stickyOffsets.chatLieu}
                  bg={rowBg}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: chatLieu ? "#1d4ed8" : "#94a3b8",
                      fontFamily: "monospace",
                    }}
                  >
                    {chatLieu || "—"}
                  </Typography>
                </ReadCell>

                {/* Loại */}
                <ReadCell width={COL_WIDTHS.loai} align="center" bg={rowBg}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: loai === "VAN" ? "#7c3aed" : "#0369a1",
                      bgcolor: loai === "VAN" ? "#f3e8ff" : "#e0f2fe",
                      borderRadius: "3px",
                      px: "3px",
                    }}
                  >
                    {loai}
                  </Typography>
                </ReadCell>

                {/* 16 cột defect */}
                {DEFECT_COLS.map(({ key }) => (
                  <NumCell
                    key={key}
                    rowIdx={ri}
                    colKey={key}
                    value={row.defects[key] || 0}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    inputRef={(el) => setRef(ri, key, el)}
                    width={COL_WIDTHS.defect}
                  />
                ))}

                {/* Tổng cộng */}
                <ReadCell width={COL_WIDTHS.tongCong} align="right" bg={tongCong > 0 ? "#fef9c3" : rowBg}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: FONT_SIZE,
                      fontWeight: tongCong > 0 ? 700 : 400,
                      color: tongCong > 0 ? "#b45309" : "#94a3b8",
                    }}
                  >
                    {tongCong || ""}
                  </Typography>
                </ReadCell>

                {/* TL đơn vị */}
                <ReadCell width={COL_WIDTHS.trongLuong} align="right" bg={rowBg}>
                  {row.unit_weight ? Number(row.unit_weight).toFixed(2) : ""}
                </ReadCell>

                {/* Tổng TL */}
                <ReadCell width={COL_WIDTHS.tongTL} align="right" bg={tongTL > 0 ? "#fef9c3" : rowBg}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: FONT_SIZE,
                      fontWeight: tongTL > 0 ? 700 : 400,
                      color: tongTL > 0 ? "#b45309" : "#94a3b8",
                    }}
                  >
                    {tongTL > 0 ? tongTL.toFixed(2) : ""}
                  </Typography>
                </ReadCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}

DefectInputGrid.propTypes = {
  rows:        PropTypes.array.isRequired,
  onRowChange: PropTypes.func.isRequired,
};
