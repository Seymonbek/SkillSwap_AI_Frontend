import { create } from 'zustand';
import { api } from '../api/axios';

export const useMentorshipStore = create((set, get) => ({
  mentorships: [],
  mentorshipDetail: null,
  isLoading: false,
  error: null,

  fetchMentorship: async (id) => {
    try {
      const res = await api.get(`/barter/mentorship/${id}/`);
      set({ mentorshipDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  updateMentorship: async (id, data) => {
    try {
      const res = await api.patch(`/barter/mentorship/${id}/`, data);
      set((s) => ({
        mentorships: s.mentorships.map((m) => m.id === id ? res.data : m),
        mentorshipDetail: res.data,
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Yangilashda xatolik' });
      return false;
    }
  },


  fetchMentorships: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/barter/mentorship/');
      set({ mentorships: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Yuklashda xatolik', isLoading: false });
    }
  },

  createMentorship: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/barter/mentorship/', data);
      set((s) => ({ mentorships: [res.data, ...s.mentorships], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Yaratishda xatolik', isLoading: false });
      return false;
    }
  },

  acceptMentorship: async (id) => {
    try {
      await api.post(`/barter/mentorship/${id}/accept/`);
      get().fetchMentorships();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  negotiateMentorship: async (id, data) => {
    try {
      await api.post(`/barter/mentorship/${id}/negotiate/`, data);
      get().fetchMentorships();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  deleteMentorship: async (id) => {
    try {
      await api.delete(`/barter/mentorship/${id}/`);
      set((s) => ({ mentorships: s.mentorships.filter((m) => m.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || "O'chirishda xatolik" });
    }
  },
}));
