import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Eye,
  MessageSquare,
  Download,
  Globe,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { applicationsService } from '../../services/applications';
import { formatCurrency, formatRelativeTime, formatDate } from '../../utils/helpers';

const ApplicationDetails = () => {
  const { id: applicationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const statusConfig = {
    submitted: {
      label: 'Application Submitted',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: FileText,
      description: 'Your application has been successfully submitted and is waiting for review.'
    },
    under_review: {
      label: 'Under Review',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Eye,
      description: 'The employer is currently reviewing your application.'
    },
    shortlisted: {
      label: 'Shortlisted',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Star,
      description: 'Congratulations! You have been shortlisted for this position.'
    },
    interviewed: {
      label: 'Interviewed',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Calendar,
      description: 'You have completed the interview process.'
    },
    hired: {
      label: 'Hired',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Congratulations! You have been selected for this position.'
    },
    rejected: {
      label: 'Not Selected',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      description: 'Unfortunately, you were not selected for this position.'
    },
    withdrawn: {
      label: 'Withdrawn',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: AlertCircle,
      description: 'You have withdrawn your application for this position.'
    }
  };

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/applications/${applicationId}` } });
      return;
    }
  }, [isAuthenticated, navigate, applicationId]);

  // Load application details
  useEffect(() => {
    const loadApplication = async () => {
      if (!applicationId || !isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading application details for ID:', applicationId);
        const response = await applicationsService.getApplication(applicationId);
        console.log('Application details loaded:', response);
        
        setApplication(response);
        
      } catch (error) {
        console.error('Failed to load application:', error);
        
        if (error.message.includes('not found')) {
          setError('Application not found or you do not have permission to view it.');
        } else if (error.message.includes('403')) {
          setError('You do not have permission to view this application.');
        } else {
          setError(error.message || 'Failed to load application details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, isAuthenticated]);

  // Handle application withdrawal
  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    
    setWithdrawing(true);
    
    try {
      await applicationsService.withdrawApplication(applicationId);
      
      // Reload application to show updated status
      const response = await applicationsService.getApplication(applicationId);
      setApplication(response);
      
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      setError(error.message || 'Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.submitted;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} border text-lg px-4 py-2`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Load Application</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link to="/my-applications">Back to Applications</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No application data
  if (!application) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
          <p className="text-gray-600 mb-8">The requested application could not be found.</p>
          <Button asChild>
            <Link to="/my-applications">Back to Applications</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[application.status] || statusConfig.submitted;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => navigate('/my-applications')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Application Details</h1>
            <p className="text-gray-600">
              View your application status and information
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="text-right">
            {getStatusBadge(application.status)}
            <p className="text-sm text-gray-500 mt-1">
              Applied {formatRelativeTime(application.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Job Information */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-2xl">{application.job?.title}</CardTitle>
              </div>
              <CardDescription className="text-lg">
                {application.company?.name || application.job?.company?.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{application.job?.location?.is_remote ? 'Remote' : (application.job?.location?.display || application.job?.location?.city || 'Location not specified')}</span>
            </div>
            {application.job?.salary_min && application.job?.salary_max && (
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                <span>{formatCurrency(application.job.salary_min)} - {formatCurrency(application.job.salary_max)}</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>{application.days_since_application || 0} days ago</span>
            </div>
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
              <span>{application.job?.employment_type || 'Full-time'}</span>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" asChild>
              <Link to={`/jobs/${application.job_id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Job Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Application Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={`border-2 ${statusInfo.color.replace('bg-', 'border-').replace('text-', 'border-')}`}>
            <statusInfo.icon className="w-5 h-5" />
            <AlertDescription className="text-base">
              <strong>{statusInfo.label}:</strong> {statusInfo.description}
            </AlertDescription>
          </Alert>

          {/* Interview Information */}
          {application.interview_scheduled && application.interview_datetime && (
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">
                    {application.status === 'interviewed' ? 'Interview Completed' : 'Interview Scheduled'}
                  </h4>
                  <p className="text-purple-700 mt-1">
                    <strong>Date:</strong> {formatDate(application.interview_datetime)}
                  </p>
                  <p className="text-purple-700">
                    <strong>Time:</strong> {new Date(application.interview_datetime).toLocaleTimeString()}
                  </p>
                  {application.interview_type && (
                    <p className="text-purple-700">
                      <strong>Type:</strong> {application.interview_type}
                    </p>
                  )}
                  {application.interview_location && (
                    <p className="text-purple-700">
                      <strong>Location:</strong> {application.interview_location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Offer Information */}
          {application.status === 'hired' && application.offered_salary && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Job Offer</h4>
                  <p className="text-green-700 mt-1">
                    <strong>Offered Salary:</strong> {formatCurrency(application.offered_salary)}
                  </p>
                  {application.offer_details && (
                    <div className="mt-2">
                      <p className="text-green-700"><strong>Offer Details:</strong></p>
                      <p className="text-green-600 text-sm">{application.offer_details}</p>
                    </div>
                  )}
                  {application.offer_expiry && (
                    <p className="text-green-700 mt-1">
                      <strong>Offer Expires:</strong> {formatDate(application.offer_expiry)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {application.feedback && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Employer Feedback</h4>
              <p className="text-gray-700">{application.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Documents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Application Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resume */}
          {application.resume_url && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium">Resume/CV</p>
                  <p className="text-sm text-gray-600">{application.resume_url.split('/').pop()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  View
                </a>
              </Button>
            </div>
          )}

          {/* Portfolio */}
          {application.portfolio_url && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium">Portfolio</p>
                  <p className="text-sm text-gray-600">{application.portfolio_url}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View
                </a>
              </Button>
            </div>
          )}

          {/* Additional Documents */}
          {application.additional_documents && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Additional Documents</p>
                  <p className="text-sm text-gray-700">{application.additional_documents}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter */}
      {application.cover_letter && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cover Letter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {application.cover_letter}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Responses */}
      {application.custom_responses && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Additional Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(JSON.parse(application.custom_responses)).map(([question, answer], index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h4 className="font-medium text-gray-900 mb-2">{question}</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {application.activities && application.activities.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {application.activities.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/my-applications">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Link>
        </Button>
        
        {/* Withdraw Application */}
        {['submitted', 'under_review', 'shortlisted'].includes(application.status) && (
          <Button 
            variant="outline" 
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
