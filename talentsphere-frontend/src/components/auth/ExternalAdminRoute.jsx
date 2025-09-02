import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth';

const ExternalAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !authService.isExternalAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ExternalAdminRoute;
