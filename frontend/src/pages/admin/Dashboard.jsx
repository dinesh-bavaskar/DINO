import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ArrowDownRight, UserPlus, Users } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge } from '../../components/ui';
import { buttonClass } from '../../components/uiClasses';
import { getEmployees, getStats } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const avatarColors = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-red-600', 'bg-sky-600'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, departments: 0 });
  const [recentEmployees, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getEmployees({ page_size: 5 })])
      .then(([sRes, eRes]) => {
        setStats(sRes.data);
        setRecent(eRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const dayStr = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const activePct = stats.total_employees > 0
    ? Math.round((stats.active_employees / stats.total_employees) * 100)
    : 0;

  const cards = [
    {
      label: 'Total Employees',
      value: stats.total_employees,
      sub: { up: null, text: 'Total registered staff' },
    },
    {
      label: 'Active Employees',
      value: stats.active_employees,
      sub: activePct > 0 
        ? { up: true, text: `${activePct}% active now` }
        : { up: null, text: 'No active staff' },
    },
    {
      label: 'Departments',
      value: stats.departments,
      sub: { up: null, text: 'Organizational sectors' },
    },
    {
      label: "Today's Date",
      value: dateStr,
      sub: { up: null, text: dayStr },
    },
  ];

  return (
    <DashboardLayout>
      <Navbar title="Dashboard" subtitle={`Welcome back, ${user?.full_name}`} />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        {loading ? <Loader /> : (
          <div className="space-y-6">
            <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {cards.map(({ label, value, sub }) => (
                <div key={label} className="flex-1 min-w-0 px-4 py-5 sm:px-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {label}
                  </p>
                  <p className="text-2xl xl:text-3xl font-black text-slate-950 leading-none whitespace-nowrap">
                    {value}
                  </p>
                  <div className="flex items-center gap-1 mt-3">
                    {sub.up === true  && <ArrowUpRight   size={13} className="flex-shrink-0 text-emerald-500" />}
                    {sub.up === false && <ArrowDownRight  size={13} className="flex-shrink-0 text-red-500" />}
                    <span className={`text-xs font-medium truncate ${
                      sub.up === true  ? 'text-emerald-600' :
                      sub.up === false ? 'text-red-500'     : 'text-slate-400'
                    }`}>
                      {sub.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { path: '/admin/register', icon: UserPlus, label: 'Register New Employee', desc: 'Add a team member to the system', tone: 'bg-blue-50 text-blue-700' },
                { path: '/admin/employees', icon: Users, label: 'View All Employees', desc: 'Browse and manage your team', tone: 'bg-violet-50 text-violet-700' },
              ].map(({ path, icon: Icon, label, desc, tone }) => (
                <button className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md" key={path} onClick={() => navigate(path)} type="button">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-950">{label}</p>
                    <p className="mt-1 text-sm text-slate-400">{desc}</p>
                  </div>
                  <ArrowRight className="text-slate-300" size={18} />
                </button>
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-950">Recent Employees</h2>
                  <p className="text-sm text-slate-400">Last {recentEmployees.length} added</p>
                </div>
                <button className={buttonClass.outline} onClick={() => navigate('/admin/employees')} type="button">
                  View all <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Employee', 'ID', 'Department', 'Designation', 'Status'].map((header) => (
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400" key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentEmployees.length === 0 ? (
                      <tr><td className="px-5 py-12 text-center text-sm text-slate-400" colSpan={5}>No employees registered yet.</td></tr>
                    ) : recentEmployees.map((emp, index) => (
                      <tr className="hover:bg-slate-50" key={emp.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarColors[index % avatarColors.length]}`}>
                              {emp.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{emp.full_name}</p>
                              <p className="text-xs text-slate-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><Badge tone="blue">{emp.employee_id}</Badge></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{emp.department}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{emp.designation}</td>
                        <td className="px-5 py-4"><Badge tone={emp.is_active ? 'green' : 'red'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge></td>
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

export default Dashboard;
