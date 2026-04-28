import api from './axios';

export const getCheques = (params) => api.get('/cheques', { params });
export const getCheque = (id) => api.get(`/cheques/${id}`);
export const createCheque = (data) => api.post('/cheques', data);
export const updateCheque = (id, data) => api.put(`/cheques/${id}`, data);
export const updateChequeStatus = (id, data) => api.put(`/cheques/${id}/status`, data);
export const deleteCheque = (id) => api.delete(`/cheques/${id}`);
export const getChequesSummary = () => api.get('/cheques/summary');
