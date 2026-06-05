/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const authKeys = ['access_token', 'refresh_token', 'user_info'];

const getStoredItem = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);

const clearAuthStorage = () => {
  authKeys.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

const getStoredUser = () => {
  const stored = getStoredItem('user_info');
  const token = getStoredItem('access_token');
  return stored && token ? JSON.parse(stored) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const loading = false;

  const login = (tokens, remember = false) => {
    clearAuthStorage();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('access_token', tokens.access);
    storage.setItem('refresh_token', tokens.refresh);
    const info = {
      role: tokens.role,
      full_name: tokens.full_name,
      employee_id: tokens.employee_id,
    };
    storage.setItem('user_info', JSON.stringify(info));
    setUser(info);
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
