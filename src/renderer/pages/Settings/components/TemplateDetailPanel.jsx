import { Box, Typography, Button, Chip } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

export default function TemplateDetailPanel({ template }) {
  const handlePreview = async () => {
    await window.electronAPI.template.preview(template.module);
  };

  const handleOpenFolder = async () => {
    await window.electronAPI.heatTreatment.openFolder(template.template_path);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.paper" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Tên template
          </Typography>
          <Typography variant="body2">{template.template_name}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Module
          </Typography>
          <Chip
            label={template.module.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            size="small"
            variant="outlined"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Đường dẫn
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
            {template.template_path}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Sheet
          </Typography>
          <Typography variant="body2">{template.sheet_name}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Hàng bắt đầu
          </Typography>
          <Typography variant="body2">{template.start_row}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Dung lượng
          </Typography>
          <Typography variant="body2">{formatFileSize(template.file_size)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Checksum
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
            {template.checksum || "—"}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Ngày cập nhật
          </Typography>
          <Typography variant="body2">{template.updated_at}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={handlePreview}
        >
          Xem trước
        </Button>
        <Button
          variant="outlined"
          startIcon={<FolderOpenOutlinedIcon />}
          onClick={handleOpenFolder}
        >
          Mở thư mục
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintOutlinedIcon />}
        >
          In thử
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
        >
          Xóa
        </Button>
      </Box>
    </Box>
  );
}
