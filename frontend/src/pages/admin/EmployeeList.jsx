import { useEffect, useState } from 'react';
import { Power, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Badge } from '../../components/ui';
import { buttonClass, inputClass } from '../../components/uiClasses';
import { getEmployees, updateEmployeeStatus } from '../../services/authService';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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

  return (
    <DashboardLayout>
      <Navbar title="Employee Management" subtitle={`${meta?.count ?? employees.length} employees total`} />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Employees</h2>
            <p className="text-sm text-slate-500">Search, add, and review team records.</p>
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
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['#', 'Employee', 'Employee ID', 'Department', 'Designation', 'Joined', 'Status', 'Action'].map((header) => (
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400" key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td className="px-4 py-14 text-center text-sm text-slate-400" colSpan={8}>
                        <Users className="mx-auto mb-3 opacity-30" size={40} />
                        {search ? 'No employees match your search.' : 'No employees found. Register the first employee!'}
                      </td>
                    </tr>
                  ) : employees.map((emp, index) => (
                    <tr className="hover:bg-slate-50" key={emp.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-400">{(page - 1) * 10 + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge tone="blue">{emp.employee_id}</Badge></td>
                      <td className="px-4 py-3"><Badge tone="slate">{emp.department}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{emp.designation}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3"><Badge tone={emp.is_active ? 'green' : 'red'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-4 py-3">
                        <button
                          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${emp.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          onClick={() => toggleStatus(emp)}
                          type="button"
                        >
                          <Power size={14} /> {emp.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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
    </DashboardLayout>
  );
};

export default EmployeeList;
