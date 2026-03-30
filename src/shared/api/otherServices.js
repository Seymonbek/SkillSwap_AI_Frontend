import api from './api';

const normalizeSubscriptionPurchasePayload = (data) => {
  if (typeof data === 'string') {
    return { plan_slug: data };
  }

  const planSlug = data?.plan_slug || data?.plan?.slug || data?.slug;
  return { plan_slug: planSlug };
};

// Search Service — /search/
export const searchService = {
  searchJobs: (params) => api.get('/search/jobs/', { params }),
  searchUsers: (params) => api.get('/search/users/', { params }),
};

// Subscriptions Service — /subscriptions/
export const subscriptionsService = {
  getPlans: (params) => api.get('/subscriptions/', { params }),
  getPlan: (id) => api.get(`/subscriptions/${id}/`),
  buySubscription: (data) => api.post('/subscriptions/buy/', normalizeSubscriptionPurchasePayload(data)),
  getMySubscription: () => api.get('/subscriptions/my-subscription/').catch(() => ({ data: null })),
};

// Admin / Moderation Service — /moderation/
export const adminService = {
  // Analytics
  getRevenueAnalytics: () => api.get('/moderation/analytics/revenue/'),
  getPlatformStats: () => api.get('/moderation/analytics/stats/'),
  getTokenAnalytics: () => api.get('/moderation/analytics/tokens/'),

  // Disputes
  getDisputes: (params) => api.get('/moderation/disputes/', { params }),
  getDispute: (id) => api.get(`/moderation/disputes/${id}/`),
  resolveDispute: (id, data) => api.post(`/moderation/disputes/${id}/resolve/`, data),

  // KYC
  getKYCRequests: (params) => api.get('/moderation/kyc/', { params }),
  getKYCRequest: (id) => api.get(`/moderation/kyc/${id}/`),
  reviewKYC: (id, data) => api.post(`/moderation/kyc/${id}/review/`, data),

  // Users
  getManagedUsers: (params) => api.get('/moderation/users/', { params }),
  getManagedUser: (id) => api.get(`/moderation/users/${id}/`),
  banUser: (id, data) => api.post(`/moderation/users/${id}/ban/`, data),
};

// Common Service — /common/
export const commonService = {
  getSettings: (params) => api.get('/common/settings/', { params }),
  getSetting: (id) => api.get(`/common/settings/${id}/`),
};

// Dispute Service (User-facing) — /dispute/
export const disputeService = {
  createDispute: (data) => api.post('/dispute/create/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  resolveDispute: (data) => api.post('/dispute/resolve/', data),
};
