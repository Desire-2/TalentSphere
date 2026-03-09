import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { 
  getAndClearIntendedDestination, 
  getPostLoginRedirect, 
  extractReturnUrl, 
  buildFullPath 
} from '../../utils/redirectUtils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced redirect logic that checks multiple sources for intended destination
  const getRedirectDestination = (user) => {
    // First, try to get stored intended destination
    const storedDestination = getAndClearIntendedDestination();
    
    // Second, check location state for immediate redirect
    const stateDestination = location.state?.from;
    
    // Third, check URL parameters
    const urlReturnTo = extractReturnUrl(location);
    
    // Determine the intended destination
    let intendedDestination = null;
    
    if (storedDestination) {
      intendedDestination = storedDestination;
    } else if (stateDestination) {
      intendedDestination = {
        pathname: stateDestination.pathname,
        search: stateDestination.search || '',
        state: stateDestination.state || null
      };
    } else if (urlReturnTo) {
      // Parse the URL return path
      const url = new URL(urlReturnTo, window.location.origin);
      intendedDestination = {
        pathname: url.pathname,
        search: url.search,
        state: null
      };
    }
    
    // Get the final redirect destination
    const redirect = getPostLoginRedirect(user, intendedDestination, '/dashboard');
    
    return {
      pathname: redirect.pathname,
      search: redirect.search,
      ...(redirect.state && { state: redirect.state })
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  // Show redirect message if there's an intended destination
  const getRedirectMessage = () => {
    const urlReturnTo = extractReturnUrl(location);
    const stateFrom = location.state?.from?.pathname;
    
    if (urlReturnTo && urlReturnTo !== '/dashboard') {
      const url = new URL(urlReturnTo, window.location.origin);
      return `You'll be redirected to ${url.pathname} after signing in.`;
    } else if (stateFrom && stateFrom !== '/dashboard') {
      return `You'll be redirected to ${stateFrom} after signing in.`;
    }
    
    return null;
  };

  const redirectMessage = getRedirectMessage();

  const onSubmit = async (data) => {
    try {
      clearError();
      console.log('Attempting login with:', { email: data.email });
      const response = await login(data);
      
      // Get the redirect destination using enhanced logic
      const user = response.user;
      const redirectDestination = getRedirectDestination(user);
      
      console.log('Login successful, navigating to:', redirectDestination);
      
      // Navigate to the determined destination
      navigate(redirectDestination.pathname + (redirectDestination.search || ''), {
        replace: true,
        ...(redirectDestination.state && { state: redirectDestination.state })
      });
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6" style={{ background: '#0D1B2E' }}>
      <div className="max-w-md w-full space-y-8">

        {/* ── Page header: logo + title ── */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl" style={{ border: '1.5px solid rgba(44,181,194,0.45)' }} />
              <div className="relative w-[110px] h-[82px] rounded-xl overflow-hidden" style={{ background: 'white', boxShadow: '0 6px 28px rgba(13,33,81,0.14)' }}>
                <img src="/logo-192.png" alt="AfriTech Bridge" className="w-full h-full object-contain p-2" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-[3px] rounded-full" style={{ background: '#2CB5C2' }} />
            <div className="w-4 h-[3px] rounded-full" style={{ background: '#F26522' }} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Welcome back</h2>
          <p className="mt-1.5 text-gray-400">Sign in to continue your journey</p>
        </div>

          {/* ─── Form card ─── */}
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #111111 0%, #2CB5C2 50%, #F26522 100%)' }} />
            {redirectMessage && (
              <div
                className="mb-5 p-4 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(44,181,194,0.12)', borderLeft: '4px solid #2CB5C2', color: 'white' }}
              >
                {redirectMessage}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-white">
                  Email address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    {...register('email')}
                    className={`h-11 rounded-xl pl-10 transition-all bg-[#162236] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#2CB5C2] focus-visible:border-[#2CB5C2] ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-white">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`h-11 rounded-xl pl-10 pr-10 transition-all bg-[#162236] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#2CB5C2] focus-visible:border-[#2CB5C2] ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#2CB5C2' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign-in CTA — orange, echoes logo arrow */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-white font-bold text-base border-0 transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-orange-200 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #F26522 0%, #F5823E 100%)' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#2CB5C2' }} />
                  SSL Secured
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Lock className="h-3.5 w-3.5" style={{ color: '#2CB5C2' }} />
                  Privacy First
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#2CB5C2' }} />
                  Free to Join
                </div>
              </div>
            </form>

            {/* Register link */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0D1B2E] text-gray-400">New to AfriTech?</span>
                </div>
              </div>

              <div className="mt-5 text-center">
                <Link
                  to="/register"
                  state={(() => {
                    const fromState = location.state?.from;
                    const returnTo = extractReturnUrl(location);
                    const payload = {};

                    const formattedFrom = typeof fromState === 'string'
                      ? { pathname: fromState }
                      : fromState;

                    if (formattedFrom) {
                      payload.from = formattedFrom;
                    }

                    if (returnTo) {
                      payload.returnTo = returnTo;
                    }

                    return Object.keys(payload).length ? payload : undefined;
                  })()}
                  className="inline-flex items-center justify-center gap-2 w-full font-semibold text-sm transition-all duration-200 px-6 py-2.5 rounded-xl hover:shadow-md hover:bg-white hover:text-[#0D1B2E] group"
                  style={{ color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}
                >
                  Create your account
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
