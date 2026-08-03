import api from './api';

export const applyCoupon = (code, cartTotal) => api.post('/coupons/apply', { code, cartTotal });
