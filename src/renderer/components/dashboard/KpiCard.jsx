import { Box, Stack, Typography } from "@mui/material";
import Sparkline from "./Sparkline";

function KpiCard({
  title,
  value,
  suffix,
  delta,
  deltaTone,
  color,
  icon,
  sparkline,
}) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 2, md: 2.25, xl: 2.5 },
        bgcolor: "background.paper",
        border: "1px solid rgba(15, 23, 42, 0.06)",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
        minHeight: { xs: 136, md: 142, xl: 146 },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25} mb={1.25}>
            <Box
              sx={{
                width: { xs: 42, md: 44, xl: 48 },
                height: { xs: 42, md: 44, xl: 48 },
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: `${color}16`,
                color,
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              {title}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: 28, md: 31, xl: 34 },
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
            {suffix ? (
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: { xs: 12.5, md: 13, xl: 14 },
                }}
              >
                {suffix}
              </Typography>
            ) : null}
          </Stack>
          <Typography
            variant="body2"
            sx={{
              mt: 0.75,
              color: deltaTone === "down" ? "#dc2626" : "#16a34a",
              fontWeight: 600,
              fontSize: { xs: 11.5, md: 12.5, xl: 13.5 },
            }}
          >
            {delta}
          </Typography>
        </Box>
        <Box sx={{ width: { xs: 72, md: 80, xl: 88 }, mt: 1 }}>
          <Sparkline values={sparkline} color={color} />
        </Box>
      </Stack>
    </Box>
  );
}

export default KpiCard;
