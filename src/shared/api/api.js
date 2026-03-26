import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.50.109.251:8000/api/v1';

/**
 * Axios instance with interceptors
 * Unicorn-level API layer with automatic token refresh
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 & refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// WebSocket connection helper
export const createWebSocket = (endpoint) => {
  const token = localStorage.getItem('access_token');
  // Convert http to ws and remove /api/v1 from the base URL
  const baseUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api/v1', '');
  const wsUrl = token
    ? `${baseUrl}${endpoint}?token=${token}`
    : `${baseUrl}${endpoint}`;
  console.log('WebSocket connecting to:', wsUrl);
  return new WebSocket(wsUrl);
};

export { api, API_BASE_URL };
export default api;
