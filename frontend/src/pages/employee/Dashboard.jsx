import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import DashboardCards from '../../components/employee/DashboardCards';
import TimesheetTable from '../../components/employee/TimesheetTable';
import { buttonClass } from '../../components/uiClasses';
import { getDashboardSummary, getTodayTimesheets } from '../../services/timesheetService';

const EmployeeDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getTodayTimesheets()])
      .then(([summaryRes, entriesRes]) => {
        setSummary(summaryRes.data);
        setEntries(entriesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Navbar title="Employee Dashboard" subtitle="Track today's work progress" />
      <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-7">
        {loading ? <Loader /> : (
          <div className="space-y-6">
            <DashboardCards summary={summary} />
            {summary?.remaining_hours > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                You have {summary.remaining_hours} hours remaining to complete today's 8 hour target.
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Today's Timesheet</h2>
                <p className="text-sm text-slate-500">Latest entries for the current day.</p>
              </div>
              <div className="flex gap-2">
                <Link className={buttonClass.primary} to="/employee/timesheet"><Table2 size={16} /> Open Timesheet</Link>
              </div>
            </div>
            <TimesheetTable entries={entries.slice(0, 5)} emptyText="No work logs added today." />
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
