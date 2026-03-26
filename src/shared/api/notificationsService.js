import api from './api';

const notificationsService = {
  // Notifications — /notifications/
  getNotifications: (params) => api.get('/notifications/', { params }),
  getNotification: (id) => api.get(`/notifications/${id}/`),

  // Mark as read — POST /notifications/{id}/mark-read/
  markAsRead: (id, data = {}) => api.post(`/notifications/${id}/mark-read/`, data),

  // Mark all as read — POST /notifications/mark-all-read/
  markAllAsRead: (data = {}) => api.post('/notifications/mark-all-read/', data),

  // Unread count — GET /notifications/unread-count/
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

export default notificationsService;
