import api from './axios';

export const getCustomers = (params) => api.get('/credit-customers', { params });
export const getCustomer = (id) => api.get(`/credit-customers/${id}`);
export const createCustomer = (data) => api.post('/credit-customers', data);
export const updateCustomer = (id, data) => api.put(`/credit-customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/credit-customers/${id}`);
export const addPayment = (id, data) => api.post(`/credit-customers/${id}/payments`, data);
export const getCustomerBalance = (id) => api.get(`/credit-customers/${id}/balance`);
export const getCustomerPayments = (id) => api.get(`/credit-customers/${id}/ledger`);
export const getCustomerSales = (id) => api.get(`/credit-customers/${id}/sales`);
export const getCreditCustomerSummary = (id) => api.get(`/credit-customers/${id}/summary`);
export const getCustomerInvoices = (id, params) => api.get(`/credit-customers/${id}/transactions`, { params });

export const getCreditCustomersSummary = () => api.get('/credit-customers/summary');
export const calculateCustomerRisk = (id) => api.post(`/credit-customers/${id}/calculate-risk`);

// Alias
export const getCreditCustomers = getCustomers;
