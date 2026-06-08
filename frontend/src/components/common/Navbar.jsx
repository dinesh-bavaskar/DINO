import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isEmployee = user?.role === 'employee';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-7">
        <div>
          <h1 className="text-base font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent" type="button">
            <Bell size={16} />
          </button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-none text-foreground">{user?.full_name}</p>
              <p className="mt-1 text-xs leading-none text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {isEmployee && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={15} /> Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
