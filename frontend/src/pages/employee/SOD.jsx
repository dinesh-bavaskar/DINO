import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Save, Sunrise, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { StatusBadge, TimePicker } from '../../components/ui';
import { buttonClass } from '../../components/uiClasses';
import {
  createTimesheet,
  getDashboardSummary,
  getProjects,
  getMilestonesByProject,
  getTodayTimesheets,
} from '../../services/timesheetService';

/* ─── helpers ──────────────────────────────────────────── */
const emptyRow = () => ({
  id: crypto.randomUUID(),
  project_name: '',
  milestone_name: '',
  task_name: '',
  planned_start: '',
  planned_end: '',
});

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
  if (!data) return 'Unable to save.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  return Object.values(data).flat().join(' ');
};

/* ─── page ─────────────────────────────────────────────── */
const SODPage = () => {
  const [rows, setRows]                       = useState([emptyRow()]);
  const [entries, setEntries]                 = useState([]);
  const [projects, setProjects]               = useState([]);
  const [milestonesCache, setMilestonesCache] = useState({});
  const [summary, setSummary]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');
  const [message, setMessage]                 = useState('');

  const plannedTotal = useMemo(() =>
    rows.reduce((acc, r) => acc + toMinutes(calculateDuration(r.planned_start, r.planned_end)), 0),
  [rows]);

  const formatTotal = (mins) =>
    `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

  const loadData = (showLoader = true) => {
    if (showLoader) setLoading(true);
    Promise.all([getTodayTimesheets(), getDashboardSummary(), getProjects()])
      .then(([eRes, sRes, pRes]) => {
        setEntries(eRes.data);
        setSummary(sRes.data);
        setProjects(pRes.data);
      })
      .catch(() => setError('Unable to load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const fetchMilestones = (projectId) => {
    if (!projectId || milestonesCache[projectId] !== undefined) return;
    getMilestonesByProject(projectId)
      .then((r) => setMilestonesCache((p) => ({ ...p, [projectId]: r.data })))
      .catch(() => setMilestonesCache((p) => ({ ...p, [projectId]: [] })));
  };

  const updateRow = (id, name, value) => {
    setError(''); setMessage('');
    setRows((cur) => cur.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [name]: value };
      if (name === 'project_name') {
        updated.milestone_name = '';
        const proj = projects.find((p) => p.name === value);
        if (proj) fetchMilestones(proj.id);
      }
      return updated;
    }));
  };

  const addRow    = () => setRows((c) => [...c, emptyRow()]);
  const removeRow = (id) => setRows((c) => c.length === 1 ? c : c.filter((r) => r.id !== id));

  const handleSave = async () => {
    const bad = rows.find((r) =>
      !r.project_name || !r.milestone_name || !r.task_name ||
      !r.planned_start || !r.planned_end ||
      calculateDuration(r.planned_start, r.planned_end) === '—'
    );
    if (bad) { setError('Fill in all fields with valid planned times.'); return; }

    setSaving(true); setError(''); setMessage('');
    try {
      for (const r of rows) {
        await createTimesheet({
          project_name:   r.project_name,
          milestone_name: r.milestone_name,
          task_name:      r.task_name,
          task_type:      'Development',
          planned_start:  r.planned_start,
          planned_end:    r.planned_end,
          actual_start:   r.planned_start,
          actual_end:     r.planned_end,
          remarks:        r.task_name,
        });
      }
      setRows([emptyRow()]);
      setMessage('SOD plan saved. Head to EOD at end of day to log actual hours.');
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
        title="Start of Day"
        subtitle="Plan your tasks for the day"
      />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
        {loading ? <Loader /> : (
          <div className="space-y-5">

            {/* Summary strip */}
            <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {[
                { label: 'Logged Today',    value: `${summary?.logged_hours ?? 0}h`    },
                { label: 'Remaining',        value: `${summary?.remaining_hours ?? 0}h` },
                { label: 'Tasks Planned',    value: entries.length                      },
                { label: 'Date',             value: summary?.current_date
                    ? new Date(summary.current_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—' },
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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Sunrise size={17} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-950">Plan Your Day</h1>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Clock size={12} />
                Total planned: {formatTotal(plannedTotal)}
              </div>
            </div>

            {/* Alert */}
            {(error || message) && (
              <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                {error || message}
              </div>
            )}

            {/* Desktop View (Table Layout) */}
            <section className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 w-[22%]">Project</th>
                      <th className="py-3.5 px-4 w-[22%]">Milestone</th>
                      <th className="py-3.5 px-4 w-[28%]">Task Description</th>
                      <th className="py-3.5 px-4 w-[11%]">Planned Start</th>
                      <th className="py-3.5 px-4 w-[11%]">Planned End</th>
                      <th className="py-3.5 px-4 text-center w-[8%]">Duration</th>
                      <th className="py-3.5 px-4 text-center w-[4%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const duration = calculateDuration(row.planned_start, row.planned_end);
                      const proj = projects.find((p) => p.name === row.project_name);
                      const milestones = proj ? (milestonesCache[proj.id] || []) : [];
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition duration-150 ease-in-out">
                          {/* Project Select */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                              <select 
                                className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 cursor-pointer appearance-none pr-8"
                                value={row.project_name} 
                                onChange={(e) => updateRow(row.id, 'project_name', e.target.value)}
                              >
                                <option value="">Select Project</option>
                                {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                                <svg className="h-4 w-4 text-current" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </td>

                          {/* Milestone Select */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                              <select 
                                className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 cursor-pointer appearance-none pr-8 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                disabled={!row.project_name} 
                                value={row.milestone_name} 
                                onChange={(e) => updateRow(row.id, 'milestone_name', e.target.value)}
                              >
                                <option value="">{row.project_name ? 'Select Milestone' : '— pick project —'}</option>
                                {milestones.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                                <svg className="h-4 w-4 text-current" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </td>

                          {/* Task Description Input */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                              <input 
                                className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 placeholder-slate-400"
                                placeholder="What will you work on?" 
                                value={row.task_name || ''} 
                                onChange={(e) => updateRow(row.id, 'task_name', e.target.value)} 
                              />
                            </div>
                          </td>

                          {/* Start Time Input */}
                          <td className="py-3.5 px-4 align-middle">
                            <TimePicker className="w-full justify-between" value={row.planned_start} onChange={(val) => updateRow(row.id, 'planned_start', val)} />
                          </td>

                          {/* End Time Input */}
                          <td className="py-3.5 px-4 align-middle">
                            <TimePicker className="w-full justify-between" value={row.planned_end} onChange={(val) => updateRow(row.id, 'planned_end', val)} />
                          </td>

                          {/* Planned Duration Column */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                              duration !== '—' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                            }`}>
                              {duration}
                            </span>
                          </td>

                          {/* Delete Button Column */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <button 
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-all duration-150 shadow-sm border border-transparent hover:border-red-100" 
                              disabled={rows.length === 1} 
                              onClick={() => removeRow(row.id)} 
                              type="button"
                            >
                              <Trash2 size={14} />
                            </button>
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
              {rows.map((row, index) => {
                const duration = calculateDuration(row.planned_start, row.planned_end);
                const proj = projects.find((p) => p.name === row.project_name);
                const milestones = proj ? (milestonesCache[proj.id] || []) : [];
                return (
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition duration-200">
                    {/* Card Header: Task Number & Delete Button */}
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Task #{index + 1}
                      </span>
                      <button 
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-all duration-150 shadow-sm border border-slate-100 hover:border-red-100" 
                        disabled={rows.length === 1} 
                        onClick={() => removeRow(row.id)} 
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Card Body: Form Fields */}
                    <div className="space-y-3.5">
                      {/* Project Selector */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project</label>
                        <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                          <select 
                            className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 cursor-pointer appearance-none pr-8"
                            value={row.project_name} 
                            onChange={(e) => updateRow(row.id, 'project_name', e.target.value)}
                          >
                            <option value="">Select Project</option>
                            {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <svg className="h-4 w-4 text-current" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Selector */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Milestone</label>
                        <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                          <select 
                            className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 cursor-pointer appearance-none pr-8 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            disabled={!row.project_name} 
                            value={row.milestone_name} 
                            onChange={(e) => updateRow(row.id, 'milestone_name', e.target.value)}
                          >
                            <option value="">{row.project_name ? 'Select Milestone' : '— pick project —'}</option>
                            {milestones.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <svg className="h-4 w-4 text-current" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Task Description */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Task Description</label>
                        <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition duration-150 ease-in-out">
                          <input 
                            className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-800 placeholder-slate-400"
                            placeholder="What will you work on?" 
                            value={row.task_name || ''} 
                            onChange={(e) => updateRow(row.id, 'task_name', e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Start and End Times Grid */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start Time</label>
                          <TimePicker className="w-full justify-between" value={row.planned_start} onChange={(val) => updateRow(row.id, 'planned_start', val)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End Time</label>
                          <TimePicker className="w-full justify-between" value={row.planned_end} onChange={(val) => updateRow(row.id, 'planned_end', val)} />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Planned Duration */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">Estimated Duration:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                        duration !== '—' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={addRow} type="button">
                <Plus size={15} /> Add Task
              </button>
              <button className={buttonClass.primary} disabled={saving} onClick={handleSave} type="button">
                <Save size={15} /> {saving ? 'Saving...' : 'Save SOD Plan'}
              </button>
            </div>

            {/* Today's planned entries */}
            {entries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Today's Planned Entries</h2>
                  <span className="text-xs text-slate-500 font-medium">{entries.length} {entries.length === 1 ? 'task' : 'tasks'} planned</span>
                </div>

                {/* Desktop view for planned entries */}
                <section className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Task Details</th>
                          <th className="py-3 px-4 text-center">Planned Hours</th>
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
                            <td className="py-3.5 px-4">
                              <StatusBadge status={e.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Mobile view for planned entries */}
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
                          Planned: <span className="text-blue-700 font-bold">{e.planned_hours}h</span>
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

export default SODPage;
