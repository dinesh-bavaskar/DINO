import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus, UploadCloud, User } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import { Field } from '../../components/ui';
import { buttonClass, inputClass } from '../../components/uiClasses';
import { registerEmployee } from '../../services/authService';
import { toast } from 'sonner';

const initialForm = {
  employee_id: '',
  full_name: '',
  email: '',
  department: '',
  designation: '',
  password: '',
  confirm_password: '',
  role: 'employee',
  profile_photo: null,
};

const RegisterEmployee = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const [roles] = useState(() => {
    const saved = localStorage.getItem('system-other-settings');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.roles || ['Employee', 'Admin'];
  });

  const [departments] = useState(() => {
    const saved = localStorage.getItem('system-other-settings');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.departments || ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance'];
  });

  const [designations] = useState(() => {
    const saved = localStorage.getItem('system-other-settings');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.designations || ['Software Engineer', 'Senior Engineer', 'HR Manager', 'Sales Executive', 'Product Manager'];
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, JPEG, PNG).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be less than 5MB.');
      return;
    }

    setForm((prev) => ({ ...prev, profile_photo: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      await registerEmployee(formData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/employees'), 1500);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        toast.error(Object.entries(errData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`).join('\n'));
      } else {
        toast.error(`Registration failed: ${errData || err.message}`);
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
          <h2 className="text-2xl font-semibold text-slate-950">Employee Registered!</h2>
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
              <h2 className="text-xl font-semibold text-slate-950">New Employee Registration</h2>
            </div>
          </div>

          <form autoComplete="off" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-blue-900 px-6 py-4 text-white">
              <UserPlus size={18} />
              <p className="text-sm font-semibold">Employee Information Form</p>
            </div>
            <div className="space-y-5 p-6">
              <div className="mb-6 flex flex-col items-center sm:flex-row sm:items-start gap-6 border-b border-slate-100 pb-6">
                <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-slate-100 shadow-sm">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h3 className="text-sm font-semibold text-slate-900">Profile Photo</h3>
                  <p className="text-sm text-slate-500">Upload a professional photo for the employee profile. Maximum file size is 5MB. JPG, JPEG, or PNG format.</p>
                  <label className={`${buttonClass.outline} inline-flex items-center gap-2 cursor-pointer mt-2`}>
                    <UploadCloud size={16} />
                    <span>Choose Photo</span>
                    <input type="file" className="hidden" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Employee ID"><input autoComplete="off" className={inputClass} name="employee_id" onChange={handleChange} required value={form.employee_id} /></Field>
                <Field label="Full Name"><input className={inputClass} name="full_name" onChange={handleChange} required value={form.full_name} /></Field>
                <Field label="Email Address"><input className={inputClass} name="email" onChange={handleChange} required type="email" value={form.email} /></Field>
                <Field label="Role">
                  <select className={inputClass} name="role" onChange={handleChange} value={form.role}>
                    {roles.map((r) => (
                      <option key={r.toLowerCase()} value={r.toLowerCase()}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Department">
                  <select
                    className={inputClass}
                    name="department"
                    onChange={handleChange}
                    required
                    value={form.department}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Designation">
                  <select
                    className={inputClass}
                    name="designation"
                    onChange={handleChange}
                    required
                    value={form.designation}
                  >
                    <option value="">Select Designation</option>
                    {designations.map((desg) => (
                      <option key={desg} value={desg}>
                        {desg}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Password"><input autoComplete="new-password" className={inputClass} name="password" onChange={handleChange} required type="password" value={form.password} /></Field>
                <Field label="Confirm Password"><input autoComplete="new-password" className={inputClass} name="confirm_password" onChange={handleChange} required type="password" value={form.confirm_password} /></Field>
              </div>

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
