import axios from './axios';

// Users
export const getDeletedUsers = () => axios.get('/trash/users');
export const restoreUser = (id) => axios.post(`/trash/users/${id}/restore`);
export const deleteUserPermanent = (id) => axios.delete(`/trash/users/${id}/permanent`);

// Products
export const getDeletedProducts = () => axios.get('/trash/products');
export const restoreProduct = (id) => axios.post(`/trash/products/${id}/restore`);
export const deleteProductPermanent = (id) => axios.delete(`/trash/products/${id}/permanent`);

// Suppliers
export const getDeletedSuppliers = () => axios.get('/trash/suppliers');
export const restoreSupplier = (id) => axios.post(`/trash/suppliers/${id}/restore`);
export const deleteSupplierPermanent = (id) => axios.delete(`/trash/suppliers/${id}/permanent`);

// Credit Customers
export const getDeletedCustomers = () => axios.get('/trash/credit-customers');
export const restoreCustomer = (id) => axios.post(`/trash/credit-customers/${id}/restore`);
export const deleteCustomerPermanent = (id) => axios.delete(`/trash/credit-customers/${id}/permanent`);

// Orders
export const getDeletedOrders = () => axios.get('/trash/orders');
export const restoreOrder = (id) => axios.post(`/trash/orders/${id}/restore`);
export const deleteOrderPermanent = (id) => axios.delete(`/trash/orders/${id}/permanent`);

// Sales
export const getDeletedSales = () => axios.get('/trash/sales');
export const restoreSale = (id) => axios.post(`/trash/sales/${id}/restore`);
export const deleteSalePermanent = (id) => axios.delete(`/trash/sales/${id}/permanent`);

// Cheques
export const getDeletedCheques = () => axios.get('/trash/cheques');
export const restoreCheque = (id) => axios.post(`/trash/cheques/${id}/restore`);
export const deleteChequePermanent = (id) => axios.delete(`/trash/cheques/${id}/permanent`);
