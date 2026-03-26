import api from './api';

const barterService = {
  // Mentorship — /barter/mentorship/
  getMentorships: (params) => api.get('/barter/mentorship/', { params }),
  getMentorship: (id) => api.get(`/barter/mentorship/${id}/`),
  createMentorship: (data) => api.post('/barter/mentorship/', data),
  updateMentorship: (id, data) => api.patch(`/barter/mentorship/${id}/`, data),
  deleteMentorship: (id) => api.delete(`/barter/mentorship/${id}/`),
  acceptMentorship: (id, data) => api.post(`/barter/mentorship/${id}/accept/`, data),
  negotiateMentorship: (id, data) => api.post(`/barter/mentorship/${id}/negotiate/`, data),

  // Sessions — /barter/sessions/
  getSessions: (params) => api.get('/barter/sessions/', { params }),
  getSession: (id) => api.get(`/barter/sessions/${id}/`),
  createSession: (data) => api.post('/barter/sessions/', data),
  updateSession: (id, data) => api.patch(`/barter/sessions/${id}/`, data),
  deleteSession: (id) => api.delete(`/barter/sessions/${id}/`),
  startSession: (id) => api.post(`/barter/sessions/${id}/start_session/`),
  completeSession: (id) => api.post(`/barter/sessions/${id}/complete_session/`),

  // AI Matchmaking — /barter/sessions/matchmaking/
  findMatch: (data) => api.post('/barter/sessions/matchmaking/', data),
};

export default barterService;
