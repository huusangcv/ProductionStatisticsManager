import { useState, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { Box, Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusChip from "./EmployeeStatusChip";

// Bộ text tiếng Việt cho DataGrid (toolbar, filter panel, column panel, footer, ...)
const viVNGridLocaleText = {
  // Toolbar
  toolbarColumns: "Cột",
  toolbarColumnsLabel: "Chọn cột hiển thị",
  toolbarFilters: "Bộ lọc",
  toolbarFiltersLabel: "Hiển thị bộ lọc",
  toolbarFiltersTooltipHide: "Ẩn bộ lọc",
  toolbarFiltersTooltipShow: "Hiển thị bộ lọc",
  toolbarDensity: "Mật độ",
  toolbarDensityLabel: "Mật độ",
  toolbarDensityCompact: "Gọn",
  toolbarDensityStandard: "Tiêu chuẩn",
  toolbarDensityComfortable: "Thoải mái",
  toolbarExport: "Xuất file",
  toolbarExportLabel: "Xuất file",
  toolbarExportCSV: "Tải xuống CSV",
  toolbarExportPrint: "In",
  toolbarExportExcel: "Tải xuống Excel",

  // Cột (Columns panel)
  columnsPanelTextFieldLabel: "Tìm cột",
  columnsPanelTextFieldPlaceholder: "Tên cột",
  columnsPanelDragIconLabel: "Sắp xếp lại cột",
  columnsPanelShowAllButton: "Hiện tất cả",
  columnsPanelHideAllButton: "Ẩn tất cả",

  // Bộ lọc (Filter panel)
  filterPanelAddFilter: "Thêm bộ lọc",
  filterPanelRemoveAll: "Xóa tất cả",
  filterPanelDeleteIconLabel: "Xóa",
  filterPanelLogicOperator: "Toán tử logic",
  filterPanelOperator: "Toán tử",
  filterPanelOperatorAnd: "Và",
  filterPanelOperatorOr: "Hoặc",
  filterPanelColumns: "Cột",
  filterPanelInputLabel: "Giá trị",
  filterPanelInputPlaceholder: "Nhập giá trị lọc",

  // Toán tử lọc
  filterOperatorContains: "chứa",
  filterOperatorEquals: "bằng",
  filterOperatorStartsWith: "bắt đầu với",
  filterOperatorEndsWith: "kết thúc với",
  filterOperatorIs: "là",
  filterOperatorNot: "không là",
  filterOperatorAfter: "sau",
  filterOperatorOnOrAfter: "vào hoặc sau",
  filterOperatorBefore: "trước",
  filterOperatorOnOrBefore: "vào hoặc trước",
  filterOperatorIsEmpty: "rỗng",
  filterOperatorIsNotEmpty: "không rỗng",
  filterOperatorIsAnyOf: "thuộc nhóm",

  // Menu cột (header menu)
  columnMenuLabel: "Menu",
  columnMenuShowColumns: "Hiện các cột",
  columnMenuManageColumns: "Quản lý cột",
  columnMenuFilter: "Lọc",
  columnMenuHideColumn: "Ẩn cột",
  columnMenuUnsort: "Bỏ sắp xếp",
  columnMenuSortAsc: "Sắp xếp tăng dần",
  columnMenuSortDesc: "Sắp xếp giảm dần",

  // Phân trang / Footer
  footerRowSelected: (count) =>
    count !== 1 ? `Đã chọn ${count.toLocaleString()} dòng` : `Đã chọn 1 dòng`,
  footerTotalRows: "Tổng số dòng:",
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
  MuiTablePagination: {
    labelRowsPerPage: "Số dòng mỗi trang:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} trong ${count !== -1 ? count : `nhiều hơn ${to}`}`,
  },

  // Khi không có dữ liệu
  noRowsLabel: "Không có dữ liệu",
  noResultsOverlayLabel: "Không tìm thấy kết quả",

  // Checkbox chọn dòng
  checkboxSelectionHeaderName: "Chọn dòng",
  checkboxSelectionSelectAllRows: "Chọn tất cả các dòng",
  checkboxSelectionUnselectAllRows: "Bỏ chọn tất cả các dòng",
  checkboxSelectionSelectRow: "Chọn dòng",
  checkboxSelectionUnselectRow: "Bỏ chọn dòng",
};

import RefreshIcon from "@mui/icons-material/Refresh";

function CustomToolbar({ onAddEmployee, onRefresh, onDeleteSelected, hasSelection }) {
  return (
    <GridToolbarContainer
      sx={{
        p: 1.5,
        borderBottom: "1px solid #E2E8F0",
        bgcolor: "#F8FAFC",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 1.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarExport />
        
        {hasSelection ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteOutlineOutlinedIcon />}
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
      </Box>
    </GridToolbarContainer>
  );
}

function EmployeeDataGrid({
  data,
  selectedRowIds,
  onSelectionChange,
  onDoubleClick,
  onEdit,
  onView,
  onDelete,
  onAddEmployee,
  onRefresh,
  onDeleteSelected,
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const columns = [
    { field: "employee_code", headerName: "Mã số", width: 110 },
    {
      field: "employee_name",
      headerName: "Họ tên",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            direction: "row",
            gap: 1,
            height: "100%",
          }}
        >
          <EmployeeAvatar name={params.row.employee_name} />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                fontWeight: 600,
                color: "#0f172a",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {params.row.employee_name}
            </Box>
          </Box>
        </Box>
      ),
    },
    { field: "department", headerName: "Bộ phận", width: 130 },
    { field: "role_code", headerName: "Vai trò", width: 150 },
    { field: "phone", headerName: "Số điện thoại", width: 140 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 140,
      renderCell: (params) => <EmployeeStatusChip status={params.value} />,
    },
    { field: "hire_date", headerName: "Ngày vào làm", width: 130 },
  ];


  const handleContextMenu = (event) => {
    event.preventDefault();
    const id = event.currentTarget.getAttribute("data-id");
    if (!id) return;
    const row = data.find((r) => r.id === id);
    if (!row) return;

    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      employee: row,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleRowDoubleClick = (params) => {
    onDoubleClick(params.row);
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        bgcolor: "#FFFFFF",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
      }}
    >
      <DataGrid
        localeText={viVNGridLocaleText}
        rows={data}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={onSelectionChange}
        onRowDoubleClick={handleRowDoubleClick}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{
          row: {
            onContextMenu: handleContextMenu,
          },
          toolbar: {
            onAddEmployee,
            onRefresh,
            onDeleteSelected,
            hasSelection: selectedRowIds?.length > 0,
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 50 },
          },
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        sx={{
          border: "none",
          width: "100%",
          minWidth: 0,
          color: "#0F172A",
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#F8FAFC",
            color: "#64748B",
            fontWeight: 600,
            fontSize: 13,
            borderBottom: "1px solid #E2E8F0",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#E2E8F0",
          },
          "& .MuiDataGrid-cell:focus-within": {
            outline: "none",
          },
          "& .MuiDataGrid-row:hover": {
            bgcolor: "#F8FAFC",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
          },
        }}
      />
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        sx={{
          "& .MuiPaper-root": {
            width: 220,
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onView(contextMenu.employee);
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xem chi tiết</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEdit(contextMenu.employee);
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chỉnh sửa</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(contextMenu.employee.employee_code);
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <ContentCopyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sao chép mã NV</ListItemText>
        </MenuItem>
        <Box sx={{ my: 1, borderBottom: "1px solid #e2e8f0" }} />
        <MenuItem
          onClick={() => {
            onDelete(contextMenu.employee);
            handleCloseContextMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xóa nhân viên</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default EmployeeDataGrid;
