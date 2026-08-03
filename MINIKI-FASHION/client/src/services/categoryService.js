import api from './api';

export const getCategories = () => api.get('/categories');
export const getCategory = (idOrSlug) => api.get(`/categories/${idOrSlug}`);
