import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your TalentSphere account
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redirectMessage && (
              <Alert className="mb-4">
                <AlertDescription className="text-blue-600">
                  {redirectMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
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
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 flex items-center gap-1 hover:underline"
                  >
                    <span className="text-xs">🔒</span>
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to TalentSphere?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create your account
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;