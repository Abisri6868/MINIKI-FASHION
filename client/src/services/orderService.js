import api from './api';

export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/my-orders');
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id, reason) => api.put(`/orders/${id}/cancel`, { reason });
export const reorderItems = (id) => api.post(`/orders/${id}/reorder`);

export const downloadInvoice = async (orderId, orderNumber) => {
  const res = await api.get(`/invoices/${orderId}`, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', `invoice-${orderNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
