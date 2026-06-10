import { useEffect, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge, StatusBadge } from '../../components/ui';
import { buttonClass, inputClass, tdClass, thClass } from '../../components/uiClasses';
import { getAdminTimesheets, reviewTimesheet, getProjects } from '../../services/timesheetService';

const initialFilters = { employee: '', date: '', dateTo: '', projectId: '' };

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
  </div>
);

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

const EmployeeSubmissions = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [projects, setProjects] = useState([]);

  const loadData = () => {
    setLoading(true);
    getAdminTimesheets({ ...filters, page })
      .then((res) => {
        setEntries(res.data);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

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

  const handleSelectEntry = (entry) => {
    setSelected(entry);
    setReviewComments(entry.review_comments || '');
  };

  const handleReview = (nextStatus) => {
    if (!selected) return;
    setReviewing(true);
    reviewTimesheet(selected.id, { status: nextStatus, review_comments: reviewComments })
      .then(() => {
        setSelected(null);
        setReviewComments('');
        loadData();
      })
      .catch((err) => {
        alert(err.response?.data?.detail || 'Unable to submit review.');
      })
      .finally(() => setReviewing(false));
  };

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
                      {['Employee', 'Project', 'Date', 'Hours'].map((header) => (
                        <th className={thClass} key={header}>{header}</th>
                      ))}
                      <th className={`${thClass} text-right`} key="Action">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.length === 0 ? (
                      <tr><td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={5}>No submissions found.</td></tr>
                    ) : entries.map((entry) => (
                      <tr className="hover:bg-slate-50" key={entry.id}>
                        <td className={tdClass}>
                          <p className="font-semibold text-slate-950">{entry.employee_name}</p>
                          <p className="text-xs text-slate-400">{entry.employee_id}</p>
                        </td>
                        <td className={tdClass}>{entry.project_name}</td>
                        <td className={tdClass}>{formatDate(entry.date)}</td>
                        <td className={tdClass}>{entry.actual_hours}</td>
                        <td className={`${tdClass} text-right`}>
                          <button className={buttonClass.ghost} type="button" onClick={() => handleSelectEntry(entry)}>
                            <Eye size={15} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setSelected(null); setReviewComments(''); }}>
              <div className="relative w-full max-w-4xl mx-4 rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Submission Detail</h2>
                    <p className="text-sm text-slate-500">{selected.employee_name} • {selected.employee_email} • <span className="font-medium text-slate-700">{selected.employee_id}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selected.status} />
                    <button className="text-slate-400 hover:text-slate-600 transition" onClick={() => { setSelected(null); setReviewComments(''); }} type="button">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {/* Table-style detail like timesheet row */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Project</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Milestone</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500" rowSpan={2}>Task Description</th>
                          <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500 border-l border-slate-200" colSpan={3}>Planned Time</th>
                          <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-orange-500 border-l border-slate-200" colSpan={3}>Actual Time</th>
                        </tr>
                        <tr>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-slate-400 border-l border-slate-200">From</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-slate-400">To</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-slate-400">Dur</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400 border-l border-slate-200">From</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400">To</th>
                          <th className="px-3 py-1.5 text-center text-xs font-semibold text-orange-400">Dur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-800">{selected.project_name || '-'}</td>
                          <td className="px-3 py-3 text-slate-600">{selected.milestone_name || '-'}</td>
                          <td className="px-3 py-3 text-slate-600">{selected.task_name || '-'}</td>
                          <td className="px-3 py-3 text-center text-slate-700 border-l border-slate-100">{formatTimeAMPM(selected.planned_start)}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{formatTimeAMPM(selected.planned_end)}</td>
                          <td className="px-3 py-3 text-center font-semibold text-blue-600 bg-blue-50">{selected.planned_hours}</td>
                          <td className="px-3 py-3 text-center text-slate-700 border-l border-slate-100">{formatTimeAMPM(selected.actual_start)}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{formatTimeAMPM(selected.actual_end)}</td>
                          <td className="px-3 py-3 text-center font-semibold text-orange-600 bg-orange-50">{selected.actual_hours}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Additional info row */}
                  <div className="grid grid-cols-3 gap-4 mt-5">
                    <DetailRow label="Task Type" value={<Badge>{selected.task_type}</Badge>} />
                    <DetailRow label="Date" value={formatDate(selected.date)} />
                    <DetailRow label="Submission Date" value={selected.submitted_at ? new Date(selected.submitted_at).toLocaleString('en-GB') : '—'} />
                  </div>

                  {selected.remarks && (
                    <div className="mt-4">
                      <DetailRow label="Remarks" value={selected.remarks} />
                    </div>
                  )}

                  {selected.status === 'submitted' ? (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <h3 className="text-sm font-bold text-slate-950 mb-3">Review Action</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Review Comments</label>
                          <textarea
                            className="w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Add comments or reasons for approval/rejection..."
                            rows={3}
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                            disabled={reviewing}
                            onClick={() => handleReview('rejected')}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                            disabled={reviewing}
                            onClick={() => handleReview('approved')}
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    selected.review_comments && (
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <DetailRow label="Review Comments" value={selected.review_comments} />
                      </div>
                    )
                  )}
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
                  <button className={buttonClass.outline} onClick={() => { setSelected(null); setReviewComments(''); }} type="button">Cancel</button>
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
