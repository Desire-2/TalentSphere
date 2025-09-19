import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const AnyAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Check authentication and role using store state instead of localStorage
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'external_admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AnyAdminRoute;
