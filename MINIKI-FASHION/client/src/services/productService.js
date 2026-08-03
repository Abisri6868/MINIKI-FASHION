import api from './api';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (idOrSlug) => api.get(`/products/${idOrSlug}`);
export const getFeaturedProducts = () => api.get('/products/collections/featured');
export const getNewArrivals = () => api.get('/products/collections/new-arrivals');
export const getBestSellers = () => api.get('/products/collections/best-sellers');
