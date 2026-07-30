import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/**
 * VerificationBanner — Băng đối soát phía trên grid nhập liệu Báo Phế.
 *
 * Props:
 *  - inputRows      : số dòng đã nhập ít nhất 1 nguyên nhân
 *  - totalRows      : tổng số dòng phế trong ngày (từ DB)
 *  - inputTotal     : tổng SL phế đã nhập (tongCong của từng dòng có data)
 *  - refTotal       : tổng scrap_quantity gốc từ DB
 */
export default function VerificationBanner({ inputRows, totalRows, inputTotal, refTotal }) {
  const rowsMatch  = inputRows  === totalRows  && totalRows  > 0;
  const totalMatch = inputTotal === refTotal   && refTotal   > 0;
  const allMatch   = rowsMatch && totalMatch;

  const color    = allMatch ? "#16a34a" : "#d97706";   // xanh lá / vàng amber
  const bgColor  = allMatch ? "#f0fdf4" : "#fffbeb";
  const bdColor  = allMatch ? "#86efac" : "#fcd34d";
  const Icon     = allMatch ? CheckCircleOutlineIcon : WarningAmberIcon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: "7px",
        borderRadius: "8px",
        border: `1px solid ${bdColor}`,
        bgcolor: bgColor,
        mb: "10px",
        flexWrap: "wrap",
      }}
    >
      <Icon sx={{ fontSize: 18, color, flexShrink: 0 }} />

      {/* Dòng đã nhập */}
      <Typography variant="caption" sx={{ fontSize: "11.5px", fontWeight: 600, color }}>
        Đã nhập:{" "}
        <span style={{ fontWeight: 700 }}>
          {inputRows}/{totalRows}
        </span>{" "}
        dòng
      </Typography>

      <Box sx={{ width: "1px", height: "14px", bgcolor: bdColor }} />

      {/* Tổng SL phế */}
      <Typography variant="caption" sx={{ fontSize: "11.5px", fontWeight: 600, color }}>
        Tổng SL phế:{" "}
        <span style={{ fontWeight: 700 }}>
          {inputTotal}
        </span>
        {" / "}
        <span style={{ color: "#64748b" }}>
          {refTotal} (gốc)
        </span>
      </Typography>

      <Box sx={{ width: "1px", height: "14px", bgcolor: bdColor }} />

      {/* Trạng thái */}
      <Typography variant="caption" sx={{ fontSize: "11.5px", fontStyle: "italic", color }}>
        {allMatch
          ? "✓ Đã khớp — sẵn sàng xuất file"
          : `⚠ Chưa khớp — còn ${totalRows - inputRows} dòng chưa phân loại nguyên nhân`}
      </Typography>
    </Box>
  );
}

VerificationBanner.propTypes = {
  inputRows:  PropTypes.number.isRequired,
  totalRows:  PropTypes.number.isRequired,
  inputTotal: PropTypes.number.isRequired,
  refTotal:   PropTypes.number.isRequired,
};
