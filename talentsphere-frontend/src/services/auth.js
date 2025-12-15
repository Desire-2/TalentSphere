import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Ensure we have the necessary data
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response format: missing token or user data');
      }
      
      // Save token and user data to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      console.error('Registration service error:', error);
      // Rethrow the error to be handled by the store
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response;
  },

  // Verify token
  verifyToken: async (token) => {
    const response = await api.post('/auth/verify-token', { token });
    return response;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get current token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  },

  // Check if user is external admin
  isExternalAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'external_admin';
  },

  // Check if user is any type of admin (admin or external_admin)
  isAnyAdmin: () => {
    const user = authService.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'external_admin');
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && user.role === role;
  },

  // Forgot password - send reset email
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await api.post('/auth/verify-reset-token', { token });
    return response;
  },

  // Reset password with token
  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      password: newPassword,
      confirm_password: confirmPassword
    });
    return response;
  },

  // Validate current session
  validateSession: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        return false;
      }

      const response = await api.post('/auth/verify-token', { token });
      return response.valid || false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  // Refresh session token
  refreshSession: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.token) {
        localStorage.setItem('token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  // Get token expiration time (from JWT payload)
  getTokenExpiration: () => {
    try {
      const token = authService.getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Check if token is expired or about to expire
  isTokenExpired: (bufferMinutes = 5) => {
    try {
      const expiration = authService.getTokenExpiration();
      if (!expiration) return true;

      const bufferMs = bufferMinutes * 60 * 1000;
      return Date.now() >= (expiration - bufferMs);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};

