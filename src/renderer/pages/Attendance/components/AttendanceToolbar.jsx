import { Box, Button, TextField, Stack, InputAdornment, IconButton, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

export default function AttendanceToolbar({
  filterDate,
  onFilterDateChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  onMarkAllPresent,
  onMarkAllNotChecked,
  onSave,
  saving
}) {
  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          type="date"
          size="small"
          value={filterDate}
          onChange={(e) => onFilterDateChange(e.target.value)}
          sx={{ width: 160 }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          size="small"
          placeholder="Tìm nhân viên..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title="Làm mới dữ liệu">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RadioButtonUncheckedIcon />}
          onClick={onMarkAllNotChecked}
          sx={{ textTransform: "none", color: "#64748b", borderColor: "#cbd5e1" }}
        >
          Xoá điểm danh
        </Button>
        <Button
          variant="outlined"
          color="success"
          startIcon={<CheckCircleOutlineIcon />}
          onClick={onMarkAllPresent}
          sx={{ textTransform: "none" }}
        >
          Tất cả có mặt
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={saving}
          sx={{ textTransform: "none", boxShadow: "none" }}
        >
          Lưu điểm danh
        </Button>
      </Stack>
    </Box>
  );
}
