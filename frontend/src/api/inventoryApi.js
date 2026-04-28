import api from './axios';

export const convertStock = (data) => api.post('/inventory/convert', data);
