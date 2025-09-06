import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Users,
  Clock,
  ExternalLink,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { scholarshipService } from '../../services/scholarship';
import { useAuthStore } from '../../stores/authStore';

const ScholarshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showExternalConfirm, setShowExternalConfirm] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // Helper function to validate and format URL
  const formatExternalUrl = (url) => {
    if (!url) return null;
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  // Helper function to get domain from URL for display
  const getDomainFromUrl = (url) => {
    try {
      const formattedUrl = formatExternalUrl(url);
      const urlObj = new URL(formattedUrl);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return url;
    }
  };

  // Helper function to safely render any field that might be an object
  const safeRender = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // For location objects
      if (value.display) return value.display;
      if (value.city || value.country) {
        return `${value.city || ''}${value.city && value.country ? ', ' : ''}${value.country || ''}`;
      }
      // For other objects, try to find a reasonable display value
      return Object.values(value).filter(v => typeof v === 'string').join(', ') || JSON.stringify(value);
    }
    return String(value);
  };

  useEffect(() => {
    if (id) {
      fetchScholarship();
    }
  }, [id]);

  const fetchScholarship = async () => {
    try {
      setLoading(true);
      const response = await scholarshipService.getScholarshipDetail(id);
      setScholarship(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching scholarship:', error);
      setError('Failed to load scholarship details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline specified';
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Deadline has passed';
    if (diffDays === 0) return 'Application deadline is today!';
    if (diffDays === 1) return 'Application due tomorrow';
    if (diffDays <= 7) return `Application due in ${diffDays} days`;
    if (diffDays <= 30) return `Application due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Application deadline: ${date.toLocaleDateString()}`;
  };

  const getDeadlineColor = (deadline) => {
    if (!deadline) return 'text-gray-500';
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 7) return 'text-orange-600';
    if (diffDays <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/scholarships/${id}` } });
      return;
    }

    // Check if deadline has passed
    if (isDeadlinePassed(scholarship.application_deadline)) {
      alert('The application deadline for this scholarship has passed.');
      return;
    }

    setIsApplying(true);
    
    try {
      if (scholarship.external_application_url) {
        const formattedUrl = formatExternalUrl(scholarship.external_application_url);
        const domain = getDomainFromUrl(scholarship.external_application_url);
        
        // For external applications, show confirmation and redirect
        if (window.confirm(
          `You will be redirected to the external application portal at ${domain}.\n\nDo you want to continue?`
        )) {
          // Track application attempt
          try {
            await scholarshipService.trackApplicationClick(id);
          } catch (trackError) {
            console.warn('Could not track application click:', trackError);
          }
          
          // Open external application URL
          window.open(formattedUrl, '_blank');
          
          // Show success message after a short delay
          setTimeout(() => {
            alert('Application portal opened in a new tab. Please complete your application on the external website.\n\nTip: Keep this page open for reference while applying!');
          }, 500);
        }
      } else {
        // Handle internal application process
        navigate(`/scholarships/${id}/apply`);
      }
    } catch (error) {
      console.error('Error during application:', error);
      alert('There was an error processing your application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isBookmarked) {
        await scholarshipService.removeBookmark(id);
        setIsBookmarked(false);
      } else {
        await scholarshipService.bookmarkScholarship(id);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scholarship.title,
          text: scholarship.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholarship details...</p>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scholarship Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The scholarship you are looking for does not exist.'}</p>
          <div className="space-x-4">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button asChild>
              <Link to="/scholarships">Browse Scholarships</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(scholarship.application_deadline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigate(-1)} variant="ghost" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scholarships
            </Button>
            <div className="flex space-x-2">
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {isAuthenticated && (
                <Button onClick={handleBookmark} variant="outline" size="sm">
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-2" />
                  )}
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scholarship Header */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {scholarship.category?.name || 'General'}
                  </Badge>
                  <div className={`text-sm font-medium ${getDeadlineColor(scholarship.application_deadline)}`}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatDeadline(scholarship.application_deadline)}
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  {scholarship.title}
                </CardTitle>
                
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      {scholarship.external_organization_name || scholarship.university_name || 'TalentSphere'}
                    </span>
                  </div>
                  {scholarship.location && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{safeRender(scholarship.location)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Deadline Alert */}
            {deadlinePassed ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  The application deadline for this scholarship has passed.
                </AlertDescription>
              </Alert>
            ) : scholarship.application_deadline && (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {formatDeadline(scholarship.application_deadline)}
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  About This Scholarship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {safeRender(scholarship.description)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {scholarship.eligibility_requirements && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Eligibility Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {safeRender(scholarship.eligibility_requirements)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Process */}
            {scholarship.application_process && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Application Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {safeRender(scholarship.application_process)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Apply Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scholarship.award_amount && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${scholarship.award_amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Award Amount</div>
                  </div>
                )}
                
                <Button 
                  onClick={handleApply}
                  disabled={deadlinePassed || isApplying}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : deadlinePassed ? (
                    'Application Closed'
                  ) : scholarship.external_application_url ? (
                    <>
                      Apply Externally
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
                
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 text-center">
                    You need to sign in to apply for scholarships
                  </p>
                )}

                {/* Application Information */}
                {scholarship.external_application_url && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">External Application</h4>
                        <p className="text-xs text-blue-700 leading-relaxed mb-2">
                          This scholarship requires application through an external portal at{' '}
                          <span className="font-medium">{getDomainFromUrl(scholarship.external_application_url)}</span>.
                          Clicking "Apply Externally" will open the scholarship provider's website in a new tab.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a 
                            href={formatExternalUrl(scholarship.external_application_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Preview application portal →
                          </a>
                          {scholarship.external_organization_website && (
                            <a 
                              href={scholarship.external_organization_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Visit organization website →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!scholarship.external_application_url && isAuthenticated && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900 mb-1">Internal Application</h4>
                        <p className="text-xs text-green-700 leading-relaxed">
                          You can apply for this scholarship directly through TalentSphere. 
                          Your profile information will be used to pre-fill the application.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Application Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 mb-1">Application Tips</h4>
                      <ul className="text-xs text-yellow-700 leading-relaxed space-y-1">
                        <li>• Ensure your profile is complete and up-to-date before applying</li>
                        <li>• Read all eligibility requirements carefully</li>
                        <li>• Prepare any required documents in advance</li>
                        <li>• Apply well before the deadline to avoid technical issues</li>
                        {scholarship.external_application_url && (
                          <li>• Keep this page open for reference while applying on the external site</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Scholarship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scholarship.scholarship_type && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Type</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {scholarship.scholarship_type.replace('_', ' ')}
                    </div>
                  </div>
                )}
                
                {scholarship.eligible_programs && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Eligible Programs</div>
                    <div className="text-sm text-gray-600">{safeRender(scholarship.eligible_programs)}</div>
                  </div>
                )}
                
                {scholarship.study_level && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Study Level</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {scholarship.study_level.replace('_', ' ')}
                    </div>
                  </div>
                )}
                
                {scholarship.application_deadline && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Application Deadline</div>
                    <div className="text-sm text-gray-600">
                      {new Date(scholarship.application_deadline).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {scholarship.external_organization_website && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Organization Website</div>
                    <a 
                      href={scholarship.external_organization_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Visit Website
                    </a>
                  </div>
                )}
                
                <Separator />
                
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(scholarship.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetail;
