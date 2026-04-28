import api from './axios';

export const convertStock = (data) => api.post('/inventory/convert', data);
// Updated by IT24104054
