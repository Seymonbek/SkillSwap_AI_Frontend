import { create } from 'zustand';
import { authService } from '@/shared/api';
import { clearStoredAuth, hasActiveSession } from '@/shared/lib/auth';
import { normalizeUser } from '@/shared/lib/user';

export const useAuthStore = create((set, get) => {
  const persistUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, twoFactorEnabled: false });
      return null;
    }

    const normalizedUser = normalizeUser(nextUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    set({
      user: normalizedUser,
      isAuthenticated: true,
      twoFactorEnabled: !!normalizedUser.is_two_factor_enabled,
    });
    return normalizedUser;
  };

  return ({

  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  wallet: null,
  kycStatus: null,
  twoFactorEnabled: false,

  // Actions
  setUser: (user) => persistUser(user),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });

      if (response.data.requires_2fa) {
        set({ isLoading: false });
        return { success: false, requires_2fa: true, temp_token: response.data.temp_token };
      }

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const userResponse = await authService.getMe();
      const user = persistUser(userResponse.data);
      set({ user, isAuthenticated: true, isLoading: false, twoFactorEnabled: !!user?.is_two_factor_enabled });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || "Login amalga oshmadi";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  verify2FA: async (tempToken, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.verifyLogin2FA({ temp_token: tempToken, code });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      const userRes = await authService.getMe();
      const user = persistUser(userRes.data);
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || "2FA kodi noto'g'ri";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.createUser({
        email: data.email,
        password: data.password,
        re_password: data.re_password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errors = error.response?.data || { detail: "Ro'yxatdan o'tishda xatolik" };
      set({ error: errors, isLoading: false });
      return { success: false, error: errors };
    }
  },

  logout: () => {
    clearStoredAuth();
    set({ user: null, isAuthenticated: false, error: null, wallet: null, kycStatus: null });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await authService.getMe();
      const user = persistUser(response.data);
      return user;
    } catch {
      get().logout();
      return null;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const isFormData = data instanceof FormData;
      const response = await authService.updateMe(data, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined);
      const user = persistUser(response.data);
      set({ user, isLoading: false });
      return { success: true, user };
    } catch (error) {
      set({ error: error.response?.data, isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  changePassword: async (current_password, new_password) => {
    try {
      await authService.setPassword({ current_password, new_password });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  resetPassword: async (email) => {
    try {
      await authService.resetPassword({ email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // 2FA
  setup2FA: async () => {
    try {
      const res = await authService.setup2FA();
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  confirm2FA: async (code) => {
    try {
      const res = await authService.verify2FA({ code });
      set({ twoFactorEnabled: true });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  disable2FA: async () => {
    try {
      await authService.disable2FA();
      set({ twoFactorEnabled: false });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // KYC
  fetchKYCStatus: async () => {
    try {
      const res = await authService.getKYCStatus();
      set({ kycStatus: res.data });
      return res.data;
    } catch {
      return null;
    }
  },

  submitKYC: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await authService.submitKYC(formData);
      set({ kycStatus: res.data, isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  // Portfolio
  fetchPortfolio: async () => {
    try {
      const res = await authService.getPortfolio();
      return res.data?.results || res.data || [];
    } catch {
      return [];
    }
  },

  addPortfolioItem: async (data) => {
    try {
      const res = await authService.addPortfolioItem(data);
      return { success: true, item: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  deletePortfolioItem: async (id) => {
    try {
      await authService.deletePortfolioItem(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Reviews
  fetchReviews: async (params) => {
    try {
      const res = await authService.getReviews(params);
      return res.data?.results || res.data || [];
    } catch {
      return [];
    }
  },

  // Skill Tests
  fetchSkillTests: async () => {
    try {
      const res = await authService.getSkillTests();
      return res.data?.results || res.data || [];
    } catch {
      return [];
    }
  },

  createSkillTest: async (data) => {
    try {
      const res = await authService.createSkillTest(data);
      return { success: true, test: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  // Initialize auth state from localStorage
  initAuth: () => {
    if (!hasActiveSession()) {
      clearStoredAuth();
      set({ user: null, isAuthenticated: false, twoFactorEnabled: false });
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = persistUser(JSON.parse(userStr));
        set({ user, isAuthenticated: true, twoFactorEnabled: !!user?.is_two_factor_enabled });
      } catch {
        clearStoredAuth();
        set({ user: null, isAuthenticated: false, twoFactorEnabled: false });
      }
      return;
    }

    set({ user: null, isAuthenticated: false, twoFactorEnabled: false });
  },
  });
});
