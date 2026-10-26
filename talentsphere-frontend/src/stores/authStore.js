import { create } from 'zustand';
import { authService } from '../services/auth';

let logoutPromise = null;
let initializePromise = null;
let storageSyncTimer = null;

const getCachedSession = () => ({
  token: authService.getToken(),
  user: authService.getCurrentUser()
});

const saveUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

const sessionReturnPath = () => {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const redirectAfterSessionExpiry = () => {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;

  const returnTo = sessionReturnPath();
  window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
};

const initialSession = getCachedSession();

export const useAuthStore = create((set, get) => ({
  user: initialSession.user,
  token: initialSession.token,
  // Route guards wait for initialize() before making a redirect decision.
  isAuthenticated: Boolean(
    initialSession.token &&
    initialSession.user &&
    !authService.isTokenExpired(0)
  ),
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Login failed' });
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
        isInitialized: true,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';

      // If the account was created but the response was interrupted, recover
      // with a login instead of leaving a half-created client session.
      if (
        errorMessage.includes('Cannot connect to server') &&
        userData?.email &&
        userData?.password
      ) {
        try {
          const fallbackLogin = await authService.login({
            email: userData.email,
            password: userData.password
          });
          set({
            user: fallbackLogin.user,
            token: fallbackLogin.token,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null
          });
          return fallbackLogin;
        } catch {
          // Fall through to the normal registration error.
        }
      }

      const { token, user } = getCachedSession();
      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null
        });
        return { user, token };
      }

      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  logout: async ({ redirect = true } = {}) => {
    if (logoutPromise) return logoutPromise;

    const hadToken = Boolean(authService.getToken());
    set({ isLoading: true });

    logoutPromise = (async () => {
      try {
        if (hadToken) {
          await authService.logout();
        } else {
          authService.clearStoredSession();
        }
      } finally {
        authService.clearStoredSession();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          error: null
        });

        if (redirect && typeof window !== 'undefined') {
          window.location.replace('/');
        }
      }
    })().finally(() => {
      logoutPromise = null;
    });

    return logoutPromise;
  },

  // Clear only local state. This is used for expired sessions and cross-tab
  // changes; it must never make another authenticated request.
  clearSession: ({ redirect = false } = {}) => {
    authService.clearStoredSession();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      error: null
    });

    if (redirect) redirectAfterSessionExpiry();
  },

  handleSessionExpired: () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      get().clearSession();
      return;
    }
    get().clearSession({ redirect: true });
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateProfile(profileData);
      saveUser(data.user);
      set({ user: data.user, isLoading: false, error: null });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Profile update failed' });
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.changePassword(passwordData);
      set({ isLoading: false, error: null });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Password change failed' });
      throw error;
    }
  },

  refreshProfile: async () => {
    if (!get().isAuthenticated) return null;

    set({ isLoading: true, error: null });
    try {
      const data = await authService.getProfile();
      saveUser(data);
      set({ user: data, isLoading: false, error: null });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Failed to refresh profile' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (userData) => {
    saveUser(userData);
    const token = authService.getToken();
    set({
      user: userData,
      token,
      isAuthenticated: Boolean(token && userData)
    });
  },

  initialize: async () => {
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      const { token, user } = getCachedSession();

      if (!token || !user) {
        get().clearSession();
        return false;
      }

      set({ user, token, isAuthenticated: true, isInitialized: false, isLoading: true });

      try {
        // Recover a recently expired access token before deciding that the
        // cached browser session is invalid. This matters after a sleeping
        // tab is resumed and uses the backend's bounded refresh grace period.
        if (authService.isTokenExpired(0)) {
          const refreshed = await authService.refreshSession();
          if (!refreshed) {
            get().clearSession();
            return false;
          }
        }

        const response = await authService.verifyToken(authService.getToken());
        if (!response?.valid) {
          get().clearSession();
          return false;
        }

        // The verify endpoint intentionally returns a small payload; merge it
        // with the cached profile so session validation does not erase fields
        // used by headers and dashboards.
        const verifiedUser = response.user ? { ...user, ...response.user } : user;
        saveUser(verifiedUser);
        set({
          user: verifiedUser,
          token: authService.getToken(),
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null
        });
        return true;
      } catch (error) {
        // A temporary backend outage must not destroy an otherwise unexpired
        // local session. The session manager will validate it later.
        if (
          error?.code !== 'NETWORK_ERROR' &&
          (error?.status == null || error.status < 500)
        ) {
          get().clearSession();
          return false;
        }

        set({ isInitialized: true, isLoading: false, error: null });
        return true;
      }
    })().finally(() => {
      initializePromise = null;
    });

    return initializePromise;
  },

  validateSession: async () => {
    if (!get().isAuthenticated) return false;

    try {
      const isValid = await authService.validateSession();
      return isValid;
    } catch (error) {
      if (error?.code === 'NETWORK_ERROR') throw error;
      return false;
    }
  },

  refreshSession: async () => {
    if (!get().isAuthenticated) return false;

    const refreshed = await authService.refreshSession();
    if (refreshed) {
      set({ token: authService.getToken(), isAuthenticated: true });
    }
    return refreshed;
  },

  isTokenExpired: (bufferMinutes = 5) => authService.isTokenExpired(bufferMinutes),
  getTokenExpiration: () => authService.getTokenExpiration()
}));

if (typeof window !== 'undefined') {
  window.addEventListener('session-expired', () => {
    useAuthStore.getState().handleSessionExpired();
  });

  // Storage events are delivered after the originating tab has finished its
  // writes. Debouncing lets token and user updates arrive as one session.
  window.addEventListener('storage', (event) => {
    if (event.key !== 'token' && event.key !== 'user') return;

    clearTimeout(storageSyncTimer);
    storageSyncTimer = setTimeout(() => {
      const { token, user } = getCachedSession();
      if (!token || !user || authService.isTokenExpired(0)) {
        useAuthStore.getState().clearSession({ redirect: true });
        return;
      }

      useAuthStore.setState({
        token,
        user,
        isAuthenticated: true,
        isInitialized: true,
        error: null
      });
    }, 0);
  });
}
