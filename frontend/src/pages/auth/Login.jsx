import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminLogin, employeeLogin } from '../../services/authService';

const emptyForm = { username: '', employee_id: '', password: '' };
const legacyCredentialKeys = [
  'username',
  'employee_id',
  'email',
  'password',
  'admin_username',
  'admin_password',
  'employee_password',
  'remembered_username',
  'remembered_employee_id',
];

const Login = () => {
  const [mode, setMode] = useState('admin');
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setForm(emptyForm);
    legacyCredentialKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim();
      if (legacyCredentialKeys.includes(name)) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    });
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setForm(emptyForm);
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = mode === 'admin'
        ? await adminLogin({ username: form.username, password: form.password })
        : await employeeLogin({ employee_id: form.employee_id, password: form.password });
      login(response.data, remember);
      navigate(response.data.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Backend server is not running. Please start the Django API and try again.');
      } else {
        setError(err.response.data?.detail || 'Invalid credentials. Please check and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef2f7',
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 8px 40px rgba(30,60,120,0.10)',
          padding: '44px 40px 36px',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div
              style={{
                background: '#eff4ff',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} color="#2563eb" />
            </div>
            <span style={{ fontWeight: '700', fontSize: '17px', color: '#2563eb', letterSpacing: '-0.2px' }}>
              EMS Portal
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', lineHeight: 1.25 }}>
            Welcome to your<br />Timesheet
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Please enter your credentials to access the Employee Timesheet portal
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px',
          }}
        >
          {[
            { key: 'admin', label: 'Admin' },
            { key: 'employee', label: 'Employee' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleModeChange(item.key)}
              type="button"
              style={{
                borderRadius: '7px',
                padding: '9px 0',
                fontSize: '13.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                background: mode === item.key ? '#fff' : 'transparent',
                color: mode === item.key ? '#2563eb' : '#64748b',
                boxShadow: mode === item.key ? '0 1px 6px rgba(30,60,120,0.10)' : 'none',
              }}
            >
              {item.label} Login
            </button>
          ))}
        </div>

        {/* Form */}
        <form autoComplete="off" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Identifier field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '7px',
              }}
            >
              {mode === 'admin' ? 'Username' : 'Employee ID'}
            </label>
            <div style={{ position: 'relative' }}>
              {mode === 'admin'
                ? <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                : <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />}
              <input
                name={mode === 'admin' ? 'username' : 'employee_id'}
                onChange={handleChange}
                placeholder={mode === 'admin' ? 'Enter username' : 'Enter employee ID'}
                required
                type="text"
                value={mode === 'admin' ? form.username : form.employee_id}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '11px 14px 11px 38px',
                  fontSize: '14px',
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '7px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                autoComplete="new-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '11px 40px 11px 38px',
                  fontSize: '14px',
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                onClick={() => setShowPassword((v) => !v)}
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
              <input
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                type="checkbox"
                style={{ width: '15px', height: '15px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
              Remember me
            </label>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '9px',
                padding: '11px 14px',
                fontSize: '13px',
                color: '#dc2626',
                fontWeight: '500',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            disabled={loading}
            type="submit"
            style={{
              width: '100%',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.18s',
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#2563eb'; }}
          >
            {loading ? 'Signing in...' : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Login;
