import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  Eye, 
  EyeOff, 
  Loader2, 
  Users, 
  Building, 
  MapPin, 
  Phone, 
  Globe, 
  Mail,
  Upload,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Star,
  Shield,
  Camera,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
  Heart,
  Lock,
  MousePointer,
  ChevronDown,
  HelpCircle,
  Rocket,
  Target,
  Crown,
  Gift,
  User,
  UserCircle,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  getAndClearIntendedDestination,
  getPostLoginRedirect,
  extractReturnUrl
} from '../../utils/redirectUtils';

const baseSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  role: z.enum(['job_seeker', 'employer'], {
    required_error: 'Please select your role'
  }),
  phone: z.string().optional().or(z.literal('')),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

const jobSeekerSchema = baseSchema.extend({
  desired_position: z.string().optional().or(z.literal('')),
  years_of_experience: z.number().min(0).optional().or(z.literal('')),
  education_level: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal(''))
});

const employerSchema = baseSchema.extend({
  // Personal/Professional Info
  job_title: z.string().min(1, 'Job title is required'),
  department: z.string().optional().or(z.literal('')),
  work_phone: z.string().optional().or(z.literal('')),
  work_email: z.string().optional().or(z.literal('')),
  hiring_authority: z.boolean().optional().default(false),
  
  // Company Info
  company_name: z.string().min(1, 'Company name is required'),
  company_website: z.string().optional().or(z.literal('')),
  company_email: z.string().optional().or(z.literal('')),
  company_phone: z.string().optional().or(z.literal('')),
  company_description: z.string().optional().or(z.literal('')),
  industry: z.string().min(1, 'Please select an industry'),
  company_size: z.string().min(1, 'Please select company size'),
  company_type: z.string().min(1, 'Please select company type'),
  founded_year: z.number().optional().or(z.literal('')),
  
  // Address
  address_line1: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal(''))
});

