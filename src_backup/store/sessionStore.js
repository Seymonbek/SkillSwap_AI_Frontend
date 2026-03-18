import { create } from 'zustand';
import { api } from '../api/axios';

export const useSessionStore = create((set, get) => ({
  sessions: [],
  sessionDetail: null,
  isLoading: false,
  error: null,
  matchResult: null,

  fetchSession: async (id) => {
    try {
      const res = await api.get(`/barter/sessions/${id}/`);
      set({ sessionDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  updateSession: async (id, data) => {
    try {
      const res = await api.patch(`/barter/sessions/${id}/`, data);
      set((s) => ({
        sessions: s.sessions.map((sess) => sess.id === id ? res.data : sess),
        sessionDetail: res.data,
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Yangilashda xatolik' });
      return false;
    }
  },

  matchLoading: false,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/barter/sessions/');
      set({ sessions: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Yuklashda xatolik', isLoading: false });
    }
  },

  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/barter/sessions/', data);
      set((s) => ({ sessions: [res.data, ...s.sessions], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Yaratishda xatolik', isLoading: false });
      return false;
    }
  },

  deleteSession: async (id) => {
    try {
      await api.delete(`/barter/sessions/${id}/`);
      set((s) => ({ sessions: s.sessions.filter((s2) => s2.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || "O'chirishda xatolik" });
    }
  },

  runMatchmaking: async (data) => {
    set({ matchLoading: true, matchResult: null, error: null });
    try {
      const res = await api.post('/barter/sessions/matchmaking/', data);
      set({ matchResult: res.data, matchLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'AI qidiruvida xatolik', matchLoading: false });
    }
  },
}));
