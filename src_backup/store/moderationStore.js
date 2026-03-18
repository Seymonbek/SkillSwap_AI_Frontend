import { create } from 'zustand';
import { api } from '../api/axios';

export const useModerationStore = create((set) => ({
  // Analytics
  stats: null,
  revenue: [],
  tokenStats: null,

  // Disputes
  disputes: [],
  disputeDetail: null,

  // KYC
  kycList: [],
  kycDetail: null,

  // Users
  users: [],
  userDetail: null,

  isLoading: false,
  error: null,
  success: null,

  // =================== ANALYTICS ===================

  fetchStats: async () => {
    try {
      const res = await api.get('/moderation/analytics/stats/');
      set({ stats: res.data });
    } catch (err) {
      console.error('Stats error:', err);
    }
  },

  fetchRevenue: async () => {
    try {
      const res = await api.get('/moderation/analytics/revenue/');
      set({ revenue: Array.isArray(res.data) ? res.data : [] });
    } catch (err) {
      console.error('Revenue error:', err);
    }
  },

  fetchTokenStats: async () => {
    try {
      const res = await api.get('/moderation/analytics/tokens/');
      set({ tokenStats: res.data });
    } catch (err) {
      console.error('Token stats error:', err);
    }
  },

  // =================== DISPUTES ===================

  fetchDisputes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/moderation/disputes/');
      set({ disputes: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchDispute: async (id) => {
    try {
      const res = await api.get(`/moderation/disputes/${id}/`);
      set({ disputeDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  resolveDispute: async (id, data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post(`/moderation/disputes/${id}/resolve/`, data);
      set({ isLoading: false, success: 'Nizo muvaffaqiyatli hal qilindi!' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  // =================== KYC ===================

  fetchKycList: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/moderation/kyc/');
      set({ kycList: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchKycDetail: async (id) => {
    try {
      const res = await api.get(`/moderation/kyc/${id}/`);
      set({ kycDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  reviewKyc: async (id, data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post(`/moderation/kyc/${id}/review/`, data);
      set({ isLoading: false, success: 'KYC muvaffaqiyatli ko\'rib chiqildi!' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  // =================== USERS ===================

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/moderation/users/');
      set({ users: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchUser: async (id) => {
    try {
      const res = await api.get(`/moderation/users/${id}/`);
      set({ userDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  banUser: async (id, data) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await api.post(`/moderation/users/${id}/ban/`, data);
      set({ isLoading: false, success: 'Foydalanuvchi ban holati yangilandi!' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
