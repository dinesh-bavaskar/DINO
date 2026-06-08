import { useEffect, useMemo, useState } from 'react';
import { Clock, SendHorizontal, Sunset, Sunrise } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { StatusBadge } from '../../components/ui';
import {
  getDashboardSummary,
  getTodayTimesheets,
  setTimesheetSubmissionStatus,
  updateTimesheet,
} from '../../services/timesheetService';

/* ─── helpers ──────────────────────────────────────────── */

const calculateDuration = (start, end) => {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '—';
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
};

const toMinutes = (dur) => {
  if (!dur || dur === '—') return 0;
  const [h, m] = dur.split(':').map(Number);
  return h * 60 + m;
};

const getErrorMessage = (data) => {
  if (!data) return 'Unable to submit.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  return Object.values(data).flat().join(' ');
};

/* ─── page ─────────────────────────────────────────────── */
const EODPage = () => {
  const navigate = useNavigate();
  const [eodRows, setEodRows] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const actualTotal = useMemo(() =>
    eodRows.reduce((acc, r) => acc + toMinutes(calculateDuration(r.actual_start, r.actual_end)), 0),
    [eodRows]);

  const formatTotal = (mins) =>
    `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

  const loadData = (showLoader = true) => {
    if (showLoader) setLoading(true);
    Promise.all([getTodayTimesheets(), getDashboardSummary()])
      .then(([eRes, sRes]) => {
        const all = eRes.data;
        setEntries(all);
        setSummary(sRes.data);
        const drafts = all.filter((e) => e.status === 'draft');
        setEodRows(drafts.map((e) => ({
          id: e.id,
          project_name: e.project_name,
          milestone_name: e.milestone_name,
          task_name: e.task_name,
          planned_start: e.planned_start,
          planned_end: e.planned_end,
          actual_start: e.actual_start,
          actual_end: e.actual_end,
          task_status: 'Completed',
        })));
      })
      .catch(() => setError('Unable to load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const updateRow = (id, name, value) => {
    setError(''); setMessage('');
    setEodRows((cur) => cur.map((r) => r.id === id ? { ...r, [name]: value } : r));
  };

  const handleSubmit = async () => {
    if (eodRows.length === 0) {
      setError('No draft entries to submit. Log your plan in SOD first.');
      return;
    }
    const bad = eodRows.find((r) =>
      !r.actual_start || !r.actual_end ||
      calculateDuration(r.actual_start, r.actual_end) === '—'
    );
    if (bad) { setError('Fill in actual start and end times for every task.'); return; }

    setSaving(true); setError(''); setMessage('');
    try {
      for (const r of eodRows) {
        await updateTimesheet(r.id, {
          project_name: r.project_name,
          milestone_name: r.milestone_name,
          task_name: r.task_name,
          task_type: 'Development',
          planned_start: r.planned_start,
          planned_end: r.planned_end,
          actual_start: r.actual_start,
          actual_end: r.actual_end,
          remarks: r.task_name,
        });
        await setTimesheetSubmissionStatus(r.id, 'submitted');
      }
      setMessage('EOD report submitted successfully!');
      loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Navbar
        title="End of Day"
        subtitle="Log actual hours and submit your daily report"
      />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
        {loading ? <Loader /> : (
          <div className="space-y-5">

            {/* Summary strip */}
            <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {[
                { label: 'Logged Today', value: `${summary?.logged_hours ?? 0}h` },
                { label: 'Remaining', value: `${summary?.remaining_hours ?? 0}h` },
                { label: 'Tasks', value: entries.length },
                { label: 'Drafts Left', value: eodRows.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-0 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950 leading-none">{value}</p>
                </div>
              ))}
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                  <Sunset size={17} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-950 leading-none">Log Actual Hours</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Update actual times for each task and submit.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700">
                <Clock size={12} />
                Actual total: {formatTotal(actualTotal)}
              </div>
            </div>

            {/* Alert */}
            {(error || message) && (
              <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                {error || message}
              </div>
            )}

            {/* EOD table or empty state */}
            {eodRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
                <Sunrise size={36} className="mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No draft entries to update</p>
                <p className="mt-1 text-xs text-slate-400">Save your SOD plan first, then come back here at end of day.</p>
                <button
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  onClick={() => navigate('/employee/sod')}
                  type="button"
                >
                  <Sunrise size={14} /> Go to SOD
                </button>
              </div>
            ) : (
              <>
                {/* Desktop View (Table Layout) */}
                <section className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3.5 px-4">Task Details</th>
                          <th className="py-3.5 px-4 text-center">Planned</th>
                          <th className="py-3.5 px-4">Actual Start</th>
                          <th className="py-3.5 px-4">Actual End</th>
                          <th className="py-3.5 px-4 text-center">Duration</th>
                          <th className="py-3.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {eodRows.map((row) => {
                          const actualDur = calculateDuration(row.actual_start, row.actual_end);
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition duration-150 ease-in-out">
                              <td className="py-4 px-4 max-w-xs md:max-w-sm">
                                <div className="flex flex-col gap-1.5">
                                  <span className="font-semibold text-slate-800 text-sm">{row.task_name}</span>
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                      {row.project_name}
                                    </span>
                                    {row.milestone_name && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {row.milestone_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center align-middle">
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50/50 text-blue-700 border border-blue-100/50">
                                  <Clock size={12} className="opacity-70" />
                                  {calculateDuration(row.planned_start, row.planned_end)}
                                </div>
                              </td>
                              <td className="py-4 px-4 align-middle">
                                <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition duration-150 ease-in-out">
                                  <input 
                                    type="time" 
                                    value={row.actual_start} 
                                    onChange={(e) => updateRow(row.id, 'actual_start', e.target.value)} 
                                    className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-slate-800"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-4 align-middle">
                                <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition duration-150 ease-in-out">
                                  <input 
                                    type="time" 
                                    value={row.actual_end} 
                                    onChange={(e) => updateRow(row.id, 'actual_end', e.target.value)} 
                                    className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-slate-800"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center align-middle">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                  actualDur !== '—' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                                }`}>
                                  {actualDur}
                                </span>
                              </td>
                              <td className="py-4 px-4 align-middle">
                                <div className="relative">
                                  <select
                                    value={row.task_status}
                                    onChange={(e) => updateRow(row.id, 'task_status', e.target.value)}
                                    className={`h-9 w-full rounded-lg border px-3 text-xs font-semibold outline-none transition-all shadow-sm focus:ring-2 cursor-pointer appearance-none pr-8 ${
                                      row.task_status === 'Completed'
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-100'
                                        : 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-100'
                                    }`}
                                  >
                                    <option value="Completed">✅ Completed</option>
                                    <option value="In-Progress">🔄 In-Progress</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500">
                                    <svg className="h-4 w-4 text-current opacity-70" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Mobile/Tablet View (Card Layout) */}
                <section className="block lg:hidden space-y-4">
                  {eodRows.map((row) => {
                    const actualDur = calculateDuration(row.actual_start, row.actual_end);
                    return (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition duration-200">
                        {/* Card Header: Project & Milestone */}
                        <div className="flex flex-wrap gap-2 items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {row.project_name}
                            </span>
                            {row.milestone_name && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {row.milestone_name}
                              </span>
                            )}
                          </div>
                          {/* Status Dropdown */}
                          <div className="relative min-w-[125px]">
                            <select
                              value={row.task_status}
                              onChange={(e) => updateRow(row.id, 'task_status', e.target.value)}
                              className={`h-8 w-full rounded-full border px-3 text-xs font-semibold outline-none transition-all cursor-pointer appearance-none pr-7 ${
                                row.task_status === 'Completed'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-100'
                                  : 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-100'
                              }`}
                            >
                              <option value="Completed">✅ Completed</option>
                              <option value="In-Progress">🔄 In-Progress</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500">
                              <svg className="h-3.5 w-3.5 text-current opacity-70" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Task Name */}
                        <h3 className="font-semibold text-slate-800 text-sm mb-3.5">{row.task_name}</h3>

                        {/* Card Body: Inputs */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actual Start</label>
                            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition duration-150 ease-in-out">
                              <input 
                                type="time" 
                                value={row.actual_start} 
                                onChange={(e) => updateRow(row.id, 'actual_start', e.target.value)} 
                                className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-slate-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actual End</label>
                            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition duration-150 ease-in-out">
                              <input 
                                type="time" 
                                value={row.actual_end} 
                                onChange={(e) => updateRow(row.id, 'actual_end', e.target.value)} 
                                className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Planned & Actual Duration */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Planned:</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50/50 text-blue-700 text-xs font-semibold border border-blue-100/50">
                              <Clock size={11} className="opacity-70" />
                              {calculateDuration(row.planned_start, row.planned_end)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Duration:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                              actualDur !== '—' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                            }`}>
                              {actualDur}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>

                <div className="flex justify-end">
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                    disabled={saving}
                    onClick={handleSubmit}
                    type="button"
                  >
                    <SendHorizontal size={15} />
                    {saving ? 'Submitting...' : 'Submit EOD Report'}
                  </button>
                </div>
              </>
            )}

            {/* All today's entries */}
            {entries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Today's Submissions</h2>
                  <span className="text-xs text-slate-500 font-medium">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} submitted</span>
                </div>

                {/* Desktop view for submissions */}
                <section className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Task Details</th>
                          <th className="py-3 px-4 text-center">Planned</th>
                          <th className="py-3 px-4 text-center">Actual</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entries.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-slate-800 text-sm">{e.task_name}</span>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {e.project_name}
                                  </span>
                                  {e.milestone_name && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                      {e.milestone_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-sm text-slate-600 font-medium">
                              {e.planned_hours}h
                            </td>
                            <td className="py-3.5 px-4 text-center text-sm text-orange-600 font-semibold">
                              {e.actual_hours}h
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={e.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Mobile view for submissions */}
                <section className="block lg:hidden space-y-3">
                  {entries.map((e) => (
                    <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition duration-200">
                      <div className="flex flex-wrap gap-2 items-center justify-between mb-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {e.project_name}
                          </span>
                          {e.milestone_name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {e.milestone_name}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={e.status} />
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm mb-3">{e.task_name}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div>
                          Planned: <span className="text-slate-700 font-semibold">{e.planned_hours}h</span>
                        </div>
                        <div>
                          Actual: <span className="text-orange-600 font-bold">{e.actual_hours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )}

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default EODPage;
