import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  LogOut,
  Building2,
  ChevronRight,
} from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Employees', icon: Users, path: '/admin/employees' },
  { label: 'Register Employee', icon: UserPlus, path: '/admin/register' },
];

const employeeLinks = [
  { label: 'My Profile', icon: User, path: '/employee/profile' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F4',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      boxShadow: '2px 0 12px rgba(29, 110, 245, 0.06)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '22px 20px',
        borderBottom: '1px solid #E2E8F4',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, #1D6EF5 0%, #1558CC 100%)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <Building2 size={20} color="#FFFFFF" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: '16px', color: '#FFFFFF' }}>EmpManager</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
            {user?.role === 'admin' ? 'Admin Panel' : 'Employee Portal'}
          </p>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          background: '#EBF2FF',
          borderRadius: '10px',
          border: '1px solid rgba(29, 110, 245, 0.15)',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #1D6EF5, #0EA5E9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '14px',
            flexShrink: 0,
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontWeight: 600,
              fontSize: '13px',
              color: '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.full_name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: '#1D6EF5', fontWeight: 500 }}>
              {user?.employee_id}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '4px 12px 12px' }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#94A3B8',
          paddingLeft: '8px',
          marginBottom: '6px',
        }}>
          Navigation
        </p>
        {links.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 12px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '3px',
                transition: 'all 0.2s ease',
                background: isActive
                  ? 'linear-gradient(135deg, #1D6EF5 0%, #1558CC 100%)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 4px 12px rgba(29,110,245,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#EBF2FF';
                  e.currentTarget.style.color = '#1D6EF5';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid #E2E8F4' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 12px',
            borderRadius: '9px',
            border: '1.5px solid #FECACA',
            cursor: 'pointer',
            background: '#FEF2F2',
            color: '#DC2626',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#DC2626';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#DC2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FEF2F2';
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.borderColor = '#FECACA';
          }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
