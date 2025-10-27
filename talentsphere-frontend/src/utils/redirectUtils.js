/**
 * Redirect utility functions for handling authentication redirects
 * Provides consistent redirect behavior across the application
 */

/**
 * Store the intended destination before redirecting to login
 * @param {string} path - The path user intended to visit
 * @param {Object} options - Additional options
 * @param {Object} options.state - Additional state to preserve
 * @param {string} options.search - Query parameters to preserve
 */
export const storeIntendedDestination = (path, options = {}) => {
  const destination = {
    pathname: path,
    search: options.search || '',
    state: options.state || null,
    timestamp: Date.now()
  };
  
  localStorage.setItem('intendedDestination', JSON.stringify(destination));
  
  // Also store in sessionStorage as backup (survives page refresh but not new tabs)
  sessionStorage.setItem('intendedDestination', JSON.stringify(destination));
};

/**
 * Retrieve and clear the stored intended destination
 * @returns {Object|null} The stored destination or null if none exists
 */
export const getAndClearIntendedDestination = () => {
  // Try localStorage first, then sessionStorage
  let stored = localStorage.getItem('intendedDestination') || 
               sessionStorage.getItem('intendedDestination');
  
  if (!stored) return null;
  
  try {
    const destination = JSON.parse(stored);
    
    // Check if the stored destination is too old (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - destination.timestamp > oneHour) {
      clearIntendedDestination();
      return null;
    }
    
    // Clear the stored destination
    clearIntendedDestination();
    
    return destination;
  } catch (error) {
    console.error('Error parsing stored destination:', error);
    clearIntendedDestination();
    return null;
  }
};

/**
 * Clear stored intended destination
 */
export const clearIntendedDestination = () => {
  localStorage.removeItem('intendedDestination');
  sessionStorage.removeItem('intendedDestination');
};

/**
 * Get the redirect path after successful login based on user role and intended destination
 * @param {Object} user - The authenticated user object
 * @param {Object} intendedDestination - The stored intended destination
 * @param {string} defaultPath - Default path if no intended destination
 * @returns {Object} Navigation object with pathname, search, and state
 */
export const getPostLoginRedirect = (user, intendedDestination = null, defaultPath = '/dashboard') => {
  // If we have an intended destination, use it (unless it's admin-only and user isn't admin)
  if (intendedDestination) {
    const { pathname, search, state } = intendedDestination;
    
    // Check if the intended destination is allowed for this user
    if (isPathAllowedForUser(pathname, user)) {
      return {
        pathname,
        search: search || '',
        state: state || null
      };
    }
  }
  
  // Determine default redirect based on user role
  let redirectPath = defaultPath;
  
  if (user.role === 'admin') {
    redirectPath = '/admin';
  } else if (user.role === 'external_admin') {
    redirectPath = '/external-admin';
  } else if (user.role === 'employer') {
    redirectPath = '/dashboard';
  } else if (user.role === 'job_seeker') {
    redirectPath = '/dashboard';
  }
  
  return {
    pathname: redirectPath,
    search: '',
    state: null
  };
};

/**
 * Check if a given path is allowed for a user based on their role
 * @param {string} pathname - The path to check
 * @param {Object} user - The user object with role information
 * @returns {boolean} Whether the path is allowed for this user
 */
export const isPathAllowedForUser = (pathname, user) => {
  if (!user || !pathname) return false;
  
  const role = user.role;
  
  // Admin-only paths
  if (pathname.startsWith('/admin')) {
    return role === 'admin';
  }
  
  // External admin-only paths
  if (pathname.startsWith('/external-admin')) {
    return role === 'external_admin';
  }
  
  // Employer-specific paths
  if (pathname.startsWith('/employer') || pathname === '/jobs/post') {
    return role === 'employer' || role === 'admin';
  }
  
  // Job seeker-specific paths
  if (pathname.startsWith('/jobseeker') || pathname.startsWith('/applications')) {
    return role === 'job_seeker' || role === 'admin';
  }
  
  // Company management paths
  if (pathname.startsWith('/company')) {
    return role === 'employer' || role === 'admin';
  }
  
  // Most other protected paths are accessible to authenticated users
  const protectedPaths = ['/dashboard', '/profile'];
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  // Allow public paths
  const publicPaths = ['/', '/jobs', '/companies', '/scholarships'];
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return true;
  }
  
  return true; // Default to allowing the path
};

/**
 * Create a standardized redirect to login function
 * This should be used instead of direct navigation to /login
 * @param {function} navigate - React Router navigate function
 * @param {Object} location - Current location object
 * @param {Object} options - Additional options
 */
export const redirectToLogin = (navigate, location, options = {}) => {
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const currentState = location.state;
  
  // Store the current location as intended destination
  storeIntendedDestination(currentPath, {
    search: currentSearch,
    state: currentState
  });
  
  // Navigate to login with the stored location in state as well (for immediate access)
  navigate('/login', {
    state: { 
      from: {
        pathname: currentPath,
        search: currentSearch,
        state: currentState
      }
    },
    replace: true
  });
};

/**
 * Build a complete URL from pathname and search parameters
 * @param {string} pathname - The pathname
 * @param {string} search - The search parameters
 * @returns {string} Complete URL path
 */
export const buildFullPath = (pathname, search = '') => {
  return pathname + (search ? search : '');
};

/**
 * Extract return URL from various sources (query params, state, etc.)
 * @param {Object} location - React Router location object
 * @returns {string|null} The return URL or null
 */
export const extractReturnUrl = (location) => {
  // Check URL query parameters first
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo');
  if (returnTo) {
    return decodeURIComponent(returnTo);
  }
  
  // Check location state
  if (location.state?.from?.pathname) {
    return buildFullPath(location.state.from.pathname, location.state.from.search);
  }
  
  if (location.state?.returnTo) {
    return location.state.returnTo;
  }
  
  return null;
};