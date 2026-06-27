import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

function EmployeeToolbar({
  totalCount,
  filteredCount,
  searchTerm,
  onSearchChange,
  filterDepartment,
  onDepartmentChange,
  filterRole,
  onRoleChange,
  filterShift,
  onShiftChange,
  filterStatus,
  onStatusChange,
  onResetFilters,
  onAddEmployee,
  onRefresh,
  hasSelection,
  onDeleteSelected,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
        <Typography variant="h2" sx={{ m: 0 }}>Quản lý nhân viên</Typography>
        <Chip 
          label={`${filteredCount} / ${totalCount}`} 
          color="primary" 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 600, bgcolor: "primary.50" }} 
        />
      </Stack>

      {/* Search and Filters grouped to manage gap of 12px */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", flexGrow: 1 }}>
        <TextField
          size="small"
          placeholder="Tìm theo Tên, Mã, SĐT..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 220, bgcolor: "white" }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }
          }}
        />

        <TextField
          select
          size="small"
          label="Phòng ban"
          value={filterDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          sx={{ minWidth: 120, bgcolor: "white" }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="Mài">Mài</MenuItem>
          <MenuItem value="Cắt">Cắt</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Vai trò"
          value={filterRole}
          onChange={(e) => onRoleChange(e.target.value)}
          sx={{ minWidth: 120, bgcolor: "white" }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="Thống kê">Thống kê</MenuItem>
          <MenuItem value="Trưởng ca">Trưởng ca</MenuItem>
          <MenuItem value="Tổ trưởng">Tổ trưởng</MenuItem>
          <MenuItem value="Công nhân">Công nhân</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Ca làm việc"
          value={filterShift}
          onChange={(e) => onShiftChange(e.target.value)}
          sx={{ minWidth: 120, bgcolor: "white" }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="Ca 1">Ca 1</MenuItem>
          <MenuItem value="Ca 2">Ca 2</MenuItem>
          <MenuItem value="Ca 3">Ca 3</MenuItem>
          <MenuItem value="Hành chính">Hành chính</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Trạng thái"
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          sx={{ minWidth: 140, bgcolor: "white" }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="Đang làm việc">Đang làm việc</MenuItem>
          <MenuItem value="Nghỉ việc">Nghỉ việc</MenuItem>
        </TextField>

        <IconButton onClick={onResetFilters} title="Đặt lại bộ lọc">
          <RestartAltIcon />
        </IconButton>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pl: 1, borderLeft: '1px solid #e2e8f0' }}>
        {hasSelection ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDeleteSelected}
            disableElevation
          >
            Xóa đã chọn
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddEmployee}
            disableElevation
          >
            Thêm nhân viên
          </Button>
        )}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Làm mới
        </Button>
      </Stack>
    </Box>
  );
}

export default EmployeeToolbar;
