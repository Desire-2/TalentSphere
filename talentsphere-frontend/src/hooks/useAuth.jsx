import { useAuthStore } from '../stores/authStore';

/**
 * Backwards-compatible facade for older components. The application now has
 * one Zustand-backed session source instead of a second React auth context.
 */
export const useAuth = () => {
  const auth = useAuthStore();

  return {
    ...auth,
    loading: !auth.isInitialized || auth.isLoading,
    login: (email, password) => auth.login({ email, password }),
    logout: () => auth.logout({ redirect: false }),
    updateUser: auth.setUser
  };
};

export const AuthProvider = ({ children }) => children;
