import { Avatar, Box, LinearProgress, Stack, Typography } from "@mui/material";
import SectionCard from "./SectionCard";

function LeaderboardPanel({ title, items }) {
  return (
    <SectionCard title={title}>
      <Stack spacing={1.5}>
        {items.map((item, index) => (
          <Stack
            key={item.name}
            direction="row"
            alignItems="center"
            spacing={1.25}
          >
            <Typography
              sx={{
                width: 18,
                fontSize: 13,
                fontWeight: 800,
                color: "text.secondary",
              }}
            >
              {index + 1}
            </Typography>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: item.color,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {item.shortName}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                mb={0.75}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {item.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 800, color: "text.secondary" }}
                >
                  {item.value.toLocaleString("vi-VN")}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={item.percent}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  bgcolor: "rgba(37, 99, 235, 0.12)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, #2f6df6 0%, #6aa7ff 100%)",
                  },
                }}
              />
            </Box>
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}

export default LeaderboardPanel;
