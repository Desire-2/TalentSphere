import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Keeps an authenticated browser session alive without tying it to user
 * activity. This matters for long-running background jobs where the user may
 * simply wait while the browser continues polling.
 */
export const useSessionManager = (options = {}) => {
  const {
    validateInterval = 5 * 60 * 1000,
    refreshBeforeExpiry = 10 * 60 * 1000,
    refreshGracePeriod = 15 * 60 * 1000,
    enableActivityTracking = true,
    onSessionExpired = null,
    onSessionRefreshed = null,
  } = options;

  const location = useLocation();
  const {
    isAuthenticated,
    isInitialized,
    user,
    validateSession,
    refreshSession,
    clearSession,
    getTokenExpiration
  } = useAuthStore();

  const lastActivityRef = useRef(Date.now());
  const validateTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const validationPromiseRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const expiredRef = useRef(false);
  const expiredCallbackRef = useRef(onSessionExpired);
  const refreshedCallbackRef = useRef(onSessionRefreshed);

  useEffect(() => {
    expiredCallbackRef.current = onSessionExpired;
  }, [onSessionExpired]);

  useEffect(() => {
    refreshedCallbackRef.current = onSessionRefreshed;
  }, [onSessionRefreshed]);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkSessionExpiration = useCallback(async () => {
    if (!isInitialized || !isAuthenticated) return true;
    if (validationPromiseRef.current) return validationPromiseRef.current;

    validationPromiseRef.current = (async () => {
      try {
        const isValid = await validateSession();
        if (!isValid) {
          clearSession({ redirect: true });
          if (!expiredRef.current) {
            expiredRef.current = true;
            expiredCallbackRef.current?.();
          }
        }
        return isValid;
      } catch (error) {
        // A transient outage should not log a user out or interrupt a
        // background generation. The next scheduled check will retry.
        if (error?.code === 'NETWORK_ERROR' || error?.status >= 500) {
          console.warn('Session validation deferred while backend is unavailable.');
          return true;
        }

        clearSession({ redirect: true });
        if (!expiredRef.current) {
          expiredRef.current = true;
          expiredCallbackRef.current?.();
        }
        return false;
      } finally {
        validationPromiseRef.current = null;
      }
    })();

    return validationPromiseRef.current;
  }, [isAuthenticated, isInitialized, validateSession, clearSession]);

  const attemptTokenRefresh = useCallback(async () => {
    if (!isInitialized || !isAuthenticated) return false;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const refreshed = await refreshSession();
        if (refreshed) {
          refreshedCallbackRef.current?.();
        } else {
          const expiration = getTokenExpiration?.();
          if (expiration && Date.now() - expiration > refreshGracePeriod) {
            clearSession({ redirect: true });
            if (!expiredRef.current) {
              expiredRef.current = true;
              expiredCallbackRef.current?.();
            }
          }
        }
        return refreshed;
      } catch (error) {
        // Keep the current token until validation says it is invalid. This
        // avoids logging out during a short network interruption.
        if (error?.code !== 'NETWORK_ERROR') {
          console.warn('Token refresh failed; the active session will be revalidated.');
        }
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [clearSession, getTokenExpiration, isAuthenticated, isInitialized, refreshGracePeriod, refreshSession]);

  const checkTokenRefresh = useCallback(() => {
    if (!isInitialized || !isAuthenticated || !user) return;

    const expiration = getTokenExpiration?.();
    const now = Date.now();
    const needsRefresh = expiration && expiration - now <= refreshBeforeExpiry && now - expiration <= refreshGracePeriod;
    if (needsRefresh) void attemptTokenRefresh();
  }, [attemptTokenRefresh, getTokenExpiration, isAuthenticated, isInitialized, refreshBeforeExpiry, refreshGracePeriod, user]);

  useEffect(() => {
    if (!isAuthenticated || !enableActivityTracking) return undefined;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, updateActivity, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity));
    };
  }, [enableActivityTracking, isAuthenticated, updateActivity]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      if (validateTimerRef.current) clearInterval(validateTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      validateTimerRef.current = null;
      refreshTimerRef.current = null;
      return undefined;
    }

    expiredRef.current = false;
    // Refresh immediately when a tab is opened close to expiry instead of
    // waiting for the first long interval tick.
    void checkTokenRefresh();
    void checkSessionExpiration();
    validateTimerRef.current = setInterval(() => void checkSessionExpiration(), validateInterval);
    refreshTimerRef.current = setInterval(
      checkTokenRefresh,
      Math.max(1000, Math.min(refreshBeforeExpiry, 60 * 1000))
    );

    return () => {
      if (validateTimerRef.current) clearInterval(validateTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      validateTimerRef.current = null;
      refreshTimerRef.current = null;
    };
  }, [checkSessionExpiration, checkTokenRefresh, isAuthenticated, isInitialized, refreshBeforeExpiry, validateInterval]);

  useEffect(() => {
    if (isAuthenticated) void checkSessionExpiration();
  }, [checkSessionExpiration, isAuthenticated, location.pathname]);

  return {
    isSessionValid: isAuthenticated,
    lastActivity: lastActivityRef.current,
    updateActivity,
    validateNow: checkSessionExpiration,
    refreshNow: attemptTokenRefresh,
  };
};

export default useSessionManager;
