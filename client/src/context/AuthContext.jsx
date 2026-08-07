import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('miniki_token');
      if (token) {
        try {
          const { data } = await authService.getMe();
          setUser(data.user);
        } catch (err) {
          localStorage.removeItem('miniki_token');
          localStorage.removeItem('miniki_user');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('miniki_token', data.token);
    localStorage.setItem('miniki_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authService.register(formData);
    localStorage.setItem('miniki_token', data.token);
    localStorage.setItem('miniki_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success('Account created successfully!');
    return data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      /* ignore */
    }
    localStorage.removeItem('miniki_token');
    localStorage.removeItem('miniki_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('miniki_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
