import axios from 'axios';
import { API_BASE_URL } from '../config';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../utils/apiError';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Check if it's our backend ApiResponse wrapper
        const isWrapped = response.data &&
            typeof response.data === 'object' &&
            'success' in response.data &&
            'data' in response.data;

        if (isWrapped) {
            const unwrappedData = response.data.data;

            // Avoid duplicate popups: success toasts are opt-in per request.
            const method = response.config.method?.toLowerCase();
            const shouldShowSuccessToast = Boolean(response.config?.meta?.showSuccessToast);
            if (
                shouldShowSuccessToast &&
                response.data.success &&
                response.data.message &&
                method !== 'get' &&
                method !== 'options'
            ) {
                toast.success(response.data.message);
            }

            // Replace response.data with the unwrapped content
            // This allows { data } = await api.get(...) to work as expected
            response.data = unwrappedData;
        }

        return response;
    },
    (error) => {
        const message = getApiErrorMessage(error, 'Something went wrong');

        const shouldShowErrorToast = Boolean(error.config?.meta?.showErrorToast);

        // Handle 401 Unauthorized (Expired or Invalid token)
        const requestUrl = error.config?.url || '';

        if (error.response?.status === 401 && !requestUrl.includes('/auth/login')) {
            localStorage.clear();
            // Using window.location.href for immediate redirect
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error.response?.status === 403 && shouldShowErrorToast) {
            // 403 Forbidden - Just show message, don't logout
            toast.warning("You don't have permission to perform this action.");
        } else if (error.response?.status !== 401 && shouldShowErrorToast) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
