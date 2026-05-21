import api from './api';

const buildMentorshipPayload = (data = {}) => ({
  mentor: data.mentor_detail?.id || data.mentor?.id || data.mentor,
  message: data.message || 'Mentorship request',
  duration_months: data.duration_months,
  proposed_schedule: data.proposed_schedule,
});

const postToFirstAvailable = async (paths, payload) => {
  let lastError = null;

  for (const path of paths) {
    try {
      return await api.post(path, payload);
    } catch (error) {
      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error('No compatible endpoint found');
};

const postSessionAction = async (paths, data = {}) =>
  postToFirstAvailable(
    Array.isArray(paths) ? paths : [paths],
    data && typeof data === 'object' ? data : {}
  );

const barterService = {
  // Mentorship — /barter/mentorship/
  getMentorships: (params) => api.get('/barter/mentorship/', { params }),
  getMentorship: (id) => api.get(`/barter/mentorship/${id}/`),
  createMentorship: (data) => api.post('/barter/mentorship/', data),
  acceptMentorship: (id, data = {}) =>
    postToFirstAvailable(
      [`/barter/mentorship/${id}/accept/`],
      buildMentorshipPayload(data)
    ),
  rejectMentorship: (id, data = {}) =>
    postToFirstAvailable(
      [
        `/barter/mentorship/${id}/reject/`,
        `/barter/mentorship/${id}/cancel/`,
      ],
      buildMentorshipPayload(data)
    ),
  negotiateMentorship: (id, data) =>
    postToFirstAvailable(
      [`/barter/mentorship/${id}/negotiate/`],
      buildMentorshipPayload(data)
    ),
  completeMentorship: (id, data = {}) =>
    postToFirstAvailable(
      [`/barter/mentorship/${id}/complete/`],
      buildMentorshipPayload(data)
    ),
  cancelMentorship: (id, data = {}) =>
    postToFirstAvailable(
      [`/barter/mentorship/${id}/cancel/`],
      buildMentorshipPayload(data)
    ),

  // Sessions — /barter/sessions/
  getSessions: (params) => api.get('/barter/sessions/', { params }),
  getSession: (id) => api.get(`/barter/sessions/${id}/`),
  createSession: (data) => api.post('/barter/sessions/', data),
  confirmSession: (id, data = {}) =>
    postSessionAction(
      `/barter/sessions/${id}/confirm_session/`,
      data
    ),
  startSession: (id, data = {}) =>
    postSessionAction(
      `/barter/sessions/${id}/start_session/`,
      data
    ),
  completeSession: (id, data = {}) =>
    postSessionAction(
      `/barter/sessions/${id}/complete_session/`,
      data
    ),
  cancelSession: async (id, data = {}) => {
    return postSessionAction(
      `/barter/sessions/${id}/cancel_session/`,
      data
    );
  },

  // AI Matchmaking — /barter/sessions/matchmaking/
  findMatch: (data) => api.post('/barter/sessions/matchmaking/', data),
};

export default barterService;
