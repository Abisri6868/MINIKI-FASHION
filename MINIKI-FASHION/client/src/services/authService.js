import api from './api';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const addAddress = (data) => api.post('/auth/address', data);
export const updateAddress = (id, data) => api.put(`/auth/address/${id}`, data);
export const deleteAddress = (id) => api.delete(`/auth/address/${id}`);
