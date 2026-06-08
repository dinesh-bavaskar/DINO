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

export const TimePicker = ({ value, onChange, className }) => {
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const valStr = `${hh}:${mm}`;
      
      let displayHour = h % 12;
      displayHour = displayHour ? displayHour : 12;
      const displayMins = String(m).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      
      timeOptions.push({
        value: valStr,
        label: `${displayHour}:${displayMins} ${ampm}`
      });
    }
  }

  // Handle any custom value that is not exactly on the 15-minute interval (e.g. "16:10")
  if (value && !timeOptions.some(opt => opt.value === value)) {
    const parts = value.split(':');
    if (parts.length >= 2) {
      let rawH = parseInt(parts[0], 10);
      let rawM = parseInt(parts[1], 10);
      if (!isNaN(rawH) && !isNaN(rawM)) {
        let displayHour = rawH % 12;
        displayHour = displayHour ? displayHour : 12;
        const displayMins = String(rawM).padStart(2, '0');
        const ampm = rawH >= 12 ? 'PM' : 'AM';
        
        timeOptions.push({
          value,
          label: `${displayHour}:${displayMins} ${ampm}`
        });
        
        timeOptions.sort((a, b) => {
          const [ha, ma] = a.value.split(':').map(Number);
          const [hb, mb] = b.value.split(':').map(Number);
          return (ha * 60 + ma) - (hb * 60 + mb);
        });
      }
    }
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-800 cursor-pointer outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`}
    >
      <option value="">Select Time</option>
      {timeOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
