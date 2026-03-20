import api from './api';

const freelanceService = {
  // Jobs — /freelance/jobs/
  getJobs: (params) => api.get('/freelance/jobs/', { params }),
  getJob: (id) => api.get(`/freelance/jobs/${id}/`),
  createJob: (data) => api.post('/freelance/jobs/', data),
  updateJob: (id, data) => api.patch(`/freelance/jobs/${id}/`, data),
  deleteJob: (id) => api.delete(`/freelance/jobs/${id}/`),

  // Proposals — /freelance/proposals/
  getProposals: (params) => api.get('/freelance/proposals/', { params }),
  getProposal: (id) => api.get(`/freelance/proposals/${id}/`),
  createProposal: (data) => api.post('/freelance/proposals/', data),
  updateProposal: (id, data) => api.patch(`/freelance/proposals/${id}/`, data),
  deleteProposal: (id) => api.delete(`/freelance/proposals/${id}/`),
  acceptProposal: (id, data) => api.post(`/freelance/proposals/${id}/accept/`, data),

  // Contracts — /freelance/contracts/
  getContracts: (params) => api.get('/freelance/contracts/', { params }),
  getContract: (id) => api.get(`/freelance/contracts/${id}/`),

  // Milestones — /freelance/milestones/
  getMilestones: (params) => api.get('/freelance/milestones/', { params }),
  getMilestone: (id) => api.get(`/freelance/milestones/${id}/`),
  createMilestone: (data) => api.post('/freelance/milestones/', data),
  updateMilestone: (id, data) => api.patch(`/freelance/milestones/${id}/`, data),
  deleteMilestone: (id) => api.delete(`/freelance/milestones/${id}/`),
  fundMilestone: (id, data) => api.post(`/freelance/milestones/${id}/fund/`, data),
  releaseMilestone: (id, data) => api.post(`/freelance/milestones/${id}/release/`, data),

  // Work Submissions — /freelance/submissions/
  getSubmissions: (params) => api.get('/freelance/submissions/', { params }),
  getSubmission: (id) => api.get(`/freelance/submissions/${id}/`),
  createSubmission: (data) => api.post('/freelance/submissions/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateSubmission: (id, data) => api.patch(`/freelance/submissions/${id}/`, data),
  deleteSubmission: (id) => api.delete(`/freelance/submissions/${id}/`),
  approveSubmission: (id, data) => api.post(`/freelance/submissions/${id}/approve/`, data),
  requestRevision: (id, data) => api.post(`/freelance/submissions/${id}/request-revision/`, data),

  // AI Features
  generateJob: (data) => api.post('/freelance/ai/generate-and-save/', data),
  generateScope: (data) => api.post('/freelance/ai/generate-scope/', data),
  analyzeResume: (data) => api.post('/freelance/ai/resume-analyzer/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default freelanceService;
