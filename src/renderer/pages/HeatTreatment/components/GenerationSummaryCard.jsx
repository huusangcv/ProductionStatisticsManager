import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Button,
  Chip,
  Grid,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";

// ── StatCell ──────────────────────────────────────────────────────────────────

function StatCell({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: color || "text.primary", lineHeight: 1 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── GenerationSummaryCard ─────────────────────────────────────────────────────

/**
 * Shows the result of a successful Heat Treatment generation.
 *
 * Props:
 *   result  {object}   The IPC result payload from heatTreatment:generate
 *   onOpenFolder  {function}
 *   onOpenFile    {function}
 *   onPrint       {function}
 */
export default function GenerationSummaryCard({ result, onOpenFolder, onOpenFile, onPrint }) {
  if (!result) return null;

  const durationSec = (result.durationMs / 1000).toFixed(2);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: "primary.light",
        bgcolor: "primary.50",
      }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <CheckCircleIcon sx={{ color: "success.main", fontSize: 22 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Xuất thành công
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thời gian xử lý: {durationSec}s
            </Typography>
          </Box>
          <Chip
            icon={<WhatshotOutlinedIcon sx={{ fontSize: 14 }} />}
            label="Heat Treatment"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Stack>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <StatCell label="Tổng dòng" value={result.totalRows} />
          </Grid>
          <Grid item xs={3}>
            <StatCell label="XLN" value={result.xlnCount} color="warning.dark" />
          </Grid>
          <Grid item xs={3}>
            <StatCell label="NO" value={result.noCount} color="info.dark" />
          </Grid>
          <Grid item xs={3}>
            <StatCell label="Tổng SL" value={result.totalCompletedQty} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {/* File info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            File đã lưu:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "monospace",
              fontSize: 11,
              bgcolor: "grey.100",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              mt: 0.5,
              wordBreak: "break-all",
            }}
          >
            {result.filePath}
          </Typography>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderOpenIcon />}
            onClick={() => onOpenFolder(result.folderPath)}
          >
            Mở thư mục
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={() => onOpenFile(result.filePath)}
            disableElevation
          >
            Mở Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => onPrint(result.filePath)}
          >
            In lại
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
