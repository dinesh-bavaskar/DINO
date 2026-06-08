import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Save, Sunrise, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { StatusBadge } from '../../components/ui';
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

const tableInputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const timeInputClass = `${tableInputClass} px-1`;

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
                  <h1 className="text-base font-bold text-slate-950 leading-none">Plan Your Day</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Enter tasks you plan to work on with estimated times.</p>
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

            {/* Entry table */}
            <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[30%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[5%]" />
                    <col className="w-[3%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-blue-50 border-b border-slate-300">
                      {['Project', 'Milestone', 'Task Description', 'Start', 'End', 'Duration', ''].map((h) => (
                        <th key={h} className="border-r last:border-r-0 border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/60">
                        <td className="border-r border-slate-200 p-1.5">
                          <select className={tableInputClass} value={row.project_name} onChange={(e) => updateRow(row.id, 'project_name', e.target.value)}>
                            <option value="">Select Project</option>
                            {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-200 p-1.5">
                          {(() => {
                            const proj = projects.find((p) => p.name === row.project_name);
                            const list = proj ? (milestonesCache[proj.id] || []) : [];
                            return (
                              <select className={tableInputClass} disabled={!row.project_name} value={row.milestone_name} onChange={(e) => updateRow(row.id, 'milestone_name', e.target.value)}>
                                <option value="">{row.project_name ? 'Select Milestone' : '— pick project —'}</option>
                                {list.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                              </select>
                            );
                          })()}
                        </td>
                        <td className="border-r border-slate-200 p-1.5">
                          <input className={tableInputClass} placeholder="What will you work on?" value={row.task_name} onChange={(e) => updateRow(row.id, 'task_name', e.target.value)} />
                        </td>
                        <td className="border-r border-slate-200 p-1.5">
                          <input className={timeInputClass} type="time" value={row.planned_start} onChange={(e) => updateRow(row.id, 'planned_start', e.target.value)} />
                        </td>
                        <td className="border-r border-slate-200 p-1.5">
                          <input className={timeInputClass} type="time" value={row.planned_end} onChange={(e) => updateRow(row.id, 'planned_end', e.target.value)} />
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2 text-center text-sm font-bold text-blue-700">
                          {calculateDuration(row.planned_start, row.planned_end)}
                        </td>
                        <td className="p-1 text-center">
                          <button className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={rows.length === 1} onClick={() => removeRow(row.id)} type="button">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                  <h2 className="text-sm font-bold text-slate-950">Today's Planned Entries</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Project', 'Milestone', 'Task', 'Planned Hours', 'Status'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.map((e) => (
                        <tr key={e.id} className="hover:bg-blue-50/30">
                          <td className="px-4 py-3 text-sm font-medium text-slate-950">{e.project_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{e.milestone_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{e.task_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{e.planned_hours}h</td>
                          <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default SODPage;
