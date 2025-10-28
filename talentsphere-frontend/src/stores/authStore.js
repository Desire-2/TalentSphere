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
      console.log('🔐 Starting registration process...', { email: userData.email, role: userData.role });
      
      const data = await authService.register(userData);
      
      console.log('✅ Registration successful', { user: data.user, hasToken: !!data.token });
      
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Check if the error indicates account already exists
      const errorMessage = error.message || 'Registration failed';

      // If the registration request likely reached the server but the response failed (CORS, proxy, etc.)
      // try a follow-up login with the same credentials. This handles the case where the user account was
      // created successfully but the client interpreted the response as a network failure.
      if (
        errorMessage.includes('Cannot connect to server') &&
        userData?.email &&
        userData?.password
      ) {
        try {
          console.warn('⚠️ Registration response failed, attempting fallback login...');
          const fallbackLogin = await authService.login({
            email: userData.email,
            password: userData.password
          });

          console.log('✅ Fallback login succeeded after registration error');

          set({
            user: fallbackLogin.user,
            token: fallbackLogin.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return fallbackLogin;
        } catch (loginError) {
          console.error('❌ Fallback login after registration failed:', loginError);
        }
      }
      
      // If the account was created but there's a token/session issue, 
      // check localStorage for the token
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        console.log('⚠️ Account exists but initial setup had issues. Using cached credentials.');
        set({
          user: user,
          token: token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return { user, token };
      }
      
      set({
        isLoading: false,
        error: errorMessage
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
      console.warn('Logout request failed, clearing client state anyway:', error);
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

  // Update user data directly (for cases where profile is updated via different service)
  setUser: (userData) => {
    set({ user: userData });
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(userData));
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

