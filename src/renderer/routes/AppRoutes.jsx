import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import EmployeesPage from "../pages/Employees/EmployeesPage";
import MappingPage from "../pages/Mapping/MappingPage";
import ImportExcelPage from "../pages/ImportExcel/ImportExcelPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import OvertimePage from "../pages/Overtime/OvertimePage";
import LeavePage from "../pages/Leave/LeavePage";
import SettingsPage from "../pages/Settings/SettingsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="mapping" element={<MappingPage />} />
        <Route path="import-excel" element={<ImportExcelPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="overtime" element={<OvertimePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
