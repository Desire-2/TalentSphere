import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { storeIntendedDestination } from '../../utils/redirectUtils';

const ExternalAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Check authentication and role using store state instead of localStorage
  if (!isAuthenticated || !user || user.role !== 'external_admin') {
    // Store the intended external admin destination
    storeIntendedDestination(location.pathname, {
      search: location.search,
      state: location.state
    });
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ExternalAdminRoute;
