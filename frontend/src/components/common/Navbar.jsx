import { useAuth } from '../../context/AuthContext';
import { Bell, Search } from 'lucide-react';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid #E2E8F4',
      background: '#FFFFFF',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: '0 1px 4px rgba(29,110,245,0.06)',
    }}>
      {/* Left: Page title */}
      <div>
        <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#0F172A' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: '#64748B', marginTop: '1px' }}>{subtitle}</p>}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8FAFF',
          border: '1.5px solid #E2E8F4',
          borderRadius: '9px',
          padding: '8px 14px',
          minWidth: '200px',
          transition: 'all 0.2s ease',
        }}>
          <Search size={14} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0F172A',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              width: '100%',
            }}
          />
        </div>

        {/* Bell */}
        <button style={{
          width: '38px',
          height: '38px',
          borderRadius: '9px',
          border: '1.5px solid #E2E8F4',
          background: '#F8FAFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#1D6EF5';
          e.currentTarget.style.background = '#EBF2FF';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#E2E8F4';
          e.currentTarget.style.background = '#F8FAFF';
        }}
        >
          <Bell size={16} color="#475569" />
          <span style={{
            position: 'absolute',
            top: '8px', right: '8px',
            width: '7px', height: '7px',
            background: '#1D6EF5',
            borderRadius: '50%',
            border: '1.5px solid white',
          }} />
        </button>

        {/* Avatar */}
        <div style={{
          width: '38px',
          height: '38px',
          background: 'linear-gradient(135deg, #1D6EF5, #0EA5E9)',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(29,110,245,0.3)',
        }}>
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
