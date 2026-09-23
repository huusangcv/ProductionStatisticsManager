import { Box, Button, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

/**
 * ApplicationLockedView
 *
 * Full-screen lock screen shown when the remote config has appLocked=true.
 * Covers the entire window — no dashboard, no sidebar visible behind it.
 * No click-through possible.
 *
 * Text content is driven by the lockScreen object from remote-config.json.
 * Falls back to safe defaults if the remote config only contained appLocked=true.
 *
 * The ONLY action available is closing the application.
 * No payment, no license input, no bypass button.
 *
 * @param {{ lockScreen: object|null }} props
 */

const DEFAULT_LOCK_SCREEN = {
  title:          "Ứng dụng đã hết hạn sử dụng",
  message:        "Vui lòng gia hạn để tiếp tục sử dụng.",
  price:          2500000,
  currency:       "VNĐ",
  period:         "12 tháng",
  contactMessage: "Vui lòng liên hệ quản trị viên để gia hạn.",
};

/**
 * Format a numeric price with Vietnamese thousand-separators.
 * e.g. 2500000 → "2.500.000"
 */
function formatPrice(value) {
  try {
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  } catch {
    return String(value);
  }
}

function ApplicationLockedView({ lockScreen }) {
  const data = { ...DEFAULT_LOCK_SCREEN, ...(lockScreen || {}) };

  const handleClose = () => {
    window.electronAPI?.window?.close?.();
  };

  return (
    <Box
      sx={{
        position:        "fixed",
        inset:           0,
        zIndex:          9999,
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        // Dark gradient background — feels serious and final
        background:      "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        // Prevent any interaction with whatever might be behind
        pointerEvents:   "all",
        userSelect:      "none",
        overflowY:       "auto",
        p:               3,
      }}
    >
      {/* Card */}
      <Box
        sx={{
          width:           "100%",
          maxWidth:        480,
          borderRadius:    "20px",
          border:          "1px solid rgba(255,255,255,0.10)",
          background:      "rgba(255,255,255,0.04)",
          backdropFilter:  "blur(12px)",
          boxShadow:       "0 24px 64px rgba(0,0,0,0.5)",
          p:               { xs: 4, sm: 5 },
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          gap:             2.5,
          textAlign:       "center",
        }}
      >
        {/* Lock Icon */}
        <Box
          sx={{
            width:          72,
            height:         72,
            borderRadius:   "50%",
            bgcolor:        "rgba(239,68,68,0.15)",
            border:         "1px solid rgba(239,68,68,0.30)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            mb:             0.5,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 36, color: "#ef4444" }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            color:       "#f1f5f9",
            fontWeight:  700,
            fontSize:    "20px",
            lineHeight:  1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {data.title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.60)", fontSize: "14px", lineHeight: 1.6 }}
        >
          {data.message}
        </Typography>

        {/* Divider */}
        <Box sx={{ width: "100%", height: 1, bgcolor: "rgba(255,255,255,0.08)" }} />

        {/* Pricing info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
          <Box
            sx={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              px:             2,
              py:             1.5,
              borderRadius:   "12px",
              bgcolor:        "rgba(255,255,255,0.05)",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
              Phí gia hạn
            </Typography>
            <Typography
              sx={{
                color:      "#60a5fa",
                fontWeight: 700,
                fontSize:   "16px",
                letterSpacing: "-0.01em",
              }}
            >
              {formatPrice(data.price)} {data.currency}
            </Typography>
          </Box>

          <Box
            sx={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              px:             2,
              py:             1.5,
              borderRadius:   "12px",
              bgcolor:        "rgba(255,255,255,0.05)",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
              Thời hạn
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "14px" }}
            >
              {data.period}
            </Typography>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ width: "100%", height: 1, bgcolor: "rgba(255,255,255,0.08)" }} />

        {/* Contact message */}
        <Typography
          sx={{ color: "rgba(255,255,255,0.50)", fontSize: "13px", lineHeight: 1.6 }}
        >
          {data.contactMessage}
        </Typography>

        {/* Close Button — only action available */}
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            mt:             1,
            width:          "100%",
            py:             1.5,
            borderRadius:   "12px",
            bgcolor:        "#ef4444",
            color:          "#fff",
            fontWeight:     700,
            fontSize:       "14px",
            letterSpacing:  "0.01em",
            boxShadow:      "0 4px 16px rgba(239,68,68,0.35)",
            "&:hover": {
              bgcolor:    "#dc2626",
              boxShadow:  "0 6px 20px rgba(239,68,68,0.45)",
            },
            transition: "all 200ms ease",
          }}
        >
          Đóng ứng dụng
        </Button>
      </Box>

      {/* Version / attribution hint at bottom */}
      <Typography
        sx={{
          mt:       3,
          color:    "rgba(255,255,255,0.20)",
          fontSize: "11px",
        }}
      >
        Production Statistics Manager
      </Typography>
    </Box>
  );
}

export default ApplicationLockedView;
