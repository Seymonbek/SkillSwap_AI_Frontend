import { create } from 'zustand';
import { disputeService } from '@/shared/api';

export const useDisputeStore = create((set) => ({
  // State
  disputes: [],
  currentDispute: null,
  isLoading: false,
  error: null,

  // Create Dispute — /dispute/create/
  createDispute: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await disputeService.createDispute(data);
      set((state) => ({
        disputes: [res.data, ...state.disputes],
        isLoading: false,
      }));
      return { success: true, dispute: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  // Resolve Dispute — /dispute/resolve/
  resolveDispute: async (data) => {
    set({ isLoading: true });
    try {
      const res = await disputeService.resolveDispute(data);
      set((state) => ({
        disputes: state.disputes.map((d) =>
          d.id === data.dispute_id ? { ...d, ...res.data } : d
        ),
        isLoading: false,
      }));
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },
}));
