import { create } from 'zustand';
import { api } from '../api/axios';

export const useSearchStore = create((set) => ({
  jobResults: [],
  userResults: [],
  isLoading: false,
  error: null,

  searchJobs: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/search/jobs/', { params: { q: query } });
      set({ jobResults: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  searchUsers: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/search/users/', { params: { q: query } });
      set({ userResults: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  clearResults: () => set({ jobResults: [], userResults: [] }),
}));
