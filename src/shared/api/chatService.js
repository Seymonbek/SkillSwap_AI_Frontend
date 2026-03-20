import api from './api';

const chatService = {
  // Rooms — /chat/rooms/
  getRooms: (params) => api.get('/chat/rooms/', { params }),
  getRoom: (id) => api.get(`/chat/rooms/${id}/`),
  createRoom: (data) => api.post('/chat/rooms/', data),
  updateRoom: (id, data) => api.patch(`/chat/rooms/${id}/`, data),
  deleteRoom: (id) => api.delete(`/chat/rooms/${id}/`),
  uploadFile: (roomId, formData) => api.post(`/chat/rooms/${roomId}/upload-file/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Messages — /chat/messages/
  getMessages: (params) => api.get('/chat/messages/', { params }),
  getMessage: (id) => api.get(`/chat/messages/${id}/`),
  markMessagesAsRead: (data) => api.post('/chat/messages/mark-read/', {}, { params: { room_id: data.room } }),

  // Video Calls — /chat/calls/
  getCalls: (params) => api.get('/chat/calls/', { params }),
  getCall: (id) => api.get(`/chat/calls/${id}/`),
  getActiveCall: () => api.get('/chat/calls/active/'),
  getICEServers: () => api.get('/chat/calls/ice-servers/'),
  getRoomCallHistory: (params) => api.get('/chat/calls/room-history/', { params }),
};

export default chatService;
