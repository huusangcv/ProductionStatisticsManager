import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SectionCard from "./SectionCard";

function RecentFilesTable({ rows }) {
  return (
    <SectionCard title="Danh sách file gần đây">
      <TableContainer sx={{ overflow: "auto" }}>
        <Table size="small" sx={{ minWidth: { xs: 640, md: 700, xl: 720 } }}>
          <TableHead>
            <TableRow>
              {[
                "Tên file",
                "Ngày",
                "Trạng thái",
                "Sản lượng",
                "Người tạo",
                "Thao tác",
              ].map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 800,
                    color: "text.secondary",
                    borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} hover>
                <TableCell
                  sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: "#eaf2ff",
                        display: "grid",
                        placeItems: "center",
                        color: "#2f6df6",
                      }}
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
                >
                  {row.date}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
                >
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
                <TableCell
                  sx={{
                    borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
                    fontWeight: 700,
                  }}
                >
                  {row.quantity.toLocaleString("vi-VN")}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
                >
                  {row.creator}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
                >
                  <Stack direction="row" spacing={0.5}>
                    <ActionIcon tone="#2563eb">
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </ActionIcon>
                    <ActionIcon tone="#f59e0b">
                      <EditOutlinedIcon sx={{ fontSize: 17 }} />
                    </ActionIcon>
                    <ActionIcon tone="#ef4444">
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </ActionIcon>
                  </Stack>
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
        width: 32,
        height: 32,
        borderRadius: 2,
        bgcolor: `${tone}12`,
        color: tone,
        border: "1px solid rgba(15, 23, 42, 0.06)",
      }}
    >
      {children}
    </IconButton>
  );
}

export default RecentFilesTable;
