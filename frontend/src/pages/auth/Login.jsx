import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminLogin, employeeLogin } from '../../services/authService';
import { Eye, EyeOff, Lock, User, IdCard, Building2, Users, BarChart3, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('admin');
  const [form, setForm] = useState({ username: '', employee_id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let response;
      if (mode === 'admin') {
        response = await adminLogin({ username: form.username, password: form.password });
      } else {
        response = await employeeLogin({ employee_id: form.employee_id, password: form.password });
      }
      login(response.data);
      navigate(response.data.role === 'admin' ? '/admin/dashboard' : '/employee/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ShieldCheck, title: 'Secure Authentication', desc: 'JWT-based token authentication with role-based access control' },
    { icon: Users,       title: 'Team Management',     desc: 'Manage employees, departments and designations in one place' },
    { icon: BarChart3,   title: 'Real-time Insights',  desc: 'Live dashboard with team statistics and activity overview' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left: Brand Panel ── */}
      <div style={{
        width: '42%',
        background: 'linear-gradient(160deg, #1A56DB 0%, #1045B8 55%, #0C338A 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Geometric Decoration */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'280px', height:'280px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-40px', width:'320px', height:'320px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', top:'40%', right:'-30px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'60px', position:'relative' }}>
          <div style={{
            width:'44px', height:'44px',
            background:'rgba(255,255,255,0.15)',
            borderRadius:'12px',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'1px solid rgba(255,255,255,0.25)',
          }}>
            <Building2 size={22} color="#FFFFFF" />
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:'17px', color:'#FFFFFF', letterSpacing:'-0.3px' }}>EmpManager</p>
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', fontWeight:400 }}>Employee Management System</p>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <h1 style={{
            fontSize:'34px', fontWeight:800, color:'#FFFFFF',
            lineHeight:1.2, marginBottom:'16px', letterSpacing:'-0.5px',
          }}>
            Manage your team<br />
            <span style={{ color:'rgba(255,255,255,0.65)' }}>with confidence.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:'44px', maxWidth:'340px' }}>
            A centralized platform for managing employees, roles, departments, and organizational data.
          </p>

          {/* Feature List */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
                <div style={{
                  width:'36px', height:'36px', flexShrink:0,
                  background:'rgba(255,255,255,0.12)',
                  borderRadius:'9px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  marginTop:'2px',
                }}>
                  <Icon size={17} color="rgba(255,255,255,0.9)" />
                </div>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#FFFFFF', marginBottom:'2px' }}>{title}</p>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', position:'relative', marginTop:'40px' }}>
          © 2025 EmpManager. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form Panel ── */}
      <div style={{
        flex:1,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        background:'#F7F9FC',
        padding:'40px 32px',
      }}>
        <div style={{ width:'100%', maxWidth:'400px', animation:'fadeIn 0.35s ease' }}>

          {/* Heading */}
          <div style={{ marginBottom:'32px' }}>
            <h2 style={{ fontSize:'24px', fontWeight:800, color:'#0F172A', marginBottom:'6px', letterSpacing:'-0.4px' }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize:'14px', color:'#64748B' }}>
              Enter your credentials below to continue
            </p>
          </div>

          {/* Role Toggle */}
          <div style={{
            display:'flex',
            background:'#EAEFF8',
            borderRadius:'10px',
            padding:'4px',
            marginBottom:'28px',
            border:'1px solid #DDE4EF',
          }}>
            {[
              { key:'admin',    label:'Admin'    },
              { key:'employee', label:'Employee' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setError(''); }}
                style={{
                  flex:1,
                  padding:'10px 0',
                  border:'none',
                  borderRadius:'7px',
                  cursor:'pointer',
                  fontFamily:'Inter, sans-serif',
                  fontSize:'13px',
                  fontWeight:600,
                  transition:'all 0.22s ease',
                  background: mode === key ? '#FFFFFF' : 'transparent',
                  color: mode === key ? '#1A56DB' : '#64748B',
                  boxShadow: mode === key ? '0 1px 6px rgba(26,86,219,0.14)' : 'none',
                }}
              >
                {label} Login
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username / Employee ID */}
            <div style={{ marginBottom:'18px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#374151', marginBottom:'7px', letterSpacing:'0.3px' }}>
                {mode === 'admin' ? 'USERNAME' : 'EMPLOYEE ID'}
              </label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>
                  {mode === 'admin' ? <User size={15} /> : <IdCard size={15} />}
                </div>
                <input
                  id={mode === 'admin' ? 'username' : 'employee_id'}
                  name={mode === 'admin' ? 'username' : 'employee_id'}
                  type="text"
                  placeholder={mode === 'admin' ? 'Enter username' : 'e.g. EMP001'}
                  value={mode === 'admin' ? form.username : form.employee_id}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  className="form-input"
                  style={{ paddingLeft:'40px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#374151', marginBottom:'7px', letterSpacing:'0.3px' }}>
                PASSWORD
              </label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>
                  <Lock size={15} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="form-input"
                  style={{ paddingLeft:'40px', paddingRight:'42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                    background:'transparent', border:'none', cursor:'pointer', color:'#94A3B8',
                    display:'flex', padding:0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width:'100%', fontSize:'14px', padding:'13px', letterSpacing:'0.2px' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
