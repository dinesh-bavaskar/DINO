import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { getStats, getEmployees } from '../../services/authService';
import { Users, UserCheck, Building, UserPlus, ArrowRight, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, departments: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, empRes] = await Promise.all([getStats(), getEmployees()]);
        setStats(statsRes.data);
        setRecentEmployees(empRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.total_employees,
      icon: Users,
      color: '#1D6EF5',
      bg: '#EBF2FF',
      trend: '+12%',
    },
    {
      label: 'Active Employees',
      value: stats.active_employees,
      icon: UserCheck,
      color: '#059669',
      bg: '#ECFDF5',
      trend: '+5%',
    },
    {
      label: 'Departments',
      value: stats.departments,
      icon: Building,
      color: '#7C3AED',
      bg: '#F5F3FF',
      trend: 'Stable',
    },
  ];

  const avatarColors = ['#1D6EF5', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0EA5E9'];

  return (
    <DashboardLayout>
      <Navbar
        title={`Good day, ${user?.full_name?.split(' ')[0]} 👋`}
        subtitle="Here's your team overview for today"
      />

      <div style={{ padding: '28px', animation: 'fadeIn 0.4s ease' }}>
        {loading ? (
          <Loader text="Loading dashboard..." />
        ) : (
          <>
            {/* Welcome Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1D6EF5 0%, #1045B8 100%)',
              borderRadius: '16px',
              padding: '28px 32px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', right: '-30px', top: '-30px',
                width: '200px', height: '200px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
              }} />
              <div style={{
                position: 'absolute', right: '80px', bottom: '-60px',
                width: '150px', height: '150px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
              }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Employee Management Dashboard
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
                  You have <strong style={{ color: '#FFFFFF' }}>{stats.total_employees}</strong> total employees across <strong style={{ color: '#FFFFFF' }}>{stats.departments}</strong> departments.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/register')}
                style={{
                  position: 'relative',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              >
                <UserPlus size={16} />
                Add Employee
              </button>
            </div>

            {/* Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {statCards.map(({ label, value, icon: Icon, color, bg, trend }) => (
                <div key={label} className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 500 }}>{label}</p>
                      <p style={{ fontSize: '38px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</p>
                    </div>
                    <div style={{
                      width: '48px', height: '48px',
                      background: bg,
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} color={color} />
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid #E2E8F4',
                  }}>
                    <TrendingUp size={13} color="#059669" />
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>{trend}</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                {
                  id: 'btn-register-employee',
                  path: '/admin/register',
                  icon: UserPlus,
                  title: 'Register Employee',
                  desc: 'Add a new employee to the system',
                  color: '#1D6EF5',
                  bg: '#EBF2FF',
                  border: 'rgba(29,110,245,0.2)',
                },
                {
                  id: 'btn-view-employees',
                  path: '/admin/employees',
                  icon: Users,
                  title: 'View All Employees',
                  desc: 'Browse and manage your team',
                  color: '#7C3AED',
                  bg: '#F5F3FF',
                  border: 'rgba(124,58,237,0.2)',
                },
              ].map(({ id, path, icon: Icon, title, desc, color, bg, border }) => (
                <button
                  key={id}
                  id={id}
                  onClick={() => navigate(path)}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${border}`,
                    borderRadius: '14px',
                    padding: '20px 22px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    transition: 'all 0.25s ease',
                    textAlign: 'left',
                    boxShadow: '0 1px 4px rgba(29,110,245,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,110,245,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(29,110,245,0.06)';
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px',
                    background: bg,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{title}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{desc}</p>
                  </div>
                  <ArrowRight size={16} color={color} />
                </button>
              ))}
            </div>

            {/* Recent Employees Table */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '14px',
              }}>
                <div>
                  <p className="section-title">Recent Employees</p>
                  <p className="section-subtitle">Latest additions to your team</p>
                </div>
                <button
                  onClick={() => navigate('/admin/employees')}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#1D6EF5', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                          <Users size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                          No employees registered yet.
                        </td>
                      </tr>
                    ) : recentEmployees.map((emp, idx) => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px',
                              background: avatarColors[idx % avatarColors.length],
                              borderRadius: '9px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            }}>
                              {emp.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{emp.full_name}</p>
                              <p style={{ fontSize: '11px', color: '#94A3B8' }}>{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-primary">{emp.employee_id}</span></td>
                        <td style={{ color: '#475569', fontSize: '13px' }}>{emp.department}</td>
                        <td style={{ color: '#475569', fontSize: '13px' }}>{emp.designation}</td>
                        <td>
                          <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {emp.is_active ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
