import { useEffect, useMemo, useState, useRef } from 'react';
import { Clock, Plus, Save, SendHorizontal, Trash2, Lock } from 'lucide-react';
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
  getTimesheetSettings,
} from '../../services/timesheetService';

/* ─── helpers ─────────────────────────────────────────────────── */
const emptyRow = () => ({
  id: Date.now() + Math.random(),
  _uid: Date.now() + Math.random(),
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

const findTimeOverlap = (tasks) => {
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const t1 = tasks[i];
      const t2 = tasks[j];

      // 1. Check planned overlap
      if (t1.planned_start && t1.planned_end && t2.planned_start && t2.planned_end) {
        if (t1.planned_start < t2.planned_end && t2.planned_start < t1.planned_end) {
          return true;
        }
      }

      // 2. Check actual overlap
      if (t1.actual_start && t1.actual_end && t2.actual_start && t2.actual_end) {
        if (t1.actual_start < t2.actual_end && t2.actual_start < t1.actual_end) {
          return true;
        }
      }
    }
  }
  return false;
};

const getOverlapIds = (tasks) => {
  const planned = new Set();
  const actual = new Set();

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const t1 = tasks[i];
      const t2 = tasks[j];

      if (t1.planned_start && t1.planned_end && t2.planned_start && t2.planned_end) {
        if (t1.planned_start < t2.planned_end && t2.planned_start < t1.planned_end) {
          planned.add(t1.id);
          planned.add(t2.id);
        }
      }

      if (t1.actual_start && t1.actual_end && t2.actual_start && t2.actual_end) {
        if (t1.actual_start < t2.actual_end && t2.actual_start < t1.actual_end) {
          actual.add(t1.id);
          actual.add(t2.id);
        }
      }
    }
  }
  return { planned, actual };
};

