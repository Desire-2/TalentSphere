import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !authService.isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;
