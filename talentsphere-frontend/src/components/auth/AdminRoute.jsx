import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { storeIntendedDestination } from '../../utils/redirectUtils';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const lastStoredPath = useRef(null);

  // Store intended destination only when location changes and user is not authenticated as admin
  useEffect(() => {
    if ((!isAuthenticated || !user || user.role !== 'admin') && lastStoredPath.current !== location.pathname) {
      storeIntendedDestination(location.pathname, {
        search: location.search,
        state: location.state
      });
      lastStoredPath.current = location.pathname;
    }
  }, [isAuthenticated, user, location.pathname, location.search, location.state]);

  // Check authentication and role using store state instead of localStorage
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
