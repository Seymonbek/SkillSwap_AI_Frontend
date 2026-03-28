import axios from 'axios';
import { clearStoredAuth, isTokenValid, redirectToLogin } from '@/shared/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.50.109.251:8000/api/v1';
const WS_BASE_URL = import.meta.env.VITE_WS_URL;
const DEBUG_WEBSOCKETS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_WS === 'true';
let refreshPromise = null;

const normalizeRequestPath = (url = '') => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
};

const isPublicAuthRequest = (config = {}) => {
  const method = String(config.method || 'get').toLowerCase();
  const path = normalizeRequestPath(config.url);

  if (path === '/auth/jwt/create/' && method === 'post') return true;
  if (path === '/auth/jwt/refresh/' && method === 'post') return true;
  if (path === '/auth/jwt/verify/' && method === 'post') return true;
  if (path === '/auth/jwt/2fa/verify/' && method === 'post') return true;
  if (path === '/auth/users/' && method === 'post') return true;
  if (path === '/auth/users/activation/' && method === 'post') return true;
  if (path === '/auth/users/resend_activation/' && method === 'post') return true;
  if (path === '/auth/users/reset_password/' && method === 'post') return true;
  if (path === '/auth/users/reset_password_confirm/' && method === 'post') return true;
  if (path === '/auth/users/reset_email/' && method === 'post') return true;
  if (path === '/auth/users/reset_email_confirm/' && method === 'post') return true;

  return false;
};

const getRefreshAccessToken = async () => {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken || !isTokenValid(refreshToken)) {
      throw new Error('No valid refresh token');
    }

    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/jwt/refresh/`, { refresh: refreshToken })
      .then((response) => {
        const { access, refresh: nextRefreshToken } = response.data;
        localStorage.setItem('access_token', access);
        if (nextRefreshToken) {
          localStorage.setItem('refresh_token', nextRefreshToken);
        }
        return access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

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
  async (config) => {
    if (isPublicAuthRequest(config)) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    }

    let token = localStorage.getItem('access_token');
    if (token && !isTokenValid(token)) {
      token = null;
    }

    if (!token) {
      try {
        token = await getRefreshAccessToken();
      } catch (refreshError) {
        clearStoredAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
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

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        const access = await getRefreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const normalizeSocketEndpoint = (endpoint) => {
  if (!endpoint) {
    return '/';
  }

  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

const getWebSocketBaseUrl = () => {
  if (WS_BASE_URL) {
    return WS_BASE_URL.replace(/\/$/, '');
  }

  try {
    const apiUrl = new URL(API_BASE_URL);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${apiUrl.host}`;
  } catch {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }

    return '';
  }
};

// WebSocket connection helper
export const createWebSocket = (endpoint) => {
  const token = localStorage.getItem('access_token');
  const socketEndpoint = normalizeSocketEndpoint(endpoint);
  const baseUrl = getWebSocketBaseUrl();
  const wsUrl = new URL(`${baseUrl}${socketEndpoint}`);

  if (token) {
    wsUrl.searchParams.set('token', token);
  }

  if (DEBUG_WEBSOCKETS) {
    console.log('WebSocket connecting to:', `${wsUrl.origin}${wsUrl.pathname}`);
  }

  return new WebSocket(wsUrl.toString());
};

export { api, API_BASE_URL };
export default api;
