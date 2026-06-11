import API from './api';

const withPageSize = (params = {}) => ({ page_size: 10, ...params });
const normalizeList = (response) => ({
  ...response,
  data: Array.isArray(response.data) ? response.data : response.data.results,
  meta: Array.isArray(response.data) ? null : {
    count: response.data.count,
    next: response.data.next,
    previous: response.data.previous,
  },
});

export const createTimesheet = (data) => API.post('/timesheets/', data);
export const getTodayTimesheets = () => API.get('/timesheets/today/');
export const updateTimesheet = (id, data) => API.put(`/timesheets/${id}/`, data);
export const deleteTimesheet = (id) => API.delete(`/timesheets/${id}/`);
export const getDashboardSummary = () => API.get('/dashboard-summary/');
export const setTimesheetSubmissionStatus = (id, status) => API.post(`/timesheets/${id}/submit/`, { status });
export const getAdminTimesheets = (params = {}) => API.get('/admin/timesheets/', { params: withPageSize(params) }).then(normalizeList);
export const getAdminTimesheetDetail = (id) => API.get(`/admin/timesheets/${id}/`);
export const updateAdminTimesheetDetail = (id, data) => API.put(`/admin/timesheets/${id}/`, data);
export const reviewTimesheet = (id, data) => API.post(`/admin/timesheets/${id}/review/`, data);
export const getProjects = () => API.get('/projects/');
export const getAdminProjects = () => API.get('/admin/projects/');
export const createProject = (data) => API.post('/admin/projects/', data);
export const updateProject = (id, data) => API.patch(`/admin/projects/${id}/`, data);
export const deleteProject = (id) => API.delete(`/admin/projects/${id}/`);
export const getMilestonesByProject = (projectId) => API.get('/milestones/', { params: { project_id: projectId } });
export const getAdminMilestones = (params = {}) => API.get('/admin/milestones/', { params });
export const createMilestone = (data) => API.post('/admin/milestones/', data);
export const updateMilestone = (id, data) => API.patch(`/admin/milestones/${id}/`, data);
export const deleteMilestone = (id) => API.delete(`/admin/milestones/${id}/`);
