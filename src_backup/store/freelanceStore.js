import { create } from 'zustand';
import { api } from '../api/axios';

export const useFreelanceStore = create((set, get) => ({
  // Jobs
  jobs: [],
  jobDetail: null,
  // Proposals
  proposals: [],
  proposalDetail: null,
  // Contracts
  contracts: [],
  contractDetail: null,
  // Milestones
  milestones: [],
  milestoneDetail: null,
  // Submissions
  submissions: [],
  submissionDetail: null,
  // AI
  aiResult: null,
  aiLoading: false,
  // Common
  isLoading: false,
  error: null,

  // ═══ JOBS ═══
  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/freelance/jobs/');
      set({ jobs: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        (err.response?.data && Object.values(err.response.data).flat().join(', ')) ||
        err.message ||
        'Ishlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
      set({ error: errorMsg, isLoading: false });
    }
  },
  fetchJob: async (id) => {
    try {
      const res = await api.get(`/freelance/jobs/${id}/`);
      set({ jobDetail: res.data });
    } catch (err) {
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        'Ish ma\'lumotlarini yuklashda xatolik';
      set({ error: errorMsg });
    }
  },
  createJob: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Client-side validation
      if (!data.title || data.title.trim().length < 5) {
        set({ error: 'Sarlavha kamida 5 ta belgidan iborat bo\'lishi kerak', isLoading: false });
        return false;
      }
      if (!data.description || data.description.trim().length < 20) {
        set({ error: 'Tavsif kamida 20 ta belgidan iborat bo\'lishi kerak', isLoading: false });
        return false;
      }
      if (data.budget && (isNaN(data.budget) || Number(data.budget) <= 0)) {
        set({ error: 'Byudjet musbat son bo\'lishi kerak', isLoading: false });
        return false;
      }

      const res = await api.post('/freelance/jobs/', data);
      set((s) => ({ jobs: [res.data, ...s.jobs], isLoading: false }));
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail ||
        (err.response?.data && Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ')) ||
        'Ish yaratishda xatolik. Iltimos, ma\'lumotlarni tekshirib qayta urinib ko\'ring.';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },
  updateJob: async (id, data) => {
    try {
      const res = await api.patch(`/freelance/jobs/${id}/`, data);
      set((s) => ({ jobs: s.jobs.map((j) => j.id === id ? res.data : j) }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },
  deleteJob: async (id) => {
    try {
      await api.delete(`/freelance/jobs/${id}/`);
      set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  // ═══ PROPOSALS ═══
  fetchProposal: async (id) => {
    try {
      const res = await api.get(`/freelance/proposals/${id}/`);
      set({ proposalDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },
  fetchProposals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/freelance/proposals/');
      set({ proposals: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },
  createProposal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/freelance/proposals/', data);
      set((s) => ({ proposals: [res.data, ...s.proposals], isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik', isLoading: false });
      return false;
    }
  },
  updateProposal: async (id, data) => {
    try {
      await api.patch(`/freelance/proposals/${id}/`, data);
      get().fetchProposals();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },
  acceptProposal: async (id, data) => {
    try {
      console.log('Sending accept request with payload:', data);
      await api.post(`/freelance/proposals/${id}/accept/`, data);
      get().fetchProposals();
    } catch (err) {
      console.error('Accept Proposal error response:', err.response?.data);
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik' });
    }
  },
  deleteProposal: async (id) => {
    try {
      await api.delete(`/freelance/proposals/${id}/`);
      set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  // ═══ CONTRACTS ═══
  fetchContracts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/freelance/contracts/');
      set({ contracts: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },
  fetchContract: async (id) => {
    try {
      const res = await api.get(`/freelance/contracts/${id}/`);
      set({ contractDetail: res.data });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  // ═══ MILESTONES ═══
  fetchMilestone: async (id) => {
    try {
      const res = await api.get(`/freelance/milestones/${id}/`);
      set({ milestoneDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },
  fetchMilestones: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/freelance/milestones/');
      set({ milestones: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },
  createMilestone: async (data) => {
    set({ error: null });
    try {
      const res = await api.post('/freelance/milestones/', data);
      set((s) => ({ milestones: [res.data, ...s.milestones] }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik' });
      return false;
    }
  },
  updateMilestone: async (id, data) => {
    try {
      await api.patch(`/freelance/milestones/${id}/`, data);
      get().fetchMilestones();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },
  fundMilestone: async (id) => {
    try {
      await api.post(`/freelance/milestones/${id}/fund/`);
      get().fetchMilestones();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
  releaseMilestone: async (id) => {
    try {
      await api.post(`/freelance/milestones/${id}/release/`);
      get().fetchMilestones();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
  deleteMilestone: async (id) => {
    try {
      await api.delete(`/freelance/milestones/${id}/`);
      set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  // ═══ SUBMISSIONS ═══
  fetchSubmission: async (id) => {
    try {
      const res = await api.get(`/freelance/submissions/${id}/`);
      set({ submissionDetail: res.data });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return null;
    }
  },
  fetchSubmissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/freelance/submissions/');
      set({ submissions: Array.isArray(res.data) ? res.data : (res.data.results || []), isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik', isLoading: false });
    }
  },
  createSubmission: async (data) => {
    set({ error: null });
    try {
      const res = await api.post('/freelance/submissions/', data);
      set((s) => ({ submissions: [res.data, ...s.submissions] }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Xatolik' });
      return false;
    }
  },
  updateSubmission: async (id, data) => {
    try {
      await api.patch(`/freelance/submissions/${id}/`, data);
      get().fetchSubmissions();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
      return false;
    }
  },
  approveSubmission: async (id) => {
    try {
      await api.post(`/freelance/submissions/${id}/approve/`);
      get().fetchSubmissions();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
  requestRevision: async (id) => {
    try {
      await api.post(`/freelance/submissions/${id}/request-revision/`);
      get().fetchSubmissions();
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },
  deleteSubmission: async (id) => {
    try {
      await api.delete(`/freelance/submissions/${id}/`);
      set((s) => ({ submissions: s.submissions.filter((s2) => s2.id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Xatolik' });
    }
  },

  // ═══ AI SERVICES ═══
  analyzeResume: async (resumeText) => {
    set({ aiLoading: true, aiResult: null, error: null });
    try {
      const res = await api.post('/freelance/ai/resume-analyzer/', { resume_text: resumeText });
      set({ aiResult: res.data, aiLoading: false });
      return true;
    } catch (err) {
      // 500 xatolikni qayta ishlash - AI xizmati ishlamayapti
      if (err.response?.status === 500 || err.response?.status === 502 || err.response?.status === 503) {
        console.warn('AI xizmati vaqtincha ishlamayapti (500)');
        set({
          error: 'AI xizmati vaqtincha ishlamayapti. Iltimos, keyinroq qayta urinib ko\'ring.',
          aiLoading: false,
          // Fallback ma'lumot
          aiResult: {
            analysis: 'AI xizmati vaqtincha ishlamayapti. Keyinroq qayta urinib ko\'ring.',
            skills: [],
            recommendations: ['AI xizmati ishga tushirilganda qayta urinib ko\'ring']
          }
        });
      } else {
        set({
          error: err.response?.data?.detail || 'Rezyume tahlil qilishda xatolik',
          aiLoading: false
        });
      }
      return false;
    }
  },
  generateScope: async (data) => {
    set({ aiLoading: true, aiResult: null, error: null });
    try {
      const res = await api.post('/freelance/ai/generate-scope/', data);
      set({ aiResult: res.data, aiLoading: false });
      return true;
    } catch (err) {
      // 500 xatolikni qayta ishlash
      if (err.response?.status === 500 || err.response?.status === 502 || err.response?.status === 503) {
        console.warn('AI generate-scope xizmati vaqtincha ishlamayapti (500)');
        set({
          error: 'AI xizmati vaqtincha ishlamayapti. Iltimos, keyinroq qayta urinib ko\'ring.',
          aiLoading: false,
          aiResult: {
            scope: 'AI xizmati vaqtincha ishlamayapti.',
            description: 'Loyiha doirasi avtomatik yaratilmadi. Iltimos, qo\'lda kiriting.',
            tasks: ['AI xizmati ishga tushirilganda qayta urinib ko\'ring']
          }
        });
      } else {
        set({
          error: err.response?.data?.detail || 'Loyiha doirasi yaratishda xatolik',
          aiLoading: false
        });
      }
      return false;
    }
  },
  generateAndSave: async (data) => {
    set({ aiLoading: true, aiResult: null, error: null });
    try {
      const res = await api.post('/freelance/ai/generate-and-save/', data);
      set({ aiResult: res.data, aiLoading: false });
      return true;
    } catch (err) {
      // 500 xatolikni qayta ishlash
      if (err.response?.status === 500 || err.response?.status === 502 || err.response?.status === 503) {
        console.warn('AI generate-and-save xizmati vaqtincha ishlamayapti (500)');
        set({
          error: 'AI xizmati vaqtincha ishlamayapti. Iltimos, keyinroq qayta urinib ko\'ring.',
          aiLoading: false,
          aiResult: {
            generated: false,
            message: 'AI xizmati vaqtincha ishlamayapti. Keyinroq qayta urinib ko\'ring.'
          }
        });
      } else {
        set({
          error: err.response?.data?.detail || 'AI yaratish va saqlashda xatolik',
          aiLoading: false
        });
      }
      return false;
    }
  },
  clearAiResult: () => set({ aiResult: null, error: null }),
}));
