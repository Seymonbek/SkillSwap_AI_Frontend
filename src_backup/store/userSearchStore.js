import { create } from 'zustand';
import { api } from '../api/axios';

export const useUserSearchStore = create((set) => ({
  users: [],
  userDetail: null,
  isLoading: false,
  error: null,

  searchUsers: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/users/search/', { params: { q: query } });
      set({ users: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },

  fetchUserDetail: async (id) => {
    try {
      const res = await api.get(`/users/search/${id}/`);
      set({ userDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  exportData: async () => {
    try {
      const res = await api.get('/users/search/export_data/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_data_export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || "Ma'lumotlarni yuklab olishda xatolik" });
      return false;
    }
  },

  clearUsers: () => set({ users: [], userDetail: null }),
}));
