import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-7">
        <div>
          <h1 className="text-base font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-6">
          {/* Real-time Current Time Card */}
          <div className="flex flex-col items-center justify-center bg-slate-50/70 border border-slate-200/60 rounded-xl px-5 py-1.5 shadow-none select-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
              CURRENT TIME
            </span>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-base font-semibold font-mono text-slate-700 tracking-wider">
                {timeString}
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
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
      </div>
    </header>
  );
};

export default Navbar;
