import api from './api';

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const acceptOrder = (id) => api.put(`/orders/${id}/accept`);
export const rejectOrder = (id, reason) => api.put(`/orders/${id}/reject`, { reason });
export const updateOrderStatus = (id, status, note) => api.put(`/orders/${id}/status`, { status, note });
export const triggerAutoProgress = () => api.post('/orders/auto-progress');
export const getDashboardStats = () => api.get('/orders/stats/dashboard');

export const invoiceDownloadUrl = (orderId, token) =>
  `${api.defaults.baseURL}/invoices/${orderId}`;
export const shippingLabelUrl = (orderId) =>
  `${api.defaults.baseURL}/shipping-labels/${orderId}`;
export const updateShippingLabel = (orderId, payload) => api.put(`/shipping-labels/${orderId}`, payload);
