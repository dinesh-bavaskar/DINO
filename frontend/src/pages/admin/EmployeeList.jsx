import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { getEmployees } from '../../services/authService';
import { Search, Users } from 'lucide-react';

const avatarColors = ['#1D6EF5', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0EA5E9', '#DB2777'];

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getEmployees()
      .then(res => {
        setEmployees(res.data);
        setFiltered(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearch(q);
    setFiltered(employees.filter(emp =>
      emp.full_name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q)
    ));
  };

  return (
    <DashboardLayout>
      <Navbar title="Employee List" subtitle={`${employees.length} employees total`} />

      <div style={{ padding: '28px', animation: 'fadeIn 0.4s ease' }}>
        {/* Header Row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', flexWrap: 'wrap', gap: '14px',
        }}>
          <div>
            <p className="section-title">All Employees</p>
            <p className="section-subtitle">Browse and manage all team members</p>
          </div>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F4',
            borderRadius: '10px',
            padding: '10px 16px',
            minWidth: '260px',
            boxShadow: '0 1px 4px rgba(29,110,245,0.06)',
            transition: 'border-color 0.2s',
          }}>
            <Search size={15} color="#94A3B8" />
            <input
              id="employee-search"
              type="text"
              placeholder="Search by name, ID, department..."
              value={search}
              onChange={handleSearch}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#0F172A', fontSize: '13px',
                fontFamily: 'Inter, sans-serif', width: '100%',
              }}
            />
          </div>
        </div>

        {loading ? (
          <Loader text="Loading employees..." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '56px', color: '#94A3B8' }}>
                      <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                      {search ? 'No employees match your search.' : 'No employees found. Register the first employee!'}
                    </td>
                  </tr>
                ) : filtered.map((emp, idx) => (
                  <tr key={emp.id}>
                    <td style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px',
                          background: avatarColors[idx % avatarColors.length],
                          borderRadius: '9px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                        }}>
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{emp.full_name}</p>
                          <p style={{ fontSize: '11px', color: '#94A3B8' }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{emp.employee_id}</span></td>
                    <td>
                      <span style={{
                        background: '#F0F4FC',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        {emp.department}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{emp.designation}</td>
                    <td style={{ color: '#94A3B8', fontSize: '12px' }}>
                      {new Date(emp.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {emp.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeList;
