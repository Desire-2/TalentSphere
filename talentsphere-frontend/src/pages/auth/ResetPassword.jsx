import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { API_CONFIG } from '../../config/environment';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  X,
  ArrowLeft,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';

// Validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  const watchedPassword = watch('password');

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    
    return Math.min(strength, 100);
  };

  useEffect(() => {
    if (watchedPassword) {
      setPasswordStrength(calculatePasswordStrength(watchedPassword));
    } else {
      setPasswordStrength(0);
    }
  }, [watchedPassword]);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok && result.valid) {
          setTokenValid(true);
          setUserInfo({ email: result.email, name: result.name });
        } else {
          setError(result.message || 'Invalid or expired reset token');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirm_password: data.confirm_password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const getPasswordValidation = () => {
    if (!watchedPassword) return [];
    
    return [
      { 
        text: 'At least 8 characters', 
        valid: watchedPassword.length >= 8,
        icon: watchedPassword.length >= 8 ? CheckCircle2 : X
      },
      { 
        text: 'One uppercase letter', 
        valid: /[A-Z]/.test(watchedPassword),
        icon: /[A-Z]/.test(watchedPassword) ? CheckCircle2 : X
      },
      { 
        text: 'One lowercase letter', 
        valid: /[a-z]/.test(watchedPassword),
        icon: /[a-z]/.test(watchedPassword) ? CheckCircle2 : X
      },
      { 
        text: 'One number', 
        valid: /\d/.test(watchedPassword),
        icon: /\d/.test(watchedPassword) ? CheckCircle2 : X
      },
    ];
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1B2E' }}>
        <div className="w-full max-w-md rounded-2xl p-12 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: '#2CB5C2' }} />
          <p className="text-gray-300">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1B2E' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }} />
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
            <p className="text-gray-300">{error}</p>
            <div className="rounded-xl p-4 text-left" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-sm text-red-400">This could happen if:</p>
              <ul className="text-sm text-red-400 mt-2 space-y-1">
                <li>• The link has expired (links expire after 1 hour)</li>
                <li>• The link has already been used</li>
                <li>• The link was copied incorrectly</li>
              </ul>
            </div>
            <div className="flex flex-col space-y-3 pt-2">
              <Link to="/forgot-password" className="w-full">
                <button
                  className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #F26522 0%, #F5823E 100%)' }}
                >
                  Request New Reset Link
                </button>
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1B2E' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg, #2CB5C2 0%, #F26522 100%)' }} />
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center relative">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1">
                <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Password Reset Successful!</h1>
              <p className="text-gray-300 mt-2">Your password has been updated successfully</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(44,181,194,0.1)', border: '1px solid rgba(44,181,194,0.25)' }}>
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: '#2CB5C2' }} />
              <p className="font-semibold text-white mb-2">All Set! 🎉</p>
              <p className="text-sm text-gray-300">
                You can now log in with your new password.
                Redirecting you to login page...
              </p>
            </div>
            <Link to="/login" className="block">
              <button
                className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #F26522 0%, #F5823E 100%)' }}
              >
                Continue to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1B2E' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2CB5C2 0%, #F26522 100%)' }}>
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-white">TalentSphere</span>
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg, #2CB5C2 0%, #F26522 100%)' }} />
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 relative" style={{ background: 'linear-gradient(135deg, #2CB5C2 0%, #F26522 100%)' }}>
              <Key className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
            {userInfo && (
              <p className="text-gray-300 mt-2">Hi {userInfo.name}, create your new password</p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-8 pb-6 space-y-6">
              {error && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-3">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Lock className="w-4 h-4" style={{ color: '#2CB5C2' }} />
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...register('password')}
                    className={`pr-10 transition-all duration-300 text-white placeholder:text-gray-500 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 bg-red-900/20'
                        : 'border-white/10 hover:border-white/25 focus:border-[#2CB5C2] bg-[#162236]'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength */}
                {watchedPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Password strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength < 40 ? 'text-red-400' :
                        passwordStrength < 70 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                {watchedPassword && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-xs font-semibold text-gray-300 mb-2">Requirements:</p>
                    <div className="space-y-1">
                      {getPasswordValidation().map((req, index) => {
                        const Icon = req.icon;
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <Icon className={`w-3 h-3 ${req.valid ? 'text-green-400' : 'text-red-400'}`} />
                            <span className={`text-xs ${req.valid ? 'text-green-400' : 'text-gray-400'}`}>
                              {req.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-400 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label htmlFor="confirm_password" className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Shield className="w-4 h-4" style={{ color: '#2CB5C2' }} />
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirm_password')}
                    className={`pr-10 transition-all duration-300 text-white placeholder:text-gray-500 ${
                      errors.confirm_password
                        ? 'border-red-500 focus:border-red-500 bg-red-900/20'
                        : 'border-white/10 hover:border-white/25 focus:border-[#2CB5C2] bg-[#162236]'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-400 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="px-8 pb-8 flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isSubmitting || passwordStrength < 70}
                className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: 'linear-gradient(135deg, #F26522 0%, #F5823E 100%)' }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Key className="w-4 h-4" />
                    Update Password
                  </div>
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
