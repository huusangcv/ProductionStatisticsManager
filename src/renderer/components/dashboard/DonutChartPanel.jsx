import { Box, Stack, Typography } from "@mui/material";
import SectionCard from "./SectionCard";

function DonutChartPanel({
  title,
  total,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftPercent,
  rightPercent,
}) {
  return (
    <SectionCard title={title}>
      <Stack alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: { xs: 176, md: 200, xl: 220 },
            height: { xs: 176, md: 200, xl: 220 },
            borderRadius: "50%",
            background: "conic-gradient(#2f6df6 0% 60%, #58c7c3 60% 100%)",
            display: "grid",
            placeItems: "center",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: { xs: 108, md: 120, xl: 132 },
              height: { xs: 108, md: 120, xl: 132 },
              borderRadius: "50%",
              bgcolor: "background.paper",
              display: "grid",
              placeItems: "center",
              boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.06)",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: 20, md: 22, xl: 24 },
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {total}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Tổng sản lượng
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={1.75}
          justifyContent="center"
          flexWrap="wrap"
        >
          <LegendItem
            color="#2f6df6"
            label={leftLabel}
            value={leftValue}
            percent={leftPercent}
          />
          <LegendItem
            color="#58c7c3"
            label={rightLabel}
            value={rightValue}
            percent={rightPercent}
          />
        </Stack>
      </Stack>
    </SectionCard>
  );
}

function LegendItem({ color, label, value, percent }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ minWidth: { xs: 140, md: 150, xl: 160 } }}
    >
      <Box
        sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color }}
      />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {value} ({percent})
        </Typography>
      </Box>
    </Stack>
  );
}

export default DonutChartPanel;
