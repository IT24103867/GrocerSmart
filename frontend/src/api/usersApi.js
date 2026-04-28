import api from './axios';

const assertValidId = (id) => {
	if (!id || id === 'undefined' || id === 'null') {
		throw new Error('Invalid user identifier');
	}
};

export const login = (data) => api.post('/auth/login', data);
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => {
	assertValidId(id);
	return api.get(`/users/${id}`);
};
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => {
	assertValidId(id);
	return api.put(`/users/${id}`, data);
};
export const deleteUser = (id) => {
	assertValidId(id);
	return api.delete(`/users/${id}`);
};
export const activateUser = (id) => {
	assertValidId(id);
	return api.patch(`/users/${id}/activate`);
};
export const deactivateUser = (id) => {
	assertValidId(id);
	return api.patch(`/users/${id}/deactivate`);
};
export const getSystemStatus = () => api.get('/auth/status');
