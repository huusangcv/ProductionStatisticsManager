import { Box, Chip, Stack, Typography } from "@mui/material";
import SectionCard from "./SectionCard";

function BarChartPanel({ title, periodLabel, bars, scaleLabels, hoverTable }) {
  const maxValue = Math.max(...bars.map((item) => item.value));

  return (
    <SectionCard
      title={title}
      action={
        <Chip
          label={periodLabel}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 999 }}
        />
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.9fr" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ minHeight: { xs: 260, md: 280, xl: 290 } }}>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="flex-end"
            sx={{ height: { xs: 210, md: 220, xl: 230 }, pt: 1 }}
          >
            {bars.map((item) => (
              <Box
                key={item.label}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary" }}
                >
                  {item.value.toLocaleString("vi-VN")}
                </Typography>
                <Box
                  sx={{
                    width: "68%",
                    minWidth: 26,
                    height: `${(item.value / maxValue) * 160 + 22}px`,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}CC 100%)`,
                    boxShadow: `0 10px 20px ${item.color}22`,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 1.5,
              pr: 1,
            }}
          >
            {scaleLabels.map((label) => (
              <Typography
                key={label}
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                {label}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            borderRadius: 3,
            bgcolor: "#f8fafc",
            border: "1px solid rgba(15, 23, 42, 0.06)",
            p: { xs: 1.5, md: 1.75, xl: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              fontSize: { xs: 13, md: 13.5, xl: 14 },
            }}
          >
            Bảng dữ liệu điểm
          </Typography>
          {hoverTable.map((row) => (
            <Stack
              key={row.label}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: row.trend === "up" ? "#16a34a" : "#2563eb",
                  fontWeight: 700,
                }}
              >
                {row.value}
              </Typography>
            </Stack>
          ))}
          <Box
            sx={{
              mt: "auto",
              pt: 1.5,
              borderTop: "1px dashed rgba(15, 23, 42, 0.12)",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Mô phỏng bảng giá trị khi rê chuột lên cột dữ liệu.
            </Typography>
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );
}

export default BarChartPanel;
