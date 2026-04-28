import api from './axios';

export const getCashierPermissions = () => api.get('/admin/permissions/cashier');
export const updateCashierPermission = (moduleKey, allowed) => api.put(`/admin/permissions/cashier/${moduleKey}`, { allowed });
export const bulkUpdateCashierPermissions = (permissions) => api.put('/admin/permissions/cashier', { permissions });
