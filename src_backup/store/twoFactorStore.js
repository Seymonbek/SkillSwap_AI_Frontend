import { create } from 'zustand';
import { api } from '../api/axios';

export const useTwoFactorStore = create((set) => ({
  qrCode: null,
  isEnabled: false,
  isLoading: false,
  error: null,
  success: null,

  setup2FA: async () => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/users/2fa/enable_2fa_setup/');
      set({ qrCode: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
      return null;
    }
  },

  confirm2FA: async (code) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/users/2fa/enable_2fa_confirm/', { code });
      set({ isEnabled: true, isLoading: false, success: '2FA muvaffaqiyatli yoqildi!' });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || "Kod noto'g'ri", isLoading: false });
      return false;
    }
  },

  disable2FA: async (code) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await api.post('/users/2fa/disable_2fa/', { code });
      set({ isEnabled: false, isLoading: false, success: "2FA o'chirildi" });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || "Kod noto'g'ri", isLoading: false });
      return false;
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
