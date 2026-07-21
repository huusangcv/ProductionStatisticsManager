/**
 * PrintConfigCard.jsx — Card UI để cấu hình vùng in cho Template.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel, Button,
  Alert, Divider, Paper, Tooltip, Grid
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";

// ── Column helpers ─────────────────────────────────────────────────────────────

function columnToIndex(letter) {
  if (!letter) return 0;
  const upper = String(letter).toUpperCase().trim();
  if (!/^[A-Z]{1,3}$/.test(upper)) return 0;
  let idx = 0;
  for (let i = 0; i < upper.length; i++) idx = idx * 26 + (upper.charCodeAt(i) - 64);
  return idx;
}

function indexToColumn(n) {
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

const ALL_COLUMNS = Array.from({ length: 702 }, (_, i) => indexToColumn(i + 1));

// ── Preview bar ────────────────────────────────────────────────────────────────

function PrintPreviewBar({ startColumn, endColumn }) {
  const startIdx = columnToIndex(startColumn) || 1;
  const endIdx = columnToIndex(endColumn) || 26;
  const displayCount = Math.max(26, endIdx + 5);
  const cols = Array.from({ length: Math.min(displayCount, 50) }, (_, i) => i + 1);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        Xem trước vùng cột in
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px", p: 1, bgcolor: "grey.50", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
        {cols.map((colIdx) => {
          const label = indexToColumn(colIdx);
          const isPrint = colIdx >= startIdx && colIdx <= endIdx;
          return (
            <Tooltip key={colIdx} title={label} placement="top" arrow>
              <Box sx={{ width: 20, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", fontSize: 9, fontFamily: "monospace", fontWeight: isPrint ? 700 : 400, bgcolor: isPrint ? "primary.main" : "grey.200", color: isPrint ? "primary.contrastText" : "text.disabled", cursor: "default", transition: "background-color 0.15s" }}>
                {label.length <= 2 ? label : "…"}
              </Box>
            </Tooltip>
          );
        })}
        {displayCount > 50 && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", ml: 0.5 }}>…</Typography>
        )}
      </Box>
    </Box>
  );
}

// ── PrintConfigCard ────────────────────────────────────────────────────────

export default function PrintConfigCard({ template, onSave, loading = false }) {
  const [config, setConfig] = useState({
    startColumn: "A", endColumn: "Z"
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (template) {
      setConfig({
        startColumn: (template.print_start_column || "A").toUpperCase(),
        endColumn: (template.print_end_column || "Z").toUpperCase(),
      });
      setError(""); setSuccessMsg("");
    }
  }, [template]);

  const handleChange = (field) => (e) => {
    setConfig(prev => ({ ...prev, [field]: e.target.value }));
    setError(""); setSuccessMsg("");
  };

  const validation = useMemo(() => {
    const si = columnToIndex(config.startColumn);
    const ei = columnToIndex(config.endColumn);
    if (!si || !ei) return { valid: false, msg: "Cột không hợp lệ" };
    if (si > ei) return { valid: false, msg: `Cột bắt đầu (${config.startColumn}) phải ≤ cột kết thúc (${config.endColumn})` };
    return { valid: true, msg: "" };
  }, [config.startColumn, config.endColumn]);

  const handleSave = async () => {
    if (!validation.valid) return;
    setSaving(true); setError(""); setSuccessMsg("");
    try {
      // Dù DB có 13 trường nhưng ta chỉ update startColumn, endColumn
      const result = await onSave(config);
      if (result.success) setSuccessMsg(result.message || "Đã lưu vùng in");
      else setError(result.message || "Lưu thất bại");
    } catch (e) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  if (!template) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PrintOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>CẤU HÌNH VÙNG IN</Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {/* VÙNG CỘT IN */}
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Bắt đầu cột</InputLabel>
            <Select value={config.startColumn} label="Bắt đầu cột" onChange={handleChange("startColumn")} MenuProps={{ PaperProps: { style: { maxHeight: 220 } } }}>
              {ALL_COLUMNS.map(col => <MenuItem key={col} value={col} dense>{col}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Kết thúc cột</InputLabel>
            <Select value={config.endColumn} label="Kết thúc cột" onChange={handleChange("endColumn")} MenuProps={{ PaperProps: { style: { maxHeight: 220 } } }}>
              {ALL_COLUMNS.map(col => <MenuItem key={col} value={col} dense>{col}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <PrintPreviewBar startColumn={config.startColumn} endColumn={config.endColumn} />
        </Grid>
      </Grid>

      {!validation.valid && <Alert severity="error" sx={{ mt: 2, py: 0.5 }}>{validation.msg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mt: 2, py: 0.5 }}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2, py: 0.5 }}>{error}</Alert>}

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={!validation.valid || saving || loading}>
          {saving ? "Đang lưu..." : "Lưu Cấu Hình"}
        </Button>
      </Box>
    </Paper>
  );
}
