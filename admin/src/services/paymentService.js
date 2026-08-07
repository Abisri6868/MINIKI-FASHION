import api from './api';

export const getRefunds = () => api.get('/payment/refunds');
export const initiateRefund = (orderId, amount, reason) => api.post(`/payment/refund/${orderId}`, { amount, reason });
