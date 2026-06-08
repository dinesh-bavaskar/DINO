import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Sunrise,
  Sunset,
  User,
} from 'lucide-react';

const employeeLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'SOD',       icon: Sunrise,         path: '/employee/sod'       },
  { label: 'EOD',       icon: Sunset,          path: '/employee/eod'       },
  { label: 'Profile',   icon: User,            path: '/employee/profile'   },
];

const EmployeeSidebar = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
            <Building2 size={19} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">EmpManager</p>
            <p className="text-[11px] text-slate-400">Employee Portal</p>
          </div>
        </div>

        {/* User card */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-blue-50/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{user?.full_name}</p>
              <p className="mt-0.5 text-xs font-medium text-sky-600">{user?.employee_id}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <div className="space-y-1">
            {employeeLinks.map(({ label, icon: Icon, path }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-blue-600 font-semibold text-white shadow-sm'
                      : 'font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sign out */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        {employeeLinks.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                active ? 'bg-sky-50 text-sky-700' : 'text-slate-500'
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-500"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default EmployeeSidebar;
