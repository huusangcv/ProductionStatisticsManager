import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import EmployeesPage from "../pages/Employees/EmployeesPage";
import RolesPage from "../pages/Roles/RolesPage";
import PositionsPage from "../pages/Positions/PositionsPage";
import DetailJointPage from "../pages/DetailJoint/DetailJointPage";
import GrindingPage from "../pages/Grinding/GrindingPage";
import CuttingPage from "../pages/Cutting/CuttingPage";
import ImportHistoryPage from "../pages/ImportHistory/ImportHistoryPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import HeatTreatmentPage from "../pages/HeatTreatment/HeatTreatmentPage";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="grinding" element={<GrindingPage />} />
        <Route path="cutting" element={<CuttingPage />} />
        <Route path="import-history" element={<ImportHistoryPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="detail-joint" element={<DetailJointPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="heat-treatment" element={<HeatTreatmentPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
