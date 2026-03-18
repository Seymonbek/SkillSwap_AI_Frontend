import { create } from 'zustand';
import { api } from '../api/axios';

export const useSubscriptionStore = create((set) => ({
  subscriptions: [],
  subscriptionDetail: null,
  mySubscription: null,
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/subscriptions/');
      set({ subscriptions: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchSubscription: async (id) => {
    try {
      const res = await api.get(`/subscriptions/${id}/`);
      set({ subscriptionDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  buySubscription: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/subscriptions/buy/', data);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return null;
    }
  },

  fetchMySubscription: async () => {
    try {
      const res = await api.get('/subscriptions/my-subscription/');
      set({ mySubscription: res.data });
      return res.data;
    } catch (err) {
      // 404 xatolikni e'tiborsiz qoldirish - endpoint bo'lmasligi mumkin
      if (err.response?.status === 404 || err.response?.status === 500) {
        console.warn('my-subscription endpoint not available:', err.message);
        set({ mySubscription: null });
        return null;
      }
      set({ mySubscription: null });
      return null;
    }
  },
}));
