import axios from './axios';

export const resetSystem = (confirmText) => axios.post('/admin/reset-system', { confirm: confirmText });
