import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If specific role required but user doesn't have it, redirect to jobs page with error
    return <Navigate to="/jobs" state={{ error: `Only ${requiredRole}s can access this page` }} replace />;
  }

  return children;
};

export default ProtectedRoute;

