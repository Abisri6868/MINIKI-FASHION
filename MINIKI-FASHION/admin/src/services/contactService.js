import api from './api';

export const getMessages = (params) => api.get('/contact', { params });
export const markMessageRead = (id) => api.put(`/contact/${id}/read`);
export const replyToMessage = (id, reply) => api.post(`/contact/${id}/reply`, { reply });
export const deleteMessage = (id) => api.delete(`/contact/${id}`);
