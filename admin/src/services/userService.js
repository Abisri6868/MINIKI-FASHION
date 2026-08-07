import api from './api';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const toggleUserStatus = (id) => api.put(`/users/${id}/status`);
