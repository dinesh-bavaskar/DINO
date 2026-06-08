import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-7">
        <div>
          <h1 className="text-base font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-none text-foreground">{user?.full_name}</p>
            <p className="mt-1 text-xs leading-none text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
