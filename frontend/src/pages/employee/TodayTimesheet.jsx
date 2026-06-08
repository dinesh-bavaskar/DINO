import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Save, SendHorizontal, Sunrise, Sunset, Trash2 } from 'lucide-react';
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
  setTimesheetSubmissionStatus,
  updateTimesheet,
} from '../../services/timesheetService';

/* ─── helpers ─────────────────────────────────────────────────── */
const emptyRow = () => ({
  id: crypto.randomUUID(),
  project_name: '',
  milestone_name: '',
  task_name: '',
  planned_start: '',
  planned_end: '',
  actual_start: '',
  actual_end: '',
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
  if (!data) return 'Unable to save timesheet.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  return Object.values(data).flat().join(' ');
};

/* ─── component ───────────────────────────────────────────────── */
const TimesheetPage = () => {
  const [tab, setTab]                     = useState('sod');
  const [rows, setRows]                   = useState([emptyRow()]);
  const [eodRows, setEodRows]             = useState([]);   // draft entries for EOD editing
  const [entries, setEntries]             = useState([]);
  const [projects, setProjects]           = useState([]);
  const [milestonesCache, setMilestonesCache] = useState({});
  const [summary, setSummary]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [message, setMessage]             = useState('');

  /* totals for SOD preview */
  const sodTotals = useMemo(() =>
    rows.reduce((acc, row) => ({
      planned: acc.planned + toMinutes(calculateDuration(row.planned_start, row.planned_end)),
    }), { planned: 0 }), [rows]);

  /* totals for EOD */
  const eodTotals = useMemo(() =>
    eodRows.reduce((acc, row) => ({
      actual: acc.actual + toMinutes(calculateDuration(row.actual_start, row.actual_end)),
    }), { actual: 0 }), [eodRows]);

  const formatTotal = (mins) =>
    `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

  /* ── data loading ────────────────────────────────────────── */
  const loadData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    return Promise.all([getTodayTimesheets(), getDashboardSummary(), getProjects()])
      .then(([entriesRes, summaryRes, projectsRes]) => {
        const allEntries = entriesRes.data;
        setEntries(allEntries);
        setSummary(summaryRes.data);
        setProjects(projectsRes.data);
        // populate EOD rows from today's DRAFT entries
        const drafts = allEntries.filter((e) => e.status === 'draft');
        setEodRows(
          drafts.map((e) => ({
            id:             e.id,       // real DB id
            isExisting:     true,
            project_name:   e.project_name,
            milestone_name: e.milestone_name,
            task_name:      e.task_name,
            planned_start:  e.planned_start,
            planned_end:    e.planned_end,
            actual_start:   e.actual_start,
            actual_end:     e.actual_end,
          }))
        );
      })
      .catch(() => setError('Unable to load today\'s timesheet.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  /* ── milestones cache ────────────────────────────────────── */
  const fetchMilestonesForProject = (projectId) => {
    if (!projectId || milestonesCache[projectId] !== undefined) return;
    getMilestonesByProject(projectId)
      .then((res) => setMilestonesCache((prev) => ({ ...prev, [projectId]: res.data })))
      .catch(() => setMilestonesCache((prev) => ({ ...prev, [projectId]: [] })));
  };

  /* ── SOD row helpers ─────────────────────────────────────── */
  const updateSodRow = (rowId, name, value) => {
    setError(''); setMessage('');
    setRows((cur) => cur.map((row) => {
      if (row.id !== rowId) return row;
      const updated = { ...row, [name]: value };
      if (name === 'project_name') {
        updated.milestone_name = '';
        const proj = projects.find((p) => p.name === value);
        if (proj) fetchMilestonesForProject(proj.id);
      }
      return updated;
    }));
  };

  const addSodTask   = () => setRows((cur) => [...cur, emptyRow()]);
  const removeSodTask = (id) => setRows((cur) => cur.length === 1 ? cur : cur.filter((r) => r.id !== id));

  const validateSodRows = () => {
    const bad = rows.find((r) =>
      !r.project_name || !r.milestone_name || !r.task_name ||
      !r.planned_start || !r.planned_end ||
      calculateDuration(r.planned_start, r.planned_end) === '—'
    );
    if (bad) { setError('Fill in all fields with valid planned times before saving.'); return false; }
    return true;
  };

  const saveSodRows = async () => {
    if (!validateSodRows()) return;
    setSaving(true); setError(''); setMessage('');
    try {
      for (const row of rows) {
        await createTimesheet({
          project_name:   row.project_name,
          milestone_name: row.milestone_name,
          task_name:      row.task_name,
          task_type:      'Development',
          planned_start:  row.planned_start,
          planned_end:    row.planned_end,
          actual_start:   row.planned_start,   // mirrors planned until EOD update
          actual_end:     row.planned_end,
          remarks:        row.task_name,
        });
      }
      setRows([emptyRow()]);
      setMessage('SOD plan saved as draft. Switch to EOD to log actual hours.');
      loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  /* ── EOD row helpers ─────────────────────────────────────── */
  const updateEodRow = (rowId, name, value) => {
    setError(''); setMessage('');
    setEodRows((cur) => cur.map((r) => r.id === rowId ? { ...r, [name]: value } : r));
  };

  const validateEodRows = () => {
    if (eodRows.length === 0) { setError('No draft entries to submit. Log your plan in SOD first.'); return false; }
    const bad = eodRows.find((r) =>
      !r.actual_start || !r.actual_end ||
      calculateDuration(r.actual_start, r.actual_end) === '—'
    );
    if (bad) { setError('Fill in actual start and end times for every task.'); return false; }
    return true;
  };

  const submitEod = async () => {
    if (!validateEodRows()) return;
    setSaving(true); setError(''); setMessage('');
    try {
      for (const row of eodRows) {
        if (row.isExisting) {
          await updateTimesheet(row.id, {
            project_name:   row.project_name,
            milestone_name: row.milestone_name,
            task_name:      row.task_name,
            task_type:      'Development',
            planned_start:  row.planned_start,
            planned_end:    row.planned_end,
            actual_start:   row.actual_start,
            actual_end:     row.actual_end,
            remarks:        row.task_name,
          });
          await setTimesheetSubmissionStatus(row.id, 'submitted');
        }
      }
      setMessage('EOD report submitted successfully!');
      loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <Navbar title="Daily Timesheet" subtitle="Log your start-of-day plan and end-of-day actuals" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
        {loading ? <Loader /> : (
          <div className="space-y-5">

            {/* ── Summary strip ── */}
            <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {[
                { label: 'Logged Today',    value: `${summary?.logged_hours ?? 0}h`    },
                { label: 'Remaining',        value: `${summary?.remaining_hours ?? 0}h` },
                { label: 'Tasks',            value: summary?.total_tasks ?? 0           },
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

            {/* ── Tab bar ── */}
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                id="tab-sod"
                type="button"
                onClick={() => { setTab('sod'); setError(''); setMessage(''); }}
                className={`flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold transition border-b-2 ${
                  tab === 'sod'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Sunrise size={16} />
                SOD — Start of Day
              </button>
              <div className="w-px bg-slate-200" />
              <button
                id="tab-eod"
                type="button"
                onClick={() => { setTab('eod'); setError(''); setMessage(''); }}
                className={`flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold transition border-b-2 ${
                  tab === 'eod'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Sunset size={16} />
                EOD — End of Day
              </button>
            </div>

            {/* ── Alert ── */}
            {(error || message) && (
              <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                error
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}>
                {error || message}
              </div>
            )}

            {/* ════════════════ SOD TAB ════════════════ */}
            {tab === 'sod' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Plan Your Day</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5">
                    <Clock size={13} />
                    Planned total: {formatTotal(sodTotals.planned)}
                  </div>
                </div>

                <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                        <col className="w-[28%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[3%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-blue-50 border-b border-slate-300">
                          <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Project</th>
                          <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Milestone</th>
                          <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Task Description</th>
                          <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-slate-700">Start</th>
                          <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-slate-700">End</th>
                          <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-slate-700">Duration</th>
                          <th className="px-1 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr className="border-b border-slate-200 hover:bg-slate-50/60" key={row.id}>
                            <td className="border-r border-slate-200 p-1.5">
                              <select className={tableInputClass} value={row.project_name} onChange={(e) => updateSodRow(row.id, 'project_name', e.target.value)}>
                                <option value="">Select Project</option>
                                {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                            </td>
                            <td className="border-r border-slate-200 p-1.5">
                              {(() => {
                                const proj = projects.find((p) => p.name === row.project_name);
                                const list = proj ? (milestonesCache[proj.id] || []) : [];
                                return (
                                  <select className={tableInputClass} disabled={!row.project_name} value={row.milestone_name} onChange={(e) => updateSodRow(row.id, 'milestone_name', e.target.value)}>
                                    <option value="">{row.project_name ? 'Select Milestone' : '— select project —'}</option>
                                    {list.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                                  </select>
                                );
                              })()}
                            </td>
                            <td className="border-r border-slate-200 p-1.5">
                              <input className={tableInputClass} placeholder="What will you work on?" value={row.task_name} onChange={(e) => updateSodRow(row.id, 'task_name', e.target.value)} />
                            </td>
                            <td className="border-r border-slate-200 p-1.5">
                              <TimePicker className="w-full justify-between border-0 shadow-none px-1 py-0" value={row.planned_start} onChange={(val) => updateSodRow(row.id, 'planned_start', val)} />
                            </td>
                            <td className="border-r border-slate-200 p-1.5">
                              <TimePicker className="w-full justify-between border-0 shadow-none px-1 py-0" value={row.planned_end} onChange={(val) => updateSodRow(row.id, 'planned_end', val)} />
                            </td>
                            <td className="border-r border-slate-200 px-2 py-2 text-center text-sm font-bold text-blue-700">
                              {calculateDuration(row.planned_start, row.planned_end)}
                            </td>
                            <td className="p-1 text-center">
                              <button className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={rows.length === 1} onClick={() => removeSodTask(row.id)} type="button">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={addSodTask} type="button">
                    <Plus size={15} /> Add Task
                  </button>
                  <button className={buttonClass.primary} disabled={saving} onClick={saveSodRows} type="button">
                    <Save size={15} /> {saving ? 'Saving...' : 'Save SOD Plan'}
                  </button>
                </div>

                {/* Today's saved SOD entries */}
                {entries.length > 0 && (
                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-950">Today's Planned Entries</h3>
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

            {/* ════════════════ EOD TAB ════════════════ */}
            {tab === 'eod' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Log Actual Hours</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5">
                    <Clock size={13} />
                    Actual total: {formatTotal(eodTotals.actual)}
                  </div>
                </div>

                {eodRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
                    <Sunrise size={32} className="mb-3 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">No draft entries yet</p>
                    <p className="mt-1 text-xs text-slate-400">Go to the SOD tab to log your planned tasks first.</p>
                    <button className="mt-4 text-xs font-semibold text-blue-600 hover:underline" onClick={() => setTab('sod')} type="button">
                      → Switch to SOD
                    </button>
                  </div>
                ) : (
                  <>
                    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed border-collapse">
                          <colgroup>
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                            <col className="w-[22%]" />
                            <col className="w-[9%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                          </colgroup>
                          <thead>
                            <tr className="bg-orange-50 border-b border-slate-300">
                              <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Project</th>
                              <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Milestone</th>
                              <th className="border-r border-slate-300 px-3 py-2.5 text-left text-xs font-bold text-slate-700">Task</th>
                              <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-slate-700">Planned</th>
                              <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-orange-700">Actual Start</th>
                              <th className="border-r border-slate-300 px-2 py-2.5 text-center text-xs font-bold text-orange-700">Actual End</th>
                              <th className="px-2 py-2.5 text-center text-xs font-bold text-orange-700">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eodRows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-200 hover:bg-orange-50/20">
                                <td className="border-r border-slate-200 px-3 py-2 text-xs font-medium text-slate-950">{row.project_name}</td>
                                <td className="border-r border-slate-200 px-3 py-2 text-xs text-slate-600">{row.milestone_name}</td>
                                <td className="border-r border-slate-200 px-3 py-2 text-xs text-slate-600">{row.task_name}</td>
                                <td className="border-r border-slate-200 px-2 py-2 text-center text-xs font-semibold text-blue-700">
                                  {calculateDuration(row.planned_start, row.planned_end)}
                                </td>
                                 <td className="border-r border-slate-200 p-1.5">
                                   <TimePicker className="w-full justify-between border-0 shadow-none px-1 py-0" value={row.actual_start} onChange={(val) => updateEodRow(row.id, 'actual_start', val)} />
                                 </td>
                                 <td className="border-r border-slate-200 p-1.5">
                                   <TimePicker className="w-full justify-between border-0 shadow-none px-1 py-0" value={row.actual_end} onChange={(val) => updateEodRow(row.id, 'actual_end', val)} />
                                 </td>
                                <td className="px-2 py-2 text-center text-sm font-bold text-orange-600">
                                  {calculateDuration(row.actual_start, row.actual_end)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <div className="flex justify-end">
                      <button className={buttonClass.primary} disabled={saving} onClick={submitEod} type="button"
                        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                        <SendHorizontal size={15} /> {saving ? 'Submitting...' : 'Submit EOD Report'}
                      </button>
                    </div>
                  </>
                )}

                {/* All today's entries summary */}
                {entries.length > 0 && (
                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-orange-50 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-950">Today's Submissions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            {['Project', 'Milestone', 'Task', 'Planned', 'Actual', 'Status'].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entries.map((e) => (
                            <tr key={e.id} className="hover:bg-orange-50/30">
                              <td className="px-4 py-3 text-sm font-medium text-slate-950">{e.project_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{e.milestone_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{e.task_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{e.planned_hours}h</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{e.actual_hours}h</td>
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

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TimesheetPage;
