import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { storeIntendedDestination, buildFullPath } from '../../utils/redirectUtils';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Store the current location as intended destination
    storeIntendedDestination(location.pathname, {
      search: location.search,
      state: location.state
    });
    
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If specific role required but user doesn't have it, redirect to appropriate dashboard
    const dashboardMap = {
      'admin': '/admin',
      'external_admin': '/external-admin',
      'employer': '/dashboard',
      'job_seeker': '/dashboard'
    };
    
    const redirectPath = dashboardMap[user.role] || '/dashboard';
    
    return <Navigate 
      to={redirectPath} 
      state={{ 
        error: `Only ${requiredRole}s can access this page. You have been redirected to your dashboard.`
      }} 
      replace 
    />;
  }

  return children;
};

export default ProtectedRoute;

