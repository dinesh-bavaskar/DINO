import API from './api';

const normalizeList = (response) => ({
  ...response,
  data: Array.isArray(response.data) ? response.data : response.data.results,
  meta: Array.isArray(response.data) ? null : {
    count: response.data.count,
    next: response.data.next,
    previous: response.data.previous,
  },
});

export const adminLogin = (data) => API.post('/auth/admin-login/', data);
export const employeeLogin = (data) => API.post('/auth/employee-login/', data);
export const getProfile = () => API.get('/profile/');
export const getEmployees = (params = {}) => API.get('/employees/', { params: { page_size: 10, ...params } }).then(normalizeList);
export const registerEmployee = (data) => API.post('/employees/register/', data);
export const updateEmployeeStatus = (id, is_active) => API.patch(`/employees/${id}/status/`, { is_active });
export const getStats = () => API.get('/employees/stats/');

export const logout = () => {
  ['access_token', 'refresh_token', 'user_info'].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};
