import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
  TextField,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import DefectInputGrid, { DEFECT_COLS, calcTongCong } from "./DefectInputGrid";
import VerificationBanner from "./VerificationBanner";

// ── HELPER ────────────────────────────────────────────────────────────────────

/** Tạo object defects rỗng với 16 key = 0 */
function emptyDefects() {
  return Object.fromEntries(DEFECT_COLS.map(({ key }) => [key, 0]));
}

/** Định dạng Date → "DD.MM.YYYY" */
function toDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

// ── BUTTON STYLE PRESETS ──────────────────────────────────────────────────────

const btnPrimary = {
  height: 34,
  borderRadius: "7px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "12px",
  px: 2,
  bgcolor: "#2f6fed",
  "&:hover": { bgcolor: "#1a53c9" },
};

const btnOutlined = {
  height: 34,
  borderRadius: "7px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "12px",
  px: 2,
  color: "#2f6fed",
  borderColor: "#2f6fed",
  bgcolor: "#fff",
  "&:hover": { bgcolor: "#f0f6ff", borderColor: "#1a53c9" },
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function CastingDefectPage() {
  // ── Ngày lọc ──
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [loadingData, setLoadingData] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // ── Dữ liệu grid ──
  const [gridRows, setGridRows] = useState([]);

  // ── Tóm tắt đối soát từ DB (không thay đổi khi nhập liệu) ──
  const [refSummary, setRefSummary] = useState({ totalRows: 0, totalScrap: 0 });

  // ── Trạng thái xuất file ──
  const [exporting, setExporting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const saveTimeoutRef = useRef(null);

  // ── Snackbar ──
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Khởi tạo ngày gần nhất ──
  useEffect(() => {
    async function initDate() {
      if (window.electronAPI.baoPhe.getLatestDate) {
        const res = await window.electronAPI.baoPhe.getLatestDate();
        if (res.ok && res.date) {
          setFilterDate(res.date);
        }
      }
    }
    initDate();
  }, []);

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!filterDate) return;
    setLoadingData(true);
    setGridRows([]);
    try {
      const [candidatesRes, summaryRes, savedRes] = await Promise.all([
        window.electronAPI.baoPhe.getCandidates(filterDate),
        window.electronAPI.baoPhe.getSummary(filterDate),
        window.electronAPI.baoPhe.loadSavedRows ? window.electronAPI.baoPhe.loadSavedRows(filterDate) : Promise.resolve({ ok: false }),
      ]);

      if (candidatesRes.ok) {
        const savedData = savedRes.ok ? savedRes.rows : {};
        // Khởi tạo gridRows: kết hợp dữ liệu đã lưu nếu có
        setGridRows(
          (candidatesRes.rows || []).map((r) => {
            const existingDefects = savedData[r.id];
            return {
              ...r,
              defects: existingDefects ? { ...emptyDefects(), ...existingDefects } : emptyDefects(),
            };
          })
        );
      } else {
        showSnackbar("Lỗi tải dữ liệu: " + candidatesRes.message, "error");
      }

      if (summaryRes.ok) {
        setRefSummary({ totalRows: summaryRes.totalRows, totalScrap: summaryRes.totalScrap });
      }
    } catch (err) {
      showSnackbar("Lỗi tải dữ liệu: " + err.message, "error");
    } finally {
      setLoadingData(false);
    }
  }, [filterDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Xử lý thay đổi defects ────────────────────────────────────────────────

  const handleRowChange = useCallback((rowIdx, newDefects) => {
    setGridRows((prev) => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], defects: newDefects };

      // Tự động lưu sau 1 giây
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (window.electronAPI.baoPhe.saveAllRows) {
          window.electronAPI.baoPhe.saveAllRows(filterDate, updated).catch(err => {
            console.error("Auto-save failed:", err);
          });
        }
      }, 1000);

      return updated;
    });
  }, [filterDate]);

  // ── Tính toán trực tiếp cho băng đối soát ────────────────────────────────

  const { inputRows, inputTotal } = useMemo(() => {
    let rows = 0, total = 0;
    for (const r of gridRows) {
      const tc = calcTongCong(r.defects);
      if (tc > 0) { rows++; total += tc; }
    }
    return { inputRows: rows, inputTotal: total };
  }, [gridRows]);

  // ── Xây dựng candidates để gửi sang main process ─────────────────────────

  const buildCandidates = useCallback(() => {
    return gridRows.map((r) => ({
      maCongDon: r.work_order_number,
      tenSanPham: r.item_name,
      quyCach: r.specification,
      trongLuongDonVi: r.unit_weight || 0,
      scrapQuantity: r.scrap_quantity || 0,
      defects: r.defects,
    }));
  }, [gridRows]);

  // ── Xuất 2 file Excel ────────────────────────────────────────────────────

  const handlePrintBaoPhe = async () => {
    if (gridRows.length === 0) {
      showSnackbar("Không có dữ liệu để xuất file.", "warning");
      return;
    }

    const invalidRows = gridRows.filter(r => calcTongCong(r.defects) > (r.scrap_quantity || 0));
    if (invalidRows.length > 0) {
      showSnackbar(`Có ${invalidRows.length} dòng nhập số phế vượt quá số lượng tham chiếu! Vui lòng kiểm tra lại.`, "error");
      return;
    }

    setExporting(true);
    setLastResult(null);
    try {
      const dateLabel = toDateLabel(filterDate);
      const result = await window.electronAPI.baoPhe.export({
        candidates: buildCandidates(),
        dateLabel,
      });

      if (result.ok) {
        setLastResult(result);
        showSnackbar("Đã tạo báo phế thành công! Đang gửi lệnh in phiếu QC...", "success");
        if (window.electronAPI.baoPhe.printFile && result.qc) {
          const printRes = await window.electronAPI.baoPhe.printFile(result.qc);
          if (!printRes.ok) {
            showSnackbar("Lỗi in: " + printRes.message, "error");
          }
        }
      } else {
        showSnackbar(result.message || "Tạo file thất bại.", "error");
      }
    } catch (err) {
      showSnackbar("Lỗi: " + err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // ── In phiếu nháp (tự động điền số phế tham chiếu vào cột 'Khác') ──────────

  const handlePrintDraft = async () => {
    if (gridRows.length === 0) {
      showSnackbar("Không có dữ liệu để in.", "warning");
      return;
    }

    const invalidRows = gridRows.filter(r => calcTongCong(r.defects) > (r.scrap_quantity || 0));
    if (invalidRows.length > 0) {
      showSnackbar(`Có ${invalidRows.length} dòng nhập số phế vượt quá số lượng tham chiếu! Vui lòng kiểm tra lại.`, "error");
      return;
    }

    setExporting(true);
    try {
      const dateLabel = toDateLabel(filterDate);

      // Tạo draft candidates: Đưa scrap_quantity (số phế đối soát) vào cột 'Khác'
      const draftCandidates = gridRows.map((r) => {
        const draftDefects = emptyDefects();
        draftDefects.khac = r.scrap_quantity || 0; // Tự động điền số phế vào cột cuối cùng (khac)
        return {
          maCongDon: r.work_order_number,
          tenSanPham: r.item_name,
          quyCach: r.specification,
          trongLuongDonVi: r.unit_weight || 0,
          scrapQuantity: r.scrap_quantity || 0,
          defects: draftDefects,
        };
      });

      const result = await window.electronAPI.baoPhe.export({
        candidates: draftCandidates,
        dateLabel,
        isDraft: true,
      });

      if (result.ok) {
        showSnackbar("Đã tạo phiếu nháp thành công! Đang gửi lệnh in...", "success");
        if (window.electronAPI.baoPhe.printFile) {
          const printRes = await window.electronAPI.baoPhe.printFile(result.full);
          if (!printRes.ok) {
            showSnackbar("Lỗi in: " + printRes.message, "error");
          }
        }
      } else {
        showSnackbar(result.message || "Tạo phiếu nháp thất bại.", "error");
      }
    } catch (err) {
      showSnackbar("Lỗi: " + err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: "10px" }}>

      {/* ── Card chính ── */}
      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: "14px 18px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          gap: "10px",
        }}
      >
        {/* ── Toolbar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            pb: "10px",
            borderBottom: "1px solid #eef2f8",
          }}
        >
          {/* ── Thống kê phế ── */}
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
              Tổng số phế: <span style={{ color: "#dc2626" }}>{refSummary.totalScrap}</span>
            </Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
              Số phế thực tế: <span style={{ color: inputTotal !== refSummary.totalScrap ? "#dc2626" : "#16a34a" }}>{inputTotal}</span>
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Date picker */}
          <TextField
            type="date"
            size="small"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            sx={{
              width: 145,
              "& .MuiInputBase-input": { fontSize: "12px", py: "6px", height: "22px" },
              "& .MuiOutlinedInput-root": { borderRadius: "7px" },
            }}
          />

          {/* Nút dropdown Xuất/In */}
          <Button
            variant="outlined"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            endIcon={<KeyboardArrowDownIcon fontSize="small" />}
            disabled={gridRows.length === 0 || loadingData || exporting}
            sx={{ ...btnOutlined, color: "#1e293b", borderColor: "#cbd5e1", bgcolor: "#ffffff", height: 32 }}
          >
            {exporting ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
            Xuất/In
          </Button>

          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{ "& .MuiPaper-root": { mt: 0.5, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "8px" } }}
          >
            <MenuItem onClick={() => { setExportAnchorEl(null); handlePrintDraft(); }} sx={{ fontSize: "13px", py: 1 }}>
              <PrintIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
              In phiếu nháp
            </MenuItem>
            <MenuItem onClick={() => { setExportAnchorEl(null); handlePrintBaoPhe(); }} sx={{ fontSize: "13px", py: 1 }}>
              <DescriptionIcon fontSize="small" sx={{ mr: 1.5, color: "#64748b" }} />
              In báo phế
            </MenuItem>
          </Menu>

          {/* Mở thư mục */}
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon fontSize="small" />}
            onClick={async () => {
              if (lastResult?.folderPath) {
                window.electronAPI.baoPhe.openFolder(lastResult.folderPath);
              } else if (window.electronAPI.baoPhe.openFolderByDate) {
                const res = await window.electronAPI.baoPhe.openFolderByDate(filterDate);
                if (!res.ok) showSnackbar(res.message, "info");
              } else {
                showSnackbar("Bạn chưa xuất file nào trong phiên này.", "info");
              }
            }}
            sx={{ ...btnOutlined, color: "#1e293b", borderColor: "#cbd5e1", bgcolor: "#ffffff", height: 32 }}
          >
            Mở thư mục
          </Button>

          {/* Refresh icon only */}
          <IconButton
            onClick={loadData}
            disabled={loadingData}
            sx={{ border: "1px solid #cbd5e1", borderRadius: "6px", p: "4px" }}
          >
            {loadingData ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* ── Loading state ── */}
        {loadingData && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3, justifyContent: "center" }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontSize: "13px", color: "#64748b" }}>Đang tải dữ liệu...</Typography>
          </Box>
        )}

        {/* ── Grid ── */}
        {!loadingData && (
          <DefectInputGrid rows={gridRows} onRowChange={handleRowChange} />
        )}
      </Card>

      {/* ── Success Dialog ── */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleIcon color="success" />
          <Typography fontWeight="bold">Xuất file thành công!</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: "#334155" }}>
            Đã tạo 2 file Excel:
          </Typography>

          {/* File đầy đủ */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: "3px" }}>
              Báo cáo đầy đủ (tất cả dòng):
            </Typography>
            <Box
              sx={{
                bgcolor: "#F1F5F9",
                p: 1,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", fontSize: "11px", flex: 1, wordBreak: "break-all" }}
              >
                {lastResult?.full}
              </Typography>
              <Button
                size="small"
                startIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => window.electronAPI.baoPhe.openFile(lastResult.full)}
                sx={{ fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Mở
              </Button>
            </Box>
          </Box>

          {/* File QC */}
          <Box>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: "3px" }}>
              Hàng phế giao QC:
            </Typography>
            <Box
              sx={{
                bgcolor: "#F1F5F9",
                p: 1,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", fontSize: "11px", flex: 1, wordBreak: "break-all" }}
              >
                {lastResult?.qc}
              </Typography>
              <Button
                size="small"
                startIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => window.electronAPI.baoPhe.openFile(lastResult.qc)}
                sx={{ fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Mở
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              window.electronAPI.baoPhe.openFolder(lastResult.folderPath);
            }}
            startIcon={<FolderOpenIcon />}
            sx={{ ...btnOutlined, height: 32 }}
          >
            Mở thư mục
          </Button>
          <Button
            onClick={() => setShowSuccessDialog(false)}
            variant="contained"
            sx={{ ...btnPrimary, height: 32 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
