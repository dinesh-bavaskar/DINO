import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Employees', icon: Users, path: '/admin/employees' },
  { label: 'Submissions', icon: ClipboardList, path: '/admin/submissions' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const employeeLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'Timesheet', icon: ClipboardList, path: '/employee/timesheet' },
  { label: 'Profile', icon: User, path: '/employee/profile' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className={`hidden shrink-0 flex-col border-r border-blue-900/50 bg-blue-950 text-slate-100 md:flex transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-16' : 'w-64'
        }`}>

        {/* Logo */}
        <div className={`flex h-16 items-center gap-3 border-b border-blue-900/50 px-4 ${isCollapsed ? 'justify-center' : ''
          }`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <Building2 size={19} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">EmpManager</p>
              <p className="text-[11px] text-blue-300 truncate">{user?.role === 'admin' ? 'Administrator' : 'Employee Portal'}</p>
            </div>
          )}
        </div>

        {/* User card */}
        <div className={`border-b border-blue-900/50 p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white shadow-sm"
              title={user?.full_name}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-blue-900/50 bg-blue-900/30 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="mt-0.5 text-xs font-medium text-sky-400">{user?.employee_id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-2">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-400/70">Workspace</p>
          )}
          <div className="space-y-1">
            {links.map(({ label, icon: Icon, path }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  title={isCollapsed ? label : undefined}
                  className={`flex w-full items-center rounded-lg transition ${isCollapsed
                    ? 'justify-center p-2.5'
                    : 'gap-3 px-3 py-2.5 text-left text-sm'
                    } ${active
                      ? 'bg-blue-600 font-semibold text-white shadow-sm'
                      : 'font-medium text-blue-100 hover:bg-blue-900/40 hover:text-white'
                    }`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer controls (Collapse & Sign Out) */}
        <div className="border-t border-blue-900/50 p-2 space-y-1">
          {/* Collapse Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : undefined}
            className={`flex w-full items-center rounded-lg transition ${isCollapsed
              ? 'justify-center p-2.5'
              : 'gap-3 px-3 py-2.5 text-left text-sm'
              } text-blue-200 hover:bg-blue-900/40 hover:text-white`}
          >
            {isCollapsed ? <ChevronRight size={17} className="shrink-0" /> : <ChevronLeft size={17} className="shrink-0" />}
            {!isCollapsed && <span className="truncate">Collapse</span>}
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`flex w-full items-center rounded-lg transition ${isCollapsed
              ? 'justify-center p-2.5'
              : 'gap-3 px-3 py-2.5 text-left text-sm'
              } text-blue-200 hover:bg-red-950/40 hover:text-red-300`}
          >
            <LogOut size={17} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-blue-900/50 bg-blue-950/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        {links.slice(0, 4).map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${active ? 'bg-blue-900/50 text-blue-100' : 'text-blue-200'}`}
              key={path}
              onClick={() => navigate(path)}
              type="button"
            >
              <Icon size={17} />
              <span className="max-w-full truncate">{label.replace(' Timesheet', '')}</span>
            </button>
          );
        })}
        <button className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-blue-200" onClick={handleLogout} type="button">
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
