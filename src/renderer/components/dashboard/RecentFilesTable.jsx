import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SectionCard from "./SectionCard";

const cellBorder = "1px solid var(--color-border)";
const headerStyle = {
  fontWeight: 800,
  color: "#64748b",
  fontSize: 13,
  borderBottom: cellBorder,
  whiteSpace: "nowrap",
};
const bodyCellStyle = {
  borderBottom: cellBorder,
  fontSize: 14,
  height: 56,
};

function RecentFilesTable({ rows }) {
  return (
    <SectionCard title="Danh sách file gần đây">
      <TableContainer sx={{ overflow: "auto" }}>
        <Table size="small" sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              {["Tên file", "Ngày", "Trạng thái", "Sản lượng", "Người tạo", "Thao tác"].map(
                (col) => (
                  <TableCell key={col} sx={headerStyle}>
                    {col}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} hover>
                <TableCell sx={bodyCellStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: "#eaf2ff", display: "grid",
                        placeItems: "center", color: "#2f6df6",
                      }}
                    >
                      <VisibilityOutlinedIcon style={{ fontSize: 18 }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{row.name}</span>
                  </div>
                </TableCell>
                <TableCell sx={bodyCellStyle}>{row.date}</TableCell>
                <TableCell sx={bodyCellStyle}>
                  <Chip
                    label={row.status}
                    size="small"
                    sx={{
                      borderRadius: 999,
                      fontWeight: 700,
                      bgcolor: row.statusBg,
                      color: row.statusColor,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ ...bodyCellStyle, fontWeight: 700 }}>
                  {row.quantity.toLocaleString("vi-VN")}
                </TableCell>
                <TableCell sx={bodyCellStyle}>{row.creator}</TableCell>
                <TableCell sx={bodyCellStyle}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <ActionIcon tone="#2563eb">
                      <VisibilityOutlinedIcon style={{ fontSize: 17 }} />
                    </ActionIcon>
                    <ActionIcon tone="#f59e0b">
                      <EditOutlinedIcon style={{ fontSize: 17 }} />
                    </ActionIcon>
                    <ActionIcon tone="#ef4444">
                      <DeleteOutlineOutlinedIcon style={{ fontSize: 17 }} />
                    </ActionIcon>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
}

function ActionIcon({ tone, children }) {
  return (
    <IconButton
      size="small"
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        bgcolor: `${tone}12`,
        color: tone,
        border: "1px solid var(--color-border)",
      }}
    >
      {children}
    </IconButton>
  );
}

export default RecentFilesTable;
