import { create } from 'zustand';
import { notificationsService } from '@/shared/api';
import { createWebSocket } from '@/shared/api/api';

const DEBUG_NOTIFICATIONS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_WS === 'true';

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  wsConnection: null,
  pollingInterval: null,
  incomingCall: null,

  // Fetch — /notifications/
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsService.getNotifications();
      const notifications = res.data?.results || res.data || [];
      set({ notifications, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
    }
  },

  // Unread count — /notifications/unread-count/
  fetchUnreadCount: async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      const count = res.data?.count ?? res.data?.unread_count ?? 0;
      set({ unreadCount: count });
      return count;
    } catch {
      return 0;
    }
  },

  // Mark as read — /notifications/{id}/mark-read/
  markAsRead: async (id) => {
    try {
      await notificationsService.markAsRead(id, {});
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Mark all as read — /notifications/mark-all-read/
  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead({});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Polling for real-time updates
  startPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) return; // Already polling

    // Immediate fetch
    get().fetchUnreadCount();

    const interval = setInterval(() => {
      get().fetchUnreadCount();
    }, 30000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // Add notification from WebSocket
  addNotification: (notification) => {
    const isIncomingCall = notification.notification_type === 'CHAT' && notification.action_url;
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      incomingCall: isIncomingCall ? notification : state.incomingCall,
    }));
  },

  clearIncomingCall: () => set({ incomingCall: null }),

  // WebSocket connection for real-time notifications
  connectWebSocket: () => {
    const { wsConnection } = get();
    if (wsConnection) return; // Already connected

    try {
      const ws = createWebSocket('/ws/notifications/');

      ws.onopen = () => {};

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notification' || data.type === 'new_notification') {
            get().addNotification({
              id: data.id || Date.now(),
              title: data.title || data.message,
              message: data.message || data.body,
              notification_type: data.notification_type || 'SYSTEM',
              action_url: data.action_url || data.link || null,
              entity_type: data.entity_type || null,
              entity_id: data.entity_id || null,
              is_read: false,
              created_at: data.created_at || new Date().toISOString(),
            });
          } else if (data.type === 'unread_count') {
            set({ unreadCount: data.count || 0 });
          }
        } catch (e) {
          if (DEBUG_NOTIFICATIONS) {
            console.error('[Notifications] WS message parse error:', e);
          }
        }
      };

      ws.onclose = (event) => {
        set({ wsConnection: null });

        // Auto-reconnect after 5 seconds (only if not intentionally closed)
        if (event.code !== 1000 && event.code !== 4000) {
          setTimeout(() => {
            const token = localStorage.getItem('access_token');
            if (token) {
              get().connectWebSocket();
            }
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        if (DEBUG_NOTIFICATIONS) {
          console.error('[Notifications] WebSocket error:', error);
        }
      };

      set({ wsConnection: ws });
    } catch (error) {
      if (DEBUG_NOTIFICATIONS) {
        console.error('[Notifications] Failed to create WebSocket:', error);
      }
    }
  },

  disconnectWebSocket: () => {
    const { wsConnection } = get();
    if (wsConnection) {
      wsConnection.onopen = null;
      wsConnection.onmessage = null;
      wsConnection.onerror = null;
      wsConnection.onclose = null;
      if (wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close(4000, 'User disconnect');
      }
      set({ wsConnection: null });
    }
  },
}));
