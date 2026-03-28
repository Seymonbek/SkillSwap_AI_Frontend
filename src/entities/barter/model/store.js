import { create } from 'zustand';
import { barterService, authService } from '@/shared/api';

const hydrateSessionAfterAction = async (id, fallbackData = null) => {
  try {
    const detailRes = await barterService.getSession(id);
    return detailRes.data || fallbackData;
  } catch {
    return fallbackData;
  }
};

export const useBarterStore = create((set) => ({
  // State
  mentors: [],
  mentorshipRequests: [],
  barterSessions: [],
  currentMentor: null,
  matchResults: null,
  isLoading: false,
  error: null,

  // Mentors — foydalanuvchilarni qidirish (users/search endpoint)
  fetchMentors: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.searchUsers(params);
      const data = res.data?.results || res.data || [];
      set({ mentors: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return [];
    }
  },

  fetchMentor: async (id) => {
    set({ isLoading: true });
    try {
      const res = await authService.getUserByIdSearch(id);
      set({ currentMentor: res.data, isLoading: false });
      return res.data;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return null;
    }
  },

  // Mentorship Requests — /barter/mentorship/
  fetchMentorshipRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await barterService.getMentorships();
      const data = res.data?.results || res.data || [];
      set({ mentorshipRequests: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return [];
    }
  },

  createMentorshipRequest: async (data) => {
    set({ isLoading: true });
    try {
      const res = await barterService.createMentorship(data);
      set((state) => ({
        mentorshipRequests: [res.data, ...state.mentorshipRequests],
        isLoading: false,
      }));
      return { success: true, request: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  acceptMentorship: async (id) => {
    try {
      const res = await barterService.acceptMentorship(id);
      set((state) => ({
        mentorshipRequests: state.mentorshipRequests.map((r) =>
          r.id === id ? { ...r, status: res.data?.status || 'ACCEPTED', ...res.data } : r
        ),
      }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  rejectMentorship: async (id) => {
    try {
      const res = await barterService.rejectMentorship(id);
      set((state) => ({
        mentorshipRequests: state.mentorshipRequests.map((r) =>
          r.id === id ? { ...r, status: res.data?.status || 'REJECTED', ...res.data } : r
        ),
      }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  negotiateMentorship: async (id, data) => {
    try {
      const res = await barterService.negotiateMentorship(id, data);
      set((state) => ({
        mentorshipRequests: state.mentorshipRequests.map((r) =>
          r.id === id ? res.data : r
        ),
      }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Barter Sessions — /barter/sessions/
  fetchBarterSessions: async () => {
    set({ isLoading: true });
    try {
      const res = await barterService.getSessions();
      const data = res.data?.results || res.data || [];
      set({ barterSessions: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return [];
    }
  },

  createBarterSession: async (data) => {
    try {
      const res = await barterService.createSession(data);
      set((state) => ({
        barterSessions: [res.data, ...state.barterSessions],
      }));
      return { success: true, session: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  confirmBarterSession: async (id) => {
    try {
      const res = await barterService.confirmSession(id);
      const sessionData = await hydrateSessionAfterAction(id, res.data);
      set((state) => ({
        barterSessions: state.barterSessions.map((s) =>
          s.id === id ? { ...s, status: sessionData?.status || 'CONFIRMED', ...sessionData } : s
        ),
      }));
      return { success: true, session: sessionData };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  startBarterSession: async (id) => {
    try {
      const res = await barterService.startSession(id);
      const sessionData = await hydrateSessionAfterAction(id, res.data);
      set((state) => ({
        barterSessions: state.barterSessions.map((s) =>
          s.id === id ? { ...s, ...sessionData } : s
        ),
      }));
      return { success: true, session: sessionData };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  completeBarterSession: async (id) => {
    try {
      const res = await barterService.completeSession(id);
      const sessionData = await hydrateSessionAfterAction(id, res.data);
      set((state) => ({
        barterSessions: state.barterSessions.map((s) =>
          s.id === id ? { ...s, ...sessionData } : s
        ),
      }));
      return { success: true, session: sessionData };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  cancelBarterSession: async (id) => {
    try {
      const res = await barterService.cancelSession(id);
      const sessionData = await hydrateSessionAfterAction(id, res.data);
      set((state) => ({
        barterSessions: state.barterSessions.map((s) =>
          s.id === id ? { ...s, status: sessionData?.status || 'CANCELLED', ...sessionData } : s
        ),
      }));
      return { success: true, session: sessionData };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // AI Matchmaking — /barter/sessions/matchmaking/
  findMatch: async (data) => {
    set({ isLoading: true });
    try {
      const res = await barterService.findMatch(data);
      set({ matchResults: res.data, isLoading: false });
      return { success: true, results: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  clearMatchResults: () => set({ matchResults: null }),
}));
