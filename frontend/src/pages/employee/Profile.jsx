import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { getProfile } from '../../services/authService';
import { User, Mail, Building2, Briefcase, IdCard, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const InfoRow = ({ icon: Icon, label, value, highlight }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '15px 20px',
      borderBottom: '1px solid #E2E8F4',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: '38px', height: '38px',
        background: '#EBF2FF',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(29,110,245,0.15)',
      }}>
        <Icon size={17} color="#1D6EF5" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
        <p style={{
          fontSize: '15px', fontWeight: 600,
          color: highlight ? '#1D6EF5' : '#0F172A',
          marginTop: '2px',
        }}>
          {value || '—'}
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <Navbar title="My Profile" subtitle="Your personal information" />

      <div style={{ padding: '28px', animation: 'fadeIn 0.4s ease' }}>
        {loading ? (
          <Loader text="Loading profile..." />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Profile Header Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1D6EF5 0%, #1045B8 100%)',
              borderRadius: '16px',
              padding: '28px 32px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorations */}
              <div style={{
                position: 'absolute', right: '-20px', top: '-20px',
                width: '160px', height: '160px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
              }} />
              <div style={{
                position: 'absolute', right: '80px', bottom: '-40px',
                width: '100px', height: '100px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
              }} />

              {/* Avatar */}
              <div style={{
                width: '80px', height: '80px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 800, color: 'white',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.35)',
                position: 'relative',
              }}>
                {(profile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
                  {profile?.full_name || user?.full_name}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '4px', fontSize: '14px' }}>
                  {profile?.designation} • {profile?.department}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {profile?.employee_id || user?.employee_id}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {profile?.role === 'admin' ? '🛡️ Admin' : '👤 Employee'}
                  </span>
                  {profile?.is_active && (
                    <span style={{
                      background: 'rgba(16,185,129,0.25)',
                      border: '1px solid rgba(16,185,129,0.5)',
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: '99px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      ● Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F4',
              boxShadow: '0 4px 16px rgba(29,110,245,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '15px 20px',
                background: '#F8FAFF',
                borderBottom: '1px solid #E2E8F4',
              }}>
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Personal Details
                </p>
              </div>
              <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
              <InfoRow icon={IdCard} label="Employee ID" value={profile?.employee_id || user?.employee_id} highlight />
              <InfoRow icon={Mail} label="Email Address" value={profile?.email} />
              <InfoRow icon={Building2} label="Department" value={profile?.department} />
              <InfoRow icon={Briefcase} label="Designation" value={profile?.designation} />
              <InfoRow icon={Shield} label="Role" value={profile?.role === 'admin' ? 'Administrator' : 'Employee'} />
              <div style={{ borderBottom: 'none' }}>
                <InfoRow
                  icon={Calendar}
                  label="Joined On"
                  value={profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : '—'
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
