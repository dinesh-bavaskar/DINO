import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, UserPlus, Users, ClipboardList, Settings, 
  Briefcase, Clock, Activity, BarChart3, TrendingUp, CheckCircle, AlertCircle, Award
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';
import { useAuth } from '../../context/AuthContext';

const Section = ({ title, children }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
    <div className="border-b border-slate-200 px-6 py-4 relative z-10 shadow-sm bg-white">
      <h2 className="font-medium text-slate-950 text-base">{title}</h2>
    </div>
    <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
      {children}
    </div>
  </section>
);

const InfoRow = ({ label, value, icon, tone = 'blue' }) => {
  const tones = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    amber: 'text-amber-600',
    slate: 'text-slate-600',
    sky: 'text-sky-600',
    indigo: 'text-indigo-600',
    red: 'text-red-600',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`flex shrink-0 items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="font-medium text-slate-950">{value}</span>
    </div>
  );
};

const ActionButton = ({ path, icon: Icon, label, tone, navigate }) => (
  <button 
    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md" 
    onClick={() => navigate(path)} 
    type="button"
  >
    <div className={`flex shrink-0 items-center justify-center ${tone}`}>
      <Icon size={26} />
    </div>
    <div className="flex-1">
      <p className="font-medium text-slate-950">{label}</p>
    </div>
    <ArrowRight className="text-slate-300" size={18} />
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    loading,
    stats,
    projects,
    milestones,
    todayTimesheets,
    weekTimesheets,
    monthTimesheets
  } = useAdminDashboardData();

  const metrics = useMemo(() => {
    const activeEmps = stats.active_employees || 0;
    
    // Today
    const todaySubmittedCount = todayTimesheets.length;
    const pendingEmployees = Math.max(0, activeEmps - todaySubmittedCount);
    const todayActualHours = todayTimesheets.reduce((acc, t) => acc + Number(t.total_actual_hours || 0), 0);
    
    // Projects
    const activeProjects = projects.filter(p => p.is_active !== false).length;
    const activeMilestones = milestones.filter(m => m.is_active !== false).length;
    
    const projectHours = {};
    todayTimesheets.forEach(t => {
      if (t.tasks) {
        t.tasks.forEach(task => {
          if (task.actual_start && task.actual_end && task.project_name) {
            const [sh, sm] = task.actual_start.split(':').map(Number);
            const [eh, em] = task.actual_end.split(':').map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff > 0) {
              projectHours[task.project_name] = (projectHours[task.project_name] || 0) + diff;
            }
          }
        });
      }
    });
    let mostWorkedProject = 'None';
    let maxHours = 0;
    for (const [proj, mins] of Object.entries(projectHours)) {
      if (mins > maxHours) {
        maxHours = mins;
        mostWorkedProject = proj;
      }
    }
    
    // Activity
    const workingToday = todayTimesheets.filter(t => Number(t.total_actual_hours || 0) > 0).length;
    const topPerformer = [...todayTimesheets].sort((a, b) => Number(b.total_actual_hours || 0) - Number(a.total_actual_hours || 0))[0];
    
    // Insights
    const weekHours = weekTimesheets.reduce((acc, t) => acc + Number(t.total_actual_hours || 0), 0);
    const monthHours = monthTimesheets.reduce((acc, t) => acc + Number(t.total_actual_hours || 0), 0);
    const avgHoursPerEmployee = activeEmps > 0 ? (monthHours / activeEmps).toFixed(1) : 0;

    return {
      todaySubmittedCount, pendingEmployees, todayActualHours: todayActualHours.toFixed(1),
      activeProjects, activeMilestones, mostWorkedProject,
      workingToday, topPerformerName: topPerformer?.employee_name || 'N/A', topPerformerHours: Number(topPerformer?.total_actual_hours || 0).toFixed(1),
      weekHours: weekHours.toFixed(1), monthHours: monthHours.toFixed(1), avgHoursPerEmployee
    };
  }, [stats, projects, milestones, todayTimesheets, weekTimesheets, monthTimesheets]);

  return (
    <DashboardLayout>
      <Navbar title="Dashboard" subtitle={`Welcome back, ${user?.full_name}`} />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        {loading ? <Loader text="Loading insights..." /> : (
          <div className="space-y-6">
            
            {/* High-level Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Total Employees</p>
                <p className="text-3xl font-medium text-slate-950 leading-none">{stats.total_employees}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Active Employees</p>
                <p className="text-3xl font-medium text-slate-950 leading-none">{stats.active_employees}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Submitted Today</p>
                <p className="text-3xl font-medium text-slate-950 leading-none text-emerald-600">{metrics.todaySubmittedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Pending Today</p>
                <p className="text-3xl font-medium text-slate-950 leading-none text-red-600">{metrics.pendingEmployees}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-lg font-medium text-slate-900">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ActionButton path="/admin/register" icon={UserPlus} label="Register Employee" tone="text-blue-600" navigate={navigate} />
                <ActionButton path="/admin/employees" icon={Users} label="View Employees" tone="text-violet-600" navigate={navigate} />
                <ActionButton path="/admin/submissions" icon={ClipboardList} label="View Submissions" tone="text-emerald-600" navigate={navigate} />
                <ActionButton path="/admin/settings" icon={Settings} label="Open Settings" tone="text-slate-600" navigate={navigate} />
              </div>
            </div>

            {/* Work & Productivity Overview */}
            <div>
              <h2 className="mb-4 text-lg font-medium text-slate-900">Work & Productivity Overview</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                
                <Section title="Today's Timesheet Summary">
                  <InfoRow label="Total Employees Submitted" value={metrics.todaySubmittedCount} icon={<CheckCircle size={24} />} tone="emerald" />
                  <InfoRow label="Pending Employees" value={metrics.pendingEmployees} icon={<AlertCircle size={24} />} tone="red" />
                  <InfoRow label="Total Actual Hours Today" value={`${metrics.todayActualHours}h`} icon={<Clock size={24} />} tone="blue" />
                </Section>
                
                <Section title="Active Projects Overview">
                  <InfoRow label="Total Active Projects" value={metrics.activeProjects} icon={<Briefcase size={24} />} tone="violet" />
                  <InfoRow label="Total Active Milestones" value={metrics.activeMilestones} icon={<BarChart3 size={24} />} tone="indigo" />
                  <InfoRow label="Most Worked Project Today" value={metrics.mostWorkedProject} icon={<TrendingUp size={24} />} tone="sky" />
                </Section>

                <Section title="Employee Activity Summary">
                  <InfoRow label="Employees Working Today" value={metrics.workingToday} icon={<Activity size={24} />} tone="emerald" />
                  <InfoRow label="Employees With No Timesheet" value={metrics.pendingEmployees} icon={<Users size={24} />} tone="amber" />
                  <InfoRow label="Top Performer Today" value={`${metrics.topPerformerName} (${metrics.topPerformerHours}h)`} icon={<Award size={24} />} tone="blue" />
                </Section>

                <Section title="Quick Insights">
                  <InfoRow label="Total Actual Hours This Week" value={`${metrics.weekHours}h`} icon={<Clock size={24} />} tone="sky" />
                  <InfoRow label="Total Actual Hours This Month" value={`${metrics.monthHours}h`} icon={<Clock size={24} />} tone="indigo" />
                  <InfoRow label="Average Hours Per Employee" value={`${metrics.avgHoursPerEmployee}h`} icon={<Activity size={24} />} tone="violet" />
                </Section>

              </div>
            </div>

          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
