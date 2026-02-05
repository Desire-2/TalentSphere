import { create } from 'zustand';
import { authService } from '../services/auth';

// Listen for session expiration events from API service
if (typeof window !== 'undefined') {
  window.addEventListener('session-expired', () => {
    console.log('🔒 Session expired event received, clearing auth state');
    const store = useAuthStore.getState();
    store.logout();
  });
  
  // Listen for storage changes to sync auth state across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'user') {
      const store = useAuthStore.getState();
      if (!e.newValue) {
        // Token/user was removed in another tab
        console.log('🔒 Auth data cleared in another tab, syncing...');
        store.logout();
      } else {
        // Token/user was updated in another tab
        console.log('🔒 Auth data updated in another tab, syncing...');
        const newToken = localStorage.getItem('token');
        const newUser = authService.getCurrentUser();
        if (newToken && newUser) {
          store.user = newUser;
          store.token = newToken;
          store.isAuthenticated = true;
        }
      }
    }
  });
}

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
      // Redirect to home page after successful logout
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
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
      // Redirect to home page even if logout fails
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
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
  },

  // Validate current session
  validateSession: async () => {
    if (!get().isAuthenticated) return false;
    
    try {
      const isValid = await authService.validateSession();
      
      if (!isValid) {
        // Session is invalid, logout
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: 'Session expired'
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  // Refresh session token
  refreshSession: async () => {
    if (!get().isAuthenticated) return false;
    
    try {
      const refreshed = await authService.refreshSession();
      
      if (refreshed) {
        // Update token in state
        const newToken = authService.getToken();
        const user = authService.getCurrentUser();
        set({
          token: newToken,
          user: user,
          isAuthenticated: true
        });
      }
      
      return refreshed;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  // Check if token is expired or about to expire
  isTokenExpired: (bufferMinutes = 5) => {
    return authService.isTokenExpired(bufferMinutes);
  },

  // Get token expiration time
  getTokenExpiration: () => {
    return authService.getTokenExpiration();
  }
}));

