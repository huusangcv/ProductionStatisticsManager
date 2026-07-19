import { useState, useCallback, useEffect } from "react";
import { Box, Snackbar, Alert, Card } from "@mui/material";
import DetailJointDataGrid from "./components/DetailJointDataGrid";
import DetailJointDrawer from "./components/DetailJointDrawer";
import DetailJointDialog from "./components/DetailJointDialog";
import DeleteDialog from "../Employees/components/DeleteDialog";

function DetailJointPage() {
  const [detailJoints, setDetailJoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Loading state for saving
  const [saving, setSaving] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.detailJoint.getAll();
      setDetailJoints(data ?? []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chi tiết kết xâu:", error);
      showSnackbar("Lỗi khi tải dữ liệu: " + error.message, "error");
      setDetailJoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleRefresh = async () => {
    await loadData();
    showSnackbar("Dữ liệu đã được làm mới");
  };

  const handleImportExcel = async () => {
    try {
      const result = await window.electronAPI.detailJoint.importExcel();
      if (result.ok) {
        showSnackbar(`Đã nhập ${result.count} dòng dữ liệu thành công`);
        loadData();
      } else if (!result.canceled) {
        showSnackbar(result.message, "error");
      }
    } catch (error) {
      console.error("Lỗi nhập file Excel:", error);
      showSnackbar("Lỗi nhập file Excel: " + error.message, "error");
    }
  };

  const handleExportExcel = async () => {
    try {
      const result = await window.electronAPI.detailJoint.exportExcel();
      if (result.ok) {
        showSnackbar("Đã xuất file Excel thành công");
      } else if (!result.canceled) {
        showSnackbar(result.message, "error");
      }
    } catch (error) {
      console.error("Lỗi xuất file Excel:", error);
      showSnackbar("Lỗi xuất file Excel: " + error.message, "error");
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleRowDoubleClick = (params) => {
    setEditingItem(params.row);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRowIds.length === 0) return;
    setItemToDelete(null); // indicates bulk delete
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      const result = await window.electronAPI.detailJoint.delete(
        itemToDelete.id,
      );
      if (result.ok) {
        showSnackbar(`Đã xóa dữ liệu thành công`);
        loadData();
        if (isDrawerOpen && editingItem?.id === itemToDelete.id) {
          setIsDrawerOpen(false);
        }
      } else {
        showSnackbar(result.message, "error");
      }
    } else {
      let successCount = 0;
      for (const id of selectedRowIds) {
        const result = await window.electronAPI.detailJoint.delete(id);
        if (result.ok) successCount++;
      }
      setSelectedRowIds([]);
      showSnackbar(`Đã xóa ${successCount} dòng dữ liệu`);
      loadData();
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSave = async (data) => {
    if (editingItem) {
      const result = await window.electronAPI.detailJoint.update(
        editingItem.id,
        data,
      );
      if (result.ok) {
        showSnackbar("Cập nhật thông tin thành công");
        loadData();
        setIsDialogOpen(false);
      } else {
        showSnackbar(result.message, "error");
      }
    } else {
      const result = await window.electronAPI.detailJoint.create(data);
      if (result.ok) {
        showSnackbar("Thêm dữ liệu mới thành công");
        loadData();
        setIsDialogOpen(false);
      } else {
        showSnackbar(result.message, "error");
      }
    }
  };

  const handleSaveFromDrawer = async (data) => {
    setSaving(true);
    try {
      const result = await window.electronAPI.detailJoint.update(
        editingItem.id,
        data,
      );
      if (result.ok) {
        showSnackbar("Cập nhật thành công.");
        loadData();
        setIsDrawerOpen(false);
        setEditingItem(null);
      } else {
        showSnackbar(result.message, "error");
      }
    } catch (error) {
      console.error("Lỗi cập nhật chi tiết kết xâu:", error);
      showSnackbar("Lỗi cập nhật: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          p: "16px 20px",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <DetailJointDataGrid
          data={detailJoints}
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          onRefresh={handleRefresh}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportExcel}
          onDeleteSelected={handleDeleteSelected}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </Card>

      {/* Overlays */}
      <DetailJointDrawer
        open={isDrawerOpen}
        item={editingItem}
        allItems={detailJoints}
        onClose={handleCloseDrawer}
        onSave={handleSaveFromDrawer}
        loading={saving}
      />

      <DetailJointDialog
        open={isDialogOpen}
        item={editingItem}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        count={selectedRowIds.length}
        employeeName={itemToDelete?.product_name}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Global Snackbar */}
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

export default DetailJointPage;
