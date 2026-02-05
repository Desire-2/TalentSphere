import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Session Manager Hook
 * Handles automatic session validation, token refresh, and expiration detection
 * 
 * Features:
 * - Automatic session validation on mount and interval
 * - Token refresh before expiration
 * - Session timeout detection
 * - Auto-logout on session expiration
 * - Activity tracking to prevent unnecessary refreshes
 */
export const useSessionManager = (options = {}) => {
  const {
    validateInterval = 5 * 60 * 1000, // Check every 5 minutes
    refreshBeforeExpiry = 10 * 60 * 1000, // Refresh 10 min before expiry
    sessionTimeout = 24 * 60 * 60 * 1000, // 24 hours session timeout
    enableActivityTracking = true,
    onSessionExpired = null,
    onSessionRefreshed = null,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, validateSession, refreshSession } = useAuthStore();
  
  const lastActivityRef = useRef(Date.now());
  const validateTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if session has expired
  const checkSessionExpiration = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const isValid = await validateSession();
      
      if (!isValid) {
        console.warn('⚠️ Session validation failed - logging out');
        await logout();
        
        if (onSessionExpired) {
          onSessionExpired();
        }
        
        // Redirect to home page after session expiration
        // Logout function will handle the redirect, but ensure it happens
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/')) {
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('❌ Session validation error:', error);
      
      // If validation fails due to network error, don't logout immediately
      if (!error.message?.includes('network') && !error.message?.includes('connect')) {
        await logout();
        // Logout function will handle redirect to home page
      }
    }
  }, [isAuthenticated, validateSession, logout, location.pathname, onSessionExpired]);

  // Attempt to refresh token
  const attemptTokenRefresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      console.log('🔄 Attempting token refresh...');
      const refreshed = await refreshSession();
      
      if (refreshed) {
        console.log('✅ Token refreshed successfully');
        if (onSessionRefreshed) {
          onSessionRefreshed();
        }
      } else {
        console.warn('⚠️ Token refresh failed - session may expire soon');
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      // Don't logout on refresh failure - let validation handle it
    }
  }, [isAuthenticated, refreshSession, onSessionRefreshed]);

  // Check if token needs refresh based on activity
  const checkTokenRefresh = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    
    // If user has been active recently, consider refreshing token
    if (enableActivityTracking && timeSinceActivity < validateInterval) {
      attemptTokenRefresh();
    }
  }, [isAuthenticated, user, attemptTokenRefresh, validateInterval, enableActivityTracking]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated || !enableActivityTracking) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated, enableActivityTracking, updateActivity]);

  // Set up periodic session validation
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timers if not authenticated
      if (validateTimerRef.current) {
        clearInterval(validateTimerRef.current);
        validateTimerRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    // Initial validation
    checkSessionExpiration();

    // Set up periodic validation
    validateTimerRef.current = setInterval(checkSessionExpiration, validateInterval);

    // Set up periodic token refresh check
    refreshTimerRef.current = setInterval(checkTokenRefresh, refreshBeforeExpiry);

    return () => {
      if (validateTimerRef.current) {
        clearInterval(validateTimerRef.current);
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated, checkSessionExpiration, checkTokenRefresh, validateInterval, refreshBeforeExpiry]);

  // Validate session on route change
  useEffect(() => {
    if (isAuthenticated) {
      checkSessionExpiration();
    }
  }, [location.pathname, isAuthenticated, checkSessionExpiration]);

  return {
    isSessionValid: isAuthenticated,
    lastActivity: lastActivityRef.current,
    updateActivity,
    validateNow: checkSessionExpiration,
    refreshNow: attemptTokenRefresh,
  };
};

export default useSessionManager;
