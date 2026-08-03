import api from './api';

export const getProductReviews = (productId) => api.get(`/reviews/product/${productId}`);
export const createReview = (formData) =>
  api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
