import { useEffect, useState } from 'react';
import { Power, Plus, Search, Users, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge, Field } from '../../components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { buttonClass, inputClass } from '../../components/uiClasses';
import { getEmployees, updateEmployeeStatus, updateEmployee } from '../../services/authService';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editForm, setEditForm] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    department: '',
    designation: '',
    password: '',
    confirm_password: '',
  });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      getEmployees({ search, page, page_size: 10 })
        .then((res) => {
          setEmployees(res.data);
          setMeta(res.meta);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, page]);

  const loadEmployees = () => {
    setLoading(true);
    getEmployees({ search, page, page_size: 10 })
      .then((res) => {
        setEmployees(res.data);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const toggleStatus = async (employee) => {
    await updateEmployeeStatus(employee.id, !employee.is_active);
    loadEmployees();
  };

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      email: emp.email,
      department: emp.department || '',
      designation: emp.designation || '',
      password: '',
      confirm_password: '',
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editForm.password || editForm.confirm_password) {
      if (editForm.password !== editForm.confirm_password) {
        setEditError('Passwords do not match.');
        return;
      }
      if (editForm.password.length < 6) {
        setEditError('Password must be at least 6 characters.');
        return;
      }
    }

    setSaving(true);
    setEditError('');
    try {
      const payload = {
        employee_id: editForm.employee_id.trim(),
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        department: editForm.department,
        designation: editForm.designation,
      };
      if (editForm.password) {
        payload.password = editForm.password;
        payload.confirm_password = editForm.confirm_password;
      }
      await updateEmployee(selectedEmp.id, payload);
      setIsEditOpen(false);
      loadEmployees();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        setEditError(
          Object.entries(errData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
            .join('\n')
        );
      } else {
        setEditError('Failed to save employee changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Navbar title="Employee Management" subtitle={`${meta?.count ?? employees.length} employees total`} />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Employees</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className={`${inputClass} pl-9`} onChange={handleSearch} placeholder="Search employees" value={search} />
            </div>
            <button className={buttonClass.primary} onClick={() => navigate('/admin/register')} type="button">
              <Plus size={16} /> Add Employee
            </button>
          </div>
        </div>

        {loading ? <Loader text="Loading employees..." /> : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed md:table-auto">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-12 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">#</th>
                    <th className="w-56 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Employee</th>
                    <th className="w-28 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">ID</th>
                    <th className="w-32 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Department</th>
                    <th className="w-36 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Designation</th>
                    <th className="w-28 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Joined</th>
                    <th className="w-24 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="w-48 px-2.5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-14 text-center text-sm text-slate-400" colSpan={8}>
                        <Users className="mx-auto mb-3 opacity-30" size={40} />
                        {search ? 'No employees match your search.' : 'No employees found. Register the first employee!'}
                      </td>
                    </tr>
                  ) : employees.map((emp, index) => (
                    <tr className="hover:bg-slate-50 cursor-pointer transition-colors" key={emp.id} onClick={() => navigate(`/admin/employees/${emp.id}`)}>
                      <td className="px-2.5 py-3 text-sm font-medium text-slate-400">{(page - 1) * 10 + index + 1}</td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-950 truncate max-w-[130px] lg:max-w-[170px]" title={emp.full_name}>{emp.full_name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[130px] lg:max-w-[170px]" title={emp.email}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-3"><Badge tone="blue">{emp.employee_id}</Badge></td>
                      <td className="px-2.5 py-3"><Badge tone="slate">{emp.department}</Badge></td>
                      <td className="px-2.5 py-3 text-sm text-slate-600 truncate max-w-[110px] lg:max-w-[140px]" title={emp.designation}>{emp.designation}</td>
                      <td className="px-2.5 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-2.5 py-3"><Badge tone={emp.is_active ? 'green' : 'red'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-2.5 py-3">
                        <div className="flex gap-1.5">
                          <button
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition whitespace-nowrap"
                            onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}
                            type="button"
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition whitespace-nowrap ${emp.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            onClick={(e) => { e.stopPropagation(); toggleStatus(emp); }}
                            type="button"
                          >
                            <Power size={13} /> {emp.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                <span>Page {page}</span>
                <div className="flex gap-2">
                  <button className={buttonClass.outline} disabled={!meta.previous} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Previous</button>
                  <button className={buttonClass.outline} disabled={!meta.next} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription className="sr-only">
              Modify the profile details, department, designation, or update password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID">
                <input
                  className={inputClass}
                  name="employee_id"
                  onChange={handleEditChange}
                  required
                  value={editForm.employee_id}
                />
              </Field>
              <Field label="Full Name">
                <input
                  className={inputClass}
                  name="full_name"
                  onChange={handleEditChange}
                  required
                  value={editForm.full_name}
                />
              </Field>
              <Field label="Email Address">
                <input
                  className={inputClass}
                  name="email"
                  onChange={handleEditChange}
                  required
                  type="email"
                  value={editForm.email}
                />
              </Field>
              <Field label="Department">
                <select
                  className={inputClass}
                  name="department"
                  onChange={handleEditChange}
                  required
                  value={editForm.department}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </Field>
              <Field label="Designation">
                <select
                  className={inputClass}
                  name="designation"
                  onChange={handleEditChange}
                  required
                  value={editForm.designation}
                >
                  <option value="">Select Designation</option>
                  {designations.map((desg) => (
                    <option key={desg} value={desg}>{desg}</option>
                  ))}
                </select>
              </Field>
              <div className="hidden sm:block" />
              <Field label="New Password (optional)">
                <input
                  className={inputClass}
                  name="password"
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                  type="password"
                  value={editForm.password}
                />
              </Field>
              <Field label="Confirm New Password">
                <input
                  className={inputClass}
                  name="confirm_password"
                  onChange={handleEditChange}
                  placeholder="Confirm new password"
                  type="password"
                  value={editForm.confirm_password}
                />
              </Field>
            </div>

            {editError && (
              <div className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {editError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <button
                className={buttonClass.outline}
                onClick={() => setIsEditOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={buttonClass.admin}
                disabled={saving}
                type="submit"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeeList;
