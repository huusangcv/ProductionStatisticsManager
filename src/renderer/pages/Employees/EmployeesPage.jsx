import { useState, useMemo, useCallback } from "react";
import { Box, Stack, Snackbar, Alert } from "@mui/material";
import EmployeeToolbar from "./components/EmployeeToolbar";
import EmployeeStatistics from "./components/EmployeeStatistics";
import EmployeeDataGrid from "./components/EmployeeDataGrid";
import EmployeeDrawer from "./components/EmployeeDrawer";
import EmployeeDialog from "./components/EmployeeDialog";
import DeleteDialog from "./components/DeleteDialog";
import { MOCK_EMPLOYEES } from "./mockData";

function EmployeesPage() {
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // Derived Statistics
  const stats = useMemo(() => {
    return {
      total: employees.length,
      grinding: employees.filter((e) => e.department === "Mài").length,
      cutting: employees.filter((e) => e.department === "Cắt").length,
      managers: employees.filter(
        (e) =>
          e.role === "Trưởng ca" ||
          e.role === "Tổ trưởng" ||
          e.role === "Thống kê",
      ).length,
      inactive: employees.filter((e) => e.status === "Nghỉ việc").length,
      active: employees.filter((e) => e.status === "Đang làm việc").length,
    };
  }, [employees]);

  // Derived Data (Filtering)
  const filteredData = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm);
      const matchDept =
        filterDepartment === "all" || emp.department === filterDepartment;
      const matchRole = filterRole === "all" || emp.role === filterRole;
      const matchShift = filterShift === "all" || emp.shift === filterShift;
      const matchStatus = filterStatus === "all" || emp.status === filterStatus;
      return matchSearch && matchDept && matchRole && matchShift && matchStatus;
    });
  }, [
    employees,
    searchTerm,
    filterDepartment,
    filterRole,
    filterShift,
    filterStatus,
  ]);

  // Handlers
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterDepartment("all");
    setFilterRole("all");
    setFilterShift("all");
    setFilterStatus("all");
  };

  const handleRefresh = () => {
    // Simulate API refresh
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

  const confirmDelete = () => {
    if (employeeToDelete) {
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
      if (activeEmployee?.id === employeeToDelete.id) setIsDrawerOpen(false);
      showSnackbar(`Đã xóa nhân viên ${employeeToDelete.fullName}`);
    } else {
      setEmployees((prev) =>
        prev.filter((e) => !selectedRowIds.includes(e.id)),
      );
      setSelectedRowIds([]);
      showSnackbar(`Đã xóa ${selectedRowIds.length} nhân viên`);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSaveEmployee = (data) => {
    if (editingEmployee) {
      setEmployees((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      if (activeEmployee?.id === data.id) setActiveEmployee(data);
      showSnackbar("Cập nhật thông tin thành công");
    } else {
      setEmployees((prev) => [data, ...prev]);
      showSnackbar("Thêm nhân viên mới thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDeactivate = (employee) => {
    const updated = { ...employee, status: "Nghỉ việc" };
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? updated : e)),
    );
    setActiveEmployee(updated);
    showSnackbar(
      `Đã ngưng hoạt động nhân viên ${employee.fullName}`,
      "warning",
    );
  };

  const handleResetPassword = (employee) => {
    showSnackbar(
      `Đã gửi yêu cầu đặt lại mật khẩu cho ${employee.fullName}`,
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
      {/* Top Toolbar */}
      {/* <Box sx={{ flexShrink: 0, mb: 3 }}>
        <EmployeeToolbar
          totalCount={stats.total}
          filteredCount={filteredData.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterDepartment={filterDepartment}
          onDepartmentChange={setFilterDepartment}
          filterRole={filterRole}
          onRoleChange={setFilterRole}
          filterShift={filterShift}
          onShiftChange={setFilterShift}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          onResetFilters={handleResetFilters}
          onAddEmployee={handleAddEmployee}
          onRefresh={handleRefresh}
          hasSelection={selectedRowIds.length > 0}
          onDeleteSelected={handleDeleteSelected}
        />
      </Box> */}

      {/* Statistics */}
      {/* <Box sx={{ flexShrink: 0, mb: 3 }}>
        <EmployeeStatistics stats={stats} />
      </Box> */}

      {/* DataGrid */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <EmployeeDataGrid
          data={filteredData}
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
          onDoubleClick={handleViewEmployee}
          onView={handleViewEmployee}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          onAddEmployee={handleAddEmployee}
        />
      </Box>

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
        employeeName={employeeToDelete?.fullName}
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
