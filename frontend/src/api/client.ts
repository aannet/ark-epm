import axios from 'axios';
import { clearAuth, getToken } from '../store/auth';

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000') + '/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.url === '/auth/login') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login?reason=session_expired';
    }
    if (error.response?.status === 403) {
      window.location.href = '/403';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
