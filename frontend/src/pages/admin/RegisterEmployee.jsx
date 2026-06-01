import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import { registerEmployee } from '../../services/authService';
import { UserPlus, CheckCircle2 } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Legal'];
const DESIGNATIONS = ['Software Engineer', 'Senior Engineer', 'Manager', 'Analyst', 'Designer', 'HR Executive', 'Accountant', 'Intern', 'Team Lead', 'Director'];

const initialForm = {
  employee_id: '',
  full_name: '',
  email: '',
  department: '',
  designation: '',
  password: '',
  confirm_password: '',
  role: 'employee',
};

const RegisterEmployee = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await registerEmployee(form);
      setSuccess(true);
      setTimeout(() => navigate('/admin/employees'), 2000);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n');
        setError(msgs);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldLabel = ({ label, required }) => (
    <label style={{
      display: 'block',
      fontSize: '12px', fontWeight: 700,
      color: '#374151',
      marginBottom: '7px',
      textTransform: 'uppercase', letterSpacing: '0.6px',
    }}>
      {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
    </label>
  );

  if (success) {
    return (
      <DashboardLayout>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '80vh', flexDirection: 'column', gap: '16px',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{
            width: '88px', height: '88px',
            background: '#ECFDF5',
            border: '2px solid #A7F3D0',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={44} color="#059669" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Employee Registered!</h2>
          <p style={{ color: '#64748B' }}>Redirecting to employee list...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Navbar title="Register Employee" subtitle="Add a new member to your team" />

      <div style={{ padding: '28px', animation: 'fadeIn 0.4s ease' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '22px',
          }}>
            <div style={{
              width: '48px', height: '48px',
              background: '#EBF2FF',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(29,110,245,0.2)',
            }}>
              <UserPlus size={22} color="#1D6EF5" />
            </div>
            <div>
              <p className="section-title">New Employee Registration</p>
              <p className="section-subtitle">Fill in all required fields below</p>
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F4',
            boxShadow: '0 4px 16px rgba(29,110,245,0.08)',
            overflow: 'hidden',
          }}>
            {/* Form Header Bar */}
            <div style={{
              background: 'linear-gradient(135deg, #1D6EF5 0%, #1045B8 100%)',
              padding: '18px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <UserPlus size={18} color="rgba(255,255,255,0.9)" />
              <p style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>
                Employee Information Form
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div>
                  <FieldLabel label="Employee ID" required />
                  <input id="employee_id" name="employee_id" type="text" placeholder="e.g. EMP001"
                    value={form.employee_id} onChange={handleChange} required className="form-input" />
                </div>
                <div>
                  <FieldLabel label="Full Name" required />
                  <input id="full_name" name="full_name" type="text" placeholder="John Doe"
                    value={form.full_name} onChange={handleChange} required className="form-input" />
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div>
                  <FieldLabel label="Email Address" required />
                  <input id="email" name="email" type="email" placeholder="john@company.com"
                    value={form.email} onChange={handleChange} required className="form-input" />
                </div>
                <div>
                  <FieldLabel label="Role" required />
                  <select id="role" name="role" value={form.role} onChange={handleChange} className="form-input">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div>
                  <FieldLabel label="Department" required />
                  <select id="department" name="department" value={form.department} onChange={handleChange} required className="form-input">
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Designation" required />
                  <select id="designation" name="designation" value={form.designation} onChange={handleChange} required className="form-input">
                    <option value="">Select Designation</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                <div>
                  <FieldLabel label="Password" required />
                  <input id="password" name="password" type="password" placeholder="Min. 6 characters"
                    value={form.password} onChange={handleChange} required className="form-input" />
                </div>
                <div>
                  <FieldLabel label="Confirm Password" required />
                  <input id="confirm_password" name="confirm_password" type="password" placeholder="Re-enter password"
                    value={form.confirm_password} onChange={handleChange} required className="form-input" />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '18px', whiteSpace: 'pre-line' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => navigate('/admin/employees')} className="btn-outline">
                  Cancel
                </button>
                <button id="register-btn" type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                  {loading ? '⏳ Registering...' : '✓ Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterEmployee;
