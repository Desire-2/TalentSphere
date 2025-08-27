import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set, get) => ({
  // State
  user: authService.getCurrentUser(),
  token: authService.getToken(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Login error:', error);
      set({
        isLoading: false,
        error: error.message || 'Login failed'
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      set({
        isLoading: false,
        error: error.message || 'Registration failed'
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateProfile(profileData);
      set({
        user: data.user,
        isLoading: false,
        error: null
      });
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      set({
        isLoading: false,
        error: error.message || 'Profile update failed'
      });
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.changePassword(passwordData);
      set({
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Password change error:', error);
      set({
        isLoading: false,
        error: error.message || 'Password change failed'
      });
      throw error;
    }
  },

  refreshProfile: async () => {
    if (!get().isAuthenticated) return;
    
    set({ isLoading: true, error: null });
    try {
      const data = await authService.getProfile();
      set({
        user: data,
        isLoading: false,
        error: null
      });
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Profile refresh error:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to refresh profile'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Initialize auth state from localStorage
  initialize: () => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    const isAuthenticated = authService.isAuthenticated();
    
    set({
      user,
      token,
      isAuthenticated,
      isLoading: false,
      error: null
    });
  }
}));

