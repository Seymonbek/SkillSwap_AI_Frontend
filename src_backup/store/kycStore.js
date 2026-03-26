import { create } from 'zustand';
import { api } from '../api/axios';

export const useKycStore = create((set) => ({
  status: null,
  isLoading: false,
  error: null,
  success: null,

  fetchKycStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/kyc/status/');
      set({ status: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ status: null, isLoading: false });
      return null;
    }
  },

  submitKyc: async (formData) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/users/kyc/submit/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ isLoading: false, success: 'Hujjat muvaffaqiyatli yuborildi!' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
