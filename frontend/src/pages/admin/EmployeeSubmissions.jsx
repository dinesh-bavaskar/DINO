import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge } from '../../components/ui';
import { buttonClass, inputClass, tdClass, thClass } from '../../components/uiClasses';
import { getAdminTimesheets } from '../../services/timesheetService';

const initialFilters = { employee: '', date: '', project: '', status: '' };

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
  </div>
);

const EmployeeSubmissions = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);

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

  const updateFilter = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout>
      <Navbar title="Employee Submissions" subtitle="Review employee timesheet submissions" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_auto_1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className={`${inputClass} pl-9`} placeholder="Filter by employee name, email, or ID" value={filters.employee} onChange={(e) => updateFilter('employee', e.target.value)} />
              </div>
              <input className={inputClass} type="date" value={filters.date} onChange={(e) => updateFilter('date', e.target.value)} />
              <input className={inputClass} placeholder="Project" value={filters.project} onChange={(e) => updateFilter('project', e.target.value)} />
              <select className={inputClass} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </section>

          {loading ? <Loader text="Loading employee submissions..." /> : (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Employee', 'Project', 'Task', 'Date', 'Hours', 'Status', 'Action'].map((header) => (
                        <th className={thClass} key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.length === 0 ? (
                      <tr><td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={6}>No submissions found.</td></tr>
                    ) : entries.map((entry) => (
                      <tr className="hover:bg-slate-50" key={entry.id}>
                        <td className={tdClass}>
                          <p className="font-semibold text-slate-950">{entry.employee_name}</p>
                          <p className="text-xs text-slate-400">{entry.employee_id}</p>
                        </td>
                        <td className={tdClass}>{entry.project_name}</td>
                        <td className={tdClass}>{entry.task_name}</td>
                        <td className={tdClass}>{entry.date}</td>
                        <td className={tdClass}>{entry.actual_hours}</td>
                        <td className={tdClass}>
                          <button className={buttonClass.ghost} type="button" onClick={() => { setSelected(entry); }}>
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
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Submission Detail</h2>
                  <p className="text-sm text-slate-500">{selected.employee_name} • {selected.employee_email}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <DetailRow label="Project" value={selected.project_name} />
                <DetailRow label="Milestone" value={selected.milestone_name} />
                <DetailRow label="Task Name" value={selected.task_name} />
                <DetailRow label="Task Type" value={<Badge>{selected.task_type}</Badge>} />
                <DetailRow label="Planned Time" value={`${selected.planned_start} - ${selected.planned_end}`} />
                <DetailRow label="Actual Time" value={`${selected.actual_start} - ${selected.actual_end}`} />
                <DetailRow label="Total Hours" value={`${selected.actual_hours} hours`} />
                <DetailRow label="Submission Date" value={selected.submitted_at || selected.created_at} />
                <DetailRow label="Date" value={selected.date} />
              </div>
              <div className="mt-5">
                <DetailRow label="Remarks" value={selected.remarks} />
              </div>
              <div className="mt-4 flex justify-end">
                <button className={buttonClass.outline} onClick={() => setSelected(null)} type="button">Close</button>
              </div>
            </section>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default EmployeeSubmissions;
