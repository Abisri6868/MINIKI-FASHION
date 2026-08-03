import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('miniki_admin_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.user.role === 'admin') {
            setAdmin(data.user);
          } else {
            localStorage.removeItem('miniki_admin_token');
          }
        } catch (err) {
          localStorage.removeItem('miniki_admin_token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem('miniki_admin_token', data.token);
    setAdmin(data.user);
    toast.success(`Welcome, ${data.user.name}`);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      /* ignore */
    }
    localStorage.removeItem('miniki_admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
