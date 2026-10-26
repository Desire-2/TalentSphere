/**
 * Authentication debugging utilities
 * Helps diagnose token and authentication issues
 */

export const authDebug = {
  /**
   * Check if user is properly authenticated
   */
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.group('🔐 Authentication Status');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    console.log('Token preview: [redacted]', token ? '(present)' : '(none)');
    console.log('User data exists:', !!user);
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('User:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: `${userData.first_name} ${userData.last_name}`
        });
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    console.groupEnd();
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      isValid: !!token && !!user
    };
  },

  /**
   * Get auth headers that would be sent
   */
  getAuthHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer [redacted]' : 'Missing'
    };
  },

  /**
   * Test authentication with backend
   */
  testAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found in localStorage');
      return { success: false, error: 'No token' };
    }

    try {
      console.log('🧪 Testing auth with backend...');
      const response = await fetch('/api/profile/complete-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Authentication successful');
        return { success: true };
      } else {
        const error = await response.text();
        console.error('❌ Authentication failed:', error);
        return { success: false, error: response.status, details: error };
      }
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear all auth data and redirect to login
   */
  clearAndRedirect: () => {
    console.warn('🗑️ Clearing authentication data...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.authDebug = authDebug;
}
