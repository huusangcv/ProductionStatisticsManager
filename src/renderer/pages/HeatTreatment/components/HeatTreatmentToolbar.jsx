import { Box, Button, CircularProgress, Divider, Tooltip, TextField, Chip } from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function HeatTreatmentToolbar({
  hasTemplate,
  hasResult,
  lastFilePath,
  lastFolderPath,
  generating,
  onGenerate,
  onPrint,
  onOpenFolder,
  onRefreshTemplate,
  selectedDate,
  onDateChange,
  today,
  totalCount,
  xlnCount,
  noCount,
}) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        
        <Box sx={{ flexGrow: 1 }} />

        {/* Date Picker */}
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          inputProps={{ max: today }}
          sx={{ width: 140, bgcolor: "white", "& .MuiInputBase-root": { height: 32, fontSize: 13 } }}
        />

        {/* Actions */}
        <Tooltip title={!hasTemplate ? "Chưa có template. Vui lòng upload trong Cài đặt." : "Tạo file Excel từ dữ liệu Mài của ngày đã chọn"}>
          <span>
            <Button
              variant="contained"
              disableElevation
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
              onClick={onGenerate}
              disabled={!hasTemplate || generating}
            >
              {generating ? "Đang tạo..." : "Tạo Excel"}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={hasResult ? "In file Excel vừa tạo" : "Tạo file Excel trước khi in"}>
          <span>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => onPrint(lastFilePath)}
              disabled={!hasResult || generating}
            >
              In
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={hasResult ? "Mở thư mục chứa file xuất" : "Chưa có file để mở"}>
          <span>
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={() => onOpenFolder(lastFolderPath)}
              disabled={!hasResult || generating}
            >
              Mở thư mục
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Tải lại trạng thái template">
          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={onRefreshTemplate}
            color="inherit"
            sx={{ color: "text.secondary", minWidth: "auto" }}
          >
            Làm mới
          </Button>
        </Tooltip>
      </Box>
    </GridToolbarContainer>
  );
}
