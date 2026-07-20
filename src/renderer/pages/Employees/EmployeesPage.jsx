import { useState, useCallback, useEffect } from "react";
import { Box, Stack, Snackbar, Alert, Card, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText } from "@mui/material";
import EmployeeDataGrid from "./components/EmployeeDataGrid";
import EmployeeDrawer from "./components/EmployeeDrawer";
import EmployeeDialog from "./components/EmployeeDialog";
import DeleteDialog from "./components/DeleteDialog";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // UI state
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Unmapped codes dialog after import Cắt/Mài (not used here but pattern for other pages)
  const [unmappedDialog, setUnmappedDialog] = useState({ open: false, codes: [] });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadMasterData = useCallback(async () => {
    const [r, p] = await Promise.all([
      window.electronAPI.roles.getAll(),
      window.electronAPI.positions.getAll(),
    ]);
    setRoles(r);
    setPositions(p);
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.employees.getAll();
      setEmployees(data);
    } catch (error) {
      showSnackbar("Lỗi khi tải dữ liệu nhân viên: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
    loadEmployees();
  }, [loadMasterData, loadEmployees]);

  // Handlers
  const handleRefresh = async () => {
    await loadEmployees();
    showSnackbar("Dữ liệu đã được làm mới");
  };

  // Drawer & Dialog Handlers
  const handleViewEmployee = (employee) => {
    setActiveEmployee(employee);
    setIsDrawerOpen(true);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRowIds.length === 0) return;
    setEmployeeToDelete(null); // indicates bulk delete
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      const result = await window.electronAPI.employees.delete(employeeToDelete.id);
      if (result.ok) {
        if (activeEmployee?.id === employeeToDelete.id) setIsDrawerOpen(false);
        showSnackbar(`Đã xóa nhân viên ${employeeToDelete.full_name}`);
        loadEmployees();
      } else {
        showSnackbar(result.message, "error");
      }
    } else {
      let successCount = 0;
      for (const id of selectedRowIds) {
        const result = await window.electronAPI.employees.delete(id);
        if (result.ok) successCount++;
      }
      setSelectedRowIds([]);
      showSnackbar(`Đã xóa ${successCount} nhân viên`);
      loadEmployees();
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSaveEmployee = async (data) => {
    if (editingEmployee) {
      const result = await window.electronAPI.employees.update(editingEmployee.id, data);
      if (result.ok) {
        showSnackbar("Cập nhật thông tin thành công");
        await loadEmployees();
        if (activeEmployee?.id === editingEmployee.id) {
          const updatedEmployee = await window.electronAPI.employees.getById(editingEmployee.id);
          setActiveEmployee(updatedEmployee);
        }
        setIsDialogOpen(false);
      } else {
        showSnackbar(result.message, "error");
      }
    } else {
      const result = await window.electronAPI.employees.create(data);
      if (result.ok) {
        showSnackbar("Thêm nhân viên mới thành công");
        await loadEmployees();
        setIsDialogOpen(false);
      } else {
        showSnackbar(result.message, "error");
      }
    }
  };

  const handleDeactivate = async (employee) => {
    const updatedData = {
      representative_code: employee.representative_code,
      full_name: employee.full_name,
      role_id: employee.role_id,
      position_id: employee.position_id,
      phone: employee.phone,
      status: "Nghỉ việc",
      hire_date: employee.hire_date,
      note: employee.note,
    };
    const result = await window.electronAPI.employees.update(employee.id, updatedData);
    if (result.ok) {
      showSnackbar(`Đã ngưng hoạt động nhân viên ${employee.full_name}`, "warning");
      await loadEmployees();
      const updatedEmployee = await window.electronAPI.employees.getById(employee.id);
      setActiveEmployee(updatedEmployee);
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleImportExcel = async () => {
    const result = await window.electronAPI.employees.importExcel();
    if (result.canceled) return;
    if (!result.ok) {
      showSnackbar(result.message, "error");
      return;
    }
    await loadEmployees();
    if (result.errors && result.errors.length > 0) {
      setUnmappedDialog({ open: true, codes: result.errors, title: "Import hoàn tất với một số lỗi", imported: result.imported });
    } else {
      showSnackbar(`Import thành công ${result.imported} nhân viên`);
    }
  };

  const handleExportExcel = async () => {
    const result = await window.electronAPI.employees.exportExcel();
    if (result.canceled) return;
    if (result.ok) {
      showSnackbar("Xuất file Excel thành công");
    } else {
      showSnackbar(result.message, "error");
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
        <EmployeeDataGrid
          data={employees}
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
          onDoubleClick={handleViewEmployee}
          onView={handleViewEmployee}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          onAddEmployee={handleAddEmployee}
          onRefresh={handleRefresh}
          onDeleteSelected={handleDeleteSelected}
          onImport={handleImportExcel}
          onExport={handleExportExcel}
        />
      </Card>

      {/* Overlays */}
      <EmployeeDrawer
        open={isDrawerOpen}
        employee={activeEmployee}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        onDeactivate={handleDeactivate}
      />

      <EmployeeDialog
        open={isDialogOpen}
        employee={editingEmployee}
        roles={roles}
        positions={positions}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEmployee}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        count={selectedRowIds.length}
        employeeName={employeeToDelete?.full_name}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Import errors / unmapped codes dialog */}
      <Dialog open={unmappedDialog.open} onClose={() => setUnmappedDialog({ open: false, codes: [] })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {unmappedDialog.title || "Kết quả Import"}
        </DialogTitle>
        <DialogContent>
          {unmappedDialog.imported !== undefined && (
            <Typography sx={{ mb: 1 }}>✅ Đã import thành công: <b>{unmappedDialog.imported}</b> nhân viên</Typography>
          )}
          {unmappedDialog.codes.length > 0 && (
            <>
              <Typography color="warning.main" sx={{ mb: 1 }}>⚠️ Có {unmappedDialog.codes.length} lỗi:</Typography>
              <List dense sx={{ bgcolor: "#fff8f0", borderRadius: 1, border: "1px solid #ffe4b2", maxHeight: 300, overflow: "auto" }}>
                {unmappedDialog.codes.map((msg, i) => (
                  <ListItem key={i}><ListItemText primary={msg} /></ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnmappedDialog({ open: false, codes: [] })} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

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

export default EmployeesPage;
