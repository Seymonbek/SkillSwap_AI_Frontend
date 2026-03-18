import { create } from 'zustand';
import { api } from '../api/axios';

export const useDisputeStore = create((set) => ({
  isLoading: false,
  error: null,
  result: null,

  createDispute: async (data) => {
    set({ isLoading: true, error: null, result: null });
    try {
      const res = await api.post('/dispute/create/', data);
      set({ result: res.data, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },

  resolveDispute: async (data) => {
    set({ isLoading: true, error: null, result: null });
    try {
      const res = await api.post('/dispute/resolve/', data);
      set({ result: res.data, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },

  clearResult: () => set({ result: null, error: null }),
}));
