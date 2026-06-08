import Sidebar from '../components/common/Sidebar';
import EmployeeSidebar from '../components/common/EmployeeSidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isEmployee ? <EmployeeSidebar /> : <Sidebar />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
