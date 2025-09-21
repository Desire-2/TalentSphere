import { useState, useEffect } from 'react';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Users,
  Bookmark,
  BookmarkCheck,
  Share2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
  GraduationCap,
  FileText,
  Mail,
  ExternalLink,
  Briefcase,
  Eye,
  Star,
  Timer,
  Info
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, snakeToTitle } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import ShareJob from '../../components/jobs/ShareJob';
import MarkdownRenderer from '../../components/ui/MarkdownRenderer';
import SmartTextRenderer from '../../components/ui/SmartTextRenderer';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { requireAuth, navigateToProtectedRoute } = useAuthNavigation();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [applying, setApplying] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);

  const getApplyButtonText = () => {
    const applicationType = job.application_type || 'internal';
    
    switch (applicationType) {
      case 'external':
        return 'Apply on Company Site';
      case 'email':
        return 'Apply via Email';
      case 'internal':
      default:
        return 'Apply Now';
    }
  };

  // Helper functions for ShareJob component
  const getCompanyName = (job) => {
    return job.company?.name || job.external_company_name || 'Company Name';
  };

  const getCompanyLogo = (job) => {
    return job.company?.logo_url || job.external_company_logo || null;
  };

  const getJobDescription = (job) => {
    if (job.summary) {
      return job.summary;
    }
    if (job.description) {
      // Return first paragraph or first 200 characters
      const firstParagraph = job.description.split('\n\n')[0];
      return firstParagraph.length > 200 
        ? firstParagraph.substring(0, 200) + '...'
        : firstParagraph;
    }
    return 'No description available';
  };

  const getJobLocation = (job) => {
    if (job.location?.is_remote) {
      return 'Remote';
    }
    if (typeof job.location?.display === 'string') {
      return job.location.display;
    }
    if (job.location?.city && job.location?.state) {
      return `${job.location.city}, ${job.location.state}`;
    }
    return 'Location not specified';
  };

  const getSalaryDisplay = (job) => {
    if (job.salary?.show_salary && job.salary?.min && job.salary?.max) {
      return `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`;
    }
    if (typeof job.salary?.display === 'string') {
      return job.salary.display;
    }
    return 'Salary not disclosed';
  };

  useEffect(() => {
    const loadJobDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const jobData = await apiService.getJob(id);
        setJob(jobData);

        // Debug: Log external job data
        if (jobData.job_source === 'external' || jobData.external_company_name) {
          console.log('External job data:', {
            id: jobData.id,
            title: jobData.title,
            external_company_name: jobData.external_company_name,
            external_company_logo: jobData.external_company_logo,
            job_source: jobData.job_source,
            company: jobData.company
          });
        }

        // Update page title if meta_title is available
        if (jobData.meta_title) {
          document.title = `${jobData.meta_title} - TalentSphere`;
        } else {
          document.title = `${jobData.title} at ${jobData.company?.name || 'Company'} - TalentSphere`;
        }
        
        // Check if user has applied (only for authenticated job seekers)
        if (isAuthenticated && user?.role === 'job_seeker') {
          try {
            const applicationStatus = await apiService.checkApplicationStatus(id);
            setHasApplied(!!applicationStatus);
            setApplicationData(applicationStatus);
          } catch (error) {
            console.warn('Could not check application status:', error);
          }
        }
        
        // Load similar jobs if available
        try {
          const similar = await apiService.getSimilarJobs(id, { limit: 3 });
          setSimilarJobs(similar.jobs || []);
        } catch (similarError) {
          console.warn('Could not load similar jobs:', similarError);
        }
        
      } catch (error) {
        console.error('Failed to load job details:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load job details';
        setError(errorMessage);
        
        // Set appropriate page title for error case
        document.title = 'Job Not Found - TalentSphere';
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
  }, [id, isAuthenticated, user]);

  const handleApply = async () => {
    console.log('🚀 Apply button clicked!', { id, user, isAuthenticated, job });
    
    requireAuth(async () => {
      if (user?.role !== 'job_seeker') {
        // Show message that only job seekers can apply
        console.log('❌ User is not a job seeker:', user?.role);
        setError('Only job seekers can apply for jobs');
        return;
      }

      // Check if user has already applied
      if (hasApplied) {
        console.log('❌ User has already applied');
        setError('You have already applied to this job! Check your application status in "My Applications".');
        return;
      }

      // Check if job is expired
      if (job.is_expired) {
        console.log('❌ Job is expired');
        setError('This job posting has expired');
        return;
      }

      // Check application method and redirect accordingly
      const applicationType = job.application_type || 'internal';
      console.log('🔍 Application type:', applicationType);

      try {
        setApplying(true);
        setError(null);

        if (applicationType === 'external' && job.application_url) {
          // External application - open URL in new tab
          console.log('🌐 Opening external URL:', job.application_url);
          window.open(job.application_url, '_blank', 'noopener,noreferrer');
          
          // Optional: Track that user clicked external apply
          try {
            await apiService.post(`/jobs/${id}/track-external-click`);
          } catch (trackError) {
            console.warn('Could not track external application click:', trackError);
          }
        } else if (applicationType === 'email' && job.application_email) {
          // Email application - open email client
          console.log('📧 Opening email application:', job.application_email);
          const subject = encodeURIComponent(`Application for ${job.title} at ${job.company?.name || 'Your Company'}`);
          const body = encodeURIComponent(`Dear Hiring Manager,

I am interested in applying for the ${job.title} position at ${job.company?.name || 'your company'}.

${job.application_instructions || 'Please find my resume attached.'}

Best regards,
${user.name || user.email}`);
          
          const mailtoUrl = `mailto:${job.application_email}?subject=${subject}&body=${body}`;
          window.location.href = mailtoUrl;
          
          // Optional: Track that user clicked email apply
          try {
            await apiService.post(`/jobs/${id}/track-email-click`);
          } catch (trackError) {
            console.warn('Could not track email application click:', trackError);
          }
        } else {
          // Internal application - redirect to application form
          const applyUrl = `/jobs/${id}/apply`;
          console.log('✅ Navigating to internal application form:', applyUrl);
          console.log('Current location:', window.location.href);
          console.log('Target URL will be:', `${window.location.origin}${applyUrl}`);
          navigateToProtectedRoute(applyUrl);
        }
      } catch (error) {
        console.error('❌ Error handling application:', error);
        setError(error.message || 'Failed to process application. Please try again.');
      } finally {
        setApplying(false);
      }
    });
  };

  const toggleBookmark = async () => {
    requireAuth(async () => {
      try {
        if (isBookmarked) {
          await apiService.removeBookmark(id);
          setIsBookmarked(false);
        } else {
          await apiService.bookmarkJob(id);
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
        // You might want to show a toast notification here
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Back button skeleton */}
          <div className="h-10 bg-gray-200 rounded w-32 mb-6"></div>
          
          {/* Job header skeleton */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="flex space-x-2 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
                ))}
              </div>
              <div className="h-12 bg-gray-200 rounded w-40"></div>
            </CardContent>
          </Card>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Job</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-8">The job you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/jobs">Browse All Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/jobs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        {/* Expired Job Warning */}
        {job.is_expired && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This job posting has expired and is no longer accepting applications.
            </AlertDescription>
          </Alert>
        )}      {/* Job Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {(job.company?.logo_url || job.external_company_logo) ? (
                  <img 
                    src={job.company?.logo_url || job.external_company_logo} 
                    alt={`${getCompanyName(job)} logo`} 
                    className="w-12 h-12 object-contain rounded"
                    onError={(e) => {
                      console.log('Logo failed to load:', job.company?.logo_url || job.external_company_logo);
                      e.target.style.display = 'none';
                      e.target.parentNode.querySelector('.fallback-icon').style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`fallback-icon w-12 h-12 flex items-center justify-center ${(job.company?.logo_url || job.external_company_logo) ? 'hidden' : 'flex'}`}>
                  {(job.job_source === 'external' || job.external_company_name) ? (
                    <div className="flex flex-col items-center text-blue-600">
                      <ExternalLink className="w-5 h-5 mb-1" />
                      <Building className="w-4 h-4" />
                    </div>
                  ) : (
                    <Building className="w-8 h-8 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  {job.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {job.is_urgent && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <Timer className="w-3 h-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  {getCompanyName(job)}
                </CardDescription>
                <p className="text-sm text-gray-600 mt-1">{job.company?.description || ''}</p>
                {job.published_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Published {formatRelativeTime(job.published_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={toggleBookmark}>
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
              <ShareJob 
                job={job}
                getCompanyName={getCompanyName}
                getCompanyLogo={getCompanyLogo}
                getJobDescription={getJobDescription}
                getJobLocation={getJobLocation}
                getSalaryDisplay={getSalaryDisplay}
                trigger={
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                {job.location?.is_remote 
                  ? 'Remote' 
                  : (typeof job.location?.display === 'string' 
                      ? job.location.display 
                      : job.location?.city && job.location?.state 
                        ? `${job.location.city}, ${job.location.state}`
                        : 'Location not specified'
                    )
                }
              </span>
            </div>
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                {job.salary?.show_salary && job.salary?.min && job.salary?.max 
                  ? `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`
                  : (typeof job.salary?.display === 'string' 
                      ? job.salary.display 
                      : 'Salary not disclosed'
                    )
                }
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>{formatRelativeTime(job.created_at)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <span>{job.statistics?.application_count || job.applications_count || 0} applicants</span>
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {job.statistics?.view_count && (
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                <span>{job.statistics.view_count} views</span>
              </div>
            )}
            {job.years_experience_min !== undefined && (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                <span>
                  {job.years_experience_min === 0 && !job.years_experience_max 
                    ? 'No experience required'
                    : job.years_experience_max 
                      ? `${job.years_experience_min}-${job.years_experience_max} years`
                      : `${job.years_experience_min}+ years`
                  }
                </span>
              </div>
            )}
            {job.application_deadline && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
              </div>
            )}
            {job.expires_at && job.days_until_expiry !== null && (
              <div className="flex items-center text-sm text-gray-600">
                <Timer className="w-4 h-4 mr-2 text-gray-400" />
                <span>
                  {job.days_until_expiry === 0 
                    ? 'Expires today' 
                    : `Expires in ${job.days_until_expiry} days`
                  }
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline">{snakeToTitle(job.employment_type)}</Badge>
            <Badge variant="outline">{snakeToTitle(job.experience_level)}</Badge>
            <Badge variant="outline">{job.category?.name || 'Unknown Category'}</Badge>
            {job.location?.is_remote && <Badge variant="outline">Remote OK</Badge>}
            {job.location?.type === 'hybrid' && <Badge variant="outline">Hybrid</Badge>}
            {job.visa_sponsorship && <Badge variant="outline">Visa Sponsorship</Badge>}
            {job.salary?.negotiable && <Badge variant="outline">Salary Negotiable</Badge>}
          </div>

          {/* Application Method Info */}
          {job.application_type && job.application_type !== 'internal' && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {job.application_type === 'external' && (
                  <div className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Applications are handled externally via the company's website
                  </div>
                )}
                {job.application_type === 'email' && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Applications should be sent via email to: {job.application_email}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Apply Button */}
          <div className="flex items-center space-x-4">
            {hasApplied ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">You have already applied to this job</span>
                </div>
                {applicationData && (
                  <div className="text-sm text-green-700">
                    <div className="mb-1">
                      <strong>Application Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        applicationData.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        applicationData.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        applicationData.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                        applicationData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {applicationData.status_display || applicationData.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Applied on:</strong> {new Date(applicationData.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate('/my-applications')}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        View Application
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate('/jobs')}
                        className="text-gray-600 border-gray-300"
                      >
                        Browse More Jobs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : isAuthenticated && user?.role === 'job_seeker' ? (
              <Button 
                size="lg" 
                onClick={handleApply}
                disabled={applying || job.is_expired}
                className="min-w-[150px]"
              >
                {applying ? 'Processing...' : job.is_expired ? 'Expired' : getApplyButtonText()}
              </Button>
            ) : isAuthenticated && user?.role !== 'job_seeker' ? (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Only job seekers can apply for jobs</span>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={handleApply}
                className="min-w-[150px]"
                disabled={job.is_expired}
              >
                {job.is_expired ? 'Expired' : getApplyButtonText()}
              </Button>
            )}
            {!isAuthenticated && (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Sign in to apply</span>
              </div>
            )}
            {job.is_expired && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">This job posting has expired</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              {job.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <SmartTextRenderer 
                    content={job.summary}
                    className="text-sm"
                  />
                </div>
              )}
              <div className="prose prose-sm max-w-none">
                {job.description ? (
                  <SmartTextRenderer 
                    content={job.description}
                    className=""
                  />
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Experience Requirements */}
              {(job.years_experience_min !== undefined || job.experience_level) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Experience Level
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{snakeToTitle(job.experience_level)} level position</span>
                    </div>
                    {job.years_experience_min !== undefined && (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">
                          {job.years_experience_min === 0 && !job.years_experience_max 
                            ? 'No prior experience required'
                            : job.years_experience_max 
                              ? `${job.years_experience_min}-${job.years_experience_max} years of experience`
                              : `Minimum ${job.years_experience_min} years of experience`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Education Requirements */}
              {job.education_requirement && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Education
                  </h4>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{job.education_requirement}</span>
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {job.required_skills && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                  <SmartTextRenderer 
                    content={job.required_skills}
                    className=""
                  />
                </div>
              )}

              {/* Application Requirements */}
              {(job.requirements?.resume || job.requirements?.cover_letter || job.requirements?.portfolio) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Application Requirements
                  </h4>
                  <ul className="space-y-2">
                    {job.requirements.resume && (
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Resume/CV required</span>
                      </li>
                    )}
                    {job.requirements.cover_letter && (
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Cover letter required</span>
                      </li>
                    )}
                    {job.requirements.portfolio && (
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Portfolio required</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {(!job.required_skills && !job.education_requirement && !job.requirements?.resume && !job.requirements?.cover_letter && !job.requirements?.portfolio) && (
                <p className="text-gray-500 italic">No specific requirements listed</p>
              )}
            </CardContent>
          </Card>

          {/* Preferred Skills */}
          {job.preferred_skills && (
            <Card>
              <CardHeader>
                <CardTitle>Preferred Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <SmartTextRenderer 
                  content={job.preferred_skills}
                  className=""
                />
              </CardContent>
            </Card>
          )}

          {/* Application Instructions */}
          {job.application_instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Application Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <SmartTextRenderer 
                  content={job.application_instructions}
                  className=""
                />
              </CardContent>
            </Card>
          )}

          {/* Remote Work Policy */}
          {(job.remote_policy || job.location?.type === 'remote' || job.location?.type === 'hybrid') && (
            <Card>
              <CardHeader>
                <CardTitle>Remote Work Policy</CardTitle>
              </CardHeader>
              <CardContent>
                {job.remote_policy ? (
                  <SmartTextRenderer 
                    content={job.remote_policy}
                    className=""
                  />
                ) : (
                  <p className="text-gray-700">
                    This position supports {job.location?.type === 'remote' ? 'fully remote' : 'hybrid'} work arrangements.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {(job.company?.logo_url || job.external_company_logo) ? (
                    <img 
                      src={job.company?.logo_url || job.external_company_logo} 
                      alt={`${getCompanyName(job)} logo`} 
                      className="w-8 h-8 object-contain rounded"
                      onError={(e) => {
                        console.log('Sidebar logo failed to load:', job.company?.logo_url || job.external_company_logo);
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.sidebar-fallback-icon').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`sidebar-fallback-icon w-8 h-8 flex items-center justify-center ${(job.company?.logo_url || job.external_company_logo) ? 'hidden' : 'flex'}`}>
                    {(job.job_source === 'external' || job.external_company_name) ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <ExternalLink className="w-3 h-3 mb-1" />
                        <Building className="w-3 h-3" />
                      </div>
                    ) : (
                      <Building className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
                About {getCompanyName(job)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(job.company?.description || job.external_company_description) && (
                <div className="text-sm">
                  <SmartTextRenderer 
                    content={job.company?.description || job.external_company_description}
                    className=""
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                {job.company?.industry && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Industry</h4>
                    <p className="text-sm text-gray-600">{job.company.industry}</p>
                  </div>
                )}
                {job.company?.size && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Company Size</h4>
                    <p className="text-sm text-gray-600">{job.company.size}</p>
                  </div>
                )}
                {job.company?.founded_year && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Founded</h4>
                    <p className="text-sm text-gray-600">{job.company.founded_year}</p>
                  </div>
                )}
                {(job.company?.website || job.external_company_website) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Website</h4>
                    <a 
                      href={job.company?.website || job.external_company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {job.company?.website || job.external_company_website}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
                {job.company?.headquarters && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Headquarters</h4>
                    <p className="text-sm text-gray-600">{job.company.headquarters}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              {job.company?.id ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/companies/${job.company.id}`}>View Company Profile</Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  External Company
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Job Statistics */}
          {(job.statistics?.view_count || job.statistics?.application_count || job.statistics?.bookmark_count) && (
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.statistics.view_count && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">Views</span>
                      </div>
                      <span className="text-sm font-medium">{job.statistics.view_count.toLocaleString()}</span>
                    </div>
                  )}
                  {job.statistics.application_count && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">Applications</span>
                      </div>
                      <span className="text-sm font-medium">{job.statistics.application_count}</span>
                    </div>
                  )}
                  {job.statistics.bookmark_count && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bookmark className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">Bookmarks</span>
                      </div>
                      <span className="text-sm font-medium">{job.statistics.bookmark_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits & Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <SmartTextRenderer 
                  content={job.benefits}
                  className=""
                />
              </CardContent>
            </Card>
          )}

          {/* Similar Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {similarJobs.length > 0 ? (
                  similarJobs.map((similarJob, index) => (
                    <div key={similarJob.id} className="border-b pb-3 last:border-b-0">
                      <h4 className="font-medium text-sm">
                        <Link 
                          to={`/jobs/${similarJob.id}`} 
                          className="hover:text-blue-600 transition-colors"
                        >
                          {similarJob.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {getCompanyName(similarJob)} • {getJobLocation(similarJob)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {similarJob.is_featured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                              Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {snakeToTitle(similarJob.employment_type)}
                          </Badge>
                        </div>
                        {getSalaryDisplay(similarJob) !== 'Salary not disclosed' && (
                          <p className="text-xs text-gray-500">
                            {getSalaryDisplay(similarJob)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(similarJob.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">No similar jobs found</h4>
                    <p className="text-xs text-gray-600">Check back later for recommendations</p>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link to={`/jobs?category=${job.category?.id || ''}`}>
                  View More {job.category?.name || 'Related'} Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;

