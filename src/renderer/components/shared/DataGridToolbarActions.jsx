import { Box, Button } from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from "@mui/x-data-grid";

/**
 * Enterprise Shared DataGrid Toolbar
 * Ensures identical layout, spacing, sizing, and button styling across all DataGrid pages.
 *
 * @param {boolean} hasExport - Whether to show the standard MUI Export button
 * @param {React.ReactNode} rightActions - Elements rendered on the right side (Date Picker, custom buttons)
 */
export default function DataGridToolbarActions({ hasExport = true, rightActions }) {
  return (
    <GridToolbarContainer
      sx={{
        minHeight: 48,
        padding: "0 0 8px 0",
        marginBottom: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "transparent",
      }}
    >
      {/* Left Section (Fixed standard order) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        {hasExport && <GridToolbarExport />}
      </Box>

      {/* Right Section (Page-specific actions) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {rightActions}
      </Box>
    </GridToolbarContainer>
  );
}

// ── Shared Standard Buttons for Right Actions ────────────────────────────────

export const StandardButton = ({
  primary,
  icon,
  label,
  loading,
  disabled,
  onClick,
  ...props
}) => (
  <Button
    variant={primary ? "contained" : "outlined"}
    color={primary ? "primary" : "secondary"}
    disableElevation={primary}
    startIcon={icon}
    disabled={disabled || loading}
    onClick={onClick}
    sx={{
      height: 38,
      borderRadius: "8px",
      fontWeight: 600,
      textTransform: "none",
    }}
    {...props}
  >
    {loading ? "Đang xử lý..." : label}
  </Button>
);
