import { create } from 'zustand';
import { chatService } from '@/shared/api';
import { createWebSocket } from '@/shared/api/api';

export const useChatStore = create((set, get) => ({
  // State
  chatRooms: [],
  currentRoom: null,
  messages: [],
  typingUsers: [],
  onlineUsers: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  wsConnection: null,

  // Chat Rooms — /chat/rooms/
  fetchChatRooms: async () => {
    set({ isLoading: true });
    try {
      const res = await chatService.getRooms();
      const rooms = res.data?.results || res.data || [];
      set({ chatRooms: rooms, isLoading: false });
      return rooms;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return [];
    }
  },

  createChatRoom: async (data) => {
    try {
      const res = await chatService.createRoom(data);
      set((state) => ({ chatRooms: [res.data, ...state.chatRooms] }));
      return { success: true, room: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  // Messages — /chat/messages/?room=X
  fetchMessages: async (roomId) => {
    set({ isLoading: true });
    try {
      const res = await chatService.getMessages({ room: roomId });
      const messages = res.data?.results || res.data || [];
      set({ messages, isLoading: false });
      return messages;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return [];
    }
  },

  // Mark messages as read — /chat/messages/mark-read/
  markMessagesAsRead: async (roomId) => {
    try {
      await chatService.markMessagesAsRead({ room: roomId });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  },

  // File upload — /chat/rooms/{id}/upload-file/
  uploadFile: async (roomId, file) => {
    try {
      const formData = new FormData();
      formData.append('room_id', roomId);
      formData.append('file', file);
      const res = await chatService.uploadFile(roomId, formData);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // WebSocket
  connectWebSocket: (roomId) => {
    // Close existing connection
    const { wsConnection } = get();
    if (wsConnection) {
      wsConnection.close();
    }

    const ws = createWebSocket(`/ws/chat/${roomId}/`);

    ws.onopen = () => {
      console.log('Chat WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'message':
          case 'chat_message':
            set((state) => ({
              messages: [...state.messages, data],
            }));
            break;

          case 'typing':
            set((state) => ({
              typingUsers: data.is_typing
                ? [...new Set([...state.typingUsers, data.user_id])]
                : state.typingUsers.filter((id) => id !== data.user_id),
            }));
            break;

          case 'online_status':
            set((state) => ({
              onlineUsers: data.is_online
                ? [...new Set([...state.onlineUsers, data.user_id])]
                : state.onlineUsers.filter((id) => id !== data.user_id),
            }));
            break;

          case 'read_receipt':
            set((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === data.message_id ? { ...msg, is_read: true, read_at: data.read_at } : msg
              ),
            }));
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('Chat WebSocket disconnected');
      set({ wsConnection: null });
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
    };

    set({ wsConnection: ws });
  },

  disconnectWebSocket: () => {
    const { wsConnection } = get();
    if (wsConnection) {
      wsConnection.close();
      set({ wsConnection: null });
    }
  },

  sendMessage: (content, messageType = 'TEXT') => {
    const { wsConnection } = get();
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'message',
        message: content,
        content,
        message_type: String(messageType || 'TEXT').toUpperCase(),
      }));
    }
  },

  sendTyping: (isTyping) => {
    const { wsConnection } = get();
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping,
      }));
    }
  },

  sendReadReceipt: (messageId) => {
    const { wsConnection } = get();
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'read_receipt',
        message_id: messageId,
      }));
    }
  },

  // Video Calls — /chat/calls/
  fetchCalls: async (params) => {
    try {
      const res = await chatService.getCalls(params);
      return res.data?.results || res.data || [];
    } catch {
      return [];
    }
  },

  getActiveCall: async () => {
    try {
      const res = await chatService.getActiveCall();
      return res.data;
    } catch {
      return null;
    }
  },

  getICEServers: async () => {
    try {
      const res = await chatService.getICEServers();
      return res.data;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  },

  getRoomCallHistory: async (roomId) => {
    try {
      const res = await chatService.getRoomCallHistory({ room: roomId });
      return res.data?.results || res.data || [];
    } catch {
      return [];
    }
  },
}));
