import { create } from 'zustand';
import { api } from '../api/axios';

export const useSkillTestStore = create((set, get) => ({
  tests: [],
  testDetail: null,
  isLoading: false,
  error: null,

  fetchTests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/skill-tests/');
      set({ tests: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchTest: async (id) => {
    try {
      const res = await api.get(`/users/skill-tests/${id}/`);
      set({ testDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  createTest: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/users/skill-tests/', data);
      set((s) => ({ tests: [res.data, ...s.tests], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },

  updateTest: async (id, data) => {
    try {
      await api.patch(`/users/skill-tests/${id}/`, data);
      get().fetchTests();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  deleteTest: async (id) => {
    try {
      await api.delete(`/users/skill-tests/${id}/`);
      set((s) => ({ tests: s.tests.filter((t) => t.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
}));
