import { labelClass, statusTone } from './uiClasses';

export const Badge = ({ children, tone = 'sky' }) => {
  const tones = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.sky}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => (
  <Badge tone={statusTone[status] || 'slate'}>
    {(status || 'draft').replace(/^\w/, (letter) => letter.toUpperCase())}
  </Badge>
);

export const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
);
