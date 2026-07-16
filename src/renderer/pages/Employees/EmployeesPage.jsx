import { useState, useCallback, useEffect } from "react";
import { Box, Stack, Snackbar, Alert, Card } from "@mui/material";
import EmployeeDataGrid from "./components/EmployeeDataGrid";
import EmployeeDrawer from "./components/EmployeeDrawer";
import EmployeeDialog from "./components/EmployeeDialog";
import DeleteDialog from "./components/DeleteDialog";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
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

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.employees.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu nhân viên:", error);
      showSnackbar("Lỗi khi tải dữ liệu nhân viên: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
      const result = await window.electronAPI.employees.delete(employeeToDelete.employee_code);
      if (result.ok) {
        if (activeEmployee?.employee_code === employeeToDelete.employee_code) setIsDrawerOpen(false);
        showSnackbar(`Đã xóa nhân viên ${employeeToDelete.employee_name}`);
        loadEmployees();
      } else {
        showSnackbar(result.message, "error");
      }
    } else {
      let successCount = 0;
      for (const id of selectedRowIds) {
        const emp = employees.find(e => e.id === id);
        if (emp) {
          const result = await window.electronAPI.employees.delete(emp.employee_code);
          if (result.ok) successCount++;
        }
      }
      setSelectedRowIds([]);
      showSnackbar(`Đã xóa ${successCount} nhân viên`);
      loadEmployees();
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSaveEmployee = async (data) => {
    if (editingEmployee) {
      const result = await window.electronAPI.employees.update(editingEmployee.employee_code, data);
      if (result.ok) {
        showSnackbar("Cập nhật thông tin thành công");
        loadEmployees();
        if (activeEmployee?.employee_code === editingEmployee.employee_code) {
          const updatedEmployee = await window.electronAPI.employees.getByCode(editingEmployee.employee_code);
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
        loadEmployees();
        setIsDialogOpen(false);
      } else {
        showSnackbar(result.message, "error");
      }
    }
  };

  const handleDeactivate = async (employee) => {
    const updatedData = { ...employee, status: "Nghỉ việc" };
    const result = await window.electronAPI.employees.update(employee.employee_code, updatedData);
    if (result.ok) {
      showSnackbar(`Đã ngưng hoạt động nhân viên ${employee.employee_name}`, "warning");
      loadEmployees();
      const updatedEmployee = await window.electronAPI.employees.getByCode(employee.employee_code);
      setActiveEmployee(updatedEmployee);
    } else {
      showSnackbar(result.message, "error");
    }
  };

  const handleResetPassword = (employee) => {
    showSnackbar(
      `Tính năng đặt lại mật khẩu chưa được hỗ trợ trên SQLite cho nhân viên.`,
      "info",
    );
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
        onResetPassword={handleResetPassword}
      />

      <EmployeeDialog
        open={isDialogOpen}
        employee={editingEmployee}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEmployee}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        count={selectedRowIds.length}
        employeeName={employeeToDelete?.employee_name}
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

export default EmployeesPage;
