import { create } from 'zustand';
import { api } from '../api/axios';

export const usePaymentStore = create((set) => ({
  isLoading: false,
  error: null,
  success: null,

  buyTokens: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/payments/buy-tokens/', data);
      set({ isLoading: false, success: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  createPaymentIntent: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/payments/create-payment-intent/', data);
      set({ isLoading: false, success: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  fundEscrow: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/payments/escrow/fund/', data);
      set({ isLoading: false, success: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  releaseEscrow: async (data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post('/payments/escrow/release/', data);
      set({ isLoading: false, success: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
