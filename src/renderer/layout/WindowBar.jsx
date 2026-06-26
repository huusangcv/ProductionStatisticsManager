import { Box, IconButton, Stack, Typography } from "@mui/material";
import MinimizeRoundedIcon from "@mui/icons-material/MinimizeRounded";
import CropSquareRoundedIcon from "@mui/icons-material/CropSquareRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

function WindowBar() {
  return (
    <Box
      sx={{
        height: 24,
        px: 1.5,
        bgcolor: "#0a1d3d",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        userSelect: "none",
        WebkitAppRegion: "drag",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <DashboardOutlinedIcon sx={{ fontSize: 18 }} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
        >
          Production Statistics Manager
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.25} sx={{ WebkitAppRegion: "no-drag" }}>
        <IconButton
          size="small"
          onClick={() => window.electronAPI?.window?.minimize()}
          sx={windowButtonSx}
          aria-label="Thu nhỏ"
        >
          <MinimizeRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => window.electronAPI?.window?.maximizeToggle()}
          sx={windowButtonSx}
          aria-label="Phóng to/Thu nhỏ"
        >
          <CropSquareRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => window.electronAPI?.window?.close()}
          sx={{
            ...windowButtonSx,
            "&:hover": { bgcolor: "#ef4444", color: "#fff" },
          }}
          aria-label="Đóng"
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}

const windowButtonSx = {
  width: 32,
  height: 18,
  borderRadius: 1,
  color: "rgba(255,255,255,0.85)",
  "&:hover": {
    bgcolor: "rgba(255,255,255,0.12)",
  },
};

export default WindowBar;
