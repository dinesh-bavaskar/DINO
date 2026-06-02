import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserPlus, User, LogOut, Building2, ChevronRight,
} from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/admin/dashboard'  },
  { label: 'Employees',         icon: Users,           path: '/admin/employees'  },
  { label: 'Register Employee', icon: UserPlus,        path: '/admin/register'   },
];

const employeeLinks = [
  { label: 'My Profile', icon: User, path: '/employee/profile' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width:'256px', minHeight:'100vh',
      background:'#FFFFFF',
      borderRight:'1px solid #E8EDF5',
      display:'flex', flexDirection:'column', flexShrink:0,
      boxShadow:'1px 0 0 #E8EDF5',
    }}>

      {/* ── Brand ── */}
      <div style={{
        padding:'0 20px',
        height:'64px',
        display:'flex', alignItems:'center', gap:'10px',
        borderBottom:'1px solid #E8EDF5',
      }}>
        <div style={{
          width:'34px', height:'34px',
          background:'linear-gradient(135deg, #1A56DB, #1045B8)',
          borderRadius:'9px',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <Building2 size={18} color="#FFFFFF" />
        </div>
        <div>
          <p style={{ fontWeight:800, fontSize:'14px', color:'#0F172A', letterSpacing:'-0.2px' }}>EmpManager</p>
          <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:400, marginTop:'1px' }}>
            {user?.role === 'admin' ? 'Administrator' : 'Employee Portal'}
          </p>
        </div>
      </div>

      {/* ── User Card ── */}
      <div style={{ padding:'16px', borderBottom:'1px solid #E8EDF5' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'10px 12px',
          background:'#F4F7FD',
          borderRadius:'10px',
          border:'1px solid #DDE5F0',
        }}>
          <div style={{
            width:'34px', height:'34px', flexShrink:0,
            background:'linear-gradient(135deg, #1A56DB, #0EA5E9)',
            borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, color:'white', fontSize:'13px',
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <p style={{
              fontWeight:600, fontSize:'13px', color:'#0F172A',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {user?.full_name}
            </p>
            <p style={{ fontSize:'11px', color:'#1A56DB', fontWeight:500, marginTop:'1px' }}>
              {user?.employee_id}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex:1, padding:'12px 10px' }}>
        <p style={{
          fontSize:'10px', fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.9px', color:'#B0BAC9',
          padding:'0 8px', marginBottom:'6px',
        }}>
          Main Menu
        </p>

        {links.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width:'100%',
                display:'flex', alignItems:'center', gap:'9px',
                padding:'10px 10px',
                borderRadius:'8px',
                border:'none',
                cursor:'pointer',
                marginBottom:'2px',
                transition:'all 0.18s ease',
                background: active ? 'linear-gradient(135deg, #1A56DB, #1045B8)' : 'transparent',
                color: active ? '#FFFFFF' : '#475569',
                fontFamily:'Inter, sans-serif',
                fontSize:'13px',
                fontWeight: active ? 600 : 400,
                boxShadow: active ? '0 2px 10px rgba(26,86,219,0.25)' : 'none',
                textAlign:'left',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='#F0F5FF'; e.currentTarget.style.color='#1A56DB'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; } }}
            >
              <Icon size={16} style={{ flexShrink:0 }} />
              <span style={{ flex:1 }}>{label}</span>
              {active && <ChevronRight size={13} />}
            </button>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding:'12px 10px 20px', borderTop:'1px solid #E8EDF5' }}>
        <button
          onClick={handleLogout}
          style={{
            width:'100%',
            display:'flex', alignItems:'center', gap:'9px',
            padding:'10px 10px',
            borderRadius:'8px',
            border:'none',
            cursor:'pointer',
            background:'transparent',
            color:'#94A3B8',
            fontFamily:'Inter, sans-serif',
            fontSize:'13px',
            fontWeight:500,
            transition:'all 0.18s ease',
            textAlign:'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#DC2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94A3B8'; }}
        >
          <LogOut size={16} style={{ flexShrink:0 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