const getSchema = (role) => {
  if (role === 'employer') {
    return employerSchema;
  } else if (role === 'job_seeker') {
    return jobSeekerSchema;
  }
  return baseSchema;
};

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showTooltips, setShowTooltips] = useState({});
  const [typingTimer, setTypingTimer] = useState(null);
  
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectDestination = (user) => {
    const storedDestination = getAndClearIntendedDestination();
    let stateDestination = location.state?.from;

    if (typeof stateDestination === 'string') {
      stateDestination = {
        pathname: stateDestination,
        search: ''
      };
    }

    const urlReturnTo = extractReturnUrl(location);

    let intendedDestination = null;

    if (storedDestination) {
      intendedDestination = storedDestination;
    } else if (stateDestination?.pathname) {
      intendedDestination = {
        pathname: stateDestination.pathname,
        search: stateDestination.search || '',
        state: stateDestination.state || null
      };
    } else if (urlReturnTo) {
      try {
        const url = new URL(urlReturnTo, window.location.origin);
        intendedDestination = {
          pathname: url.pathname,
          search: url.search,
          state: null
        };
      } catch (parseError) {
        console.warn('Unable to parse return URL on registration:', urlReturnTo, parseError);
      }
    }

    const resolvedUser = user || {};
    const redirect = getPostLoginRedirect(resolvedUser, intendedDestination, '/dashboard');

    return {
      pathname: redirect.pathname,
      search: redirect.search || '',
      ...(redirect.state ? { state: redirect.state } : {})
    };
  };

  const getRedirectMessage = () => {
    const urlReturnTo = extractReturnUrl(location);

    if (urlReturnTo && urlReturnTo !== '/dashboard') {
      try {
        const url = new URL(urlReturnTo, window.location.origin);
        return `You'll be redirected to ${url.pathname} after creating your account.`;
      } catch (parseError) {
        console.warn('Unable to parse return URL for message:', urlReturnTo, parseError);
      }
    }

    const fromState = location.state?.from;
    const fromPathname = typeof fromState === 'string'
      ? fromState
      : fromState?.pathname;

    if (fromPathname && fromPathname !== '/dashboard') {
      return `You'll be redirected to ${fromPathname} after creating your account.`;
    }

    return null;
  };

  const redirectMessage = getRedirectMessage();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      role: '',
      terms_accepted: false,
      hiring_authority: false,
      years_of_experience: 0,
      founded_year: new Date().getFullYear()
    },
    mode: 'onChange'
  });

  const selectedRole = watch('role');
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedFirstName = watch('first_name');
  const watchedLastName = watch('last_name');
  
  // Update resolver when role changes
  useEffect(() => {
    if (selectedRole) {
      // Get current form data
      const currentData = watch();
      // Update the form with the new schema but preserve current data
      const newSchema = getSchema(selectedRole);
      reset(currentData, { 
        resolver: zodResolver(newSchema),
        keepValues: true,
        keepErrors: false
      });
    }
  }, [selectedRole, reset, watch]);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Construction', 'Transportation', 'Entertainment',
    'Food & Beverage', 'Real Estate', 'Consulting', 'Non-profit', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const companyTypes = [
    'Startup', 'Private Company', 'Public Company', 
    'Non-profit', 'Government', 'Agency', 'Freelance'
  ];

  const educationLevels = [
    'High School', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Professional Certification', 'Other'
  ];

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhanced password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  };

  // Watch for password changes and update strength
  useEffect(() => {
    const subscription = watch((value) => {
      if (value.password) {
        const strength = calculatePasswordStrength(value.password);
        setPasswordStrength(strength);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Smooth animations
  const handleStepTransition = (newStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(newStep);
      setIsAnimating(false);
    }, 150);
  };

  // Enhanced field focus handling
  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    
    // Clear any existing timer
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    
    // Set a timer to hide focus after inactivity
    const timer = setTimeout(() => {
      setFocusedField(null);
    }, 5000);
    setTypingTimer(timer);
  };

  const toggleTooltip = (field) => {
    setShowTooltips(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const calculateProgress = () => {
    const requiredFields = selectedRole === 'employer' ? 
      ['role', 'first_name', 'last_name', 'email', 'password', 'job_title', 'company_name', 'industry', 'company_size', 'company_type'] :
      ['role', 'first_name', 'last_name', 'email', 'password'];
    
    const filledFields = requiredFields.filter(field => {
      const value = watch(field);
      return value !== undefined && value !== '' && value !== null;
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const canProceedToStep2 = () => {
    const basicFields = ['role', 'first_name', 'last_name', 'email', 'password'];
    const hasValues = basicFields.every(field => {
      const value = watch(field);
      return value !== undefined && value !== '' && value !== null;
    });
    const termsAccepted = watch('terms_accepted');
    const hasNoErrors = !errors.role && !errors.first_name && !errors.last_name && !errors.email && !errors.password && !errors.terms_accepted;
    console.log('canProceedToStep2 - hasValues:', hasValues, 'termsAccepted:', termsAccepted, 'hasNoErrors:', hasNoErrors);
    console.log('form values:', basicFields.map(field => ({ [field]: watch(field) })));
    console.log('errors:', { role: errors.role, first_name: errors.first_name, last_name: errors.last_name, email: errors.email, password: errors.password, terms_accepted: errors.terms_accepted });
    return hasValues && termsAccepted && hasNoErrors;
  };

  const nextStep = async () => {
    const isValid = await trigger(['role', 'first_name', 'last_name', 'email', 'password', 'terms_accepted']);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const canSubmitForm = () => {
    if (selectedRole === 'employer') {
      const employerFields = ['role', 'first_name', 'last_name', 'email', 'password', 'job_title', 'company_name', 'industry', 'company_size', 'company_type'];
      return employerFields.every(field => {
        const value = watch(field);
        return value !== undefined && value !== '' && value !== null;
      }) && watch('terms_accepted');
    } else if (selectedRole === 'job_seeker') {
      const jobSeekerFields = ['role', 'first_name', 'last_name', 'email', 'password'];
      return jobSeekerFields.every(field => {
        const value = watch(field);
        return value !== undefined && value !== '' && value !== null;
      }) && watch('terms_accepted');
    }
    return false;
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const onSubmit = async (data) => {
    try {
      clearError();
      
      console.log('🔍 Form submission debug:');
      console.log('Selected role:', selectedRole);
      console.log('All form data:', data);
      console.log('Watch values check:', {
        role: watch('role'),
        job_title: watch('job_title'),
        company_name: watch('company_name'),
        industry: watch('industry'),
        company_size: watch('company_size'),
        company_type: watch('company_type')
      });
      
      // Add profile picture if uploaded
      if (profilePicture) {
        data.profile_picture = profilePictureUrl;
      }
      
      // Add marketing consent
      data.marketing_consent = agreedToMarketing;
      
      // Basic validation for required fields
      if (data.role === 'employer') {
        console.log('🏢 Validating employer data...');
        
        // Get the latest values directly from the form
        const formValues = {
          job_title: watch('job_title'),
          company_name: watch('company_name'),
          industry: watch('industry'),
          company_size: watch('company_size'),
          company_type: watch('company_type')
        };
        
        console.log('Form values from watch:', formValues);
        
        // Update data with latest form values
        Object.assign(data, formValues);
        
        console.log('Updated data with form values:', {
          job_title: data.job_title,
          company_name: data.company_name,
          industry: data.industry,
          company_size: data.company_size,
          company_type: data.company_type
        });
        
        // Check if any required fields are missing
        const requiredFields = ['job_title', 'company_name', 'industry', 'company_size', 'company_type'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field] === '');
        
        if (missingFields.length > 0) {
          console.error('❌ Missing required employer fields:', missingFields);
          // Don't return, let's try to continue and see what the backend says
        } else {
          console.log('✅ All required employer fields are present');
        }
      }
      
      // Clean up the data - remove empty strings and convert them to null
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );
      
      console.log('🧹 Cleaned data for submission:', cleanedData);
      
      const response = await registerUser(cleanedData);
      const latestUser = response?.user || useAuthStore.getState().user;

      const redirectDestination = getRedirectDestination(latestUser);

      navigate(redirectDestination.pathname + (redirectDestination.search || ''), {
        replace: true,
        ...(redirectDestination.state ? { state: redirectDestination.state } : {})
      });
    } catch (error) {
      console.error('💥 Registration error:', error);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return "Basic Information";
    if (currentStep === 2 && selectedRole === 'employer') return "Professional & Company Details";
    if (currentStep === 2 && selectedRole === 'job_seeker') return "Professional Details";
    return "Registration";
  };

  const getStepDescription = () => {
    if (currentStep === 1) return "Let's start with your basic information";
    if (currentStep === 2 && selectedRole === 'employer') return "Tell us about your role and company";
    if (currentStep === 2 && selectedRole === 'job_seeker') return "Help us understand your career goals";
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Join TalentSphere
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Create your account and start your journey
          </p>
          
          {/* Enhanced Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-semibold text-blue-600">Progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-blue-600">{calculateProgress()}%</span>
                {calculateProgress() === 100 && (
                  <Crown className="w-4 h-4 text-yellow-500 animate-bounce" />
                )}
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={calculateProgress()} 
                className={`h-3 transition-all duration-700 ease-out ${isAnimating ? 'opacity-70' : 'opacity-100'}`} 
              />
              <div 
                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out opacity-80"
                style={{ width: `${calculateProgress()}%` }}
              />
              {calculateProgress() > 0 && (
                <div className="absolute -top-1 right-0 flex items-center">
                  <div className="animate-pulse">
                    <Zap className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Step Indicator */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center transition-all duration-300 ${currentStep >= 1 ? 'text-blue-600 scale-105' : 'text-gray-400 scale-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep >= 1 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? (
                  <CheckCircle2 className="w-5 h-5 animate-pulse" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <span className="ml-3 text-sm font-semibold">Basic Info</span>
            </div>
            <div className={`w-12 h-0.5 transition-all duration-500 ${
              currentStep >= 2 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                : 'bg-gray-200'
            }`} />
            <div className={`flex items-center transition-all duration-300 ${currentStep >= 2 ? 'text-blue-600 scale-105' : 'text-gray-400 scale-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep >= 2 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <UserCircle className="w-5 h-5" />
              </div>
              <span className="ml-3 text-sm font-semibold">Details</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
            <CardDescription className="text-base">
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redirectMessage && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  {redirectMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                        {profilePictureUrl ? (
                          <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-picture').click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Enhanced Role Selection */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <Label className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Choose Your Journey
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">Select how you want to use TalentSphere</p>
                    </div>
                    <RadioGroup
                      value={selectedRole || ''}
                      onValueChange={(value) => {
                        setValue('role', value);
                        console.log('Role changed to:', value);
                      }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                      <div
                        onMouseEnter={() => setHoveredRole('job_seeker')}
                        onMouseLeave={() => setHoveredRole(null)}
                        className="relative group"
                      >
                        <RadioGroupItem
                          value="job_seeker"
                          id="job_seeker"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="job_seeker"
                          className={`flex flex-col items-center justify-center rounded-2xl border-2 bg-white p-8 cursor-pointer transition-all duration-300 transform ${
                            selectedRole === 'job_seeker'
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl shadow-blue-500/20 scale-105'
                              : hoveredRole === 'job_seeker'
                              ? 'border-blue-300 bg-blue-50 shadow-lg scale-102'
                              : 'border-gray-200 hover:border-blue-200 hover:bg-blue-25 hover:shadow-md'
                          }`}
                        >
                          <div className={`relative transition-all duration-300 ${
                            selectedRole === 'job_seeker' || hoveredRole === 'job_seeker' ? 'animate-pulse' : ''
                          }`}>
                            <Users className={`mb-4 h-10 w-10 transition-all duration-300 ${
                              selectedRole === 'job_seeker' 
                                ? 'text-blue-600 scale-110' 
                                : 'text-blue-500'
                            }`} />
                            {selectedRole === 'job_seeker' && (
                              <div className="absolute -top-2 -right-2">
                                <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className={`text-xl font-bold transition-all duration-300 ${
                            selectedRole === 'job_seeker'
                              ? 'text-blue-700'
                              : 'text-gray-700'
                          }`}>
                            Job Seeker
                          </span>
                          <span className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
                            Discover amazing opportunities and build your career
                          </span>
                          <div className="flex items-center mt-3 space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <Award className="w-4 h-4 text-purple-500" />
                            <Heart className="w-4 h-4 text-red-500" />
                          </div>
                        </Label>
                        {selectedRole === 'job_seeker' && (
                          <div className="absolute -top-1 -right-1">
                            <div className="bg-blue-500 text-white rounded-full p-1">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div
                        onMouseEnter={() => setHoveredRole('employer')}
                        onMouseLeave={() => setHoveredRole(null)}
                        className="relative group"
                      >
                        <RadioGroupItem
                          value="employer"
                          id="employer"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="employer"
                          className={`flex flex-col items-center justify-center rounded-2xl border-2 bg-white p-8 cursor-pointer transition-all duration-300 transform ${
                            selectedRole === 'employer'
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl shadow-green-500/20 scale-105'
                              : hoveredRole === 'employer'
                              ? 'border-green-300 bg-green-50 shadow-lg scale-102'
                              : 'border-gray-200 hover:border-green-200 hover:bg-green-25 hover:shadow-md'
                          }`}
                        >
                          <div className={`relative transition-all duration-300 ${
                            selectedRole === 'employer' || hoveredRole === 'employer' ? 'animate-pulse' : ''
                          }`}>
                            <Building className={`mb-4 h-10 w-10 transition-all duration-300 ${
                              selectedRole === 'employer' 
                                ? 'text-green-600 scale-110' 
                                : 'text-green-500'
                            }`} />
                            {selectedRole === 'employer' && (
                              <div className="absolute -top-2 -right-2">
                                <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
                              </div>
                            )}
                          </div>
                          <span className={`text-xl font-bold transition-all duration-300 ${
                            selectedRole === 'employer'
                              ? 'text-green-700'
                              : 'text-gray-700'
                          }`}>
                            Employer
                          </span>
                          <span className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
                            Find and hire exceptional talent for your organization
                          </span>
                          <div className="flex items-center mt-3 space-x-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <Rocket className="w-4 h-4 text-orange-500" />
                            <Gift className="w-4 h-4 text-pink-500" />
                          </div>
                        </Label>
                        {selectedRole === 'employer' && (
                          <div className="absolute -top-1 -right-1">
                            <div className="bg-green-500 text-white rounded-full p-1">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                    {/* Hidden input for form validation */}
                    <input 
                      type="hidden" 
                      {...register('role')}
                      value={selectedRole}
                    />
                    {errors.role && (
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Enhanced Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className={`space-y-3 transition-all duration-300 ${
                      focusedField === 'first_name' ? 'scale-105' : 'scale-100'
                    }`}>
                      <Label htmlFor="first_name" className="flex items-center gap-2 text-sm font-semibold">
                        <User className="w-4 h-4 text-blue-500" />
                        First name <span className="text-red-500">*</span>
                        <button
                          type="button"
                          onClick={() => toggleTooltip('first_name')}
                          className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </button>
                      </Label>
                      <div className="relative">
                        <Input
                          id="first_name"
                          placeholder="Enter your first name"
                          {...register('first_name')}
                          onFocus={() => handleFieldFocus('first_name')}
                          onBlur={() => setFocusedField(null)}
                          className={`transition-all duration-300 ${
                            errors.first_name 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : focusedField === 'first_name'
                              ? 'border-blue-500 focus:border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400 focus:border-blue-400'
                          }`}
                        />
                        {focusedField === 'first_name' && !errors.first_name && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <MousePointer className="w-4 h-4 text-blue-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                      {showTooltips.first_name && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                          💡 Enter your legal first name as it appears on official documents
                        </div>
                      )}
                      {errors.first_name && (
                        <p className="text-sm text-red-600 flex items-center gap-2 animate-pulse">
                          <AlertCircle className="w-4 h-4" />
                          {errors.first_name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className={`space-y-3 transition-all duration-300 ${
                      focusedField === 'last_name' ? 'scale-105' : 'scale-100'
                    }`}>
                      <Label htmlFor="last_name" className="flex items-center gap-2 text-sm font-semibold">
                        <User className="w-4 h-4 text-blue-500" />
                        Last name <span className="text-red-500">*</span>
                        <button
                          type="button"
                          onClick={() => toggleTooltip('last_name')}
                          className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </button>
                      </Label>
                      <div className="relative">
                        <Input
                          id="last_name"
                          placeholder="Enter your last name"
                          {...register('last_name')}
                          onFocus={() => handleFieldFocus('last_name')}
                          onBlur={() => setFocusedField(null)}
                          className={`transition-all duration-300 ${
                            errors.last_name 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : focusedField === 'last_name'
                              ? 'border-blue-500 focus:border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400 focus:border-blue-400'
                          }`}
                        />
                        {focusedField === 'last_name' && !errors.last_name && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <MousePointer className="w-4 h-4 text-blue-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                      {showTooltips.last_name && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                          💡 Enter your family name or surname
                        </div>
                      )}
                      {errors.last_name && (
                        <p className="text-sm text-red-600 flex items-center gap-2 animate-pulse">
                          <AlertCircle className="w-4 h-4" />
                          {errors.last_name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Email Field */}
                  <div className={`space-y-3 transition-all duration-300 ${
                    focusedField === 'email' ? 'scale-105' : 'scale-100'
                  }`}>
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="w-4 h-4 text-blue-500" />
                      Email address <span className="text-red-500">*</span>
                      <button
                        type="button"
                        onClick={() => toggleTooltip('email')}
                        className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400" />
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="your.email@example.com"
                        {...register('email')}
                        onFocus={() => handleFieldFocus('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-300 ${
                          errors.email 
                            ? 'border-red-500 focus:border-red-500 bg-red-50' 
                            : focusedField === 'email'
                            ? 'border-blue-500 focus:border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 focus:border-blue-400'
                        }`}
                      />
                      {focusedField === 'email' && !errors.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Mail className="w-4 h-4 text-blue-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                    {showTooltips.email && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                        💡 Use a valid email address for account verification and communications
                      </div>
                    )}
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-2 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Enhanced Password Field */}
                  <div className={`space-y-3 transition-all duration-300 ${
                    focusedField === 'password' ? 'scale-105' : 'scale-100'
                  }`}>
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Password <span className="text-red-500">*</span>
                      <button
                        type="button"
                        onClick={() => toggleTooltip('password')}
                        className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400" />
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        {...register('password')}
                        onFocus={() => handleFieldFocus('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`pr-12 transition-all duration-300 ${
                          errors.password 
                            ? 'border-red-500 focus:border-red-500 bg-red-50' 
                            : focusedField === 'password'
                            ? 'border-blue-500 focus:border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 focus:border-blue-400'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                        {focusedField === 'password' && !errors.password && (
                          <Lock className="w-4 h-4 text-blue-500 animate-pulse" />
                        )}
                        <button
                          type="button"
                          className="hover:text-blue-600 transition-colors p-1 rounded"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {showTooltips.password && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        🔒 Strong passwords have:
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• At least 8 characters</li>
                          <li>• Mix of uppercase and lowercase</li>
                          <li>• Numbers and special characters</li>
                        </ul>
                      </div>
                    )}

                    {/* Enhanced Password Strength Indicator */}
                    {watchedPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-600">Password Strength</span>
                          <span className={`font-bold ${
                            passwordStrength >= 80 ? 'text-green-600' :
                            passwordStrength >= 60 ? 'text-yellow-600' :
                            passwordStrength >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {passwordStrength >= 80 ? 'Strong 💪' :
                             passwordStrength >= 60 ? 'Good 👍' :
                             passwordStrength >= 40 ? 'Fair 🤔' : 'Weak 😟'}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-700 ease-out ${
                                passwordStrength >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                passwordStrength >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                passwordStrength >= 40 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          {passwordStrength >= 80 && (
                            <div className="absolute right-0 -top-1">
                              <Sparkles className="w-3 h-3 text-green-500 animate-bounce" />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center gap-1 ${
                            watchedPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {watchedPassword.length >= 8 ? 
                              <CheckCircle2 className="w-3 h-3" /> : 
                              <X className="w-3 h-3" />
                            }
                            8+ characters
                          </div>
                          <div className={`flex items-center gap-1 ${
                            /[A-Z]/.test(watchedPassword) && /[a-z]/.test(watchedPassword) ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {/[A-Z]/.test(watchedPassword) && /[a-z]/.test(watchedPassword) ? 
                              <CheckCircle2 className="w-3 h-3" /> : 
                              <X className="w-3 h-3" />
                            }
                            Mixed case
                          </div>
                          <div className={`flex items-center gap-1 ${
                            /\d/.test(watchedPassword) ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {/\d/.test(watchedPassword) ? 
                              <CheckCircle2 className="w-3 h-3" /> : 
                              <X className="w-3 h-3" />
                            }
                            Numbers
                          </div>
                          <div className={`flex items-center gap-1 ${
                            /[^A-Za-z0-9]/.test(watchedPassword) ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {/[^A-Za-z0-9]/.test(watchedPassword) ? 
                              <CheckCircle2 className="w-3 h-3" /> : 
                              <X className="w-3 h-3" />
                            }
                            Special chars
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-2 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone number (optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...register('phone')}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Enhanced Terms and Conditions */}
                  <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">Legal & Privacy</h3>
                    </div>
                    
                    <div className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 ${
                      watch('terms_accepted') 
                        ? 'bg-green-50 border border-green-200' 
                        : errors.terms_accepted
                        ? 'bg-red-50 border border-red-200 animate-pulse'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="relative">
                        <Checkbox
                          id="terms"
                          checked={watch('terms_accepted') || false}
                          onCheckedChange={(checked) => setValue('terms_accepted', checked)}
                          className="mt-1"
                        />
                        {watch('terms_accepted') && (
                          <div className="absolute -top-1 -right-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <Label htmlFor="terms" className="text-sm leading-relaxed flex-1">
                        I agree to TalentSphere's{' '}
                        <Link 
                          to="/terms" 
                          className="text-blue-600 hover:text-blue-800 underline font-semibold hover:bg-blue-100 px-1 rounded transition-all"
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link 
                          to="/privacy" 
                          className="text-blue-600 hover:text-blue-800 underline font-semibold hover:bg-blue-100 px-1 rounded transition-all"
                        >
                          Privacy Policy
                        </Link>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Lock className="w-3 h-3" />
                          <span>Your data is secure and protected</span>
                        </div>
                      </Label>
                    </div>
                    
                    {errors.terms_accepted && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg animate-pulse">
                        <p className="text-sm text-red-600 flex items-center gap-2 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          {errors.terms_accepted.message}
                        </p>
                      </div>
                    )}

                    <div className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 ${
                      agreedToMarketing 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="relative">
                        <Checkbox
                          id="marketing"
                          checked={agreedToMarketing}
                          onCheckedChange={setAgreedToMarketing}
                          className="mt-1"
                        />
                        {agreedToMarketing && (
                          <div className="absolute -top-1 -right-1">
                            <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <Label htmlFor="marketing" className="text-sm leading-relaxed flex-1">
                        I'd like to receive updates about new features and opportunities via email
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Gift className="w-3 h-3" />
                          <span>Get early access to new features and job alerts</span>
                        </div>
                      </Label>
                    </div>
                  </div>

                  {/* Enhanced Navigation */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceedToStep2()}
                      className={`relative overflow-hidden group transition-all duration-300 transform ${
                        !canProceedToStep2() 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      } px-8 py-3 rounded-xl font-semibold flex items-center gap-2`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {!canProceedToStep2() ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Complete Required Fields
                          </>
                        ) : (
                          <>
                            Continue to Next Step
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                      {canProceedToStep2() && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  {selectedRole === 'employer' ? (
                    <>
                      {/* Professional Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold">Professional Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="job_title" className="flex items-center gap-2">
                              Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="job_title"
                              placeholder="HR Manager"
                              {...register('job_title')}
                              className={errors.job_title ? 'border-red-500' : 'border-gray-300'}
                            />
                            {errors.job_title && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.job_title.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                              id="department"
                              placeholder="Human Resources"
                              {...register('department')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="work_phone">Work Phone</Label>
                            <Input
                              id="work_phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...register('work_phone')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="work_email">Work Email</Label>
                            <Input
                              id="work_email"
                              type="email"
                              placeholder="john.doe@company.com"
                              {...register('work_email')}
                              className={errors.work_email ? 'border-red-500' : 'border-gray-300'}
                            />
                            {errors.work_email && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.work_email.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="hiring_authority"
                            {...register('hiring_authority')}
                          />
                          <Label htmlFor="hiring_authority" className="text-sm">
                            I have hiring authority in my organization
                          </Label>
                        </div>
                      </div>

                      <Separator />

                      {/* Company Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Building className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-semibold">Company Information</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company_name" className="flex items-center gap-2">
                              Company Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="company_name"
                              placeholder="Acme Corporation"
                              {...register('company_name')}
                              className={errors.company_name ? 'border-red-500' : 'border-gray-300'}
                            />
                            {errors.company_name && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.company_name.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="industry" className="flex items-center gap-2">
                              Industry <span className="text-red-500">*</span>
                            </Label>
                            <Select onValueChange={(value) => {
                              console.log('🏭 Industry selected:', value);
                              setValue('industry', value);
                              trigger('industry');
                            }}>
                              <SelectTrigger className={errors.industry ? 'border-red-500' : 'border-gray-300'}>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry} value={industry.toLowerCase().replace(/\s+/g, '_')}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Hidden input for form registration */}
                            <input type="hidden" {...register('industry')} />
                            {errors.industry && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.industry.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_size" className="flex items-center gap-2">
                              Company Size <span className="text-red-500">*</span>
                            </Label>
                            <Select onValueChange={(value) => {
                              console.log('📏 Company size selected:', value);
                              setValue('company_size', value);
                              trigger('company_size');
                            }}>
                              <SelectTrigger className={errors.company_size ? 'border-red-500' : 'border-gray-300'}>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                              <SelectContent>
                                {companySizes.map((size) => (
                                  <SelectItem key={size} value={size.toLowerCase().replace(/\s+/g, '_')}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Hidden input for form registration */}
                            <input type="hidden" {...register('company_size')} />
                            {errors.company_size && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.company_size.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_type" className="flex items-center gap-2">
                              Company Type <span className="text-red-500">*</span>
                            </Label>
                            <Select onValueChange={(value) => {
                              console.log('🏢 Company type selected:', value);
                              setValue('company_type', value);
                              trigger('company_type');
                            }}>
                              <SelectTrigger className={errors.company_type ? 'border-red-500' : 'border-gray-300'}>
                                <SelectValue placeholder="Select company type" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyTypes.map((type) => (
                                  <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Hidden input for form registration */}
                            <input type="hidden" {...register('company_type')} />
                            {errors.company_type && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.company_type.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_website">Company Website</Label>
                            <Input
                              id="company_website"
                              type="url"
                              placeholder="https://company.com"
                              {...register('company_website')}
                              className={errors.company_website ? 'border-red-500' : 'border-gray-300'}
                            />
                            {errors.company_website && (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.company_website.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="founded_year" className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Founded Year
                            </Label>
                            <Input
                              id="founded_year"
                              type="number"
                              min="1800"
                              max={new Date().getFullYear()}
                              placeholder={new Date().getFullYear().toString()}
                              {...register('founded_year', { valueAsNumber: true })}
                              className="border-gray-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_description">Company Description</Label>
                          <Textarea
                            id="company_description"
                            placeholder="Brief description of your company..."
                            rows={3}
                            {...register('company_description')}
                            className={errors.company_description ? 'border-red-500' : 'border-gray-300'}
                          />
                          {errors.company_description && (
                            <p className="text-sm text-red-600 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              {errors.company_description.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Company Location */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold">Company Location</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address_line1">Address</Label>
                            <Input
                              id="address_line1"
                              placeholder="123 Business Street"
                              {...register('address_line1')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="San Francisco"
                              {...register('city')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              placeholder="California"
                              {...register('state')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              placeholder="United States"
                              {...register('country')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="postal_code">Postal Code</Label>
                            <Input
                              id="postal_code"
                              placeholder="94105"
                              {...register('postal_code')}
                              className="border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Job Seeker Step 2
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold">Professional Details</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="desired_position">Desired Position</Label>
                            <Input
                              id="desired_position"
                              placeholder="Software Developer"
                              {...register('desired_position')}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="years_of_experience">Years of Experience</Label>
                            <Input
                              id="years_of_experience"
                              type="number"
                              min="0"
                              max="50"
                              {...register('years_of_experience', { valueAsNumber: true })}
                              className="border-gray-300"
                            />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="education_level">Education Level</Label>
                            <Select onValueChange={(value) => {
                              setValue('education_level', value);
                              trigger('education_level');
                            }}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select education level" />
                              </SelectTrigger>
                              <SelectContent>
                                {educationLevels.map((level) => (
                                  <SelectItem key={level} value={level.toLowerCase().replace(/\s+/g, '_')}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Hidden input for form registration */}
                            <input type="hidden" {...register('education_level')} />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Textarea
                              id="skills"
                              placeholder="JavaScript, React, Node.js, Python..."
                              rows={3}
                              {...register('skills')}
                              className="border-gray-300"
                            />
                            <p className="text-xs text-gray-500">
                              Separate skills with commas
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading || !canSubmitForm()}
                      className={`relative overflow-hidden group transition-all duration-500 transform ${
                        isLoading || !canSubmitForm()
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-2xl hover:shadow-green-500/30 hover:scale-105'
                      } text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 min-w-[200px] justify-center`}
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="animate-pulse">Creating your account...</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                            <span>Create Account</span>
                            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                          </>
                        )}
                      </div>
                      {!isLoading && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Enhanced Login Link */}
            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-6 bg-white text-gray-500 font-medium">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
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
                  className="group inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 transition-all duration-300 px-4 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Sign in to your account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Benefits Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <div className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-100">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
              <Shield className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors">Secure & Safe</p>
              <p className="text-xs text-gray-600">Bank-level security protection</p>
              <div className="flex items-center mt-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-100">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
              <Users className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-green-900 transition-colors">Join 10,000+ Users</p>
              <p className="text-xs text-gray-600">Fast-growing community</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-500 animate-bounce" />
                <span className="text-xs text-green-600 ml-1 font-medium">+2.5k this month</span>
              </div>
            </div>
          </div>
          
          <div className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-yellow-100">
            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors duration-300">
              <Star className="h-6 w-6 text-yellow-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-yellow-900 transition-colors">Top Rated Platform</p>
              <p className="text-xs text-gray-600">4.9/5 user satisfaction</p>
              <div className="flex items-center mt-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-2 h-2 fill-current text-yellow-400 group-hover:animate-pulse`} style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

