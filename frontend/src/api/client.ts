import axios from 'axios';
import { clearAuth, getToken, setAuth } from '../store/auth';
import { refreshToken } from './auth';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.config?.url === '/auth/login' || error.config?.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResult = await refreshToken();
        
        if (refreshResult.success && refreshResult.data) {
          setAuth(refreshResult.data.accessToken, refreshResult.data.user);
          onTokenRefreshed(refreshResult.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${refreshResult.data.accessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        clearAuth();
        window.location.href = '/login?reason=session_expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      const token = getToken();
      if (token) {
        clearAuth();
        window.location.href = '/login?reason=session_expired';
      } else {
        window.location.href = '/401';
      }
    }

    if (error.response?.status === 403) {
      window.location.href = '/403';
    }

    return Promise.reject(error);
  },
);

export default apiClient;
