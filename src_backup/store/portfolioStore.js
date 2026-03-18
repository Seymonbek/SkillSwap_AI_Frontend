import { create } from 'zustand';
import { api } from '../api/axios';

export const usePortfolioStore = create((set, get) => ({
  items: [],
  itemDetail: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/portfolio/');
      set({ items: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchPortfolioItem: async (id) => {
    try {
      const res = await api.get(`/users/portfolio/${id}/`);
      set({ itemDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  createPortfolioItem: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/users/portfolio/', data);
      set((s) => ({ items: [res.data, ...s.items], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },

  updatePortfolioItem: async (id, data) => {
    try {
      await api.patch(`/users/portfolio/${id}/`, data);
      get().fetchPortfolio();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  deletePortfolioItem: async (id) => {
    try {
      await api.delete(`/users/portfolio/${id}/`);
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
}));
