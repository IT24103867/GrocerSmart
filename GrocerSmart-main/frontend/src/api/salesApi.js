import axios from './axios';

// Sales Records (Header)
export const getSales = (params) => axios.get('/sales', { params });
export const getSale = (id) => axios.get(`/sales/${id}`);
export const createSale = (data) => axios.post('/sales', data);
export const updateSale = (id, data) => axios.put(`/sales/${id}`, data);
export const deleteSale = (id) => axios.delete(`/sales/${id}`);
export const confirmSale = (id) => axios.put(`/sales/${id}/confirm`);

// Analytics
export const getDailySalesStats = (from, to) => axios.get('/sales/analytics/daily', { params: { from, to } });
export const getTopProductsStats = (from, to, limit) => axios.get('/sales/analytics/top-products', { params: { from, to, limit } });

// Alias for compatibility
export const getTopProducts = getTopProductsStats;