/* ─── component ───────────────────────────────────────────────── */
const TimesheetPage = () => {
  const [rows, setRows] = useState([emptyRow()]);
  const [savedTasks, setSavedTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestonesCache, setMilestonesCache] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState(null);

  const [localSettings, setLocalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('system-timesheet-settings');
      return saved ? JSON.parse(saved) : {
        dailyTargetHours: 8,
        allowOverlap: false,
        requireMilestone: true
      };
    } catch {
      return { dailyTargetHours: 8, allowOverlap: false, requireMilestone: true };
    }
  });

  const dailyTargetHours = localSettings?.dailyTargetHours || 8;
  const targetMinutes = dailyTargetHours * 60;

  // Helper to check if a time is within the window
  const isTimeInWindow = (time, start, end) => {
    if (!time || !start || !end) return false;
    const t = time.substring(0, 5);
    const s = start.substring(0, 5);
    const e = end.substring(0, 5);
    if (s <= e) {
      return t >= s && t <= e;
    } else {
      return t >= s || t <= e;
    }
  };

  // Helper to format time to AM/PM for user-friendly display
  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = String(m).padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  const currentLocalTime = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [rows]); // Re-evaluate when rows change or on mount

  const isPlannedEditable = useMemo(() => {
    if (!settings) return true;
    return isTimeInWindow(currentLocalTime, settings.planned_start_time, settings.planned_end_time);
  }, [settings, currentLocalTime]);

  const isActualEditable = useMemo(() => {
    if (!settings) return true;
    return isTimeInWindow(currentLocalTime, settings.actual_start_time, settings.actual_end_time);
  }, [settings, currentLocalTime]);

  const windowNotice = useMemo(() => {
    if (!settings) return '';
    const plannedStr = `${formatTimeAMPM(settings.planned_start_time)} to ${formatTimeAMPM(settings.planned_end_time)}`;
    const actualStr = `${formatTimeAMPM(settings.actual_start_time)} to ${formatTimeAMPM(settings.actual_end_time)}`;

    if (!isPlannedEditable && !isActualEditable) {
      return `Please note: Timesheet editing windows are closed. (Planned Window: ${plannedStr}, Actual Window: ${actualStr}).`;
    }
    if (!isPlannedEditable) {
      return `Please note: Planned Time fields can only be edited between ${plannedStr}.`;
    }
    if (!isActualEditable) {
      return `Please note: Actual Time fields can only be edited between ${actualStr}.`;
    }
    return '';
  }, [settings, isPlannedEditable, isActualEditable]);

  /* Totals derived dynamically from the rows */
  const plannedTotal = useMemo(() =>
    rows.reduce((acc, row) => acc + toMinutes(calculateDuration(row.planned_start, row.planned_end)), 0)
    , [rows]);

  const actualTotal = useMemo(() =>
    rows.reduce((acc, row) => acc + toMinutes(calculateDuration(row.actual_start, row.actual_end)), 0)
    , [rows]);

  const overlapIds = useMemo(() => getOverlapIds(rows), [rows]);

  /* ── data loading ────────────────────────────────────────── */
  const fetchMilestonesForProject = (projectId) => {
    if (!projectId || milestonesCache[projectId] !== undefined) return;
    getMilestonesByProject(projectId)
      .then((res) => setMilestonesCache((prev) => ({ ...prev, [projectId]: res.data })))
      .catch(() => setMilestonesCache((prev) => ({ ...prev, [projectId]: [] })));
  };

  const loadData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    return Promise.all([
      getTodayTimesheets(),
      getDashboardSummary(),
      getProjects(),
      getTimesheetSettings().catch((e) => {
        console.error("Failed to load time settings:", e);
        return { data: { planned_start_time: '06:00:00', planned_end_time: '12:00:00', actual_start_time: '12:00:00', actual_end_time: '23:59:00' } };
      })
    ])
      .then(([entriesRes, summaryRes, projectsRes, settingsRes]) => {
        const allEntries = entriesRes.data;
        setSummary(summaryRes.data);
        setProjects(projectsRes.data);
        setSettings(settingsRes.data);

        // Pre-fetch milestones for existing entries' projects
        allEntries.forEach((e) => {
          const proj = projectsRes.data.find((p) => p.name === e.project_name);
          if (proj) {
            fetchMilestonesForProject(proj.id);
          }
        });

        const mapped = allEntries.map((e) => ({
          id: e.id,
          _uid: e.id,
          isExisting: true,
          project_name: e.project_name,
          milestone_name: e.milestone_name,
          task_name: e.task_name,
          planned_start: e.planned_start ? e.planned_start.substring(0, 5) : '',
          planned_end: e.planned_end ? e.planned_end.substring(0, 5) : '',
          actual_start: e.actual_start ? e.actual_start.substring(0, 5) : '',
          actual_end: e.actual_end ? e.actual_end.substring(0, 5) : '',
          status: e.status,
        }));

        if (mapped.length > 0) {
          setRows(mapped);
          setSavedTasks(mapped);
        } else {
          setRows([emptyRow()]);
          setSavedTasks([]);
        }
      })
      .catch(() => setError('Unable to load today\'s timesheet.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Real-time validation for time overlaps
  useEffect(() => {
    if (overlapIds?.planned?.size > 0 || overlapIds?.actual?.size > 0) {
      setError('Time overlap detected. Please select a non-overlapping time slot.');
    } else {
      setError((prev) =>
        prev === 'Time overlap detected. Please select a non-overlapping time slot.' || prev === 'Time overlap detected. Please adjust task timings before saving.' ? '' : prev
      );
    }
  }, [overlapIds]);

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
    } catch {
      setError('Unable to delete timesheet entry.');
    }
  };

  /* ── validations ─────────────────────────────────────────── */
  const validateRows = (isAutoSave = false) => {
    if (rows.length === 0) {
      if (!isAutoSave) setError('No tasks to save.');
      return false;
    }

    if (!localSettings.allowOverlap && findTimeOverlap(rows)) {
      if (!isAutoSave) setError('Time overlap detected. Please adjust task timings before saving.');
      return false;
    }

    let hasAnyTime = false;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;

      if (!r.project_name) {
        if (!isAutoSave) setError(`Row ${rowNum}: Please select a project.`);
        return false;
      }
      if (localSettings.requireMilestone && !r.milestone_name) {
        if (!isAutoSave) setError(`Row ${rowNum}: Please select a milestone.`);
        return false;
      }
      if (!r.task_name.trim()) {
        if (!isAutoSave) setError(`Row ${rowNum}: Please enter a task description.`);
        return false;
      }

      const hasPlanned = r.planned_start || r.planned_end;
      const hasActual = r.actual_start || r.actual_end;

      if (hasPlanned || hasActual) {
        hasAnyTime = true;
      }

      if (hasPlanned) {
        if (!r.planned_start || !r.planned_end) {
          if (!isAutoSave) setError(`Row ${rowNum}: Please select both planned start and end times, or leave both empty.`);
          return false;
        }
        if (calculateDuration(r.planned_start, r.planned_end) === '—') {
          if (!isAutoSave) setError(`Row ${rowNum}: Planned start time must be before planned end time.`);
          return false;
        }
      }

      if (hasActual) {
        if (!r.actual_start || !r.actual_end) {
          if (!isAutoSave) setError(`Row ${rowNum}: Please select both actual start and end times, or leave both empty.`);
          return false;
        }
        if (calculateDuration(r.actual_start, r.actual_end) === '—') {
          if (!isAutoSave) setError(`Row ${rowNum}: Actual start time must be before actual end time.`);
          return false;
        }
      }
    }

    if (!hasAnyTime) {
      if (!isAutoSave) setError('Please enter at least Planned Time or Actual Time for your tasks.');
      return false;
    }

    if (actualTotal > targetMinutes) {
      if (!isAutoSave) setError(`Daily total actual hours must not exceed ${dailyTargetHours} hours.`);
      return false;
    }

    return true;
  };

  const getCleanData = (data) => JSON.stringify(data.map(r => ({
    project_name: r.project_name,
    milestone_name: r.milestone_name,
    task_name: r.task_name,
    planned_start: r.planned_start || '',
    planned_end: r.planned_end || '',
    actual_start: r.actual_start || '',
    actual_end: r.actual_end || '',
  })));

  /* ── save / submit operations ────────────────────────────── */
  const handleSaveTimesheet = async (isAutoSave = false) => {
    if (isAutoSave) {
      if (getCleanData(rows) === getCleanData(savedTasks)) return;
    }

    if (!validateRows(isAutoSave)) return;
    if (!isAutoSave) { setSaving(true); setError(''); setMessage(''); }

    try {
      let createdIds = {};
      for (const row of rows) {
        const payload = {
          project_name: row.project_name,
          milestone_name: row.milestone_name,
          task_name: row.task_name,
          task_type: 'Development',
          planned_start: row.planned_start || null,
          planned_end: row.planned_end || null,
          actual_start: row.actual_start || null,
          actual_end: row.actual_end || null,
          remarks: row.task_name,
        };
        if (row.isExisting) {
          await updateTimesheet(row.id, payload);
        } else {
          const res = await createTimesheet(payload);
          createdIds[row.id] = res.data.id;
        }
      }

      if (isAutoSave) {
        if (Object.keys(createdIds).length > 0) {
          setRows(cur => cur.map(r => createdIds[r.id] ? { ...r, id: createdIds[r.id], isExisting: true } : r));
        }
        setSavedTasks(rows.map(r => createdIds[r.id] ? { ...r, id: createdIds[r.id], isExisting: true } : r));
        // Auto-save occurs silently without notifying the user
        getDashboardSummary().then(res => setSummary(res.data)).catch(() => { });
      } else {
        setMessage('Timesheet Saved Successfully.');
        await loadData(false);
      }
    } catch (err) {
      if (!isAutoSave) {
        setError(getErrorMessage(err.response?.data));
      } else {
        setError('Auto-save failed: ' + getErrorMessage(err.response?.data));
      }
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const autoSaveRef = useRef();
  useEffect(() => {
    autoSaveRef.current = () => handleSaveTimesheet(true);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (autoSaveRef.current) autoSaveRef.current();
    }, 45000);

    const handleBeforeUnload = () => {
      if (autoSaveRef.current) autoSaveRef.current();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <DashboardLayout>
      <Navbar title="Daily Timesheet" subtitle="Log your efforts" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
        {loading ? <Loader /> : (
          <div className="space-y-5">

            {/* ── Summary strip ── */}
            <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {[
                { label: 'Logged Today', value: `${summary?.logged_hours ?? 0}h` },
                { label: 'Remaining', value: `${summary?.remaining_hours ?? 0}h` },
                { label: 'Tasks', value: summary?.total_tasks ?? 0 },
                {
                  label: 'Date', value: summary?.current_date
                    ? new Date(summary.current_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-0 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-medium text-slate-950 leading-none">{value}</p>
                </div>
              ))}
            </div>

            {/* ── Table Card ── */}
            <div className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700 border border-green-200">
                  {message}
                </div>
              )}
              <div>
                {settings && (
                  <div className="flex w-full text-xs font-normal text-slate-500 pb-1.5">
                    <div style={{ width: '44.23%' }} />
                    <div style={{ width: '25.96%' }} className={`flex items-center justify-center gap-1.5 ${isPlannedEditable ? 'text-green-600' : ''}`}>
                      {isPlannedEditable && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      <span> Active Window: {formatTimeAMPM(settings.planned_start_time)} – {formatTimeAMPM(settings.planned_end_time)}</span>
                    </div>
                    <div style={{ width: '25.96%' }} className={`flex items-center justify-center gap-1.5 ${isActualEditable ? 'text-green-600' : ''}`}>
                      {isActualEditable && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      <span> Active Window: {formatTimeAMPM(settings.actual_start_time)} – {formatTimeAMPM(settings.actual_end_time)}</span>
                    </div>
                  </div>
                )}
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
                        <tr className="bg-blue-950 border-b border-blue-900">
                          <th className="border-r border-blue-900 px-3 py-2 text-xs font-bold text-slate-200" rowSpan={2}>Project</th>
                          <th className="border-r border-blue-900 px-3 py-2 text-xs font-bold text-slate-200" rowSpan={2}>Milestone</th>
                          <th className="border-r border-blue-900 px-3 py-2 text-xs font-bold text-slate-200" rowSpan={2}>Task Description</th>
                          <th className={`relative border-r border-blue-900 px-2 py-1.5 text-center text-xs font-normal text-white ${!isPlannedEditable ? 'opacity-80 bg-blue-900/50' : ''}`} colSpan={3}>
                            <div className="flex items-center justify-center gap-1.5">
                              Planned Time <span className={`inline-flex items-center justify-center px-1 text-[11px] font-normal ${plannedTotal < targetMinutes ? 'text-red-400' : 'text-green-400'}`}>{formatTotal(plannedTotal)} / {dailyTargetHours}h</span>
                              {!isPlannedEditable && (
                                <div className="inline-flex items-center justify-center text-red-400 cursor-help group relative ml-1">
                                  <Lock size={12} className="stroke-[2.5]" />
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1 whitespace-nowrap z-50 shadow-lg border border-slate-700 font-normal normal-case tracking-normal">
                                    Planned Time Window Closed
                                  </div>
                                </div>
                              )}
                            </div>
                          </th>
                          <th className={`relative border-r border-blue-900 px-2 py-1.5 text-center text-xs font-normal text-white ${!isActualEditable ? 'opacity-80 bg-blue-900/50' : ''}`} colSpan={3}>
                            <div className="flex items-center justify-center gap-1.5">
                              Actual Time <span className={`inline-flex items-center justify-center px-1 text-[11px] font-normal ${actualTotal < targetMinutes ? 'text-red-400' : 'text-green-400'}`}>{formatTotal(actualTotal)} / {dailyTargetHours}h</span>
                              {!isActualEditable && (
                                <div className="inline-flex items-center justify-center text-red-400 cursor-help group relative ml-1">
                                  <Lock size={12} className="stroke-[2.5]" />
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1 whitespace-nowrap z-50 shadow-lg border border-slate-700 font-normal normal-case tracking-normal">
                                    Actual Time Window Closed
                                  </div>
                                </div>
                              )}
                            </div>
                          </th>
                          <th className="px-1 py-2" rowSpan={2} />
                        </tr>
                        <tr className="bg-blue-950 border-b border-blue-900">
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isPlannedEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>From</th>
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isPlannedEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>To</th>
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isPlannedEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>Dur</th>
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isActualEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>From</th>
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isActualEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>To</th>
                          <th className={`border-r border-blue-900 px-2 py-1 text-center text-[10px] font-bold text-white ${!isActualEditable ? 'opacity-60 bg-blue-900/50' : ''}`}>Dur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const isSubmitted = row.status === 'submitted';
                          const isPlannedReadOnly = isSubmitted || !isPlannedEditable;
                          const isActualReadOnly = isSubmitted || !isActualEditable;
                          const isActualOnlyTask = !row.planned_start && !row.planned_end;
                          const isBaseReadOnly = isSubmitted || (!isPlannedEditable && ((!isActualOnlyTask && row.isExisting) || !isActualEditable));
                          const hasPlannedOverlap = overlapIds?.planned?.has(row.id) || false;
                          const hasActualOverlap = overlapIds?.actual?.has(row.id) || false;
                          return (
                            <tr className={`border-b border-slate-150 hover:bg-slate-50/50 ${isSubmitted ? 'bg-slate-50/30 text-slate-500' : ''}`} key={row._uid || row.id}>
                              {/* Project */}
                              <td className="border-r border-slate-200 p-1.5">
                                {isBaseReadOnly ? (
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
                                {isBaseReadOnly ? (
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
                                {isBaseReadOnly ? (
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
                              <td className={`border-r border-slate-200 p-1 ${!isPlannedEditable ? 'opacity-60 bg-slate-50/50 pointer-events-none' : ''}`}>
                                <TimePicker
                                  disabled={isPlannedReadOnly || !isPlannedEditable}
                                  className={`w-full ${hasPlannedOverlap ? '!bg-red-50 !border-red-400 focus:!border-red-500 focus:!ring-red-200 !text-red-900' : 'border-slate-200 focus:border-blue-400'}`}
                                  value={row.planned_start}
                                  onChange={(val) => updateRow(row.id, 'planned_start', val)}
                                />
                              </td>

                              {/* Planned To */}
                              <td className={`border-r border-slate-200 p-1 ${!isPlannedEditable ? 'opacity-60 bg-slate-50/50 pointer-events-none' : ''}`}>
                                <TimePicker
                                  disabled={isPlannedReadOnly || !isPlannedEditable}
                                  className={`w-full ${hasPlannedOverlap ? '!bg-red-50 !border-red-400 !text-red-900' : 'border-slate-200 focus:border-blue-400'}`}
                                  value={row.planned_end}
                                  onChange={(val) => updateRow(row.id, 'planned_end', val)}
                                />
                              </td>

                              {/* Planned Dur */}
                              <td className={`border-r border-slate-200 px-2 py-2 text-center text-xs font-bold text-blue-700 ${!isPlannedEditable ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                {calculateDuration(row.planned_start, row.planned_end)}
                              </td>

                              {/* Actual From */}
                              <td className={`border-r border-slate-200 p-1 ${!isActualEditable ? 'opacity-60 bg-slate-50/50 pointer-events-none' : ''}`}>
                                <TimePicker
                                  disabled={isActualReadOnly || !isActualEditable}
                                  className={`w-full ${hasActualOverlap ? '!bg-red-50 !border-red-400 !text-red-900' : 'border-slate-200 focus:border-orange-400'}`}
                                  value={row.actual_start}
                                  onChange={(val) => updateRow(row.id, 'actual_start', val)}
                                />
                              </td>

                              {/* Actual To */}
                              <td className={`border-r border-slate-200 p-1 ${!isActualEditable ? 'opacity-60 bg-slate-50/50 pointer-events-none' : ''}`}>
                                <TimePicker
                                  disabled={isActualReadOnly || !isActualEditable}
                                  className={`w-full ${hasActualOverlap ? '!bg-red-50 !border-red-400 !text-red-900' : 'border-slate-200 focus:border-orange-400'}`}
                                  value={row.actual_end}
                                  onChange={(val) => updateRow(row.id, 'actual_end', val)}
                                />
                              </td>

                              {/* Actual Dur */}
                              <td className={`border-r border-slate-200 px-2 py-2 text-center text-xs font-bold text-orange-600 ${!isActualEditable ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                {calculateDuration(row.actual_start, row.actual_end)}
                              </td>

                              {/* Action */}
                              <td className="p-1 text-center">
                                <button
                                  className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                                  disabled={isBaseReadOnly}
                                  onClick={() => removeTask(row)}
                                  type="button"
                                  title={isBaseReadOnly ? 'Cannot delete this task at this time' : 'Delete task'}
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
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  onClick={addTask}
                  type="button"
                  disabled={!isPlannedEditable && !isActualEditable}
                  title={(!isPlannedEditable && !isActualEditable) ? 'Cannot add tasks outside of any active Time Window' : 'Add new task'}
                >
                  <Plus size={15} /> Add Task
                </button>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    className={`${buttonClass.primary} min-h-10 bg-blue-600 hover:bg-blue-700`}
                    disabled={saving}
                    onClick={handleSaveTimesheet}
                    type="button"
                  >
                    <Save size={15} className="mr-1.5" /> Save Timesheet
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
