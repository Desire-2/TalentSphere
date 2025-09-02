import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth';

const AnyAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !authService.isAnyAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AnyAdminRoute;
