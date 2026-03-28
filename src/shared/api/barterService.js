import api from './api';

const buildMentorshipPayload = (data = {}) => ({
  mentor: data.mentor_detail?.id || data.mentor?.id || data.mentor,
  message: data.message || 'Mentorship request',
  duration_months: data.duration_months,
  proposed_schedule: data.proposed_schedule,
});

const buildSessionPayload = (data = {}) => ({
  mentor: data.mentor_detail?.id || data.mentor?.id || data.mentor,
  topic: data.topic,
  scheduled_time: data.scheduled_time,
  duration_minutes: data.duration_minutes,
});

const hasRequiredSessionPayload = (payload = {}) =>
  Boolean(payload.mentor && payload.topic && payload.scheduled_time);

const getSessionActionPayload = async (id, data = {}) => {
  const directPayload = buildSessionPayload(data);
  if (hasRequiredSessionPayload(directPayload)) {
    return directPayload;
  }

  const res = await api.get(`/barter/sessions/${id}/`);
  return buildSessionPayload(res.data);
};

const buildSyntheticResponse = (data, status = 200) => ({
  data,
  status,
  statusText: status === 204 ? 'No Content' : 'OK',
  headers: {},
  config: {},
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

const deleteMentorshipWithStatus = async (id, data = {}, status = 'REJECTED') => {
  await api.delete(`/barter/mentorship/${id}/`);
  return buildSyntheticResponse({ ...data, id, status }, 204);
};

const deleteSessionWithStatus = async (id, data = {}, status = 'CANCELLED') => {
  await api.delete(`/barter/sessions/${id}/`);
  return buildSyntheticResponse({ ...data, id, status }, 204);
};

const postSessionAction = async (id, paths, data = {}) => {
  const payload = await getSessionActionPayload(id, data);
  return postToFirstAvailable(Array.isArray(paths) ? paths : [paths], payload);
};

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
  rejectMentorship: async (id, data = {}) => {
    const payload = buildMentorshipPayload(data);

    try {
      return await postToFirstAvailable(
        [
          `/barter/mentorship/${id}/reject/`,
          `/barter/mentorship/${id}/cancel/`,
        ],
        payload
      );
    } catch (error) {
      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }

      return deleteMentorshipWithStatus(id, data, 'REJECTED');
    }
  },
  negotiateMentorship: (id, data) =>
    postToFirstAvailable(
      [`/barter/mentorship/${id}/negotiate/`],
      buildMentorshipPayload(data)
    ),
  completeMentorship: async (id, data = {}) => {
    const payload = buildMentorshipPayload(data);

    try {
      return await postToFirstAvailable(
        [`/barter/mentorship/${id}/complete/`],
        payload
      );
    } catch (error) {
      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }

      return deleteMentorshipWithStatus(id, data, 'COMPLETED');
    }
  },
  cancelMentorship: async (id, data = {}) => {
    const payload = buildMentorshipPayload(data);

    try {
      return await postToFirstAvailable(
        [`/barter/mentorship/${id}/cancel/`],
        payload
      );
    } catch (error) {
      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }

      return deleteMentorshipWithStatus(id, data, 'CANCELLED');
    }
  },

  // Sessions — /barter/sessions/
  getSessions: (params) => api.get('/barter/sessions/', { params }),
  getSession: (id) => api.get(`/barter/sessions/${id}/`),
  createSession: (data) => api.post('/barter/sessions/', data),
  confirmSession: (id, data = {}) =>
    postSessionAction(
      id,
      [
        `/barter/sessions/${id}/confirm_session/`,
        `/barter/sessions/${id}/confirm/`,
      ],
      data
    ),
  startSession: (id, data = {}) =>
    postSessionAction(
      id,
      [
        `/barter/sessions/${id}/start_session/`,
        `/barter/sessions/${id}/start/`,
      ],
      data
    ),
  completeSession: (id, data = {}) =>
    postSessionAction(
      id,
      [
        `/barter/sessions/${id}/complete_session/`,
        `/barter/sessions/${id}/complete/`,
      ],
      data
    ),
  cancelSession: async (id, data = {}) => {
    try {
      return await postSessionAction(
        id,
        [
          `/barter/sessions/${id}/cancel_session/`,
          `/barter/sessions/${id}/cancel/`,
        ],
        data
      );
    } catch (error) {
      const status = error.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw error;
      }

      return deleteSessionWithStatus(id, data, 'CANCELLED');
    }
  },

  // AI Matchmaking — /barter/sessions/matchmaking/
  findMatch: (data) => api.post('/barter/sessions/matchmaking/', data),
};

export default barterService;
