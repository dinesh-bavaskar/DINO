import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminRoute, EmployeeRoute, PublicRoute } from './ProtectedRoutes';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/admin/Dashboard';
import EmployeeList from '../pages/admin/EmployeeList';
import RegisterEmployee from '../pages/admin/RegisterEmployee';
import Profile from '../pages/employee/Profile';
import EmployeeDashboard from '../pages/employee/Dashboard';
import TodayTimesheet from '../pages/employee/TodayTimesheet';
import EmployeeSubmissions from '../pages/admin/EmployeeSubmissions';
import AdminSettings from '../pages/admin/Settings';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <AdminRoute>
                <EmployeeList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/register"
            element={
              <AdminRoute>
                <RegisterEmployee />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <AdminRoute>
                <EmployeeSubmissions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <EmployeeRoute>
                <EmployeeDashboard />
              </EmployeeRoute>
            }
          />
          <Route
            path="/employee/timesheet"
            element={
              <EmployeeRoute>
                <TodayTimesheet />
              </EmployeeRoute>
            }
          />
          <Route path="/employee/add-work" element={<Navigate to="/employee/timesheet" replace />} />
          <Route path="/employee/today-timesheet" element={<Navigate to="/employee/timesheet" replace />} />
          <Route path="/employee/submissions" element={<Navigate to="/employee/timesheet" replace />} />
          <Route
            path="/employee/profile"
            element={
              <EmployeeRoute>
                <Profile />
              </EmployeeRoute>
            }
          />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
