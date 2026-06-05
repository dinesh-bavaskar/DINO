import { useEffect, useState } from 'react';
import { Briefcase, Building2, Calendar, IdCard, Mail, Shield, User } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge } from '../../components/ui';
import { getProfile } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    { icon: User, label: 'Full Name', value: profile?.full_name },
    { icon: IdCard, label: 'Employee ID', value: profile?.employee_id || user?.employee_id, highlight: true },
    { icon: Mail, label: 'Email Address', value: profile?.email },
    { icon: Building2, label: 'Department', value: profile?.department },
    { icon: Briefcase, label: 'Designation', value: profile?.designation },
    { icon: Shield, label: 'Role', value: profile?.role === 'admin' ? 'Administrator' : 'Employee' },
    {
      icon: Calendar,
      label: 'Joined On',
      value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-',
    },
  ];

  return (
    <DashboardLayout>
      <Navbar title="My Profile" subtitle="Your personal information" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        {loading ? <Loader text="Loading profile..." /> : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="relative overflow-hidden rounded-lg bg-blue-600 p-7 text-white shadow-sm">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border-2 border-white/30 bg-white/20 text-3xl font-black">
                  {(profile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{profile?.full_name || user?.full_name}</h2>
                  <p className="mt-1 text-sm text-white/75">{profile?.designation} • {profile?.department}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold">{profile?.employee_id || user?.employee_id}</span>
                    <span className="rounded-md border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold">{profile?.role === 'admin' ? 'Admin' : 'Employee'}</span>
                    {profile?.is_active && <span className="rounded-md border border-emerald-200/60 bg-emerald-400/25 px-3 py-1 text-xs font-semibold">Active</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Personal Details</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map(({ icon: Icon, label, value, highlight }) => (
                  <div className="flex items-center gap-4 px-5 py-4 transition hover:bg-sky-50/40" key={label}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-sky-100 bg-sky-50 text-sky-600">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className={`mt-1 font-semibold ${highlight ? 'text-sky-600' : 'text-slate-950'}`}>{value || '-'}</p>
                    </div>
                    {label === 'Role' && <Badge>{value}</Badge>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Profile;
