import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, X, Pencil, Check } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { TimePicker } from '../../components/ui';
import { buttonClass, inputClass, tdClass, thClass } from '../../components/uiClasses';
import {
  getAdminTimesheetDetail,
  getAdminTimesheets,
  getProjects,
  getMilestonesByProject,
  updateAdminTimesheetDetail,
} from '../../services/timesheetService';

const initialFilters = { employee: '', date: '', dateTo: '', projectId: '' };

const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '—';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = String(minutes).padStart(2, '0');
  return `${hours}:${minStr} ${ampm}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatHours = (value) => `${Number(value || 0).toFixed(2)}h`;

const tableInputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

const calculateDuration = (start, end) => {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '—';
  return `${Number(mins / 60).toFixed(2)}h`;
};

const EmployeeSubmissions = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [milestonesCache, setMilestonesCache] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      getAdminTimesheets({ ...filters, page })
        .then((res) => {
          setEntries(res.data);
          setMeta(res.meta);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters, page]);

  // Fetch projects for dropdown
  useEffect(() => {
    getProjects()
      .then((res) => {
        // Assuming API returns { data: [...] } or direct array
        const data = res.data?.data ?? res.data;
        setProjects(data);
      })
      .catch(console.error);
  }, []);

  const updateFilter = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchMilestonesForProject = (projectId) => {
    if (!projectId || milestonesCache[projectId] !== undefined) return;
    getMilestonesByProject(projectId)
      .then((res) => setMilestonesCache((prev) => ({ ...prev, [projectId]: res.data })))
      .catch(() => setMilestonesCache((prev) => ({ ...prev, [projectId]: [] })));
  };

  useEffect(() => {
    if (editReport && editReport.tasks) {
      editReport.tasks.forEach((t) => {
        const proj = projects.find((p) => p.name === t.project_name);
        if (proj) {
          fetchMilestonesForProject(proj.id);
        }
      });
    }
  }, [editReport, projects]);

  const calculatedPlannedTotal = useMemo(() => {
    if (!editReport || !editReport.tasks) return '0.00';
    const totalMins = editReport.tasks.reduce((acc, task) => {
      if (!task.planned_start || !task.planned_end) return acc;
      const [sh, sm] = task.planned_start.split(':').map(Number);
      const [eh, em] = task.planned_end.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    return (totalMins / 60).toFixed(2);
  }, [editReport]);

  const calculatedActualTotal = useMemo(() => {
    if (!editReport || !editReport.tasks) return '0.00';
    const totalMins = editReport.tasks.reduce((acc, task) => {
      if (!task.actual_start || !task.actual_end) return acc;
      const [sh, sm] = task.actual_start.split(':').map(Number);
      const [eh, em] = task.actual_end.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    return (totalMins / 60).toFixed(2);
  }, [editReport]);

  const handleUpdateTask = (taskId, field, value) => {
    setEditReport((prev) => {
      if (!prev) return null;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updated = { ...t, [field]: value };
        if (field === 'project_name') {
          updated.milestone_name = '';
          const proj = projects.find((p) => p.name === value);
          if (proj) fetchMilestonesForProject(proj.id);
        }
        return updated;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleSelectEntry = (entry) => {
    getAdminTimesheetDetail(entry.id)
      .then((res) => {
        setSelected(res.data);
        setEditReport(res.data);
      })
      .catch(() => {
        setSelected(entry);
        setEditReport(entry);
      });
  };

  const handleSaveEdit = () => {
    if (!editReport) return;
    for (let i = 0; i < editReport.tasks.length; i++) {
      const t = editReport.tasks[i];
      const rowNum = i + 1;
      
      if (!t.project_name) {
        setEditError(`Row ${rowNum}: Please select a project.`);
        return;
      }
      if (!t.milestone_name) {
        setEditError(`Row ${rowNum}: Please select a milestone.`);
        return;
      }
      if (!t.task_name.trim()) {
        setEditError(`Row ${rowNum}: Please enter a task description.`);
        return;
      }
      if (!t.planned_start || !t.planned_end) {
        setEditError(`Row ${rowNum}: Please select planned start and end times.`);
        return;
      }
      if (calculateDuration(t.planned_start, t.planned_end) === '—') {
        setEditError(`Row ${rowNum}: Planned start time must be before planned end time.`);
        return;
      }
      if (!t.actual_start || !t.actual_end) {
        setEditError(`Row ${rowNum}: Please select actual start and end times.`);
        return;
      }
      if (calculateDuration(t.actual_start, t.actual_end) === '—') {
        setEditError(`Row ${rowNum}: Actual start time must be before actual end time.`);
        return;
      }
    }

    setSavingEdit(true);
    setEditError('');
    updateAdminTimesheetDetail(selected.id, { tasks: editReport.tasks })
      .then((res) => {
        setSelected(res.data);
        setEditReport(res.data);
        setEditingTaskId(null);
        setEntries((prev) => prev.map(e => e.id === res.data.id ? res.data : e));
        alert('Timesheet details updated successfully.');
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Failed to update timesheet details.';
        setEditError(msg);
      })
      .finally(() => {
        setSavingEdit(false);
      });
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <Navbar title="Employee Submissions" subtitle="Review employee timesheet submissions" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_auto_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className={`${inputClass} pl-9`} placeholder="Filter by employee name, email, or ID" value={filters.employee} onChange={(e) => updateFilter('employee', e.target.value)} />
              </div>
              <input className={inputClass} type="date" value={filters.date} onChange={(e) => updateFilter('date', e.target.value)} placeholder="From date" />
              <input className={inputClass} type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} placeholder="To date" />
              <select className={inputClass} value={filters.projectId} onChange={(e) => updateFilter('projectId', e.target.value)}>
                <option value="">All Projects</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
          </section>

          {loading ? <Loader text="Loading employee submissions..." /> : (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      {['Employee', 'Projects', 'Date', 'Total Hours'].map((header) => (
                        <th className={thClass} key={header}>{header}</th>
                      ))}
                      <th className={`${thClass} text-right`} key="Action">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.length === 0 ? (
                      <tr><td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={5}>No submissions found.</td></tr>
                    ) : entries.map((entry) => {
                      const isToday = entry.date === todayStr;
                      return (
                        <tr className={isToday ? "bg-blue-50/40 hover:bg-blue-100/40 transition-colors duration-150" : "hover:bg-slate-50 transition-colors duration-150"} key={entry.id}>
                          <td className={tdClass}>
                            <p className="font-semibold text-slate-950">{entry.employee_name}</p>
                            <p className="text-xs text-slate-400">{entry.employee_id}</p>
                          </td>
                          <td className={tdClass}>{entry.project_names?.join(', ') || '-'}</td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2">
                              <span>{formatDate(entry.date)}</span>
                              {isToday && (
                                <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={tdClass}>{formatHours(entry.total_actual_hours)}</td>
                          <td className={`${tdClass} text-right`}>
                            <button className={buttonClass.ghost} type="button" onClick={() => handleSelectEntry(entry)}>
                              <Eye size={15} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {meta && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                  <span>Page {page}</span>
                  <div className="flex gap-2">
                    <button className={buttonClass.outline} disabled={!meta.previous} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Previous</button>
                    <button className={buttonClass.outline} disabled={!meta.next} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setSelected(null); setEditReport(null); setEditError(''); }}>
              <div className="relative w-full max-w-6xl mx-4 rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Submission Detail</h2>
                    <p className="text-sm text-slate-500">
                      <span className="font-bold text-slate-900">{selected.employee_name}</span> • {selected.employee_email} • <span className="font-medium text-slate-700">{selected.employee_id}</span>
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition" onClick={() => { setSelected(null); setEditReport(null); setEditingTaskId(null); setEditError(''); }} type="button">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5">
                  {editError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {editError}
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-white">
                          <td colSpan={4} className="p-3 pr-1.5 align-top">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Report Date</p>
                              <p className="mt-1 text-lg font-black text-slate-900">{formatDate(selected.date)}</p>
                            </div>
                          </td>
                          <td colSpan={3} className="p-3 px-1.5 align-top">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Total Planned Hours</p>
                              <p className="mt-1 text-lg font-black text-blue-700">{formatHours(calculatedPlannedTotal)}</p>
                            </div>
                          </td>
                          <td colSpan={4} className="p-3 pl-1.5 align-top">
                            <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Total Actual Hours</p>
                              <p className="mt-1 text-lg font-black text-orange-700">{formatHours(calculatedActualTotal)}</p>
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Project</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Milestone</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Task</th>
                          <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-blue-600 border-l border-slate-200" colSpan={3}>SOD Planned Time</th>
                          <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-orange-500 border-l border-slate-200" colSpan={3}>EOD Actual Time</th>
                          <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Action</th>
                        </tr>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-blue-500 border-l border-slate-200">From</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-blue-500">To</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-blue-500">Duration</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400 border-l border-slate-200">From</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400">To</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((editReport && editReport.tasks) || []).map((task, index) => {
                          const isEditing = task.id === editingTaskId;
                          return (
                            <tr className="border-t border-slate-100" key={task.id}>
                              <td className="px-3 py-3 text-sm font-medium text-slate-400">{index + 1}</td>
                              
                              {/* Project */}
                              <td className="px-3 py-3">
                                {isEditing ? (
                                  <select
                                    className={tableInputClass}
                                    value={task.project_name || ''}
                                    onChange={(e) => handleUpdateTask(task.id, 'project_name', e.target.value)}
                                  >
                                    <option value="">Select Project</option>
                                    {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                  </select>
                                ) : (
                                  <span className="font-medium text-slate-800">{task.project_name || '-'}</span>
                                )}
                              </td>

                              {/* Milestone */}
                              <td className="px-3 py-3">
                                {isEditing ? (
                                  (() => {
                                    const proj = projects.find((p) => p.name === task.project_name);
                                    const list = proj ? (milestonesCache[proj.id] || []) : [];
                                    return (
                                      <select
                                        className={tableInputClass}
                                        disabled={!task.project_name}
                                        value={task.milestone_name || ''}
                                        onChange={(e) => handleUpdateTask(task.id, 'milestone_name', e.target.value)}
                                      >
                                        <option value="">{task.project_name ? 'Select Milestone' : '— select project —'}</option>
                                        {list.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                                      </select>
                                    );
                                  })()
                                ) : (
                                  <span className="text-slate-600">{task.milestone_name || '-'}</span>
                                )}
                              </td>

                              {/* Task */}
                              <td className="px-3 py-3">
                                {isEditing ? (
                                  <input
                                    className={tableInputClass}
                                    value={task.task_name || ''}
                                    onChange={(e) => handleUpdateTask(task.id, 'task_name', e.target.value)}
                                  />
                                ) : (
                                  <span className="text-slate-600">{task.task_name || '-'}</span>
                                )}
                              </td>

                              {/* Planned From */}
                              <td className="p-1 border-l border-slate-100">
                                {isEditing ? (
                                  <TimePicker
                                    className="w-full border-slate-200"
                                    value={task.planned_start}
                                    onChange={(val) => handleUpdateTask(task.id, 'planned_start', val)}
                                  />
                                ) : (
                                  <div className="text-center text-slate-700">{formatTimeAMPM(task.planned_start)}</div>
                                )}
                              </td>

                              {/* Planned To */}
                              <td className="p-1">
                                {isEditing ? (
                                  <TimePicker
                                    className="w-full border-slate-200"
                                    value={task.planned_end}
                                    onChange={(val) => handleUpdateTask(task.id, 'planned_end', val)}
                                  />
                                ) : (
                                  <div className="text-center text-slate-700">{formatTimeAMPM(task.planned_end)}</div>
                                )}
                              </td>

                              {/* Planned Duration */}
                              <td className="px-3 py-3 text-center font-semibold text-blue-600 bg-blue-50/30">
                                {calculateDuration(task.planned_start, task.planned_end)}
                              </td>

                              {/* Actual From */}
                              <td className="p-1 border-l border-slate-100">
                                {isEditing ? (
                                  <TimePicker
                                    className="w-full border-slate-200 focus:border-orange-400"
                                    value={task.actual_start}
                                    onChange={(val) => handleUpdateTask(task.id, 'actual_start', val)}
                                  />
                                ) : (
                                  <div className="text-center text-slate-700">{formatTimeAMPM(task.actual_start)}</div>
                                )}
                              </td>

                              {/* Actual To */}
                              <td className="p-1">
                                {isEditing ? (
                                  <TimePicker
                                    className="w-full border-slate-200 focus:border-orange-400"
                                    value={task.actual_end}
                                    onChange={(val) => handleUpdateTask(task.id, 'actual_end', val)}
                                  />
                                ) : (
                                  <div className="text-center text-slate-700">{formatTimeAMPM(task.actual_end)}</div>
                                )}
                              </td>

                              {/* Actual Duration */}
                              <td className="px-3 py-3 text-center font-semibold text-orange-600 bg-orange-50/30">
                                {calculateDuration(task.actual_start, task.actual_end)}
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-3 text-center">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                                    title="Save row"
                                  >
                                    <Check size={14} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(task.id)}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Edit row"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200">
                  <button className={buttonClass.outline} onClick={() => { setSelected(null); setEditReport(null); setEditingTaskId(null); setEditError(''); }} type="button">Close</button>
                  <button
                    className={buttonClass.admin}
                    disabled={savingEdit}
                    onClick={handleSaveEdit}
                    type="button"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default EmployeeSubmissions;
