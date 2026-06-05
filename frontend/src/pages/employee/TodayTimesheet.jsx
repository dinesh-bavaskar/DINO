import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, SendHorizontal, Trash2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { StatusBadge } from '../../components/ui';
import { buttonClass } from '../../components/uiClasses';
import {
  createTimesheet,
  getDashboardSummary,
  getProjects,
  getTodayTimesheets,
  setTimesheetSubmissionStatus,
} from '../../services/timesheetService';

const milestoneOptions = ['Planning', 'Development', 'Testing', 'Review', 'Release'];

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

const tableInputClass = 'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const timeInputClass = `${tableInputClass} px-1`;

const calculateDuration = (start, end) => {
  if (!start || !end) return '0:00';
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) return '0:00';
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};

const getErrorMessage = (data) => {
  if (!data) return 'Unable to save timesheet.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  return Object.values(data).flat().join(' ');
};

const TimesheetPage = () => {
  const [rows, setRows] = useState([emptyRow()]);
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const totals = useMemo(() => rows.reduce((acc, row) => {
    const planned = calculateDuration(row.planned_start, row.planned_end);
    const actual = calculateDuration(row.actual_start, row.actual_end);
    const toMinutes = (value) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    return {
      planned: acc.planned + toMinutes(planned),
      actual: acc.actual + toMinutes(actual),
    };
  }, { planned: 0, actual: 0 }), [rows]);

  const formatTotal = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

  const loadData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    return Promise.all([getTodayTimesheets(), getDashboardSummary(), getProjects()])
      .then(([entriesRes, summaryRes, projectsRes]) => {
        setEntries(entriesRes.data);
        setSummary(summaryRes.data);
        setProjects(projectsRes.data);
      })
      .catch(() => setError('Unable to load today timesheet.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateRow = (rowId, name, value) => {
    setError('');
    setMessage('');
    setRows((current) => current.map((row) => (
      row.id === rowId ? { ...row, [name]: value } : row
    )));
  };

  const addTask = () => setRows((current) => [...current, emptyRow()]);

  const removeTask = (rowId) => {
    setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== rowId));
  };

  const validateRows = () => {
    const invalid = rows.find((row) => (
      !row.project_name ||
      !row.milestone_name ||
      !row.task_name ||
      !row.planned_start ||
      !row.planned_end ||
      !row.actual_start ||
      !row.actual_end ||
      calculateDuration(row.planned_start, row.planned_end) === '0:00' ||
      calculateDuration(row.actual_start, row.actual_end) === '0:00'
    ));
    if (invalid) {
      setError('Complete every row with valid planned and actual time before saving.');
      return false;
    }
    return true;
  };

  const saveRows = async (nextStatus) => {
    if (!validateRows()) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      for (const row of rows) {
        const response = await createTimesheet({
          project_name: row.project_name,
          milestone_name: row.milestone_name,
          task_name: row.task_name,
          task_type: 'Development',
          planned_start: row.planned_start,
          planned_end: row.planned_end,
          actual_start: row.actual_start,
          actual_end: row.actual_end,
          remarks: row.task_name,
        });
        if (nextStatus === 'submitted') {
          await setTimesheetSubmissionStatus(response.data.id, 'submitted');
        }
      }
      setRows([emptyRow()]);
      setMessage(nextStatus === 'submitted' ? 'Timesheet submitted successfully.' : 'Timesheet saved as draft.');
      loadData(false);
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Navbar title="Daily Timesheet" subtitle="Create and submit today's work entries" />
      <main className="flex-1 overflow-auto bg-white p-4 md:p-6">
        {loading ? <Loader /> : (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-950">Daily Timesheet</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Logged {summary?.logged_hours || 0}h today. Remaining {summary?.remaining_hours || 0}h.
                </p>
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Planned {formatTotal(totals.planned)} | Actual {formatTotal(totals.actual)}
              </div>
            </div>

            {(error || message) && (
              <div className={`rounded-md border px-4 py-3 text-sm font-medium ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                {error || message}
              </div>
            )}

            <section className="overflow-hidden border border-slate-300 bg-white">
              <div className="overflow-hidden">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[24%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[2%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-3 text-center text-sm font-bold text-slate-950" rowSpan={2}>Project Name</th>
                      <th className="border border-slate-300 px-2 py-3 text-center text-sm font-bold text-slate-950" rowSpan={2}>Milestone</th>
                      <th className="border border-slate-300 px-2 py-3 text-center text-sm font-bold text-slate-950" rowSpan={2}>Task</th>
                      <th className="border border-slate-300 px-2 py-2 text-center text-sm font-bold text-slate-950" colSpan={3}>Planned</th>
                      <th className="border border-slate-300 px-2 py-2 text-center text-sm font-bold text-slate-950" colSpan={3}>Actual</th>
                      <th className="border border-slate-300 px-1 py-2 text-center text-sm font-bold text-slate-950" rowSpan={2}></th>
                    </tr>
                    <tr className="bg-slate-100">
                      {['From', 'To', 'Duration', 'From', 'To', 'Duration'].map((header) => (
                        <th className="border border-slate-300 px-2 py-2 text-center text-sm font-bold text-slate-950" key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr className="bg-slate-50" key={row.id}>
                        <td className="border border-slate-300 p-1.5">
                          <select className={tableInputClass} value={row.project_name} onChange={(event) => updateRow(row.id, 'project_name', event.target.value)}>
                            <option value="">Select Project</option>
                            {projects.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}
                          </select>
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <select className={tableInputClass} value={row.milestone_name} onChange={(event) => updateRow(row.id, 'milestone_name', event.target.value)}>
                            <option value="">Select Milestone</option>
                            {milestoneOptions.map((milestone) => <option key={milestone} value={milestone}>{milestone}</option>)}
                          </select>
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <input className={tableInputClass} placeholder="Task Description" value={row.task_name} onChange={(event) => updateRow(row.id, 'task_name', event.target.value)} />
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <input className={timeInputClass} type="time" value={row.planned_start} onChange={(event) => updateRow(row.id, 'planned_start', event.target.value)} />
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <input className={timeInputClass} type="time" value={row.planned_end} onChange={(event) => updateRow(row.id, 'planned_end', event.target.value)} />
                        </td>
                        <td className="border border-slate-300 px-1 py-2 text-center text-sm font-bold text-slate-950">{calculateDuration(row.planned_start, row.planned_end)}</td>
                        <td className="border border-slate-300 p-1.5">
                          <input className={timeInputClass} type="time" value={row.actual_start} onChange={(event) => updateRow(row.id, 'actual_start', event.target.value)} />
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <input className={timeInputClass} type="time" value={row.actual_end} onChange={(event) => updateRow(row.id, 'actual_end', event.target.value)} />
                        </td>
                        <td className="border border-slate-300 px-1 py-2 text-center text-sm font-bold text-slate-950">{calculateDuration(row.actual_start, row.actual_end)}</td>
                        <td className="border border-slate-300 p-1 text-center">
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={rows.length === 1} onClick={() => removeTask(row.id)} title="Remove task" type="button">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" onClick={addTask} type="button">
                <Plus size={17} /> Add Task
              </button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className={buttonClass.outline} disabled={saving} onClick={() => saveRows('draft')} type="button">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button className={buttonClass.primary} disabled={saving} onClick={() => saveRows('submitted')} type="button">
                  <SendHorizontal size={16} /> {saving ? 'Submitting...' : 'Submit Timesheet'}
                </button>
              </div>
            </div>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-950">Today&apos;s Saved Entries</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Project', 'Milestone', 'Task', 'Planned', 'Actual', 'Status'].map((header) => (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={6}>No saved entries yet.</td>
                      </tr>
                    ) : entries.map((entry) => (
                      <tr className="hover:bg-blue-50/40" key={entry.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-950">{entry.project_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.milestone_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.task_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.planned_hours}h</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.actual_hours}h</td>
                        <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TimesheetPage;
