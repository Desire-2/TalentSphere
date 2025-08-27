import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

const AuthInitializer = ({ children }) => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    initialize();
  }, [initialize]);

  return children;
};

export default AuthInitializer;
