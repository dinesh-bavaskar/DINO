import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/employee/profile" replace />;
  return children;
};

export const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-page"><div className="spinner" /></div>;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/profile'} replace />;
  }
  return children;
};
