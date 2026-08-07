import api from './api';

export const createRazorpayOrder = (data) => api.post('/payment/create-order', data);
export const verifyPayment = (data) => api.post('/payment/verify', data);
export const retryPayment = (orderId) => api.post(`/payment/retry/${orderId}`);
export const confirmRetryPayment = (orderId, data) => api.put(`/payment/confirm/${orderId}`, data);
export const getPaymentHistory = () => api.get('/payment/history');
