import api from './axios';

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const markOrderAudited = (id) => api.patch(`/orders/${id}/audit`);
export const addOrderItem = (id, data) => api.post(`/orders/${id}/items`, data);
export const getOrderItems = (id) => api.get(`/orders/${id}/items`);
export const confirmOrder = (id) => api.put(`/orders/${id}/confirm`);
