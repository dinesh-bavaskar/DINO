import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const employeeLinks = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/employee/dashboard',
    description: 'Overview & stats',
  },
  {
    label: 'Timesheet',
    icon: ClipboardList,
    path: '/employee/timesheet',
    description: 'Log your work hours',
  },
  {
    label: 'Profile',
    icon: User,
    path: '/employee/profile',
    description: 'Account & settings',
  },
];

const EmployeeSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-screen sticky top-0',
          'border-r border-border bg-sidebar text-sidebar-foreground',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border',
            collapsed ? 'justify-center px-0' : 'gap-3 px-5'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight text-foreground">EmpManager</p>
              <p className="text-[11px] text-muted-foreground">Employee Portal</p>
            </div>
          )}
        </div>

        {/* User card */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 rounded-xl bg-accent/60 border border-border/60 p-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user?.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.employee_id}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Staff
              </Badge>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center py-4 border-b border-border">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
          )}
          {employeeLinks.map(({ label, icon: Icon, path, description }) => {
            const active = location.pathname === path;
            const btn = (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'shrink-0 transition-transform duration-150',
                    !active && 'group-hover:scale-110'
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <span className="block leading-none">{label}</span>
                    {!active && (
                      <span className="mt-0.5 block text-[11px] font-normal opacity-60 leading-none">
                        {description}
                      </span>
                    )}
                  </div>
                )}
                {!collapsed && active && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
                )}
              </button>
            );

            return collapsed ? (
              <Tooltip key={path}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{label}</p>
                  <p className="text-[11px] opacity-75">{description}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              btn
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-3 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full justify-center rounded-xl p-2.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        {employeeLinks.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-destructive transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default EmployeeSidebar;
