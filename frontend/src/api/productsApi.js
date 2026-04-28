import api from './axios';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const searchProductById = (id) => api.get(`/products/search`, { params: { id } });
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const importCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/bulk-import', formData);
};

export const getProductDemandForecast = (productId) => api.get(`/orders/products/${productId}/forecast`);
// Updated by IT24104054
