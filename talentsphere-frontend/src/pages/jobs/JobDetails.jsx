import { useState, useEffect } from 'react';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import './JobDetails.css';
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
import { LeaderboardAd, ResponsiveAd, SquareAd } from '../../components/ads/AdComponents';

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
  const [similarJobsLoading, setSimilarJobsLoading] = useState(false);
  const [similarJobsError, setSimilarJobsError] = useState(null);

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
        setSimilarJobsLoading(true);
        setSimilarJobsError(null);
        try {
          const similar = await apiService.getSimilarJobs(id, { limit: 5 });
          if (similar.success) {
            setSimilarJobs(similar.similar_jobs || []);
          } else {
            setSimilarJobs([]);
            setSimilarJobsError(similar.error || 'Failed to load similar jobs');
          }
        } catch (similarError) {
          console.warn('Could not load similar jobs:', similarError);
          setSimilarJobsError('Failed to load similar jobs');
          setSimilarJobs([]);
        } finally {
          setSimilarJobsLoading(false);
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
    if (!job) {
      return;
    }

    const applicationType = job.application_type || 'internal';
    const overridePath = applicationType === 'internal'
      ? { pathname: `/jobs/${id}/apply` }
      : { pathname: `/jobs/${id}` };

    console.log('🚀 Apply button clicked!', { id, user, isAuthenticated, job, applicationType, overridePath });
    
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
      const currentApplicationType = job.application_type || 'internal';
      console.log('🔍 Application type:', currentApplicationType);

      try {
        setApplying(true);
        setError(null);

        if (currentApplicationType === 'external' && job.application_url) {
          // External application - open URL in new tab
          console.log('🌐 Opening external URL:', job.application_url);
          window.open(job.application_url, '_blank', 'noopener,noreferrer');
          
          // Optional: Track that user clicked external apply
          try {
            await apiService.post(`/jobs/${id}/track-external-click`);
          } catch (trackError) {
            console.warn('Could not track external application click:', trackError);
          }
        } else if (currentApplicationType === 'email' && job.application_email) {
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
    }, { overridePath });
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
        {/* Google Ads - Leaderboard */}
        <div className="mb-6">
          <div className="flex justify-center">
            <LeaderboardAd className="rounded-lg shadow-sm" />
          </div>
        </div>

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

      {/* Google Ads - Responsive between sections */}
      <div className="mb-8">
        <div className="flex justify-center">
          <ResponsiveAd className="rounded-lg shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Enhanced Job Description */}
          <Card className="enhanced-card shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Job Description</CardTitle>
                    <CardDescription className="text-blue-100 mt-1">
                      Detailed overview of the role and responsibilities
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm">
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 bg-white/80 backdrop-blur-sm">
              {/* Enhanced Summary Section */}
              {job.summary && (
                <div className="relative p-6 border-b border-gray-100">
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r"></div>
                  
                  <div className="relative">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Info className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">Position Overview</h4>
                      <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm">
                      <SmartTextRenderer 
                        content={job.summary}
                        className="text-gray-700 leading-relaxed text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Description Content */}
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">Complete Job Details</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                </div>

                {job.description ? (
                  <div className="relative">
                    {/* Enhanced Markdown/Smart Text Rendering */}
                    <div className="enhanced-job-description prose prose-lg max-w-none 
                                  prose-headings:text-gray-900 prose-headings:font-bold 
                                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
                                  prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5 prose-h2:text-indigo-700
                                  prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-purple-600
                                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                                  prose-ul:my-4 prose-li:my-2 prose-li:text-gray-700
                                  prose-ol:my-4 prose-ol:list-decimal
                                  prose-strong:text-gray-900 prose-strong:font-semibold
                                  prose-em:text-indigo-600 prose-em:italic
                                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-purple-700
                                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4
                                  prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:p-4 prose-blockquote:my-4 prose-blockquote:rounded-r-lg
                                  prose-a:text-indigo-600 prose-a:hover:text-indigo-800 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                                  ">
                      
                      {/* Smart content rendering with enhanced markdown support */}
                      {job.description.includes('##') || job.description.includes('**') || job.description.includes('*') || job.description.includes('-') ? (
                        <MarkdownRenderer 
                          content={job.description}
                          className="enhanced-markdown-content"
                        />
                      ) : (
                        <SmartTextRenderer 
                          content={job.description}
                          className="enhanced-text-content"
                        />
                      )}
                    </div>

                    {/* Interactive Elements for Better UX */}
                    <div className="mt-8 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Timer className="w-4 h-4" />
                          <span>{Math.ceil(job.description.split(' ').length / 200)} min read</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{job.description.split(' ').length} words</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-indigo-600"
                          onClick={() => {
                            navigator.clipboard.writeText(job.description);
                            // Add toast notification here if available
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Copy Description
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No detailed description available</p>
                    <p className="text-gray-400 text-sm">The job description has not been provided for this position.</p>
                  </div>
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

          {/* Enhanced Application Instructions */}
          {job.application_instructions && (
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg ring-1 ring-emerald-200/50">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:15px_15px]"></div>
                </div>
                
                <div className="relative">
                  <CardTitle className="flex items-center gap-3">
                    <div className="relative">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Info className="w-2.5 h-2.5 text-yellow-900" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">Application Instructions</h3>
                      <p className="text-emerald-100 text-sm font-medium">
                        Follow these guidelines for the best application experience
                      </p>
                    </div>
                    <Badge className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Important
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-0 bg-white/80 backdrop-blur-sm">
                <div className="p-6 space-y-4">
                  {/* Instructions Content with Enhanced Bullet Design */}
                  <div className="bg-white/70 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-4">How to Apply</h4>
                        <div className="space-y-3">
                          {/* Enhanced Bullet Point Display */}
                          {job.application_instructions.split('\n').filter(line => line.trim()).map((instruction, index) => {
                            const trimmedInstruction = instruction.trim();
                            if (!trimmedInstruction) return null;
                            
                            return (
                              <div key={index} className="flex items-start gap-3 group">
                                <div className="flex-shrink-0 mt-1.5">
                                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                                    <span className="text-white font-bold text-xs">{index + 1}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl p-4 border border-emerald-100/50 group-hover:border-emerald-200 transition-all duration-200">
                                    <SmartTextRenderer 
                                      content={trimmedInstruction.replace(/^[-•*]\s*/, '')}
                                      className="prose prose-sm prose-emerald max-w-none text-gray-700 leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Fallback for single instruction */}
                          {!job.application_instructions.includes('\n') && (
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1.5">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl p-4 border border-emerald-100/50">
                                  <SmartTextRenderer 
                                    content={job.application_instructions}
                                    className="prose prose-sm prose-emerald max-w-none text-gray-700 leading-relaxed"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Type Specific Guidelines */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {job.application_type === 'external' ? (
                          <ExternalLink className="w-5 h-5 text-blue-600" />
                        ) : job.application_type === 'email' ? (
                          <Mail className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Application Method</h4>
                        <div className="text-sm text-gray-700">
                          {job.application_type === 'external' && (
                            <div className="flex items-center gap-2 p-3 bg-blue-100/50 rounded-xl">
                              <ExternalLink className="w-4 h-4 text-blue-600" />
                              <span>Apply directly on the company's website using the "Apply on Company Site" button below.</span>
                            </div>
                          )}
                          {job.application_type === 'email' && (
                            <div className="flex items-center gap-2 p-3 bg-blue-100/50 rounded-xl">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span>Send your application via email using the "Apply via Email" button below.</span>
                            </div>
                          )}
                          {(!job.application_type || job.application_type === 'internal') && (
                            <div className="flex items-center gap-2 p-3 bg-blue-100/50 rounded-xl">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Apply directly through our platform using the "Apply Now" button below.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips Section */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-3">Application Tips</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Tailor your resume to match job requirements</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Write a compelling cover letter</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Highlight relevant experience</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Follow all application instructions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information if Email Application */}
                  {job.application_type === 'email' && job.application_email && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                          <div className="flex items-center gap-2 p-3 bg-purple-100/50 rounded-xl">
                            <Mail className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-900">{job.application_email}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto h-7 px-2 text-xs"
                              onClick={() => navigator.clipboard.writeText(job.application_email)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Deadline if Available */}
                  {job.application_deadline && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Application Deadline</h4>
                          <div className="flex items-center gap-2 p-3 bg-red-100/50 rounded-xl">
                            <Clock className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-900">
                              {new Date(job.application_deadline).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <Badge variant="destructive" className="ml-auto">
                              {(() => {
                                const daysLeft = Math.ceil((new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                return daysLeft > 0 ? `${daysLeft} days left` : 'Expired';
                              })()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
          {/* Google Ads - Square Ad */}
          <div className="flex justify-center">
            <SquareAd className="rounded-lg shadow-sm" />
          </div>

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
                <div className="enhanced-job-description prose prose-sm max-w-none 
                              prose-headings:text-gray-900 prose-headings:font-semibold 
                              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
                              prose-ul:my-3 prose-li:my-1 prose-li:text-gray-700
                              prose-strong:text-gray-900 prose-strong:font-semibold
                              bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 border border-blue-100">
                  {(job.company?.description || job.external_company_description).includes('##') || 
                   (job.company?.description || job.external_company_description).includes('**') || 
                   (job.company?.description || job.external_company_description).includes('*') ? (
                    <MarkdownRenderer 
                      content={job.company?.description || job.external_company_description}
                      className="enhanced-company-description"
                    />
                  ) : (
                    <SmartTextRenderer 
                      content={job.company?.description || job.external_company_description}
                      className="text-gray-700 leading-relaxed"
                    />
                  )}
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

          {/* Enhanced Similar Jobs with Premium Visual Design */}
          <Card className="overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-xl border-0 ring-1 ring-slate-200/50">
            <CardHeader className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
              </div>
              
              <div className="relative">
                <CardTitle className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-2.5 h-2.5 text-yellow-900" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Similar Opportunities</h3>
                    <p className="text-indigo-100 text-sm font-medium">
                      AI-powered job matching • Tailored for you
                    </p>
                  </div>
                  {similarJobs.length > 0 && (
                    <Badge className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm px-3 py-1">
                      <Eye className="w-3 h-3 mr-1" />
                      {similarJobs.length} matches
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0 bg-white/80 backdrop-blur-sm">
              {similarJobsLoading ? (
                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Briefcase className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-gray-600 font-medium">Finding your perfect matches...</p>
                  </div>
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="flex gap-2">
                              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                            </div>
                          </div>
                          <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : similarJobsError ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Oops! Something went wrong</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">{similarJobsError}</p>
                  <Button 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => window.location.reload()}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : similarJobs.length > 0 ? (
                <div className="space-y-1">
                  {similarJobs.map((similarJob, index) => (
                    <div 
                      key={similarJob.id} 
                      className="relative group hover:shadow-lg transition-all duration-300 bg-white/70 hover:bg-white border-b border-slate-100 last:border-b-0"
                    >
                      {/* Hover Effect Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-purple-50/0 to-blue-50/0 group-hover:from-indigo-50/50 group-hover:via-purple-50/30 group-hover:to-blue-50/50 transition-all duration-300 rounded-lg"></div>
                      
                      <div className="relative p-6">
                        {/* Job Header with Enhanced Match Score */}
                        <div className="flex items-start gap-4 mb-4">
                          {/* Company Logo Placeholder */}
                          <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-all duration-200">
                            <Building className="w-6 h-6 text-slate-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors duration-200">
                              <Link 
                                to={`/jobs/${similarJob.id}`} 
                                className="hover:underline line-clamp-2"
                              >
                                {similarJob.title}
                              </Link>
                            </h4>
                            
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span className="font-medium">{getCompanyName(similarJob)}</span>
                              </div>
                              {getJobLocation(similarJob) && (
                                <>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{getJobLocation(similarJob)}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Match Score with Visual Progress */}
                            {similarJob.similarity_score && (
                              <div className="mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-600">Match Score</span>
                                      <span className="text-xs font-bold text-gray-900">{Math.round(similarJob.similarity_score)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 rounded-full ${
                                          similarJob.similarity_score >= 80 
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                            : similarJob.similarity_score >= 60 
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                        }`}
                                        style={{ width: `${similarJob.similarity_score}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                    similarJob.similarity_score >= 80 
                                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                                      : similarJob.similarity_score >= 60 
                                      ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200' 
                                      : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                                  }`}>
                                    {similarJob.similarity_score >= 80 ? 'Excellent' : similarJob.similarity_score >= 60 ? 'Good' : 'Fair'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Match Reasons */}
                        {similarJob.match_reasons && similarJob.match_reasons.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Why it matches</p>
                            <div className="flex flex-wrap gap-2">
                              {similarJob.match_reasons.slice(0, 3).map((reason, i) => (
                                <span 
                                  key={i}
                                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200 shadow-sm"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1.5" />
                                  {reason}
                                </span>
                              ))}
                              {similarJob.match_reasons.length > 3 && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                                  +{similarJob.match_reasons.length - 3} more reasons
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Enhanced Job Details Row */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            {/* Employment Type */}
                            <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200 hover:from-slate-200 hover:to-gray-200 px-3 py-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {snakeToTitle(similarJob.employment_type)}
                            </Badge>
                            
                            {/* Experience Level */}
                            {similarJob.experience_level && (
                              <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 hover:from-blue-200 hover:to-indigo-200 px-3 py-1">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {snakeToTitle(similarJob.experience_level)}
                              </Badge>
                            )}
                            
                            {/* Featured Badge with Animation */}
                            {similarJob.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200 px-3 py-1 animate-pulse">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          
                          {/* Salary and Posted Date */}
                          <div className="text-right">
                            {getSalaryDisplay(similarJob) !== 'Salary not disclosed' && (
                              <p className="text-sm font-bold text-green-600 mb-1">
                                {getSalaryDisplay(similarJob)}
                              </p>
                            )}
                            <p className="flex items-center justify-end gap-1 text-xs text-gray-500">
                              <Timer className="w-3 h-3" />
                              {similarJob.days_since_posted !== undefined 
                                ? `${similarJob.days_since_posted}d ago`
                                : formatRelativeTime(similarJob.created_at)
                              }
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        {(similarJob.is_bookmarked || similarJob.has_applied) && (
                          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                            {similarJob.has_applied && (
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-3 py-1">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Applied
                              </Badge>
                            )}
                            {similarJob.is_bookmarked && (
                              <Badge className="bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border-blue-200 px-3 py-1">
                                <BookmarkCheck className="w-3 h-3 mr-1" />
                                Bookmarked
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Enhanced Action Buttons */}
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200" 
                        asChild
                      >
                        <Link to={`/jobs?category=${job.category?.id || ''}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Browse {job.category?.name || 'Related'} Jobs
                        </Link>
                      </Button>
                      {isAuthenticated && user?.role === 'job_seeker' && (
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                          asChild
                        >
                          <Link to="/recommendations">
                            <Star className="w-4 h-4 mr-2" />
                            Get AI Recommendations
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="relative w-24 h-24 bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Briefcase className="w-12 h-12 text-slate-400" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-3">No Similar Jobs Found</h4>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    We couldn't find jobs similar to this one right now, but don't worry! 
                    Explore our other opportunities or get personalized recommendations.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      variant="outline" 
                      className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200" 
                      asChild
                    >
                      <Link to={`/jobs?category=${job.category?.id || ''}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Browse {job.category?.name || 'Related'} Jobs
                      </Link>
                    </Button>
                    {isAuthenticated && user?.role === 'job_seeker' && (
                      <Button 
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200" 
                        asChild
                      >
                        <Link to="/recommendations">
                          <Star className="w-4 h-4 mr-2" />
                          Get Personalized Jobs
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;

