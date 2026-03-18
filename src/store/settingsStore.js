import { create } from 'zustand';
import { api } from '../api/axios';

export const useSettingsStore = create((set) => ({
  settings: [],
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/common/settings/');
      set({ settings: Array.isArray(res.data) ? res.data : (res.data.results || [res.data]), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Yuklashda xatolik', isLoading: false });
    }
  },

  fetchSetting: async (id) => {
    try {
      const res = await api.get(`/common/settings/${id}/`);
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },
}));
