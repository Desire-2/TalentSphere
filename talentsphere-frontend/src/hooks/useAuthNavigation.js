import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { redirectToLogin, storeIntendedDestination } from '../utils/redirectUtils';

/**
 * Custom hook for handling authentication-aware navigation
 * Provides utilities for redirecting to login while preserving intended destination
 */
export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  /**
   * Navigate to login while storing the current location
   * @param {Object} options - Navigation options
   */
  const navigateToLogin = (options = {}) => {
    redirectToLogin(navigate, location, options);
  };

  /**
   * Navigate to a protected route, redirecting to login if not authenticated
   * @param {string} path - The path to navigate to
   * @param {Object} options - Navigation options
   */
  const navigateToProtectedRoute = (path, options = {}) => {
    if (!isAuthenticated) {
      // Store the intended destination
      storeIntendedDestination(path, {
        search: options.search || '',
        state: options.state || null
      });
      
      // Redirect to login
      navigate('/login', {
        state: { 
          from: {
            pathname: path,
            search: options.search || '',
            state: options.state || null
          }
        },
        replace: true
      });
      return;
    }
    
    // User is authenticated, navigate normally
    navigate(path, options);
  };

  /**
   * Handle bookmark/apply action that requires authentication
   * @param {function} action - The action to perform if authenticated
   * @param {Object} options - Options for the redirect
   */
  const requireAuth = (action, options = {}) => {
    if (!isAuthenticated) {
      navigateToLogin(options);
      return;
    }
    
    // User is authenticated, perform the action
    action();
  };

  /**
   * Check if user can access a specific path
   * @param {string} path - The path to check
   * @returns {boolean} Whether user can access the path
   */
  const canAccess = (path) => {
    if (!isAuthenticated) return false;
    
    // Import the utility function here to avoid circular dependencies
    const { isPathAllowedForUser } = require('../utils/redirectUtils');
    return isPathAllowedForUser(path, user);
  };

  /**
   * Navigate with role-based redirection
   * If user tries to access a path they don't have permission for,
   * redirect them to an appropriate page
   * @param {string} path - The path to navigate to
   * @param {Object} options - Navigation options
   */
  const navigateWithRoleCheck = (path, options = {}) => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    
    if (!canAccess(path)) {
      // Redirect to appropriate dashboard based on role
      const dashboardMap = {
        'admin': '/admin',
        'external_admin': '/external-admin',
        'employer': '/dashboard',
        'job_seeker': '/dashboard'
      };
      
      const redirectPath = dashboardMap[user.role] || '/dashboard';
      navigate(redirectPath, { 
        ...options,
        state: { 
          ...options.state,
          error: `You don't have permission to access ${path}` 
        }
      });
      return;
    }
    
    navigate(path, options);
  };

  return {
    navigateToLogin,
    navigateToProtectedRoute,
    navigateWithRoleCheck,
    requireAuth,
    canAccess,
    isAuthenticated,
    user
  };
};