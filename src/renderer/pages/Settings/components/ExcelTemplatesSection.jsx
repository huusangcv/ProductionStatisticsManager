import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Stack,
  Skeleton,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PreviewIcon from "@mui/icons-material/Preview";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import TemplatePreviewDialog from "./TemplatePreviewDialog";

const MODULE = "heat-treatment";

// ── TemplateInfoRow ───────────────────────────────────────────────────────────

function TemplateInfoRow({ label, value }) {
  return (
    <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ py: 0.5 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 110, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.primary", fontFamily: "monospace", fontSize: 12 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

// ── ExcelTemplatesSection ─────────────────────────────────────────────────────

export default function ExcelTemplatesSection() {
  const [template, setTemplate]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar]     = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── Load template metadata ────────────────────────────────────────────────

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const tmpl = await window.electronAPI.template.get(MODULE);
      setTemplate(tmpl);
    } catch (err) {
      showSnackbar("Lỗi tải thông tin template: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const result = await window.electronAPI.template.upload(MODULE);
    if (result.canceled) return;
    if (result.ok) {
      setTemplate(result.template);
      showSnackbar("Template đã được upload thành công.");
    } else {
      showSnackbar(result.message || "Upload thất bại.", "error");
    }
  };

  const handleReplace = handleUpload; // same flow — upsert replaces existing

  const handleDelete = async () => {
    const result = await window.electronAPI.template.delete(MODULE);
    if (result.ok) {
      setTemplate(null);
      showSnackbar("Đã xóa template.", "info");
    } else {
      showSnackbar(result.message || "Xóa thất bại.", "error");
    }
  };

  const handlePreview = () => setPreviewOpen(true);

  // ── Render ────────────────────────────────────────────────────────────────

  const hasTemplate = !!template;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Excel Templates
      </Typography>

      {/* Heat Treatment Template Card */}
      <Card
        variant="outlined"
        sx={{
          maxWidth: 600,
          borderRadius: 2,
          border: "1px solid",
          borderColor: hasTemplate ? "success.light" : "divider",
        }}
      >
        <CardContent sx={{ pb: "16px !important" }}>
          {/* Card Header */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <WhatshotOutlinedIcon sx={{ color: "warning.dark", fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Heat Treatment Template
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Template Excel dùng để xuất báo cáo nhiệt luyện
              </Typography>
            </Box>
            {loading ? (
              <Skeleton variant="rounded" width={72} height={24} />
            ) : hasTemplate ? (
              <Chip
                icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                label="Đang dùng"
                size="small"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
                label="Chưa có"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          {/* Template Info */}
          {loading ? (
            <Stack spacing={0.75}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="60%" />
            </Stack>
          ) : hasTemplate ? (
            <Box>
              <TemplateInfoRow label="Tên template" value={template.template_name} />
              <TemplateInfoRow label="Upload lúc" value={template.uploaded_at} />
              <TemplateInfoRow label="Cập nhật lúc" value={template.updated_at} />
              <TemplateInfoRow label="Trạng thái" value={template.status === "active" ? "Đang hoạt động" : template.status} />
              <TemplateInfoRow label="Vị trí lưu" value={template.template_path} />
              <TemplateInfoRow label="Sheet" value={template.sheet_name} />
              <TemplateInfoRow label="Hàng bắt đầu" value={String(template.start_row)} />
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Chưa có template. Nhấn <strong>Upload</strong> để tải lên file Excel template của công ty.
            </Alert>
          )}

          <Divider sx={{ mt: 2, mb: 1.5 }} />

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!hasTemplate ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<UploadFileIcon />}
                onClick={handleUpload}
                disableElevation
              >
                Upload
              </Button>
            ) : (
              <>
                <Tooltip title="Xem nội dung file template">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={handlePreview}
                  >
                    Preview
                  </Button>
                </Tooltip>
                <Tooltip title="Thay thế bằng file template mới">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SwapHorizIcon />}
                    onClick={handleReplace}
                  >
                    Replace
                  </Button>
                </Tooltip>
                <Tooltip title="Mở thư mục chứa template">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FolderOpenIcon />}
                    onClick={() =>
                      window.electronAPI.heatTreatment.openFolder(
                        template.template_path.replace(/[\\/][^\\/]+$/, "")
                      )
                    }
                  >
                    Mở thư mục
                  </Button>
                </Tooltip>
                <Tooltip title="Xóa template khỏi hệ thống">
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        open={previewOpen}
        module={MODULE}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
