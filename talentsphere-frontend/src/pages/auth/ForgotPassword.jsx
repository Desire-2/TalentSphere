import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { 
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(null); // null = unknown, true = sent, false = failed

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const watchedEmail = watch('email');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    setEmailSent(null);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setEmail(data.email);
        // Backend may include an `email_sent` boolean (true if SMTP succeeded or simulated)
        setEmailSent(result.hasOwnProperty('email_sent') ? !!result.email_sent : true);
        setIsSubmitted(true);
      } else {
        // Surface server-provided error when available
        setError(result.error || 'Failed to send reset email');
        setEmailSent(result.hasOwnProperty('email_sent') ? !!result.email_sent : false);
      }
    } catch (err) {
      // Detect a common connection error (e.g., ERR_CONNECTION_REFUSED / failed to fetch)
      const msg = err && err.message ? err.message.toLowerCase() : '';
      if (msg.includes('failed to fetch') || msg.includes('networkrequest failed') || msg.includes('network error') || msg.includes('networkrequestfailed')) {
        setError('Cannot reach backend server. Please make sure the backend is running and reachable.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      setEmailSent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1B2E' }}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg, #2CB5C2 0%, #F26522 100%)' }} />
            <div className="p-8 text-center space-y-6">
              <div>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
                <p className="text-gray-300 mt-2">We've sent password reset instructions</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ background: 'rgba(44,181,194,0.1)', border: '1px solid rgba(44,181,194,0.25)' }}>
                  <div className="flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6" style={{ color: '#2CB5C2' }} />
                  </div>
                  <p className="text-sm text-gray-300">
                    {emailSent === true ? "We've sent a password reset link to:" : "If an account exists we attempted to send a password reset link to:"}
                  </p>
                  <p className="font-semibold text-white mt-1">{email}</p>
                </div>

                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-300">
                    The link will expire in <strong className="text-white">1 hour</strong> for security reasons
                  </p>
                </div>

                {emailSent === false && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm text-yellow-300 font-semibold">We couldn't send the email right now</p>
                        <p className="text-xs text-yellow-400">We've logged the attempt. Please try again in a few minutes or contact support if the problem persists.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-left space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: '#2CB5C2' }} />
                    What to do next:
                  </h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#2CB5C2' }}></div>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#2CB5C2' }}></div>
                      Click the "Reset Password" button in the email
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#2CB5C2' }}></div>
                      Create a new, secure password
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col space-y-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={() => { setIsSubmitted(false); setEmail(''); setError(''); setEmailSent(null); }}
                    className="font-semibold transition-colors hover:opacity-80"
                    style={{ color: '#2CB5C2' }}
                  >
                    Try again
                  </button>
                </div>
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
              <Mail className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
            <p className="text-gray-300 mt-2">No worries! We'll send you reset instructions.</p>
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

              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Mail className="w-4 h-4" style={{ color: '#2CB5C2' }} />
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                    className={`transition-all duration-300 text-white placeholder:text-gray-500 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 bg-red-900/20'
                        : 'border-white/10 hover:border-white/25 focus:border-[#2CB5C2] bg-[#162236]'
                    }`}
                    disabled={isSubmitting}
                  />
                  {watchedEmail && !errors.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(44,181,194,0.08)', border: '1px solid rgba(44,181,194,0.2)' }}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#2CB5C2' }} />
                  <div className="text-sm">
                    <p className="font-semibold text-white mb-1">Security Notice</p>
                    <p className="text-gray-300">
                      We'll send a secure link to reset your password.
                      The link will expire in 1 hour for your protection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: 'linear-gradient(135deg, #F26522 0%, #F5823E 100%)' }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Reset Link
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

              <div className="text-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xs text-gray-400 mb-2">Need help?</p>
                <a
                  href="mailto:afritechbridge@yahoo.com"
                  className="inline-flex items-center gap-1 text-xs transition-colors hover:text-white"
                  style={{ color: '#2CB5C2' }}
                >
                  <Mail className="w-3 h-3" />
                  Contact Support
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
