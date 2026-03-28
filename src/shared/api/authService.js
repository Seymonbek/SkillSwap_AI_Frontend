import api from './api';

const authService = {
  // JWT Auth
  login: (data) => api.post('/auth/jwt/create/', data),
  refreshToken: (data) => api.post('/auth/jwt/refresh/', data),
  verifyToken: (data) => api.post('/auth/jwt/verify/', data),

  // Users
  createUser: (data) => api.post('/auth/users/', data),
  getUsers: (params) => api.get('/auth/users/', { params }),
  getUserById: (id) => api.get(`/auth/users/${id}/`),
  getMe: () => api.get('/auth/users/me/'),
  updateMe: (data, config) => api.patch('/auth/users/me/', data, config),
  deleteMe: () => api.delete('/auth/users/me/'),

  // User activation
  activateUser: (data) => api.post('/auth/users/activation/', data),
  resendActivation: (data) => api.post('/auth/users/resend_activation/', data),

  // Password
  setPassword: (data) => api.post('/auth/users/set_password/', data),
  resetPassword: (data) => api.post('/auth/users/reset_password/', data),
  resetPasswordConfirm: (data) => api.post('/auth/users/reset_password_confirm/', data),

  // Email
  setEmail: (data) => api.post('/auth/users/set_email/', data),
  resetEmail: (data) => api.post('/auth/users/reset_email/', data),
  resetEmailConfirm: (data) => api.post('/auth/users/reset_email_confirm/', data),

  // 2FA - /users/2fa/
  setup2FA: () => api.post('/users/2fa/enable_2fa_setup/'),
  verify2FA: (data) => api.post('/users/2fa/enable_2fa_confirm/', data),
  verifyLogin2FA: (data) => api.post('/auth/jwt/2fa/verify/', data),
  disable2FA: () => api.post('/users/2fa/disable_2fa/'),

  // KYC - /users/kyc/
  getKYCStatus: () => api.get('/users/kyc/status/'),
  submitKYC: (data) => api.post('/users/kyc/submit/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Portfolio - /users/portfolio/
  getPortfolio: (params) => api.get('/users/portfolio/', { params }),
  getPortfolioItem: (id) => api.get(`/users/portfolio/${id}/`),
  addPortfolioItem: (data) => api.post('/users/portfolio/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updatePortfolioItem: (id, data, config) => api.patch(`/users/portfolio/${id}/`, data, config),
  deletePortfolioItem: (id) => api.delete(`/users/portfolio/${id}/`),

  // Reviews - /users/reviews/
  getReviews: (params) => api.get('/users/reviews/', { params }),
  getReview: (id) => api.get(`/users/reviews/${id}/`),
  createReview: (data) => api.post('/users/reviews/', data),
  updateReview: (id, data) => api.patch(`/users/reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`/users/reviews/${id}/`),

  // Skill Tests - /users/skill-tests/
  getSkillTests: (params) => api.get('/users/skill-tests/', { params }),
  getSkillTest: (id) => api.get(`/users/skill-tests/${id}/`),
  createSkillTest: (data) => api.post('/users/skill-tests/', data),
  updateSkillTest: (id, data) => api.patch(`/users/skill-tests/${id}/`, data),
  deleteSkillTest: (id) => api.delete(`/users/skill-tests/${id}/`),

  // Search Users - /users/search/
  searchUsers: (params) => api.get('/users/search/', { params }),
  getUserByIdSearch: (id) => api.get(`/users/search/${id}/`),
  exportUserData: () => api.get('/users/search/export_data/'),
};

export default authService;
