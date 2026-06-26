import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SectionCard from "./SectionCard";

function ImportPanel({ files }) {
  return (
    <SectionCard title="Import Excel">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "0.95fr 1.05fr" },
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            border: "1.5px dashed rgba(37, 99, 235, 0.26)",
            borderRadius: 4,
            bgcolor: "#f8fbff",
            p: { xs: 2.25, md: 2.5, xl: 3 },
            minHeight: { xs: 220, md: 230, xl: 240 },
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                bgcolor: "#eaf2ff",
                color: "#2f6df6",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 46 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, fontSize: { xs: 16, md: 17 } }}
              >
                Kéo & thả file Excel vào đây
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.75,
                  fontSize: { xs: 12.5, xl: 14 },
                }}
              >
                Hoặc chọn file để tạo mô phỏng luồng nhập dữ liệu.
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1.05,
                textTransform: "none",
                fontWeight: 700,
                fontSize: { xs: 12.5, xl: 13.5 },
              }}
            >
              Chọn file từ máy
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Hỗ trợ định dạng .xlsx, .xlsm, tối đa 50MB
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={1.25}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              File vừa nhập
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Mô phỏng tiến trình nhập
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {files.map((file) => (
              <Box
                key={file.name}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  border: "1px solid rgba(15, 23, 42, 0.06)",
                  bgcolor: "background.paper",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: "#eaf2ff",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <InsertDriveFileOutlinedIcon
                      sx={{ color: "#2f6df6", fontSize: 18 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {file.meta}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: file.tone }}
                  >
                    {file.status}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={file.progress}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "rgba(37, 99, 235, 0.1)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      background: file.bar,
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
    </SectionCard>
  );
}

export default ImportPanel;
