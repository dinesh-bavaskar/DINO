const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', yyyy: 'numeric' });
};

const DashboardCards = ({ summary }) => {
  const logged    = summary?.logged_hours    ?? 0;
  const remaining = summary?.remaining_hours ?? 0;
  const tasks     = summary?.total_tasks     ?? 0;
  const date      = summary?.current_date
    ? new Date(summary.current_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

  const cards = [
    {
      label: 'Logged Today',
      value: `${logged}h`,
    },
    {
      label: 'Remaining',
      value: `${remaining}h`,
    },
    {
      label: 'Tasks',
      value: tasks,
    },
    {
      label: 'Date',
      value: date,
    },
  ];

  return (
    <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {cards.map(({ label, value }) => (
        <div key={label} className="flex-1 min-w-0 px-4 py-5 sm:px-6">
          {/* Label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            {label}
          </p>

          {/* Value */}
          <p className={`font-medium text-slate-950 leading-none whitespace-nowrap ${
            String(value).length > 5 
              ? 'text-lg sm:text-xl xl:text-2xl' 
              : 'text-2xl xl:text-3xl'
          }`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
