import { useState, useEffect, useRef } from 'react';
import { getStats } from '../services/authService';
import { getAdminTimesheets, getAdminProjects, getAdminMilestones } from '../services/timesheetService';

export const useAdminDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, departments: 0 });
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [todayTimesheets, setTodayTimesheets] = useState([]);
  const [weekTimesheets, setWeekTimesheets] = useState([]);
  const [monthTimesheets, setMonthTimesheets] = useState([]);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`;

    Promise.all([
      getStats(),
      getAdminProjects(),
      getAdminMilestones(),
      getAdminTimesheets({ date: todayStr, page_size: 1000 }),
      getAdminTimesheets({ date: weekStartStr, dateTo: todayStr, page_size: 2000 }),
      getAdminTimesheets({ date: monthStartStr, dateTo: todayStr, page_size: 5000 })
    ])
      .then(([sRes, pRes, mRes, tToday, tWeek, tMonth]) => {
        setStats(sRes.data);
        setProjects(pRes.data?.data ?? pRes.data ?? []);
        setMilestones(mRes.data?.data ?? mRes.data ?? []);
        setTodayTimesheets(tToday.data || []);
        setWeekTimesheets(tWeek.data || []);
        setMonthTimesheets(tMonth.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return {
    loading,
    stats,
    projects,
    milestones,
    todayTimesheets,
    weekTimesheets,
    monthTimesheets
  };
};
