import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', yyyy: 'numeric' });
};

const DashboardCards = ({ summary }) => {
  const logged    = summary?.logged_hours    ?? 0;
  const remaining = summary?.remaining_hours ?? 0;
  const tasks     = summary?.total_tasks     ?? 0;
  const date      = summary?.current_date
    ? new Date(summary.current_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  const loggedPct   = Math.round((logged / 8) * 100);
  const isOnTrack   = remaining === 0;

  const cards = [
    {
      label: "Today's Logged Hours",
      value: `${logged}h`,
      sub: loggedPct > 0
        ? { up: true,  text: `${loggedPct}% of daily 8h target` }
        : { up: null,  text: 'No hours logged yet' },
    },
    {
      label: 'Remaining Hours',
      value: `${remaining}h`,
      sub: isOnTrack
        ? { up: true,  text: 'Daily target complete' }
        : { up: false, text: `${remaining}h still to log today` },
    },
    {
      label: 'Tasks Logged',
      value: tasks,
      sub: tasks > 0
        ? { up: true,  text: `${tasks} task${tasks !== 1 ? 's' : ''} recorded today` }
        : { up: null,  text: 'No tasks added yet' },
    },
    {
      label: "Today's Date",
      value: date,
      sub: { up: null, text: new Date().toLocaleDateString('en-GB', { weekday: 'long' }) },
    },
  ];

  return (
    <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {cards.map(({ label, value, sub }) => (
        <div key={label} className="flex-1 min-w-0 px-4 py-5 sm:px-6">
          {/* Label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            {label}
          </p>

          {/* Value */}
          <p className="text-2xl xl:text-3xl font-black text-slate-950 leading-none whitespace-nowrap">
            {value}
          </p>

          {/* Sub-note */}
          <div className="flex items-center gap-1 mt-3">
            {sub.up === true  && <ArrowUpRight   size={13} className="flex-shrink-0 text-emerald-500" />}
            {sub.up === false && <ArrowDownRight  size={13} className="flex-shrink-0 text-red-500" />}
            <span className={`text-xs font-medium truncate ${
              sub.up === true  ? 'text-emerald-600' :
              sub.up === false ? 'text-red-500'     : 'text-slate-400'
            }`}>
              {sub.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
