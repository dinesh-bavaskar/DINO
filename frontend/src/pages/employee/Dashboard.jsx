import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Table2, Calendar, FolderGit2, Flag, Target, Clock, Activity, BarChart, CheckCircle2, ChevronRight, Filter, Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { useEmployeeDashboardData } from '../../hooks/useEmployeeDashboardData';
import { StatusBadge } from '../../components/ui';

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const EmployeeDashboard = () => {
  const { history, loading } = useEmployeeDashboardData();

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [milestoneFilter, setMilestoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(row => {
      if (fromDate && row.date < fromDate) return false;
      if (toDate && row.date > toDate) return false;
      if (projectFilter && row.project_name !== projectFilter) return false;
      if (milestoneFilter && row.milestone_name !== milestoneFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [history, fromDate, toDate, projectFilter, milestoneFilter, statusFilter]);

  // Options for filters
  const uniqueProjects = useMemo(() => [...new Set(history.map(r => r.project_name).filter(Boolean))], [history]);
  const uniqueMilestones = useMemo(() => [...new Set(history.map(r => r.milestone_name).filter(Boolean))], [history]);
  const uniqueStatuses = useMemo(() => [...new Set(history.map(r => r.status).filter(Boolean))], [history]);

  // Quick Insights & Stats logic
  const stats = useMemo(() => {
    let totalHours = 0;
    let todayHours = 0;
    let weekHours = 0;
    let monthHours = 0;
    let totalTasks = 0;

    const today = new Date();
    
    // Using local timezone date formatting
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    
    // Week calculations (assuming week starts Monday)
    const dayOfWeek = today.getDay() || 7; 
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    const m_y = monday.getFullYear();
    const m_m = String(monday.getMonth() + 1).padStart(2, '0');
    const m_d = String(monday.getDate()).padStart(2, '0');
    const mondayStr = `${m_y}-${m_m}-${m_d}`;

    // Month calculations
    const monthStartStr = `${y}-${m}-01`;

    const projectMap = {}; // { proj_name: { tasks: 0, hours: 0 } }
    const dateSet = new Set();
    let lastWorkingDate = null;

    history.forEach(row => {
      const hours = parseFloat(row.actual_hours) || 0;
      
      // ONLY process stats if Actual Hours > 0
      if (hours > 0) {
        totalHours += hours;
        totalTasks += 1;

        if (row.date === todayStr) todayHours += hours;
        if (row.date >= mondayStr && row.date <= todayStr) weekHours += hours;
        if (row.date >= monthStartStr && row.date <= todayStr) monthHours += hours;

        dateSet.add(row.date);
        
        if (!lastWorkingDate || row.date > lastWorkingDate) {
          lastWorkingDate = row.date;
        }

        if (row.project_name) {
          if (!projectMap[row.project_name]) projectMap[row.project_name] = { tasks: 0, hours: 0 };
          projectMap[row.project_name].tasks += 1;
          projectMap[row.project_name].hours += hours;
        }
      }
    });

    let mostWorkedProject = 'N/A';
    let maxProjHours = 0;
    for (const [pName, pData] of Object.entries(projectMap)) {
      if (pData.hours > maxProjHours) {
        maxProjHours = pData.hours;
        mostWorkedProject = pName;
      }
    }

    const totalProjects = Object.keys(projectMap).length;
    const avgDaily = dateSet.size > 0 ? (totalHours / dateSet.size) : 0;

    return {
      totalHours: totalHours.toFixed(2),
      todayHours: todayHours.toFixed(2),
      weekHours: weekHours.toFixed(2),
      monthHours: monthHours.toFixed(2),
      totalTasks,
      totalProjects,
      mostWorkedProject,
      avgDaily: avgDaily.toFixed(2),
      lastWorkingDate: lastWorkingDate || 'N/A',
      projectMap,
    };
  }, [history]);

  // Project-wise array for rendering
  const projectSummary = useMemo(() => {
    const list = Object.entries(stats.projectMap).map(([name, data]) => ({ name, ...data }));
    list.sort((a, b) => b.hours - a.hours);
    return list;
  }, [stats.projectMap]);

  // Recent Activity
  const recentActivity = useMemo(() => {
    return [...history].sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return (a.actual_start || '') > (b.actual_start || '') ? -1 : 1;
    }).slice(0, 15);
  }, [history]);

  return (
    <DashboardLayout>
      <Navbar title="Employee Dashboard" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 lg:p-8">
        {loading ? <Loader /> : (
          <div className="mx-auto max-w-7xl space-y-6">
            
            {/* Header Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Your Productivity Overview</h1>
              </div>
              <Link to="/employee/timesheet" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950">
                <Table2 size={16} /> Enter Today's Timesheet
              </Link>
            </div>

            {/* ── Summary Cards ── */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
              <div className="flex divide-x divide-slate-200 min-w-max lg:min-w-full">
                {[
                  { label: 'Total Hours', value: `${stats.totalHours}h` },
                  { label: 'Total Projects', value: stats.totalProjects },
                  { label: "Today's Hours", value: `${stats.todayHours}h` },
                  { label: 'This Week', value: `${stats.weekHours}h` },
                  { label: 'This Month', value: `${stats.monthHours}h` },
                ].map((card, i) => (
                  <div key={i} className="flex-1 min-w-[140px] px-5 py-5 sm:px-6">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 truncate">
                      {card.label}
                    </p>
                    <p className={`font-medium text-slate-950 leading-none whitespace-nowrap ${
                      String(card.value).length > 5 
                        ? 'text-xl xl:text-2xl' 
                        : 'text-2xl xl:text-3xl'
                    }`}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Secondary Dashboards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Quick Insights */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
                  <Activity size={18} className="text-blue-500" />
                  <h3 className="font-medium text-slate-950 text-base">Quick Insights</h3>
                </div>
                <div className="p-4 flex-1 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-sm text-slate-500">Most Worked Project</span>
                    <span className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{stats.mostWorkedProject}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-sm text-slate-500">Active Projects</span>
                    <span className="text-sm font-semibold text-slate-900">{stats.totalProjects}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-sm text-slate-500">Avg Daily Hours</span>
                    <span className="text-sm font-semibold text-slate-900">{stats.avgDaily}h / day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Last Active Date</span>
                    <span className="text-sm font-semibold text-slate-900">{formatDate(stats.lastWorkingDate)}</span>
                  </div>
                </div>
              </div>

              {/* Project-wise Summary */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col lg:col-span-2 overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
                  <BarChart size={18} className="text-emerald-500" />
                  <h3 className="font-medium text-slate-950 text-base">Project-wise Summary</h3>
                </div>
                <div className="flex-1 overflow-auto max-h-[220px] p-5 space-y-5">
                  {projectSummary.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 italic">No project data available.</div>
                  ) : (
                    projectSummary.map((ps, index) => {
                      const maxHours = Math.max(...projectSummary.map(p => p.hours), 1);
                      const percentage = (ps.hours / maxHours) * 100;
                      const colors = [
                        'bg-blue-500',
                        'bg-emerald-500',
                        'bg-purple-500',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-indigo-500'
                      ];
                      const barColor = colors[index % colors.length];

                      return (
                        <div key={ps.name} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-800 flex items-center gap-2">
                              {ps.name} 
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                {ps.tasks} task{ps.tasks !== 1 ? 's' : ''}
                              </span>
                            </span>
                            <span className="font-semibold text-slate-900">{ps.hours.toFixed(2)} <span className="text-slate-400 text-xs font-medium">hrs</span></span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Filters & History Table ── */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white">
                <div className="flex items-center gap-2">
                  <Table2 size={18} className="text-indigo-500" />
                  <h3 className="font-medium text-slate-950 text-base">Work History</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Filter size={14} /> <span>Filter Results</span>
                </div>
              </div>
              
              {/* Filter Toolbar */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">From Date</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-xs text-slate-800" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">To Date</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-xs text-slate-800" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Project</label>
                  <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-xs text-slate-800 bg-white">
                    <option value="">All Projects</option>
                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Milestone</label>
                  <select value={milestoneFilter} onChange={e => setMilestoneFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-2 text-xs text-slate-800 bg-white">
                    <option value="">All Milestones</option>
                    {uniqueMilestones.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="shrink-0">
                  <button onClick={() => { setFromDate(''); setToDate(''); setProjectFilter(''); setMilestoneFilter(''); setStatusFilter(''); }} className="h-9 px-4 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition">
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-blue-900 border-b border-blue-950 text-[11px] font-semibold uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Project</th>
                      <th className="px-4 py-3 font-semibold">Milestone</th>
                      <th className="px-4 py-3 max-w-[200px] font-semibold">Task Description</th>
                      <th className="px-4 py-3 font-semibold">Start Time</th>
                      <th className="px-4 py-3 font-semibold">End Time</th>
                      <th className="px-4 py-3 text-center font-semibold">Planned Hrs</th>
                      <th className="px-4 py-3 text-center font-semibold">Actual Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search size={24} className="text-slate-300" />
                            <span>No timesheet records found matching your filters.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5 font-medium text-slate-700">{formatDate(row.date)}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{row.project_name}</td>
                          <td className="px-4 py-2.5 text-slate-600">{row.milestone_name || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate" title={row.task_name}>{row.task_name || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-500">{row.actual_start?.substring(0, 5) || row.planned_start?.substring(0, 5) || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-500">{row.actual_end?.substring(0, 5) || row.planned_end?.substring(0, 5) || '-'}</td>
                          <td className="px-4 py-2.5 text-center text-blue-900 bg-blue-50/30">{parseFloat(row.planned_hours || 0).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-orange-600 bg-orange-50/30">{parseFloat(row.actual_hours || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs font-medium text-slate-500 text-center">
                Showing {filteredHistory.length} of {history.length} records
              </div>
            </div>

            {/* ── Recent Activity List ── */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
                <CheckCircle2 size={18} className="text-rose-500" />
                <h3 className="font-medium text-slate-950 text-base">Recent Completed Activity</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {recentActivity.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400 italic">No recent activity.</div>
                ) : (
                  recentActivity.map(row => (
                    <div key={row.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                        <FolderGit2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {row.task_name || 'Unnamed Task'} 
                          <span className="font-normal text-slate-500 ml-2">on {row.project_name}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(row.date)} • {row.actual_start?.substring(0, 5)} - {row.actual_end?.substring(0, 5)} • <span className="font-semibold text-orange-600">{parseFloat(row.actual_hours || 0).toFixed(2)} hrs</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
