import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, Calendar, Clock, CheckCircle2,
  Activity, Target, BarChart, Flag, Edit, Power, History, FileText, Search, Home
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart as RechartsBarChart, Bar
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge, StatusBadge } from '../../components/ui';
import { getEmployee, updateEmployeeStatus } from '../../services/authService';
import { getAdminTimesheets } from '../../services/timesheetService';
import { buttonClass } from '../../components/uiClasses';

const decimalHours = (val) => parseFloat(val || 0).toFixed(2);
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Timesheet History
  const [filterDate, setFilterDate] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Filters for Trend Graph
  const [graphFilter, setGraphFilter] = useState('7'); // '7', '15', '30', 'custom'
  const [graphStartDate, setGraphStartDate] = useState('');
  const [graphEndDate, setGraphEndDate] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const empRes = await getEmployee(id);
        const employeeData = empRes.data;
        if (!mounted) return;
        setEmployee(employeeData);

        const tsRes = await getAdminTimesheets({ employee: employeeData.employee_id, page_size: 100 });
        if (mounted) {
          setReports(tsRes.data || []);
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [id]);

  const toggleStatus = async () => {
    if (!employee) return;
    try {
      await updateEmployeeStatus(employee.id, !employee.is_active);
      setEmployee(prev => ({ ...prev, is_active: !prev.is_active }));
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // --- Aggregations (Purely Client-Side) ---
  const stats = useMemo(() => {
    if (!reports.length) return null;

    let totalActualHours = 0;
    let todayHours = 0;
    let weekHours = 0;
    let monthHours = 0;
    let totalTasks = 0;
    const projectMap = {};
    const dateMap = {};

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    const weekStartStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const monthStartStr = `${y}-${m}-01`;

    let last30DaysHours = 0;
    let last7DaysHours = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Trend Map for Chart
    const trendMap = {};
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      trendMap[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`] = 0;
    }

    let longestTaskWorked = null;
    let maxTaskHours = 0;
    let firstActivityDate = '9999-99-99';
    let lastActivityDate = '0000-00-00';

    reports.forEach(r => {
      let dailyTotal = 0;

      if (r.date < firstActivityDate) firstActivityDate = r.date;
      if (r.date > lastActivityDate) lastActivityDate = r.date;

      r.tasks.forEach(t => {
        const hours = parseFloat(t.actual_hours) || 0;
        if (hours > 0) {
          totalActualHours += hours;
          dailyTotal += hours;
          totalTasks++;

          if (hours > maxTaskHours) {
            maxTaskHours = hours;
            longestTaskWorked = t.task_name;
          }

          if (r.date === todayStr) todayHours += hours;
          if (r.date >= weekStartStr && r.date <= todayStr) weekHours += hours;
          if (r.date >= monthStartStr && r.date <= todayStr) monthHours += hours;

          const repDate = new Date(r.date);
          if (repDate >= thirtyDaysAgo) last30DaysHours += hours;
          if (repDate >= sevenDaysAgo) last7DaysHours += hours;

          if (trendMap[r.date] !== undefined) {
            trendMap[r.date] += hours;
          }

          const pName = t.project_name || 'Unknown Project';
          if (!projectMap[pName]) {
            projectMap[pName] = {
              name: pName, hours: 0, tasks: 0,
              firstWorked: r.date, lastWorked: r.date
            };
          }
          projectMap[pName].hours += hours;
          projectMap[pName].tasks++;
          if (r.date < projectMap[pName].firstWorked) projectMap[pName].firstWorked = r.date;
          if (r.date > projectMap[pName].lastWorked) projectMap[pName].lastWorked = r.date;
        }
      });
      if (dailyTotal > 0) {
        dateMap[r.date] = (dateMap[r.date] || 0) + dailyTotal;
      }
    });

    if (firstActivityDate === '9999-99-99') firstActivityDate = 'N/A';
    if (lastActivityDate === '0000-00-00') lastActivityDate = 'N/A';

    const projectStats = Object.values(projectMap).sort((a, b) => b.hours - a.hours);
    const mostWorkedProject = projectStats.length > 0 ? projectStats[0].name : 'N/A';

    let maxDailyHours = 0;
    let mostActiveDay = 'N/A';
    for (const [date, hours] of Object.entries(dateMap)) {
      if (hours > maxDailyHours) {
        maxDailyHours = hours;
        mostActiveDay = date;
      }
    }

    const totalWorkingDays = Object.keys(dateMap).length;
    const avgDaily = totalWorkingDays > 0 ? (totalActualHours / totalWorkingDays) : 0;
    const avgWeekly = avgDaily * 5;

    return {
      totalActualHours, todayHours, weekHours, monthHours, totalTasks,
      projectStats, mostWorkedProject, maxDailyHours, mostActiveDay,
      avgDaily, avgWeekly, todayStr, last7DaysHours, last30DaysHours,
      trendData: Object.entries(trendMap).map(([date, hours]) => ({ date, hours })),
      longestTaskWorked, totalWorkingDays, firstActivityDate, lastActivityDate
    };
  }, [reports]);

  const trendDataCalculated = useMemo(() => {
    if (!reports.length) return { data: [], avgPlanned: 0, avgActual: 0, totalPlanned: 0, totalActual: 0, productivity: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startLimit = null;
    let endLimit = new Date(today); // By default include up to today

    if (graphFilter === '7') {
      startLimit = new Date(today);
      startLimit.setDate(today.getDate() - 6);
    } else if (graphFilter === '15') {
      startLimit = new Date(today);
      startLimit.setDate(today.getDate() - 14);
    } else if (graphFilter === '30') {
      startLimit = new Date(today);
      startLimit.setDate(today.getDate() - 29);
    } else if (graphFilter === 'custom') {
      if (graphStartDate) startLimit = new Date(graphStartDate);
      if (graphEndDate) {
        endLimit = new Date(graphEndDate);
        endLimit.setHours(23, 59, 59, 999);
      }
    }

    const dateMap = {};

    reports.forEach(r => {
      const parts = r.date.split('-');
      if (parts.length !== 3) return;

      const rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      rDate.setHours(0, 0, 0, 0);

      let include = true;
      if (startLimit && rDate < startLimit) include = false;
      if (endLimit && rDate > endLimit) include = false;

      if (include) {
        if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, planned: 0, actual: 0 };
        r.tasks.forEach(t => {
          dateMap[r.date].planned += parseFloat(t.planned_hours) || 0;
          dateMap[r.date].actual += parseFloat(t.actual_hours) || 0;
        });
      }
    });

    const fillMissingDays = (start, end) => {
      const data = [];
      const current = new Date(start);
      while (current <= end) {
        const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        if (dateMap[dStr]) {
          data.push({
            date: dStr,
            planned: Number(dateMap[dStr].planned.toFixed(2)),
            actual: Number(dateMap[dStr].actual.toFixed(2))
          });
        } else {
          data.push({ date: dStr, planned: 0, actual: 0 });
        }
        current.setDate(current.getDate() + 1);
      }
      return data;
    };

    let chartData = [];
    if (startLimit && endLimit && (endLimit - startLimit) / (1000 * 60 * 60 * 24) <= 60) {
      chartData = fillMissingDays(startLimit, endLimit);
    } else {
      chartData = Object.values(dateMap).sort((a, b) => a.date > b.date ? 1 : -1);
      chartData = chartData.map(d => ({ ...d, planned: Number(d.planned.toFixed(2)), actual: Number(d.actual.toFixed(2)) }));
    }

    let totalPlanned = 0;
    let totalActual = 0;
    chartData.forEach(d => {
      totalPlanned += d.planned;
      totalActual += d.actual;
    });

    const daysCount = chartData.length || 1;
    const avgPlanned = totalPlanned / daysCount;
    const avgActual = totalActual / daysCount;
    const productivity = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return {
      data: chartData,
      totalPlanned,
      totalActual,
      avgPlanned,
      avgActual,
      productivity
    };
  }, [reports, graphFilter, graphStartDate, graphEndDate]);

  // Tasks Data
  const todayTasks = useMemo(() => {
    if (!stats || !reports.length) return [];
    const todayRep = reports.find(r => r.date === stats.todayStr);
    return todayRep ? todayRep.tasks : [];
  }, [reports, stats]);

  const allTasks = useMemo(() => {
    const list = [];
    reports.forEach(r => {
      r.tasks.forEach(t => {
        list.push({
          ...t,
          date: r.date,
          status: r.status,
          reportId: r.id
        });
      });
    });
    return list;
  }, [reports]);

  const filteredHistory = useMemo(() => {
    return allTasks.filter(t => {
      if (filterDate && t.date !== filterDate) return false;
      if (filterProject && t.project_name !== filterProject) return false;
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      return true;
    });
  }, [allTasks, filterDate, filterProject, filterMonth]);

  const uniqueProjects = useMemo(() => [...new Set(allTasks.map(t => t.project_name).filter(Boolean))], [allTasks]);

  const timelineActivities = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return (a.actual_start || '') > (b.actual_start || '') ? -1 : 1;
    }).slice(0, 10);
  }, [allTasks]);

  if (loading) {
    return (
      <DashboardLayout>
        <Navbar title="Employee Profile" />
        <main className="flex-1 overflow-auto bg-slate-50 p-6 flex justify-center items-center">
          <Loader text="Loading Profile..." />
        </main>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <Navbar title="Employee Profile" />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="max-w-3xl mx-auto text-center py-20">
            <User size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700">Employee Not Found</h2>
            <button onClick={() => navigate('/admin/employees')} className="mt-4 text-blue-900 hover:underline">Return to Directory</button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Navbar title={`${employee.full_name}'s Profile`} subtitle="Employee Analytics" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 lg:p-8">

        {/* Navigation */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 ml-2">Employee Profile & Analytics</h1>
          <button onClick={() => navigate('/admin/employees')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 shadow-sm transition flex items-center gap-2 font-medium">
            <ArrowLeft size={16} /> Back to Employees
          </button>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">

          {/* ROW 1: PROFILE & HIGH-LEVEL STATS */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* 1. EMPLOYEE INFORMATION & ACTIONS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-1 flex flex-col items-center relative h-full">
              <div className="absolute top-4 right-4">
                <Badge tone={employee.is_active ? 'green' : 'red'}>{employee.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="w-24 h-24 bg-blue-900 rounded-full flex items-center justify-center text-3xl font-semibold text-white shadow-md mb-4 ring-4 ring-blue-50 mt-4 overflow-hidden">
                {employee?.profile_photo && typeof employee.profile_photo === 'string' ? (
                  <img src={employee.profile_photo.startsWith('http') ? employee.profile_photo : `http://127.0.0.1:8000${employee.profile_photo}`} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  (employee?.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{employee.full_name}</h2>
              <p className="text-sm text-slate-500 mb-2">{employee.email}</p>
              <Badge tone="blue" className="mb-6">{employee.employee_id}</Badge>

              <div className="w-full space-y-3 text-sm text-left border-t border-slate-100 pt-5 mb-6">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-800">{employee.department}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Designation</span>
                  <span className="font-semibold text-slate-800">{employee.designation}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Role</span>
                  <span className="font-semibold text-slate-800 capitalize">{employee.role}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Joining Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(employee.created_at?.substring(0, 10))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-semibold text-slate-800">{employee.last_login ? formatDate(employee.last_login.substring(0, 10)) : 'N/A'}</span>
                </div>
              </div>

              {/* Quick Admin Actions merged into Employee Info */}
              <div className="w-full space-y-3 mt-auto">
                <button onClick={() => navigate('/admin/employees')} className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-sm">
                  <Edit size={16} /> Edit Profile
                </button>
                <button onClick={toggleStatus} className={`w-full py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-sm ${employee.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'}`}>
                  <Power size={16} /> {employee.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <Link to={`/admin/submissions?search=${employee.employee_id}`} className="w-full py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-sm">
                  <FileText size={16} /> View Today's Timesheet
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN STACK */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* 2. PRODUCTIVITY OVERVIEW */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
                  <Activity size={18} className="text-blue-500" />
                  <h3 className="font-medium text-slate-950 text-base">Productivity Overview</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Total Actual Hours", val: stats?.totalActualHours || 0 },
                      { label: "Today's Actual Hours", val: stats?.todayHours || 0 },
                      { label: "Weekly Actual Hours", val: stats?.weekHours || 0 },
                      { label: "Monthly Actual Hours", val: stats?.monthHours || 0 },
                      { label: "Total Projects Worked", val: stats?.projectStats.length || 0 },
                      { label: "Average Daily Hours", val: decimalHours(stats?.avgDaily) },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">{item.label}</p>
                        <p className="text-2xl font-semibold text-slate-900">{typeof item.val === 'number' ? decimalHours(item.val) : item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ATTENDANCE TREND */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
                  <BarChart size={18} className="text-indigo-500" />
                  <h3 className="font-medium text-slate-950 text-base">Attendance Trend</h3>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Last 7 Days (Weekly)</p>
                      <p className="text-lg font-semibold text-slate-900">{decimalHours(stats?.last7DaysHours)}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold">Last 30 Days (Monthly)</p>
                      <p className="text-lg font-semibold text-slate-900">{decimalHours(stats?.last30DaysHours)}h</p>
                    </div>
                  </div>
                  <div className="w-full h-[180px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={stats?.trendData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => formatDate(val).substring(0, 5)}
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={12}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `${val}h`}
                          tickMargin={8}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(label) => formatDate(label)}
                          formatter={(value) => [`${value}h`, 'Hours']}
                        />
                        <Bar 
                          dataKey="hours" 
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={40}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 1.5: PLANNED VS ACTUAL HOURS TREND */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-rose-500" />
                <h3 className="font-medium text-slate-950 text-base">Planned vs Actual Hours Trend</h3>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="h-9 px-3 text-sm border border-slate-300 rounded-md bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={graphFilter}
                  onChange={(e) => setGraphFilter(e.target.value)}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="15">Last 15 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
                {graphFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      className="h-9 px-3 text-sm border border-slate-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={graphStartDate}
                      onChange={(e) => setGraphStartDate(e.target.value)}
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="date"
                      className="h-9 px-3 text-sm border border-slate-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={graphEndDate}
                      onChange={(e) => setGraphEndDate(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Statistics Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Avg Planned Hours', value: decimalHours(trendDataCalculated.avgPlanned) + 'h' },
                  { label: 'Avg Actual Hours', value: decimalHours(trendDataCalculated.avgActual) + 'h' },
                  { label: 'Productivity %', value: decimalHours(trendDataCalculated.productivity) + '%' },
                  { label: 'Total Planned Hours', value: decimalHours(trendDataCalculated.totalPlanned) + 'h' },
                  { label: 'Total Actual Hours', value: decimalHours(trendDataCalculated.totalActual) + 'h' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center relative overflow-hidden">
                    <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    {stat.label === 'Productivity %' && (
                      <div className={`absolute top-0 right-0 w-1.5 h-full ${trendDataCalculated.totalActual >= trendDataCalculated.totalPlanned ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* The Graph */}
              <div className="w-full h-[350px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendDataCalculated.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => formatDate(val).substring(0, 5)}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickMargin={15}
                      axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => `${val}h`}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 'dataMax + 2']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100 text-sm min-w-[200px]">
                              <p className="font-semibold mb-3 text-slate-800 pb-2 border-b border-slate-100">{formatDate(label)}</p>
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-6 mb-2">
                                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                                    <span className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: entry.color }}></span>
                                    {entry.name}
                                  </span>
                                  <span className="font-bold text-slate-900">{entry.value}h</span>
                                </div>
                              ))}
                              <div className={`mt-3 pt-2 text-xs text-center font-bold uppercase tracking-wider rounded-md py-1.5 ${payload[1]?.value >= payload[0]?.value ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {payload[1]?.value >= payload[0]?.value ? 'Meeting Plan' : 'Below Plan'}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '13px', fontWeight: 500 }} />
                    <Area type="monotone" dataKey="planned" name="Planned Hours" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPlanned)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#2563eb' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                    <Area type="monotone" dataKey="actual" name="Actual Hours" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#ea580c' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#ea580c' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW 2: TODAY'S WORK SUMMARY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
              <Flag size={18} className="text-amber-500" />
              <h3 className="font-medium text-slate-950 text-base">Today's Work Summary</h3>
            </div>
            <div className="p-6">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-500">No activity recorded for today.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-blue-900 border-b border-blue-950 relative z-10 shadow-sm text-[10px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="px-4 py-3 font-medium">Project</th>
                        <th className="px-4 py-3 font-medium">Milestone</th>
                        <th className="px-4 py-3 w-1/3 font-medium">Task</th>
                        <th className="px-4 py-3 text-center font-medium">Planned Duration</th>
                        <th className="px-4 py-3 text-center font-medium">Actual Duration</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {todayTasks.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{t.project_name}</td>
                          <td className="px-4 py-3 text-slate-500">{t.milestone_name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={t.task_name}>{t.task_name}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{decimalHours(t.planned_hours)}h</td>
                          <td className="px-4 py-3 text-center font-semibold text-blue-900 bg-blue-50/50">{decimalHours(t.actual_hours)}h</td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ROW 4: PROJECT-WISE SUMMARY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex items-center gap-2 bg-white">
              <Briefcase size={18} className="text-blue-500" />
              <h3 className="font-medium text-slate-950 text-base">Project-Wise Summary</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-blue-900 border-b border-blue-950 relative z-10 shadow-sm text-[10px] uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-4 py-3 font-medium">Project Name</th>
                      <th className="px-4 py-3 text-center font-medium">First Worked Date</th>
                      <th className="px-4 py-3 text-center font-medium">Last Worked Date</th>
                      <th className="px-4 py-3 text-center font-medium">Total Tasks</th>
                      <th className="px-4 py-3 text-center font-medium">Total Actual Hours</th>
                      <th className="px-4 py-3 min-w-[200px] font-medium">Contribution %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {!stats?.projectStats.length ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-slate-500">No project history found.</td>
                      </tr>
                    ) : stats.projectStats.map((p, i) => {
                      const percentage = stats.totalActualHours > 0 ? (p.hours / stats.totalActualHours) * 100 : 0;
                      return (
                        <tr key={p.name} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{formatDate(p.firstWorked)}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{formatDate(p.lastWorked)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">{p.tasks}</td>
                          <td className="px-4 py-3 text-center font-semibold text-blue-900">{decimalHours(p.hours)}h</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-xs font-semibold text-slate-600 w-10 text-right">{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 5: TIMESHEET HISTORY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-purple-500" />
                <h3 className="font-medium text-slate-950 text-base">Timesheet History</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="h-9 px-3 text-sm border border-slate-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-9 px-3 text-sm border border-slate-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="h-9 px-3 text-sm border border-slate-300 rounded-md bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Projects</option>
                  {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterProject(''); }} className="h-9 px-4 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition">Clear Filters</button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-blue-900 border-b border-blue-950 sticky top-0 shadow-sm text-[10px] uppercase tracking-wider text-white z-10">
                  <tr>
                    <th className="px-4 py-3 border-b font-medium">Date</th>
                    <th className="px-4 py-3 border-b font-medium">Project</th>
                    <th className="px-4 py-3 border-b font-medium">Milestone</th>
                    <th className="px-4 py-3 border-b max-w-[200px] font-medium">Task Description</th>
                    <th className="px-4 py-3 border-b text-center font-medium">Planned Duration</th>
                    <th className="px-4 py-3 border-b text-center font-medium">Actual Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                        <Search size={24} className="mx-auto mb-2 opacity-30" />
                        No tasks match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{formatDate(t.date)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{t.project_name}</td>
                        <td className="px-4 py-3 text-slate-500">{t.milestone_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={t.task_name}>{t.task_name}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{decimalHours(t.planned_hours)}h</td>
                        <td className="px-4 py-3 text-center font-semibold text-orange-600 bg-orange-50/30">{decimalHours(t.actual_hours)}h</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default EmployeeProfile;
