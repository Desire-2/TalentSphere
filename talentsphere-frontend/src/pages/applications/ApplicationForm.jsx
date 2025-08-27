import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  DollarSign, 
  Clock, 
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Star
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { applicationsService } from '../../services/applications';
import { jobsService } from '../../services/jobs';
import { formatCurrency, formatRelativeTime, snakeToTitle } from '../../utils/helpers';

const ApplicationForm = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  console.log('[ApplicationForm] Render:', {
    jobId,
    isAuthenticated,
    userRole: user?.role,
    timestamp: new Date().toISOString()
  });
  
  // Form state
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const fileInputRef = useRef(null);

  // Application form data
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    resume_url: '',
    portfolio_url: '',
    additional_documents: '',
    custom_responses: {},
    source: 'direct',
    // Personal information
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    availability: '',
    expected_salary: '',
    notice_period: '',
    willing_to_relocate: false
  });

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState([]);

  // Progress calculation
  const totalSteps = 4;
  const progress = (completedSteps.size / totalSteps) * 100;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      // Don't navigate immediately, let the user see a message
      console.log('User not authenticated, will redirect to login');
      return;
    }
    
    if (user?.role !== 'job_seeker') {
      console.log('User role not job_seeker, role is:', user?.role);
      return;
    }
  }, [isAuthenticated, user, navigate, jobId]);

  // Show authentication required message
  if (!isAuthenticated) {
    console.log('[ApplicationForm] Showing login required message');
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-8">You need to sign in to apply for this job.</p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/login" state={{ returnTo: `/jobs/${jobId}/apply` }}>
                Sign In
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show role error message
  if (user?.role !== 'job_seeker') {
    console.log('[ApplicationForm] Showing role error message. User role:', user?.role);
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-8">Only job seekers can apply for jobs. Current role: {user?.role}</p>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
            <Button asChild>
              <Link to="/profile">Update Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Load job details
  useEffect(() => {
    const loadJob = async () => {
      if (!jobId || !isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const jobData = await jobsService.getJobById(jobId);
        console.log('Job data loaded:', jobData);
        setJob(jobData.data || jobData);
        
        // Check if job allows applications
        if (jobData.application_type === 'external') {
          setError('This job requires external application. Please visit the company website to apply.');
          return;
        }
        
        if (jobData.application_type === 'email') {
          setError('This job requires email application. Please contact the employer directly.');
          return;
        }
        
        // Check if job is expired or inactive
        if (jobData.status !== 'published' || !jobData.is_active) {
          setError('This job is no longer accepting applications.');
          return;
        }
        
        // Check if application deadline has passed
        if (jobData.application_deadline && new Date() > new Date(jobData.application_deadline)) {
          setError('The application deadline for this job has passed.');
          return;
        }
        
        // Load custom questions if any
        if (jobData.custom_questions) {
          setCustomQuestions(JSON.parse(jobData.custom_questions));
        }
        
        // Pre-fill user data
        setApplicationData(prev => ({
          ...prev,
          full_name: user?.name || user?.full_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
        }));
        
        // Check if user has already applied
        try {
          const myApplications = await applicationsService.getMyApplications({ page: 1, per_page: 100 });
          const existingApplication = myApplications.applications?.find(app => app.job_id === parseInt(jobId));
          
          if (existingApplication) {
            setError('You have already applied for this job. You can view your application status in your dashboard.');
            return;
          }
        } catch (err) {
          console.warn('Could not check existing applications:', err);
        }
        
      } catch (error) {
        console.error('Failed to load job:', error);
        setError(error.message || 'Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, isAuthenticated, user]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark step as completed based on required fields
    updateStepCompletion(field);
  };

  // Handle custom question responses
  const handleCustomResponse = (questionId, value) => {
    setApplicationData(prev => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [questionId]: value
      }
    }));
  };

  // Update step completion
  const updateStepCompletion = (field) => {
    const newCompletedSteps = new Set(completedSteps);
    
    // Step 1: Personal Information
    if (['full_name', 'email', 'phone'].includes(field) && 
        applicationData.full_name && applicationData.email && applicationData.phone) {
      newCompletedSteps.add(1);
    }
    
    // Step 2: Cover Letter
    if (field === 'cover_letter' && applicationData.cover_letter.trim().length > 100) {
      newCompletedSteps.add(2);
    }
    
    // Step 3: Resume/Documents
    if (field === 'resume_url' && applicationData.resume_url) {
      newCompletedSteps.add(3);
    }
    
    setCompletedSteps(newCompletedSteps);
  };

  // Handle file upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document for your resume.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Resume file size should be less than 5MB.');
      return;
    }
    
    setUploadingResume(true);
    setError(null);
    
    try {
      // Import upload service dynamically
      const { default: uploadService } = await import('../../services/uploadService');
      
      // Upload the file
      const uploadedUrl = await uploadService.uploadResume(file, user?.id);
      
      handleInputChange('resume_url', uploadedUrl);
      console.log('Resume uploaded successfully:', uploadedUrl);
      
    } catch (error) {
      console.error('Resume upload failed:', error);
      setError(error.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    
    // Required fields
    if (!applicationData.full_name.trim()) errors.push('Full name is required');
    if (!applicationData.email.trim()) errors.push('Email is required');
    if (!applicationData.cover_letter.trim()) errors.push('Cover letter is required');
    
    // Job-specific requirements
    if (job?.requires_resume && !applicationData.resume_url) {
      errors.push('Resume is required for this job');
    }
    
    if (job?.requires_cover_letter && !applicationData.cover_letter.trim()) {
      errors.push('Cover letter is required for this job');
    }
    
    if (job?.requires_portfolio && !applicationData.portfolio_url.trim()) {
      errors.push('Portfolio is required for this job');
    }
    
    // Custom question validation
    customQuestions.forEach(question => {
      if (question.is_required && !applicationData.custom_responses[question.id]) {
        errors.push(`${question.question} is required`);
      }
    });
    
    return errors;
  };

  // Submit application
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Prepare application data
      const submitData = {
        cover_letter: applicationData.cover_letter,
        resume_url: applicationData.resume_url,
        portfolio_url: applicationData.portfolio_url || null,
        additional_documents: applicationData.additional_documents || null,
        custom_responses: Object.keys(applicationData.custom_responses).length > 0 
          ? JSON.stringify(applicationData.custom_responses) 
          : null,
        source: applicationData.source
      };
      
      console.log('Submitting application:', submitData);
      
      const result = await applicationsService.applyForJob(jobId, submitData);
      
      console.log('Application submitted successfully:', result);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/my-applications', { 
          state: { 
            message: `Application submitted successfully for ${job?.title}!` 
          }
        });
      }, 3000);
      
    } catch (error) {
      console.error('Application submission failed:', error);
      
      if (error.message.includes('already applied')) {
        setError('You have already applied for this job.');
      } else if (error.message.includes('not found')) {
        setError('Job not found or is no longer available.');
      } else if (error.message.includes('deadline')) {
        setError('Application deadline has passed.');
      } else {
        setError(error.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Apply for Job</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
            <Button asChild>
              <Link to="/my-applications">My Applications</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-gray-600 mb-2">
            Your application for <strong>{job?.title}</strong> at <strong>{job?.company?.name || job?.company_name}</strong> has been successfully submitted.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            You'll be redirected to your applications page shortly. The employer will review your application and get back to you.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/my-applications">View My Applications</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse More Jobs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main application form
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => navigate(`/jobs/${jobId}`)}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Details
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
        
        {/* Job Summary */}
        {job && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    {job.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {job.company?.name || job.company_name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.location?.is_remote ? 'Remote' : (job.location?.display || job.location?.city || 'Location not specified')}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    {job.salary_min && job.salary_max 
                      ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`
                      : 'Salary not disclosed'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{formatRelativeTime(job.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{snakeToTitle(job.employment_type || 'full_time')}</span>
                </div>
              </div>
              
              {/* Application Deadline */}
              {job.application_deadline && (
                <Alert className="mt-4">
                  <Calendar className="w-4 h-4" />
                  <AlertDescription>
                    Application deadline: {new Date(job.application_deadline).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Application Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <div className={`flex items-center ${completedSteps.has(1) ? 'text-green-600' : ''}`}>
              {completedSteps.has(1) ? <CheckCircle className="w-4 h-4 mr-1" /> : <div className="w-4 h-4 mr-1" />}
              Personal Info
            </div>
            <div className={`flex items-center ${completedSteps.has(2) ? 'text-green-600' : ''}`}>
              {completedSteps.has(2) ? <CheckCircle className="w-4 h-4 mr-1" /> : <div className="w-4 h-4 mr-1" />}
              Cover Letter
            </div>
            <div className={`flex items-center ${completedSteps.has(3) ? 'text-green-600' : ''}`}>
              {completedSteps.has(3) ? <CheckCircle className="w-4 h-4 mr-1" /> : <div className="w-4 h-4 mr-1" />}
              Documents
            </div>
            <div className={`flex items-center ${completedSteps.has(4) ? 'text-green-600' : ''}`}>
              {completedSteps.has(4) ? <CheckCircle className="w-4 h-4 mr-1" /> : <div className="w-4 h-4 mr-1" />}
              Review
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Personal Information */}
        <Card className={step === 1 ? 'border-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Step 1: Personal Information
              {completedSteps.has(1) && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Please provide your contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={applicationData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={applicationData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availability">Available to Start</Label>
                <Input
                  id="availability"
                  type="text"
                  value={applicationData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  placeholder="e.g., Immediately, 2 weeks notice"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expected_salary">Expected Salary (Optional)</Label>
                <Input
                  id="expected_salary"
                  type="number"
                  value={applicationData.expected_salary}
                  onChange={(e) => handleInputChange('expected_salary', e.target.value)}
                  placeholder="Enter expected salary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notice_period">Current Notice Period</Label>
                <Input
                  id="notice_period"
                  type="text"
                  value={applicationData.notice_period}
                  onChange={(e) => handleInputChange('notice_period', e.target.value)}
                  placeholder="e.g., 30 days, Not applicable"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Cover Letter */}
        <Card className={step === 2 ? 'border-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Step 2: Cover Letter
              {completedSteps.has(2) && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
              {job?.requires_cover_letter && <span className="text-red-500 ml-2">*</span>}
            </CardTitle>
            <CardDescription>
              Tell us why you're the perfect candidate for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="cover_letter">
                Cover Letter {job?.requires_cover_letter && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="cover_letter"
                value={applicationData.cover_letter}
                onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                placeholder="Dear Hiring Manager,

I am writing to express my strong interest in the [Job Title] position at [Company Name]. With my experience in [relevant experience], I am confident I would be a valuable addition to your team.

[Explain why you're interested in this role and company]

[Highlight your relevant skills and achievements]

[Conclude with enthusiasm and next steps]

Thank you for considering my application. I look forward to hearing from you.

Best regards,
[Your name]"
                rows={15}
                required={job?.requires_cover_letter}
                className="min-h-[300px]"
              />
              <p className="text-sm text-gray-500">
                {applicationData.cover_letter.length} characters
                {applicationData.cover_letter.length < 100 && applicationData.cover_letter.length > 0 && 
                  " (minimum 100 characters recommended)"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Resume and Documents */}
        <Card className={step === 3 ? 'border-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Step 3: Resume & Documents
              {completedSteps.has(3) && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
              {job?.requires_resume && <span className="text-red-500 ml-2">*</span>}
            </CardTitle>
            <CardDescription>
              Upload your resume and any additional documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume">
                Resume/CV {job?.requires_resume && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-2">
                {!applicationData.resume_url ? (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop or click to browse (PDF, DOC, DOCX - Max 5MB)
                    </p>
                    {uploadingResume && (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-800">Resume uploaded successfully</p>
                        <p className="text-sm text-green-600">{applicationData.resume_url.split('/').pop()}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleInputChange('resume_url', '');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploadingResume}
                />
              </div>
            </div>

            {/* Portfolio URL */}
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">
                Portfolio/Website URL
                {job?.requires_portfolio && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                id="portfolio_url"
                type="url"
                value={applicationData.portfolio_url}
                onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                placeholder="https://your-portfolio.com"
                required={job?.requires_portfolio}
              />
            </div>

            {/* Additional Documents */}
            <div className="space-y-2">
              <Label htmlFor="additional_documents">Additional Documents (Optional)</Label>
              <Textarea
                id="additional_documents"
                value={applicationData.additional_documents}
                onChange={(e) => handleInputChange('additional_documents', e.target.value)}
                placeholder="Provide links to any additional documents (certifications, references, etc.)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Custom Questions */}
        {customQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Additional Questions
              </CardTitle>
              <CardDescription>
                Please answer the following questions from the employer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customQuestions.map((question, index) => (
                <div key={question.id || index} className="space-y-2">
                  <Label htmlFor={`custom_${question.id || index}`}>
                    {question.question}
                    {question.is_required && <span className="text-red-500"> *</span>}
                  </Label>
                  {question.question_type === 'textarea' ? (
                    <Textarea
                      id={`custom_${question.id || index}`}
                      value={applicationData.custom_responses[question.id || index] || ''}
                      onChange={(e) => handleCustomResponse(question.id || index, e.target.value)}
                      placeholder="Enter your answer..."
                      rows={4}
                      required={question.is_required}
                    />
                  ) : (
                    <Input
                      id={`custom_${question.id || index}`}
                      type="text"
                      value={applicationData.custom_responses[question.id || index] || ''}
                      onChange={(e) => handleCustomResponse(question.id || index, e.target.value)}
                      placeholder="Enter your answer..."
                      required={question.is_required}
                      maxLength={question.max_length}
                    />
                  )}
                  {question.max_length && (
                    <p className="text-sm text-gray-500">
                      {(applicationData.custom_responses[question.id || index] || '').length} / {question.max_length} characters
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Application Requirements */}
        {(job?.requires_resume || job?.requires_cover_letter || job?.requires_portfolio) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required for this position:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {job?.requires_resume && <li>Resume/CV</li>}
                {job?.requires_cover_letter && <li>Cover Letter</li>}
                {job?.requires_portfolio && <li>Portfolio/Website</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" type="button" asChild>
            <Link to={`/jobs/${jobId}`}>Cancel</Link>
          </Button>
          
          <Button type="submit" disabled={submitting} className="min-w-[200px]">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
