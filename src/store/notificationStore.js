import { create } from 'zustand';
import { api } from '../api/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  notificationDetail: null,
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/notifications/');
      set({ notifications: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchNotification: async (id) => {
    try {
      const res = await api.get(`/notifications/${id}/`);
      set({ notificationDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read/`);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count/');
      set({ unreadCount: res.data.count || res.data.unread_count || 0 });
    } catch { /* ignore */ }
  },
}));
