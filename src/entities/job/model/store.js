import { create } from 'zustand';
import { freelanceService } from '@/shared/api';

export const useJobStore = create((set, get) => ({
  // State
  jobs: [],
  myJobs: [],
  currentJob: null,
  proposals: [],
  contracts: [],
  currentContract: null,
  milestones: [],
  submissions: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    skills: [],
    min_budget: null,
    max_budget: null,
    status: '',
    ordering: '-created_at',
  },
  pagination: { count: 0, next: null, previous: null },

  // Filter actions
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({
    filters: { search: '', skills: [], min_budget: null, max_budget: null, status: '', ordering: '-created_at' },
  }),

  // Jobs — /freelance/jobs/
  fetchJobs: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const queryParams = {};
      if (filters.search) queryParams.search = filters.search;
      if (filters.skills?.length) queryParams.skills_required = filters.skills.join(',');
      if (filters.min_budget) queryParams.min_budget = filters.min_budget;
      if (filters.max_budget) queryParams.max_budget = filters.max_budget;
      if (filters.status) queryParams.status = filters.status;
      if (filters.ordering) queryParams.ordering = filters.ordering;
      Object.assign(queryParams, params);

      const res = await freelanceService.getJobs(queryParams);
      const data = res.data;
      set({
        jobs: data?.results || data || [],
        pagination: {
          count: data?.count || 0,
          next: data?.next || null,
          previous: data?.previous || null,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
    }
  },

  fetchJob: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await freelanceService.getJob(id);
      set({ currentJob: res.data, isLoading: false });
      return res.data;
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return null;
    }
  },

  createJob: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await freelanceService.createJob(data);
      set((state) => ({ myJobs: [res.data, ...state.myJobs], isLoading: false }));
      return { success: true, job: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  updateJob: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await freelanceService.updateJob(id, data);
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? res.data : j)),
        myJobs: state.myJobs.map((j) => (j.id === id ? res.data : j)),
        currentJob: state.currentJob?.id === id ? res.data : state.currentJob,
        isLoading: false,
      }));
      return { success: true, job: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  deleteJob: async (id) => {
    try {
      await freelanceService.deleteJob(id);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        myJobs: state.myJobs.filter((j) => j.id !== id),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // AI Features
  generateScope: async (data) => {
    try {
      const res = await freelanceService.generateScope(data);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  generateAndSaveJob: async (data) => {
    try {
      const res = await freelanceService.generateJob(data);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  analyzeResume: async (data) => {
    try {
      const res = await freelanceService.analyzeResume(data);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Proposals — /freelance/proposals/
  fetchProposals: async (params = {}) => {
    try {
      const res = await freelanceService.getProposals(params);
      const data = res.data?.results || res.data || [];
      set({ proposals: data });
      return data;
    } catch (error) {
      set({ error: error.response?.data });
      return [];
    }
  },

  createProposal: async (data) => {
    set({ isLoading: true });
    try {
      const res = await freelanceService.createProposal(data);
      set((state) => ({ proposals: [res.data, ...state.proposals], isLoading: false }));
      return { success: true, proposal: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  acceptProposal: async (id, data = {}) => {
    try {
      const res = await freelanceService.acceptProposal(id, data);
      set((state) => ({
        proposals: state.proposals.map((p) => (p.id === id ? { ...p, status: 'ACCEPTED' } : p)),
      }));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Contracts — /freelance/contracts/
  fetchContracts: async (params = {}) => {
    try {
      const res = await freelanceService.getContracts(params);
      const data = res.data?.results || res.data || [];
      set({ contracts: data });
      return data;
    } catch (error) {
      set({ error: error.response?.data });
      return [];
    }
  },

  fetchContract: async (id) => {
    try {
      const res = await freelanceService.getContract(id);
      set({ currentContract: res.data });
      return res.data;
    } catch {
      return null;
    }
  },

  // Milestones — /freelance/milestones/
  fetchMilestones: async (contractId) => {
    try {
      const res = await freelanceService.getMilestones({ contract: contractId });
      const data = res.data?.results || res.data || [];
      set({ milestones: data });
      return data;
    } catch (error) {
      set({ error: error.response?.data });
      return [];
    }
  },

  createMilestone: async (data) => {
    try {
      const res = await freelanceService.createMilestone(data);
      set((state) => ({ milestones: [...state.milestones, res.data] }));
      return { success: true, milestone: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  fundMilestone: async (id) => {
    try {
      const res = await freelanceService.fundMilestone(id, {});
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === id ? res.data : m)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  releaseMilestone: async (id) => {
    try {
      const res = await freelanceService.releaseMilestone(id, {});
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === id ? res.data : m)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Work Submissions — /freelance/submissions/
  fetchSubmissions: async (params = {}) => {
    try {
      const res = await freelanceService.getSubmissions(params);
      const data = res.data?.results || res.data || [];
      set({ submissions: data });
      return data;
    } catch {
      return [];
    }
  },

  createSubmission: async (data) => {
    try {
      const res = await freelanceService.createSubmission(data);
      set((state) => ({ submissions: [...state.submissions, res.data] }));
      return { success: true, submission: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  approveSubmission: async (id) => {
    try {
      const res = await freelanceService.approveSubmission(id, {});
      set((state) => ({
        submissions: state.submissions.map((s) => (s.id === id ? res.data : s)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  requestRevision: async (id, data = {}) => {
    try {
      const res = await freelanceService.requestRevision(id, data);
      set((state) => ({
        submissions: state.submissions.map((s) => (s.id === id ? res.data : s)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },
}));
