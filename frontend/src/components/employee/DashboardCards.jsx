import { CalendarDays, CheckSquare, Clock, TimerReset } from 'lucide-react';

const cards = [
  { key: 'logged_hours', label: "Today's Logged Hours", suffix: 'Hours', icon: Clock, tone: 'bg-sky-100 text-sky-700' },
  { key: 'remaining_hours', label: 'Remaining Hours', suffix: 'Hours', icon: TimerReset, tone: 'bg-amber-100 text-amber-700' },
  { key: 'total_tasks', label: 'Total Tasks', suffix: 'Tasks', icon: CheckSquare, tone: 'bg-emerald-100 text-emerald-700' },
  { key: 'current_date', label: 'Current Date', suffix: '', icon: CalendarDays, tone: 'bg-violet-100 text-violet-700' },
];

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DashboardCards = ({ summary }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
    {cards.map(({ key, label, suffix, icon: Icon, tone }) => {
      const value = key === 'current_date' ? formatDate(summary?.[key]) : summary?.[key] ?? 0;
      return (
        <div key={key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {value}
                {suffix && <span className="ml-1 text-sm font-semibold text-slate-500">{suffix}</span>}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-md ${tone}`}>
              <Icon size={22} />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default DashboardCards;
