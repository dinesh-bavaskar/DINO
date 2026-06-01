import API from './api';

export const adminLogin = (data) => API.post('/auth/admin-login/', data);
export const employeeLogin = (data) => API.post('/auth/employee-login/', data);
export const getProfile = () => API.get('/profile/');
export const getEmployees = () => API.get('/employees/');
export const registerEmployee = (data) => API.post('/employees/register/', data);
export const getStats = () => API.get('/employees/stats/');

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
};
