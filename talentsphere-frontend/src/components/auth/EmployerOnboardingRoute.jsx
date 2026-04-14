import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const ALLOWED_ONBOARDING_PATHS = [
  '/employer/onboarding',
  '/employer/company-profile',
  '/employer/company/profile',
  '/employer/company/settings'
];

const EmployerOnboardingRoute = ({ children }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || user?.role !== 'employer') {
        setIsChecking(false);
        return;
      }

      try {
        const status = await apiService.getEmployerOnboardingStatus();
        setOnboardingStatus(status || null);
      } catch (error) {
        // Fail open to avoid locking users out if status endpoint is temporarily unavailable.
        console.warn('Employer onboarding status check failed:', error);
        setOnboardingStatus(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user?.role]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50 px-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-cyan-200/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg">
              <div className="absolute h-full w-full animate-ping rounded-xl bg-cyan-400/30" />
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Preparing your employer workspace</p>
              <p className="mt-1 text-xs text-slate-600">
                Checking onboarding and verification status
                <span className="inline-block animate-bounce">.</span>
                <span className="inline-block animate-bounce [animation-delay:120ms]">.</span>
                <span className="inline-block animate-bounce [animation-delay:240ms]">.</span>
              </p>
            </div>
          </div>

          <div className="relative mt-5 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
            </div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
              <span>Onboarding checks</span>
              <span>Verification checks</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'employer') {
    return children;
  }

  const onboardingComplete = onboardingStatus?.onboarding_complete;
  const isAllowedPath = ALLOWED_ONBOARDING_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

  if (onboardingComplete === false && !isAllowedPath) {
    return <Navigate to="/employer/onboarding" replace />;
  }

  if (onboardingComplete === true && location.pathname === '/employer/onboarding') {
    return <Navigate to="/employer/dashboard" replace />;
  }

  return children;
};

export default EmployerOnboardingRoute;
