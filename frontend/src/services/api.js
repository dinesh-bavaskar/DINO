import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

const authKeys = ['access_token', 'refresh_token', 'user_info'];

const getStoredItem = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);

const setStoredItem = (key, value) => {
  const storage = localStorage.getItem(key) ? localStorage : sessionStorage;
  storage.setItem(key, value);
};

const clearAuthStorage = () => {
  authKeys.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = getStoredItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getStoredItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh });
          setStoredItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return API(original);
        } catch {
          clearAuthStorage();
          window.location.href = '/login';
        }
      } else {
        clearAuthStorage();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
