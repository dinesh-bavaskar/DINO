import { useEffect, useState } from 'react';
import { Power, Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
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
import { getEmployees, updateEmployeeStatus, updateEmployee, deleteEmployee } from '../../services/authService';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const EmployeeList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [empToDelete, setEmpToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle modal states
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [empToToggle, setEmpToToggle] = useState(null);

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
        .catch(() => toast.error('Failed to load employees'))
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
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const promptToggleStatus = (emp) => {
    setEmpToToggle(emp);
    setIsToggleOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!empToToggle) return;
    try {
      await updateEmployeeStatus(empToToggle.id, !empToToggle.is_active);
      toast.success(`Employee ${empToToggle.is_active ? 'deactivated' : 'activated'} successfully`);
      setIsToggleOpen(false);
      setEmpToToggle(null);
      loadEmployees();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const promptDelete = (emp) => {
    if (user?.employee_id === emp.employee_id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setEmpToDelete(emp);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!empToDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(empToDelete.id);
      toast.success('Employee deleted successfully');
      setIsDeleteOpen(false);
      setEmpToDelete(null);
      loadEmployees();
    } catch (err) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
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
    setProfilePhoto(null);
    setRemovePhoto(false);
    setProfilePhotoPreview(emp.profile_photo ? (emp.profile_photo.startsWith('http') ? emp.profile_photo : `http://127.0.0.1:8000${emp.profile_photo}`) : null);
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
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

    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setRemovePhoto(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editForm.password || editForm.confirm_password) {
      if (editForm.password !== editForm.confirm_password) {
        toast.error('Passwords do not match.');
        return;
      }
      if (editForm.password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', editForm.employee_id.trim());
      formData.append('full_name', editForm.full_name.trim());
      formData.append('email', editForm.email.trim());
      formData.append('department', editForm.department);
      formData.append('designation', editForm.designation);
      if (editForm.password) {
        formData.append('password', editForm.password);
        formData.append('confirm_password', editForm.confirm_password);
      }
      
      if (removePhoto) {
        formData.append('profile_photo', '');
      } else if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }

      await updateEmployee(selectedEmp.id, formData);
      setIsEditOpen(false);
      toast.success('Employee updated successfully');
      loadEmployees();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        toast.error(
          Object.entries(errData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
            .join('\n')
        );
      } else {
        toast.error('Failed to save employee changes.');
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
            <h2 className="text-xl font-semibold text-slate-950">Employees</h2>
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
                <thead className="bg-blue-900 border-b border-blue-950 relative z-10 shadow-sm">
                  <tr>
                    <th className="w-20 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">ID</th>
                    <th className="w-64 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Employee</th>
                    <th className="w-32 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Department</th>
                    <th className="w-40 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Designation</th>
                    <th className="w-28 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Joined</th>
                    <th className="w-28 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Status</th>
                    <th className="w-40 px-2.5 py-3 text-left text-xs font-medium uppercase tracking-wide text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {employees.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-14 text-center text-sm text-slate-400" colSpan={7}>
                        <Users className="mx-auto mb-3 opacity-30" size={40} />
                        {search ? 'No employees match your search.' : 'No employees found. Register the first employee!'}
                      </td>
                    </tr>
                  ) : employees.map((emp, index) => (
                    <tr className="hover:bg-slate-50 cursor-pointer transition-colors" key={emp.id} onClick={() => navigate(`/admin/employees/${emp.id}`)}>
                      <td className="px-2.5 py-3 text-sm text-slate-700 font-medium">{emp.employee_id}</td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-semibold text-white overflow-hidden">
                            {emp?.profile_photo && typeof emp.profile_photo === 'string' ? (
                              <img src={emp.profile_photo.startsWith('http') ? emp.profile_photo : `http://127.0.0.1:8000${emp.profile_photo}`} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (emp?.full_name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-950 truncate max-w-[130px] lg:max-w-[170px]" title={emp.full_name}>{emp.full_name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[130px] lg:max-w-[170px]" title={emp.email}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 text-sm text-slate-600">{emp.department}</td>
                      <td className="px-2.5 py-3 text-sm text-slate-600 truncate max-w-[110px] lg:max-w-[140px]" title={emp.designation}>{emp.designation}</td>
                      <td className="px-2.5 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); promptToggleStatus(emp); }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${emp.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                          <span className={`text-xs font-semibold ${emp.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {emp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
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
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition whitespace-nowrap"
                            onClick={(e) => { e.stopPropagation(); promptDelete(emp); }}
                            type="button"
                          >
                            <Trash2 size={13} /> Delete
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <button
              className={buttonClass.outline}
              onClick={() => setIsDeleteOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`${buttonClass.admin} !bg-red-600 hover:!bg-red-700`}
              disabled={deleting}
              onClick={confirmDelete}
              type="button"
            >
              {deleting ? 'Deleting...' : 'Permanent Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Employee Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to {empToToggle?.is_active ? 'deactivate' : 'activate'} this employee?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <button
              className={buttonClass.outline}
              onClick={() => setIsToggleOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={buttonClass.admin}
              onClick={confirmToggleStatus}
              type="button"
            >
              Yes, Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="mb-6 flex flex-col items-center sm:flex-row sm:items-start gap-5 border-b border-slate-100 pb-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-blue-900 text-2xl font-semibold text-white shadow-sm">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  (editForm.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h3 className="text-sm font-semibold text-slate-900">Profile Photo</h3>
                <div className="flex justify-center sm:justify-start gap-2">
                  <label className={`${buttonClass.outline} cursor-pointer !min-h-8 !py-1 !px-3 !text-xs`}>
                    Change Photo
                    <input type="file" className="hidden" accept="image/jpeg, image/png, image/jpg" onChange={handlePhotoChange} />
                  </label>
                  {profilePhotoPreview && (
                    <button type="button" className={`${buttonClass.ghost} !min-h-8 !py-1 !px-3 !text-xs text-red-600 hover:bg-red-50 hover:text-red-700`} onClick={handleRemovePhoto}>
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-1">JPG, JPEG, or PNG. Max 5MB.</p>
              </div>
            </div>

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
