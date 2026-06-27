import { useState, useEffect, useRef } from 'react';
import { getTimesheetHistory } from '../services/timesheetService';

export const useEmployeeDashboardData = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    getTimesheetHistory()
      .then((res) => {
        setHistory(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { history, loading };
};
