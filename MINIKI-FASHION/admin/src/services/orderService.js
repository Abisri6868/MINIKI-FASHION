import api from './api';

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status, note) => api.put(`/orders/${id}/status`, { status, note });
export const getDashboardStats = () => api.get('/orders/stats/dashboard');
