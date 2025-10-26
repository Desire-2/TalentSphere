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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Check Your Email
              </h1>
              <p className="text-gray-600 mt-2">
                We've sent password reset instructions
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700">
                        {emailSent === true ? "We've sent a password reset link to:" : "If an account exists we attempted to send a password reset link to:"}
                  </p>
                  <p className="font-semibold text-green-800 mt-1">
                    {email}
                  </p>
                </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                      <p className="text-xs text-blue-700">
                        The link will expire in <strong>1 hour</strong> for security reasons
                      </p>
                </div>

                    {emailSent === false && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-yellow-800 font-semibold">We couldn't send the email right now</p>
                            <p className="text-xs text-yellow-700">We've logged the attempt. Please try again in a few minutes or contact support if the problem persists.</p>
                          </div>
                        </div>
                      </div>
                    )}

                <div className="text-left space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    What to do next:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      Click the "Reset Password" button in the email
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      Create a new, secure password
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-gray-500">Didn't receive the email?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                    setError('');
                    setEmailSent(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Try again
                </Button>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 relative">
              <Mail className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Forgot Password?
            </h1>
            <p className="text-gray-600 mt-2">
              No worries! We'll send you reset instructions.
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                    className={`transition-all duration-300 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500 bg-red-50' 
                        : watchedEmail
                        ? 'border-green-500 focus:border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400 focus:border-blue-400'
                    }`}
                    disabled={isSubmitting}
                  />
                  {watchedEmail && !errors.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Security Notice</p>
                    <p>
                      We'll send a secure link to reset your password. 
                      The link will expire in 1 hour for your protection.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>

              {/* Contact Support */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Need help?</p>
                <a 
                  href="mailto:afritechbridge@yahoo.com"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  Contact Support
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
