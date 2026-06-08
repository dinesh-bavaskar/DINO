import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import { Field } from '../../components/ui';
import { buttonClass, inputClass } from '../../components/uiClasses';
import { registerEmployee } from '../../services/authService';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Legal'];
const designations = ['Software Engineer', 'Senior Engineer', 'Manager', 'Analyst', 'Designer', 'HR Executive', 'Accountant', 'Intern', 'Team Lead', 'Director'];

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
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [isCustomDesig, setIsCustomDesig] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      setTimeout(() => navigate('/admin/employees'), 1500);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        setError(Object.entries(errData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`).join('\n'));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={46} />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Employee Registered!</h2>
          <p className="text-slate-500">Redirecting to employee list...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Navbar title="Register Employee" subtitle="Add a new member to your team" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <UserPlus size={23} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">New Employee Registration</h2>
            </div>
          </div>

          <form className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-blue-600 px-6 py-4 text-white">
              <UserPlus size={18} />
              <p className="text-sm font-semibold">Employee Information Form</p>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Employee ID"><input className={inputClass} name="employee_id" onChange={handleChange} required value={form.employee_id} /></Field>
                <Field label="Full Name"><input className={inputClass} name="full_name" onChange={handleChange} required value={form.full_name} /></Field>
                <Field label="Email Address"><input className={inputClass} name="email" onChange={handleChange} required type="email" value={form.email} /></Field>
                <Field label="Role">
                  <select className={inputClass} name="role" onChange={handleChange} value={form.role}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                {!isCustomDept ? (
                  <Field label="Department">
                    <select
                      className={inputClass}
                      name="department"
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomDept(true);
                          setForm((prev) => ({ ...prev, department: '' }));
                        } else {
                          handleChange(e);
                        }
                      }}
                      required
                      value={form.department}
                    >
                      <option value="">Select Department</option>
                      {departments.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Add Custom Department</option>
                    </select>
                  </Field>
                ) : (
                  <Field label="Custom Department">
                    <div className="flex gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        name="department"
                        onChange={handleChange}
                        placeholder="Enter department name"
                        required
                        value={form.department}
                      />
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 self-center whitespace-nowrap"
                        onClick={() => {
                          setIsCustomDept(false);
                          setForm((prev) => ({ ...prev, department: '' }));
                        }}
                        type="button"
                      >
                        Select from list
                      </button>
                    </div>
                  </Field>
                )}

                {!isCustomDesig ? (
                  <Field label="Designation">
                    <select
                      className={inputClass}
                      name="designation"
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomDesig(true);
                          setForm((prev) => ({ ...prev, designation: '' }));
                        } else {
                          handleChange(e);
                        }
                      }}
                      required
                      value={form.designation}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Add Custom Designation</option>
                    </select>
                  </Field>
                ) : (
                  <Field label="Custom Designation">
                    <div className="flex gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        name="designation"
                        onChange={handleChange}
                        placeholder="Enter designation name"
                        required
                        value={form.designation}
                      />
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 self-center whitespace-nowrap"
                        onClick={() => {
                          setIsCustomDesig(false);
                          setForm((prev) => ({ ...prev, designation: '' }));
                        }}
                        type="button"
                      >
                        Select from list
                      </button>
                    </div>
                  </Field>
                )}
                <Field label="Password"><input className={inputClass} name="password" onChange={handleChange} required type="password" value={form.password} /></Field>
                <Field label="Confirm Password"><input className={inputClass} name="confirm_password" onChange={handleChange} required type="password" value={form.confirm_password} /></Field>
              </div>

              {error && <div className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button className={buttonClass.outline} onClick={() => navigate('/admin/employees')} type="button">Cancel</button>
                <button className={`${buttonClass.admin} flex-1`} disabled={loading} type="submit">{loading ? 'Registering...' : 'Register Employee'}</button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default RegisterEmployee;
