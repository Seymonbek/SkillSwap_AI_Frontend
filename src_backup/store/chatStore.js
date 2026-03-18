import { create } from 'zustand';
import { api } from '../api/axios';

export const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  roomDetail: null,
  messages: [],
  messageDetail: null,
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/chat/rooms/');
      set({ rooms: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Yuklashda xatolik', isLoading: false });
    }
  },

  createRoom: async (data) => {
    try {
      const res = await api.post('/chat/rooms/', data);
      set((s) => ({ rooms: [res.data, ...s.rooms] }));
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Yaratishda xatolik' });
      return null;
    }
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, messages: [] });
    if (room) get().fetchMessages(room.id);
  },

  fetchMessages: async (roomId) => {
    try {
      // Xonalarni room ichida messages bilan olishga harakat qilish
      const res = await api.get(`/chat/rooms/${roomId}/`);
      if (res.data && res.data.messages) {
        set({ messages: res.data.messages });
      } else {
        set({ messages: [] });
      }
    } catch (err) {
      // 405 xatolikni yashirish va bo'sh array qaytarish
      if (err.response?.status === 405 || err.response?.status === 404) {
        console.warn(`Messages endpoint not available for room ${roomId}`);
      }
      set({ messages: [] });
    }
  },

  sendMessage: async (roomId, content) => {
    try {
      const res = await api.post('/chat/messages/', { room: roomId, content, message_type: 'TEXT' });
      set((s) => ({ messages: [...s.messages, res.data] }));
      return true;
    } catch {
      return false;
    }
  },

  uploadFile: async (roomId, file, messageType = 'FILE') => {
    try {
      const formData = new FormData();
      formData.append('room_id', roomId);
      formData.append('file', file);
      formData.append('message_type', messageType);
      const res = await api.post(`/chat/rooms/${roomId}/upload-file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // re-fetch messages to include the new file message
      get().fetchMessages(roomId);
      return true;
    } catch {
      return false;
    }
  },

  markRead: async (roomId) => {
    try {
      await api.post(`/chat/messages/mark-read/?room_id=${roomId}`, {});
    } catch { /* ignore */ }
  },

  fetchRoom: async (id) => {
    try {
      const res = await api.get(`/chat/rooms/${id}/`);
      set({ roomDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },

  updateRoom: async (id, data) => {
    try {
      await api.patch(`/chat/rooms/${id}/`, data);
      get().fetchRooms();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },

  deleteRoom: async (id) => {
    try {
      await api.delete(`/chat/rooms/${id}/`);
      set((s) => ({
        rooms: s.rooms.filter((r) => r.id !== id),
        activeRoom: s.activeRoom?.id === id ? null : s.activeRoom,
        messages: s.activeRoom?.id === id ? [] : s.messages,
      }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  fetchMessage: async (id) => {
    try {
      const res = await api.get(`/chat/messages/${id}/`);
      set({ messageDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },
}));
