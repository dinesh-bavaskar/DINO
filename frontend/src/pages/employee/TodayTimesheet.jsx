import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Save, SendHorizontal, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { StatusBadge, TimePicker } from '../../components/ui';
import { buttonClass } from '../../components/uiClasses';
import {
  createTimesheet,
  deleteTimesheet,
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
  isExisting: false,
  project_name: '',
  milestone_name: '',
  task_name: '',
  planned_start: '',
  planned_end: '',
  actual_start: '',
  actual_end: '',
  status: 'draft',
});

const tableInputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

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

const formatTotal = (mins) =>
  `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

const getErrorMessage = (data) => {
  if (!data) return 'Unable to save timesheet.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  return Object.values(data).flat().join(' ');
};

/* ─── component ───────────────────────────────────────────────── */
const TimesheetPage = () => {
  const [rows, setRows]                   = useState([emptyRow()]);
  const [projects, setProjects]           = useState([]);
  const [milestonesCache, setMilestonesCache] = useState({});
  const [summary, setSummary]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [message, setMessage]             = useState('');

  /* Totals derived dynamically from the rows */
  const plannedTotal = useMemo(() =>
    rows.reduce((acc, row) => acc + toMinutes(calculateDuration(row.planned_start, row.planned_end)), 0)
  , [rows]);

  const actualTotal = useMemo(() =>
    rows.reduce((acc, row) => acc + toMinutes(calculateDuration(row.actual_start, row.actual_end)), 0)
  , [rows]);

  /* ── data loading ────────────────────────────────────────── */
  const fetchMilestonesForProject = (projectId) => {
    if (!projectId || milestonesCache[projectId] !== undefined) return;
    getMilestonesByProject(projectId)
      .then((res) => setMilestonesCache((prev) => ({ ...prev, [projectId]: res.data })))
      .catch(() => setMilestonesCache((prev) => ({ ...prev, [projectId]: [] })));
  };

  const loadData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    return Promise.all([getTodayTimesheets(), getDashboardSummary(), getProjects()])
      .then(([entriesRes, summaryRes, projectsRes]) => {
        const allEntries = entriesRes.data;
        setSummary(summaryRes.data);
        setProjects(projectsRes.data);

        // Pre-fetch milestones for existing entries' projects
        allEntries.forEach((e) => {
          const proj = projectsRes.data.find((p) => p.name === e.project_name);
          if (proj) {
            fetchMilestonesForProject(proj.id);
          }
        });

        if (allEntries.length === 0) {
          setRows([emptyRow()]);
        } else {
          setRows(
            allEntries.map((e) => ({
              id:             e.id,
              isExisting:     true,
              project_name:   e.project_name,
              milestone_name: e.milestone_name,
              task_name:      e.task_name,
              planned_start:  e.planned_start ? e.planned_start.substring(0, 5) : '',
              planned_end:    e.planned_end ? e.planned_end.substring(0, 5) : '',
              actual_start:   e.actual_start ? e.actual_start.substring(0, 5) : '',
              actual_end:     e.actual_end ? e.actual_end.substring(0, 5) : '',
              status:         e.status,
            }))
          );
        }
      })
      .catch(() => setError('Unable to load today\'s timesheet.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  /* ── row operations ──────────────────────────────────────── */
  const updateRow = (rowId, name, value) => {
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

  const addTask = () => {
    setError('');
    setMessage('');
    setRows((cur) => [...cur, emptyRow()]);
  };

  const removeTask = async (row) => {
    if (!row.isExisting) {
      setRows((cur) => cur.length === 1 ? [emptyRow()] : cur.filter((r) => r.id !== row.id));
      return;
    }
    if (!window.confirm('Delete this timesheet entry?')) return;
    setError(''); setMessage('');
    try {
      await deleteTimesheet(row.id);
      loadData(false);
    } catch (err) {
      setError('Unable to delete timesheet entry.');
    }
  };

  /* ── validations ─────────────────────────────────────────── */
  const validateRows = (isSubmit) => {
    if (rows.length === 0) {
      setError('No tasks to save.');
      return false;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      
      if (!r.project_name) {
        setError(`Row ${rowNum}: Please select a project.`);
        return false;
      }
      if (!r.milestone_name) {
        setError(`Row ${rowNum}: Please select a milestone.`);
        return false;
      }
      if (!r.task_name.trim()) {
        setError(`Row ${rowNum}: Please enter a task description.`);
        return false;
      }
      if (!r.planned_start || !r.planned_end) {
        setError(`Row ${rowNum}: Please select planned start and end times.`);
        return false;
      }
      if (calculateDuration(r.planned_start, r.planned_end) === '—') {
        setError(`Row ${rowNum}: Planned start time must be before planned end time.`);
        return false;
      }

      if (isSubmit) {
        if (!r.actual_start || !r.actual_end) {
          setError(`Row ${rowNum}: Please select actual start and end times for final submission.`);
          return false;
        }
        if (calculateDuration(r.actual_start, r.actual_end) === '—') {
          setError(`Row ${rowNum}: Actual start time must be before actual end time.`);
          return false;
        }
      } else {
        if ((r.actual_start && !r.actual_end) || (!r.actual_start && r.actual_end)) {
          setError(`Row ${rowNum}: Please select both actual start and end times, or leave both empty.`);
          return false;
        }
        if (r.actual_start && r.actual_end && calculateDuration(r.actual_start, r.actual_end) === '—') {
          setError(`Row ${rowNum}: Actual start time must be before actual end time.`);
          return false;
        }
      }
    }

    if (isSubmit) {
      if (actualTotal > 8 * 60) {
        setError('Daily total actual hours must not exceed 8 hours.');
        return false;
      }
    }

    return true;
  };

  /* ── save / submit operations ────────────────────────────── */
  const handleSaveDraft = async () => {
    if (!validateRows(false)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      for (const row of rows) {
        const payload = {
          project_name:   row.project_name,
          milestone_name: row.milestone_name,
          task_name:      row.task_name,
          task_type:      'Development',
          planned_start:  row.planned_start,
          planned_end:    row.planned_end,
          actual_start:   row.actual_start || row.planned_start,
          actual_end:     row.actual_end || row.planned_end,
          remarks:        row.task_name,
        };

        if (row.isExisting) {
          if (row.status === 'draft') {
            await updateTimesheet(row.id, payload);
          }
        } else {
          await createTimesheet(payload);
        }
      }
      setMessage('Timesheet saved as draft.');
      await loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!validateRows(true)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const savedIds = [];
      for (const row of rows) {
        const payload = {
          project_name:   row.project_name,
          milestone_name: row.milestone_name,
          task_name:      row.task_name,
          task_type:      'Development',
          planned_start:  row.planned_start,
          planned_end:    row.planned_end,
          actual_start:   row.actual_start,
          actual_end:     row.actual_end,
          remarks:        row.task_name,
        };

        if (row.isExisting) {
          if (row.status === 'draft') {
            await updateTimesheet(row.id, payload);
            savedIds.push(row.id);
          }
        } else {
          const res = await createTimesheet(payload);
          savedIds.push(res.data.id);
        }
      }

      for (const id of savedIds) {
        await setTimesheetSubmissionStatus(id, 'submitted');
      }

      for (const row of rows) {
        if (row.isExisting && row.status === 'draft' && !savedIds.includes(row.id)) {
          await setTimesheetSubmissionStatus(row.id, 'submitted');
        }
      }

      setMessage('Timesheet submitted successfully!');
      await loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

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

            {/* ── Table Card ── */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Daily Timesheet</h2>
                  <p className="text-xs text-slate-500">Log planned and actual hours side-by-side</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <Clock size={13} />
                    Planned total: {formatTotal(plannedTotal)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5">
                    <Clock size={13} />
                    Actual total: {formatTotal(actualTotal)}
                  </div>
                </div>
              </div>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="w-full">
                  <table className="w-full table-fixed border-collapse text-left">
                    <colgroup>
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[20%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[7%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[7%]" />
                      <col className="w-[4%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" rowSpan={2}>Project</th>
                        <th className="border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" rowSpan={2}>Milestone</th>
                        <th className="border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" rowSpan={2}>Task Description</th>
                        <th className="border-r border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-slate-700 bg-blue-50/50 text-blue-800" colSpan={3}>Planned Time</th>
                        <th className="border-r border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-slate-700 bg-orange-50/50 text-orange-800" colSpan={3}>Actual Time</th>
                        <th className="px-1 py-2" rowSpan={2} />
                      </tr>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-blue-50/20">From</th>
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-blue-50/20">To</th>
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-blue-50/20">Dur</th>
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-orange-50/20">From</th>
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-orange-50/20">To</th>
                        <th className="border-r border-slate-200 px-2 py-1 text-center text-[10px] font-bold text-slate-500 bg-orange-50/20">Dur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isReadOnly = row.status === 'submitted';
                        return (
                          <tr className={`border-b border-slate-150 hover:bg-slate-50/50 ${isReadOnly ? 'bg-slate-50/30 text-slate-500' : ''}`} key={row.id}>
                            {/* Project */}
                            <td className="border-r border-slate-200 p-1.5">
                              {isReadOnly ? (
                                <div className="px-2 py-1 text-xs text-slate-700 font-medium truncate">{row.project_name}</div>
                              ) : (
                                <select
                                  className={tableInputClass}
                                  value={row.project_name}
                                  onChange={(e) => updateRow(row.id, 'project_name', e.target.value)}
                                >
                                  <option value="">Select Project</option>
                                  {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                              )}
                            </td>

                            {/* Milestone */}
                            <td className="border-r border-slate-200 p-1.5">
                              {isReadOnly ? (
                                <div className="px-2 py-1 text-xs text-slate-600 truncate">{row.milestone_name}</div>
                              ) : (
                                (() => {
                                  const proj = projects.find((p) => p.name === row.project_name);
                                  const list = proj ? (milestonesCache[proj.id] || []) : [];
                                  return (
                                    <select
                                      className={tableInputClass}
                                      disabled={!row.project_name}
                                      value={row.milestone_name}
                                      onChange={(e) => updateRow(row.id, 'milestone_name', e.target.value)}
                                    >
                                      <option value="">{row.project_name ? 'Select Milestone' : '— select project —'}</option>
                                      {list.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    </select>
                                  );
                                })()
                              )}
                            </td>

                            {/* Task Description */}
                            <td className="border-r border-slate-200 p-1.5">
                              {isReadOnly ? (
                                <div className="px-2 py-1 text-xs text-slate-600 truncate" title={row.task_name}>{row.task_name}</div>
                              ) : (
                                <input
                                  className={tableInputClass}
                                  placeholder="What will you work on?"
                                  value={row.task_name}
                                  onChange={(e) => updateRow(row.id, 'task_name', e.target.value)}
                                />
                              )}
                            </td>

                            {/* Planned From */}
                            <td className="border-r border-slate-200 p-1">
                              <TimePicker
                                disabled={isReadOnly}
                                className="w-full border-slate-200 focus:border-blue-400"
                                value={row.planned_start}
                                onChange={(val) => updateRow(row.id, 'planned_start', val)}
                              />
                            </td>

                            {/* Planned To */}
                            <td className="border-r border-slate-200 p-1">
                              <TimePicker
                                disabled={isReadOnly}
                                className="w-full border-slate-200 focus:border-blue-400"
                                value={row.planned_end}
                                onChange={(val) => updateRow(row.id, 'planned_end', val)}
                              />
                            </td>

                            {/* Planned Dur */}
                            <td className="border-r border-slate-200 px-2 py-2 text-center text-xs font-bold text-blue-700">
                              {calculateDuration(row.planned_start, row.planned_end)}
                            </td>

                            {/* Actual From */}
                            <td className="border-r border-slate-200 p-1">
                              <TimePicker
                                disabled={isReadOnly}
                                className="w-full border-slate-200 focus:border-orange-400"
                                value={row.actual_start}
                                onChange={(val) => updateRow(row.id, 'actual_start', val)}
                              />
                            </td>

                            {/* Actual To */}
                            <td className="border-r border-slate-200 p-1">
                              <TimePicker
                                disabled={isReadOnly}
                                className="w-full border-slate-200 focus:border-orange-400"
                                value={row.actual_end}
                                onChange={(val) => updateRow(row.id, 'actual_end', val)}
                              />
                            </td>

                            {/* Actual Dur */}
                            <td className="border-r border-slate-200 px-2 py-2 text-center text-xs font-bold text-orange-600">
                              {calculateDuration(row.actual_start, row.actual_end)}
                            </td>

                            {/* Action */}
                            <td className="p-1 text-center">
                              <button
                                className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                                disabled={isReadOnly}
                                onClick={() => removeTask(row)}
                                type="button"
                                title={isReadOnly ? 'Submitted tasks cannot be deleted' : 'Delete task'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  onClick={addTask}
                  type="button"
                >
                  <Plus size={15} /> Add Task
                </button>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    className={`${buttonClass.outline} min-h-10`}
                    disabled={saving || rows.every(r => r.status === 'submitted')}
                    onClick={handleSaveDraft}
                    type="button"
                  >
                    Save as Draft
                  </button>
                  <button
                    className={`${buttonClass.primary} min-h-10`}
                    disabled={saving || rows.every(r => r.status === 'submitted')}
                    onClick={handleSubmitReport}
                    type="button"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                  >
                    <SendHorizontal size={15} /> Submit Report
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TimesheetPage;
