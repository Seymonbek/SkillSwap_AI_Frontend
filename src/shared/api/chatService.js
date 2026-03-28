import api from './api';

const buildDirectRoomPayloads = (targetUserId, roomName) => {
  const normalizedUserId = Number.isNaN(Number(targetUserId))
    ? targetUserId
    : Number(targetUserId);

  const basePayload = {
    is_group: false,
    can_add_participants: false,
  };
  const payloadWithName = roomName
    ? { ...basePayload, name: roomName }
    : basePayload;

  const variants = [
    { ...payloadWithName, participant_ids: [normalizedUserId] },
    { ...payloadWithName, participants: [normalizedUserId] },
    { ...payloadWithName, participant: normalizedUserId },
    { ...payloadWithName, participant_id: normalizedUserId },
    { ...payloadWithName, user_id: normalizedUserId },
    { ...payloadWithName, user: normalizedUserId },
    { ...payloadWithName, user_ids: [normalizedUserId] },
    { ...payloadWithName, callee: normalizedUserId },
    { ...payloadWithName, target_user_id: normalizedUserId },
  ];

  return variants.map((payload) =>
    Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    )
  );
};

const chatService = {
  // Rooms — /chat/rooms/
  getRooms: (params) => api.get('/chat/rooms/', { params }),
  getRoom: (id) => api.get(`/chat/rooms/${id}/`),
  createRoom: (data) => api.post('/chat/rooms/', data),
  createDirectRoom: async (targetUserId, roomName) => {
    let lastError = null;

    for (const payload of buildDirectRoomPayloads(targetUserId, roomName)) {
      try {
        return await api.post('/chat/rooms/', payload);
      } catch (error) {
        const status = error.response?.status;
        if (status && ![400, 404, 405, 422].includes(status)) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to create direct chat room');
  },
  updateRoom: (id, data) => api.patch(`/chat/rooms/${id}/`, data),
  deleteRoom: (id) => api.delete(`/chat/rooms/${id}/`),
  uploadFile: (roomId, formData) => api.post(`/chat/rooms/${roomId}/upload-file/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Messages — /chat/messages/
  sendMessage: (data) => api.post('/chat/messages/', data),
  getMessages: (params) => {
    const roomId = params?.room_id ?? params?.room;
    return api.get('/chat/messages/', { params: roomId ? { room_id: roomId } : params });
  },
  getMessage: (id) => api.get(`/chat/messages/${id}/`),
  markMessagesAsRead: (data) => api.post('/chat/messages/mark-read/', {}, { params: { room_id: data.room_id ?? data.room } }),

  // Video Calls — /chat/calls/
  getCalls: (params) => api.get('/chat/calls/', { params }),
  getCall: (id) => api.get(`/chat/calls/${id}/`),
  getActiveCall: () => api.get('/chat/calls/active/'),
  getICEServers: () => api.get('/chat/calls/ice-servers/'),
  getRoomCallHistory: (params) => api.get('/chat/calls/room-history/', { params }),
};

export default chatService;
