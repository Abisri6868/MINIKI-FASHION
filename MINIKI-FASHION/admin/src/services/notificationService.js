import api from './api';

export const getNotifications = () => api.get('/notifications');
export const markAllNotificationsRead = () => api.put('/notifications/read-all');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
