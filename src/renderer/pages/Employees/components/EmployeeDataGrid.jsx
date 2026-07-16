import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusChip from "./EmployeeStatusChip";
import DataGridToolbarActions, { StandardButton } from "../../../components/shared/DataGridToolbarActions";
import { viVNGridLocaleText } from "../../../constants/dataGridLocale";

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
        <Box sx={{ display: "flex", alignItems: "center", direction: "row", gap: 1, height: "100%" }}>
          <EmployeeAvatar name={params.row.employee_name} />
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
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

  const hasSelection = selectedRowIds?.length > 0;

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column",
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
        slots={{
          toolbar: () => (
            <DataGridToolbarActions
              hasExport={true}
              rightActions={
                <>
                  {hasSelection ? (
                    <StandardButton
                      primary={true}
                      icon={<DeleteOutlineOutlinedIcon />}
                      label="Xóa đã chọn"
                      onClick={onDeleteSelected}
                      color="error"
                    />
                  ) : (
                    <StandardButton
                      primary={true}
                      icon={<AddIcon />}
                      label="Thêm nhân viên"
                      onClick={onAddEmployee}
                    />
                  )}
                  <StandardButton
                    primary={false}
                    icon={<RefreshIcon />}
                    label="Làm mới"
                    onClick={onRefresh}
                  />
                </>
              }
            />
          )
        }}
        slotProps={{
          row: {
            onContextMenu: handleContextMenu,
          }
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
            borderTop: "none",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#E2E8F0",
          },
          "& .MuiDataGrid-row:hover": {
            bgcolor: "#F8FAFC",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
            minHeight: "48px",
          },
          "& .MuiTablePagination-root": {
            padding: "4px 12px",
          },
          "& .MuiTablePagination-toolbar": {
            minHeight: "40px",
            padding: 0,
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
