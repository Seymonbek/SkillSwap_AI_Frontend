import { create } from 'zustand';
import { api } from '../api/axios';

/**
 * Video Call Store - WebSocket bilan yangilangan versiya
 * Real-time video qo'ng'iroqlarni boshqarish
 */

export const useVideoCallStore = create((set, get) => ({
  // State
  calls: [],
  callDetail: null,
  activeCall: null,
  iceServers: [],
  roomHistory: [],
  isLoading: false,
  error: null,

  // WebSocket
  socket: null,
  isSocketConnected: false,

  // Current call state
  currentCall: null,
  incomingCall: null,
  isInCall: false,

  // =================== REST API ===================

  // GET /chat/calls/ — Qo'ng'iroqlar ro'yxati
  fetchCalls: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/chat/calls/');
      set({ calls: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        "Qo'ng'iroqlar ro'yxatini yuklashda xatolik";
      set({ error: errorMsg, isLoading: false });
    }
  },

  // GET /chat/calls/{id}/ — Tafsilot
  fetchCall: async (id) => {
    try {
      const res = await api.get(`/chat/calls/${id}/`);
      set({ callDetail: res.data });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Qo'ng'iroq ma'lumotlarini yuklashda xatolik";
      set({ error: errorMsg });
      return null;
    }
  },

  // GET /chat/calls/active/ — Faol qo'ng'iroq
  fetchActiveCall: async () => {
    try {
      const res = await api.get('/chat/calls/active/');
      set({ activeCall: res.data });
      return res.data;
    } catch (err) {
      set({ activeCall: null });
      return null;
    }
  },

  // GET /chat/calls/ice-servers/ — WebRTC STUN/TURN
  fetchIceServers: async () => {
    try {
      const res = await api.get('/chat/calls/ice-servers/');
      const servers = Array.isArray(res.data) ? res.data : (res.data.ice_servers || res.data.servers || []);
      set({ iceServers: servers });
      return servers;
    } catch (err) {
      // Fallback to public STUN
      const fallback = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
      set({ iceServers: fallback });
      return fallback;
    }
  },

  // GET /chat/calls/room-history/ — Xona qo'ng'iroq tarixi
  fetchRoomHistory: async (roomId) => {
    if (!roomId) {
      set({ roomHistory: [] });
      return;
    }
    try {
      const params = { room_id: roomId };
      const res = await api.get('/chat/calls/room-history/', { params });
      set({ roomHistory: Array.isArray(res.data) ? res.data : (res.data.results || []) });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Xona tarixini yuklashda xatolik";
      set({ error: errorMsg });
    }
  },

  // =================== WebSocket ===================

  /**
   * WebSocket ulanishini o'rnatish
   */
  connectWebSocket: (callId, token) => {
    // Agar oldin connection bo'lsa, yopish
    const { socket: existingSocket } = get();
    if (existingSocket) {
      existingSocket.close();
    }

    // WebSocket URL
    const wsUrl = `ws://13.50.109.251:8000/ws/calls/${callId}/?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected:', callId);
      set({ isSocketConnected: true, socket });
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      set({ isSocketConnected: false, socket: null });
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ error: 'WebSocket ulanishida xatolik' });
    };

    return socket;
  },

  /**
   * WebSocket yopish
   */
  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isSocketConnected: false });
    }
  },

  // =================== Call Actions ===================

  /**
   * Qo'ng'iroq qilish (boshlash)
   */
  initiateCall: async (roomId, calleeId, callType = 'VIDEO') => {
    const token = localStorage.getItem('access_token');

    // 1. REST API orqali qo'ng'iroq yaratish
    const call = await get().createCall(roomId, callType);
    if (!call) return null;

    // 2. WebSocket ulanish
    const socket = get().connectWebSocket(call.id, token);

    // 3. State yangilash
    set({
      currentCall: call,
      isInCall: true,
      socket
    });

    return { call, socket };
  },

  /**
   * Kiruvchi qo'ng'iroqni qabul qilish
   */
  acceptIncomingCall: (callData) => {
    const token = localStorage.getItem('access_token');
    const socket = get().connectWebSocket(callData.id, token);

    set({
      incomingCall: null,
      currentCall: callData,
      isInCall: true,
      socket
    });

    return socket;
  },

  /**
   * Kiruvchi qo'ng'iroqni rad etish
   */
  rejectIncomingCall: () => {
    set({ incomingCall: null });
  },

  /**
   * Qo'ng'iroqni tugatish
   */
  hangUp: async () => {
    const { currentCall, socket } = get();

    // WebSocket orqali qo'ng'iroq tugaganini xabar qilish
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'call-ended' }));
    }

    // REST API orqali tugatish
    if (currentCall) {
      await get().endCall(currentCall.id);
    }

    // WebSocket yopish
    get().disconnectWebSocket();

    set({
      currentCall: null,
      isInCall: false,
      incomingCall: null
    });
  },

  /**
   * Kiruvchi qo'ng'iroqni o'rnatish (boshqa foydalanuvchidan)
   */
  setIncomingCall: (callData) => {
    set({ incomingCall: callData });
  },

  clearError: () => set({ error: null }),

  /**
   * Store tozalash (logout uchun)
   */
  reset: () => set({
    calls: [],
    callDetail: null,
    activeCall: null,
    currentCall: null,
    incomingCall: null,
    isInCall: false,
    error: null
  })
}));
