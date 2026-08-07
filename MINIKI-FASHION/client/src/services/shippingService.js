import api from './api';

export const getShippingSettings = () => api.get('/shipping-settings');
export const estimateDelivery = (pincode, method = 'Standard') =>
  api.get('/shipping-settings/estimate', { params: { pincode, method } });
