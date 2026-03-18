import { create } from 'zustand';
import { api } from '../api/axios';

export const useReviewStore = create((set, get) => ({
  reviews: [],
  reviewDetail: null,
  isLoading: false,
  error: null,

  fetchReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/reviews/');
      set({ reviews: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchReview: async (id) => {
    try {
      const res = await api.get(`/users/reviews/${id}/`);
      set({ reviewDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  createReview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/users/reviews/', data);
      set((s) => ({ reviews: [res.data, ...s.reviews], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },

  updateReview: async (id, data) => {
    try {
      await api.patch(`/users/reviews/${id}/`, data);
      get().fetchReviews();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  deleteReview: async (id) => {
    try {
      await api.delete(`/users/reviews/${id}/`);
      set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
}));
