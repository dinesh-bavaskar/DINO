import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminRoute, EmployeeRoute, PublicRoute } from './ProtectedRoutes';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/admin/Dashboard';
import EmployeeList from '../pages/admin/EmployeeList';
import RegisterEmployee from '../pages/admin/RegisterEmployee';
import Profile from '../pages/employee/Profile';

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

          {/* Employee Routes */}
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
