import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Globe,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { scholarshipService } from '../../services/scholarship';
import { useAuthStore } from '../../stores/authStore';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';
import SEOHelmet from '../../components/seo/SEOHelmet';
import ShareScholarship from '../../components/scholarships/ShareScholarship';
import { 
  generateScholarshipStructuredData, 
  generateBreadcrumbStructuredData,
  generateScholarshipSEOTitle,
  generateScholarshipSEODescription,
  generateKeywords
} from '../../utils/seoUtils';
import { LeaderboardAd, ResponsiveAd, SquareAd } from '../../components/ads/AdComponents';

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
  const { requireAuth, navigateToProtectedRoute } = useAuthNavigation();

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
    if (!scholarship) {
      return;
    }

    const applicationType = scholarship.application_type || 'external';
    const overridePath = applicationType === 'internal'
      ? { pathname: `/scholarships/${id}/apply` }
      : { pathname: `/scholarships/${id}` };

    requireAuth(async () => {
      if (isDeadlinePassed(scholarship.application_deadline)) {
        alert('The application deadline for this scholarship has passed.');
        return;
      }

      setIsApplying(true);

      try {
        if (applicationType === 'external' || scholarship.application_url) {
          const applicationUrl = scholarship.application_url || scholarship.external_application_url;

          if (applicationUrl) {
            const formattedUrl = formatExternalUrl(applicationUrl);
            const domain = getDomainFromUrl(applicationUrl);

            if (window.confirm(
              `You will be redirected to the external application portal at ${domain}.\n\nDo you want to continue?`
            )) {
              try {
                await scholarshipService.trackApplicationClick(id);
              } catch (trackError) {
                console.warn('Could not track application click:', trackError);
              }

              window.open(formattedUrl, '_blank');

              setTimeout(() => {
                alert('Application portal opened in a new tab. Please complete your application on the external website.\n\nTip: Keep this page open for reference while applying!');
              }, 500);
            }
          }
        } else if (applicationType === 'email' && scholarship.application_email) {
          const subject = `Application for ${scholarship.title}`;
          const body = `Dear Selection Committee,\n\nI am writing to express my interest in applying for the ${scholarship.title} scholarship.\n\n[Your application details here]\n\nThank you for considering my application.\n\nBest regards,\n${user?.first_name} ${user?.last_name}`;

          const mailtoLink = `mailto:${scholarship.application_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(mailtoLink);

          alert('Your email client will open shortly. Please send your application to the provided email address.');
        } else if (applicationType === 'internal') {
          navigateToProtectedRoute(`/scholarships/${id}/apply`);
        }
      } catch (error) {
        console.error('Error during application:', error);
        alert('There was an error processing your application. Please try again.');
      } finally {
        setIsApplying(false);
      }
    }, { overridePath });
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

  // SEO data generation
  const seoTitle = generateScholarshipSEOTitle(scholarship);
  const seoDescription = generateScholarshipSEODescription(scholarship);
  const scholarshipKeywords = generateKeywords(
    [scholarship.title, scholarship.category?.name, 'scholarship', 'financial aid', 'education funding'],
    scholarship.study_level ? [scholarship.study_level] : []
  );
  
  const structuredData = generateScholarshipStructuredData(scholarship);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Scholarships', url: '/scholarships' },
    { name: scholarship.title, url: `/scholarships/${scholarship.id}` }
  ];
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* SEO Meta Tags */}
      <SEOHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={scholarshipKeywords}
        type="article"
        image="/scholarship-og-image.jpg"
        canonical={`${window.location.origin}/scholarships/${scholarship.id}`}
        structuredData={[structuredData, breadcrumbStructuredData]}
        articleData={{
          title: scholarship.title,
          description: seoDescription,
          datePublished: scholarship.created_at,
          dateModified: scholarship.updated_at
        }}
      />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigate(-1)} variant="ghost" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scholarships
            </Button>
            <div className="flex space-x-2">
              {/* Share Scholarship Component */}
              <ShareScholarship scholarship={scholarship} />
              
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
        {/* Google Ads - Leaderboard */}
        <div className="mb-8">
          <div className="flex justify-center">
            <LeaderboardAd className="rounded-lg shadow-sm" />
          </div>
        </div>
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

            {/* Google Ads - Responsive between sections */}
            <div className="mb-6">
              <div className="flex justify-center">
                <ResponsiveAd className="rounded-lg shadow-sm" />
              </div>
            </div>

            {/* Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  About This Scholarship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-blue max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />,
                      h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold text-gray-900 mb-4 mt-6" />,
                      h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold text-gray-900 mb-3 mt-5" />,
                      h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold text-gray-900 mb-2 mt-4" />,
                      p: ({node, ...props}) => <p {...props} className="text-gray-700 leading-relaxed mb-4" />,
                      ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside text-gray-700 mb-4 space-y-2" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside text-gray-700 mb-4 space-y-2" />,
                      li: ({node, ...props}) => <li {...props} className="ml-4" />,
                      strong: ({node, ...props}) => <strong {...props} className="font-bold text-gray-900" />,
                      em: ({node, ...props}) => <em {...props} className="italic text-gray-800" />,
                      blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" />,
                      code: ({node, inline, ...props}) => 
                        inline 
                          ? <code {...props} className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" />
                          : <code {...props} className="block bg-gray-100 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" />,
                      hr: ({node, ...props}) => <hr {...props} className="my-6 border-gray-300" />,
                    }}
                  >
                    {safeRender(scholarship.description)}
                  </ReactMarkdown>
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
                  <div className="prose prose-blue max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />,
                        h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold text-gray-900 mb-4 mt-6" />,
                        h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold text-gray-900 mb-3 mt-5" />,
                        h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold text-gray-900 mb-2 mt-4" />,
                        p: ({node, ...props}) => <p {...props} className="text-gray-700 leading-relaxed mb-4" />,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside text-gray-700 mb-4 space-y-2" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside text-gray-700 mb-4 space-y-2" />,
                        li: ({node, ...props}) => <li {...props} className="ml-4" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-gray-900" />,
                        em: ({node, ...props}) => <em {...props} className="italic text-gray-800" />,
                        blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-green-500 pl-4 italic text-gray-600 my-4" />,
                        code: ({node, inline, ...props}) => 
                          inline 
                            ? <code {...props} className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" />
                            : <code {...props} className="block bg-gray-100 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" />,
                        hr: ({node, ...props}) => <hr {...props} className="my-6 border-gray-300" />,
                      }}
                    >
                      {safeRender(scholarship.eligibility_requirements)}
                    </ReactMarkdown>
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
                  <div className="prose prose-blue max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />,
                        h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold text-gray-900 mb-4 mt-6" />,
                        h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold text-gray-900 mb-3 mt-5" />,
                        h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold text-gray-900 mb-2 mt-4" />,
                        p: ({node, ...props}) => <p {...props} className="text-gray-700 leading-relaxed mb-4" />,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside text-gray-700 mb-4 space-y-2" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside text-gray-700 mb-4 space-y-2" />,
                        li: ({node, ...props}) => <li {...props} className="ml-4" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-gray-900" />,
                        em: ({node, ...props}) => <em {...props} className="italic text-gray-800" />,
                        blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-purple-500 pl-4 italic text-gray-600 my-4" />,
                        code: ({node, inline, ...props}) => 
                          inline 
                            ? <code {...props} className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" />
                            : <code {...props} className="block bg-gray-100 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" />,
                        hr: ({node, ...props}) => <hr {...props} className="my-6 border-gray-300" />,
                      }}
                    >
                      {safeRender(scholarship.application_process)}
                    </ReactMarkdown>
                  </div>
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
                  ) : (scholarship.application_type === 'external' || scholarship.application_url) ? (
                    <>
                      Apply Externally
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  ) : (scholarship.application_type === 'email' && scholarship.application_email) ? (
                    <>
                      Send Application Email
                      <Mail className="w-4 h-4 ml-2" />
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
                {(scholarship.application_type === 'external' || scholarship.application_url) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">External Application</h4>
                        <p className="text-xs text-blue-700 leading-relaxed mb-2">
                          This scholarship requires application through an external portal at{' '}
                          <span className="font-medium">{getDomainFromUrl(scholarship.application_url || scholarship.external_application_url)}</span>.
                          Clicking "Apply Externally" will open the scholarship provider's website in a new tab.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a 
                            href={formatExternalUrl(scholarship.application_url || scholarship.external_application_url)}
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

                {scholarship.application_type === 'email' && scholarship.application_email && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-purple-900 mb-1">Email Application</h4>
                        <p className="text-xs text-purple-700 leading-relaxed mb-2">
                          This scholarship requires application by email. Clicking "Send Application Email" will open your email client.
                        </p>
                        <p className="text-xs text-purple-800 font-medium">
                          Send to: <a href={`mailto:${scholarship.application_email}`} className="text-purple-600 hover:text-purple-800 underline">{scholarship.application_email}</a>
                        </p>
                        {scholarship.application_instructions && (
                          <p className="text-xs text-purple-700 leading-relaxed mt-2">
                            Instructions: {scholarship.application_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {scholarship.application_type === 'internal' && isAuthenticated && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900 mb-1">Internal Application</h4>
                        <p className="text-xs text-green-700 leading-relaxed">
                          You can apply for this scholarship directly through TalentSphere. 
                          Your profile information will be used to pre-fill the application form.
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
                        {(scholarship.application_type === 'external' || scholarship.application_url) && (
                          <li>• Keep this page open for reference while applying on the external site</li>
                        )}
                        {scholarship.application_type === 'internal' && (
                          <li>• Your profile information will help us verify your eligibility</li>
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
