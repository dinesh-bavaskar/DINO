import { Bell, ClipboardList, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const employeeTabs = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'Timesheet', icon: ClipboardList, path: '/employee/timesheet' },
  { label: 'Profile', icon: User, path: '/employee/profile' },
];

const Navbar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployee = user?.role === 'employee';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-7">
        <div>
          <h1 className="text-base font-bold text-slate-950">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50" type="button">
            <Bell size={16} />
          </button>
          <div className="hidden h-6 w-px bg-slate-200 sm:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-none text-slate-950">{user?.full_name}</p>
              <p className="mt-1 text-xs leading-none text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {isEmployee && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={15} /> Logout
              </button>
            )}
          </div>
        </div>
      </div>
      {isEmployee && (
        <nav className="flex gap-2 border-t border-slate-100 px-4 py-2 md:px-7">
          {employeeTabs.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <button
                className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
                key={path}
                onClick={() => navigate(path)}
                type="button"
              >
                <Icon size={16} /> {label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
