import api from './api';

export const getShippingSettings = () => api.get('/shipping-settings');
export const updateShippingSettings = (payload) => api.put('/shipping-settings', payload);
export const upsertPincodeRule = (payload) => api.post('/shipping-settings/pincode', payload);
export const deletePincodeRule = (pincode) => api.delete(`/shipping-settings/pincode/${pincode}`);
