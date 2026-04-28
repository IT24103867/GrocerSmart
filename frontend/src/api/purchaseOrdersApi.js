import api from './axios';

export const getPOs = (params) => api.get('/purchase-orders', { params });
export const createPO = (data) => api.post('/purchase-orders', data);
export const addItem = (id, data) => api.post(`/purchase-orders/${id}/items`, data);
export const getItems = (id) => api.get(`/purchase-orders/${id}/items`);
export const receivePO = (id) => api.put(`/purchase-orders/${id}/receive`);
