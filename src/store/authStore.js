import { create } from 'zustand';
import { api } from '../api/axios';
import { validators, formatApiError } from '../utils/validators';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  success: null,
  validationErrors: {},

  // =================== JWT ===================

  // POST /auth/jwt/create/
  login: async (email, password) => {
    // Client-side validation
    const emailError = validators.email(email);
    if (emailError) {
      set({ error: emailError, isLoading: false });
      return false;
    }
    if (!password) {
      set({ error: 'Parol kiritilishi kerak', isLoading: false });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/jwt/create/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      set({ isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      const errorMsg = formatApiError(error.response?.data) || "Noto'g'ri email yoki parol";
      set({
        isLoading: false,
        error: errorMsg
      });
      return false;
    }
  },

  // =================== USER ME ===================

  // GET /auth/users/me/
  fetchUser: async () => {
    try {
      const res = await api.get('/auth/users/me/');
      set({ user: res.data });
    } catch (error) {
      console.error("Profilni yuklashda xatolik", error);
    }
  },

  // PUT/PATCH /auth/users/me/
  updateProfile: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.patch('/auth/users/me/', data);
      set({ user: res.data, isLoading: false, success: 'Profil yangilandi!' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return null;
    }
  },

  // DELETE /auth/users/me/ — O'z hisobini o'chirish
  deleteMyAccount: async (current_password) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/auth/users/me/', { data: { current_password } });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.response?.data?.current_password?.[0] || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // =================== USER {id} ===================

  // GET /auth/users/{id}/
  fetchUserById: async (id) => {
    try {
      const res = await api.get(`/auth/users/${id}/`);
      return res.data;
    } catch (err) {
      console.error('User fetch error:', err);
      return null;
    }
  },

  // PUT /auth/users/{id}/
  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/auth/users/${id}/`, data);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return null;
    }
  },

  // DELETE /auth/users/{id}/
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/auth/users/${id}/`);
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // =================== ACTIVATION ===================

  // POST /auth/users/activation/ — Akkaunt aktivatsiya
  activateAccount: async (uid, token) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/activation/', { uid, token });
      set({ isLoading: false, success: 'Akkaunt muvaffaqiyatli faollashtirildi!' });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.detail || err.response?.data?.uid?.[0] || err.response?.data?.token?.[0] || 'Aktivatsiya xatoligi',
        isLoading: false
      });
      return false;
    }
  },

  // POST /auth/users/resend_activation/ — Qayta yuborish
  resendActivation: async (email) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/resend_activation/', { email });
      set({ isLoading: false, success: 'Aktivatsiya emaili qayta yuborildi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.response?.data?.email?.[0] || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // =================== PASSWORD RESET ===================

  // POST /auth/users/reset_password/ — Parol tiklash
  resetPassword: async (email) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/reset_password/', { email });
      set({ isLoading: false, success: 'Parol tiklash havolasi emailga yuborildi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.response?.data?.email?.[0] || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // POST /auth/users/reset_password_confirm/ — Yangi parol o'rnatish
  resetPasswordConfirm: async (uid, token, new_password) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/reset_password_confirm/', { uid, token, new_password });
      set({ isLoading: false, success: 'Parol muvaffaqiyatli o\'zgartirildi!' });
      return true;
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.detail || errData?.new_password?.[0] || errData?.token?.[0] || errData?.uid?.[0] || 'Xatolik';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  // =================== EMAIL RESET ===================

  // POST /auth/users/reset_email/ — Email tiklash
  resetEmail: async (email) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/reset_email/', { email });
      set({ isLoading: false, success: 'Email tiklash havolasi yuborildi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // POST /auth/users/reset_email_confirm/
  resetEmailConfirm: async (uid, token) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/reset_email_confirm/', { uid, token });
      set({ isLoading: false, success: 'Email muvaffaqiyatli o\'zgartirildi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // POST /auth/users/set_email/ — Email o'zgartirish
  setEmail: async (new_email, current_password) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/set_email/', { new_email, current_password });
      set({ isLoading: false, success: 'Email muvaffaqiyatli yangilandi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.response?.data?.new_email?.[0] || err.response?.data?.current_password?.[0] || 'Xatolik', isLoading: false });
      return false;
    }
  },

  // =================== REGISTER ===================

  // POST /auth/users/
  register: async (email, password, re_password) => {
    // Client-side validation
    const emailError = validators.email(email);
    if (emailError) {
      set({ error: emailError, isLoading: false });
      return false;
    }

    const passwordError = validators.password(password);
    if (passwordError) {
      set({ error: passwordError, isLoading: false });
      return false;
    }

    const matchError = validators.passwordMatch(password, re_password);
    if (matchError) {
      set({ error: matchError, isLoading: false });
      return false;
    }

    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/', { email, password, re_password });
      set({ isLoading: false, success: "Ro'yxatdan o'tish muvaffaqiyatli! Emailni tekshiring." });
      return true;
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data) || "Ro'yxatdan o'tishda xatolik";
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  // POST /auth/users/set_password/
  setPassword: async (current_password, new_password) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/auth/users/set_password/', { current_password, new_password });
      set({ isLoading: false, success: 'Parol muvaffaqiyatli o\'zgartirildi!' });
      return true;
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.current_password?.[0] || data?.new_password?.[0] || data?.detail || 'Xatolik';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  // =================== UTILS ===================

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  clearMessages: () => set({ error: null, success: null, validationErrors: {} }),
}));