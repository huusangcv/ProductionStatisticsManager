import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, TextField, InputAdornment } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

import DataGridToolbarActions, {
  StandardButton,
} from "../../../components/shared/DataGridToolbarActions";
import { viVNGridLocaleText } from "../../../constants/dataGridLocale";

function PricesDataGrid({
  data,
  selectedRowIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onAdd,
  onRefresh,
  onImportExcel,
  onExportExcel,
  onDeleteSelected,
  onRowDoubleClick,
  searchTerm,
  onSearchChange,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const safeData = data ?? [];
  const safeSelectedRowIds = selectedRowIds ?? [];

  const columns = [
    {
      field: "stt",
      headerName: "STT",
      width: 70,
      valueGetter: (params) => {
        try {
          const sortedIds = params.api?.getSortedRowIds();
          if (!sortedIds) return "";
          const index = sortedIds.indexOf(params.id);
          return index >= 0 ? index + 1 : "";
        } catch (error) {
          return "";
        }
      },
    },
    { field: "material_code", headerName: "Mã liệu", width: 180 },
    {
      field: "product_name",
      headerName: "Tên hàng",
      flex: 1,
      minWidth: 220,
    },
    { field: "specification", headerName: "Quy cách", width: 150 },
    { field: "cutting_price", headerName: "Đơn giá Cắt", width: 150, type: "number" },
    { field: "grinding_price", headerName: "Đơn giá Mài", width: 150, type: "number" },
  ];

  const handleContextMenu = (event) => {
    event.preventDefault();
    const id = event.currentTarget.getAttribute("data-id");
    if (!id) return;
    const row = safeData.find((r) => r.id === parseInt(id));
    if (!row) return;

    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      item: row,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const hasSelection = safeSelectedRowIds.length > 0;

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
        rows={safeData}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={safeSelectedRowIds}
        onRowSelectionModelChange={onSelectionChange}
        onRowDoubleClick={onRowDoubleClick}
        slots={{
          toolbar: () => (
            <DataGridToolbarActions
              hasExport={false}
              rightActions={
                <>
                  <TextField
                    placeholder="Tìm kiếm..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 250,
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        borderRadius: "8px",
                        bgcolor: "#fff",
                      },
                    }}
                  />
                  <StandardButton
                    primary={false}
                    icon={<UploadFileIcon />}
                    label="Nhập Excel"
                    onClick={onImportExcel}
                  />
                  <StandardButton
                    primary={false}
                    icon={<DownloadIcon />}
                    label="Xuất Excel"
                    onClick={onExportExcel}
                  />
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
                      label="Thêm mới"
                      onClick={onAdd}
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
          ),
        }}
        slotProps={{
          row: {
            onContextMenu: handleContextMenu,
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
            onEdit(contextMenu.item);
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chỉnh sửa</ListItemText>
        </MenuItem>
        <Box sx={{ my: 1, borderBottom: "1px solid #e2e8f0" }} />
        <MenuItem
          onClick={() => {
            onDelete(contextMenu.item);
            handleCloseContextMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xóa</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default PricesDataGrid;
