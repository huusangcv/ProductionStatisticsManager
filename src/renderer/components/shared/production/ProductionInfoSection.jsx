import { Box, Typography, Divider } from "@mui/material";

export function InfoRow({ label, value, valueColor = "text.primary" }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: valueColor,
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function ProductionInfoSection({ title, children }) {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          textTransform: "uppercase",
          color: "text.secondary",
          mb: 1,
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default ProductionInfoSection;
