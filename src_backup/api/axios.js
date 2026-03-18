import axios from 'axios';

const BASE_URL = 'http://13.50.109.251:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Перед каждым запросом достаем токен и суем в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Если ответ пришел с ошибкой 401 (Токен протух) — обновляем его
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если 401 и мы еще не пытались обновить токен (_retry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post(`${BASE_URL}/auth/jwt/refresh/`, { refresh: refreshToken });
        
        // Сохраняем новый
        localStorage.setItem('access_token', res.data.access);
        
        // Повторяем запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (err) {
        // Если refresh тоже протух — выкидываем из аккаунта
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);