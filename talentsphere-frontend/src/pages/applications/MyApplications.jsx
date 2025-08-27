import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Eye,
  FileText,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hourglass,
  Star,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';
import { applicationsService } from '../../services/applications';

const MyApplications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  const statusConfig = {
    submitted: {
      label: 'Application Submitted',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: FileText
    },
    under_review: {
      label: 'Under Review',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Eye
    },
    shortlisted: {
      label: 'Shortlisted',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Star
    },
    interviewed: {
      label: 'Interviewed',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Calendar
    },
    hired: {
      label: 'Hired',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    rejected: {
      label: 'Not Selected',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    },
    withdrawn: {
      label: 'Withdrawn',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: AlertCircle
    }
  };

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/my-applications' } });
      return;
    }
    
    if (user?.role !== 'job_seeker') {
      navigate('/dashboard', { 
        state: { error: 'Only job seekers can view applications' } 
      });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load applications
  const loadApplications = async (showLoader = true) => {
    if (!isAuthenticated || user?.role !== 'job_seeker') return;
    
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      console.log('Loading applications with params:', params);
      const response = await applicationsService.getMyApplications(params);
      console.log('Applications loaded:', response);
      
      setApplications(response.applications || []);
      setPagination(response.pagination || pagination);
      
    } catch (error) {
      console.error('Failed to load applications:', error);
      setError(error.message || 'Failed to load applications. Please try again.');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadApplications();
  }, [isAuthenticated, user, pagination.page, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadApplications();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications(false);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle application withdrawal
  const handleWithdrawApplication = async (applicationId, jobTitle) => {
    if (!confirm(`Are you sure you want to withdraw your application for "${jobTitle}"?`)) {
      return;
    }
    
    try {
      await applicationsService.withdrawApplication(applicationId);
      setSuccessMessage('Application withdrawn successfully');
      await loadApplications(false);
    } catch (error) {
      setError(error.message || 'Failed to withdraw application');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.submitted;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && applications.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">
              Track and manage your job applications
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto"
            onClick={() => setSuccessMessage('')}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by job title or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || (statusFilter && statusFilter !== 'all') ? 'Try adjusting your filters' : 'You haven\'t applied to any jobs yet'}
            </p>
            {!searchTerm && (!statusFilter || statusFilter === 'all') && (
              <Button asChild>
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            )}
          </div>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-xl">{application.job?.title}</CardTitle>
                        {getStatusBadge(application.status)}
                      </div>
                      <CardDescription className="text-base">
                        {application.company?.name || application.job?.company?.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Applied {formatRelativeTime(application.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {application.job?.location?.is_remote ? 'Remote' : 
                       (application.job?.location?.display || 
                        application.job?.location?.city || 
                        'Location not specified')}
                    </div>
                    {application.job?.salary_min && application.job?.salary_max && (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {formatCurrency(application.job.salary_min)} - {formatCurrency(application.job.salary_max)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {application.days_since_application} days ago
                    </div>
                  </div>

                  {/* Status-specific Information */}
                  {application.status === 'interviewed' && application.interview_datetime && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <AlertDescription className="text-purple-800">
                        <strong>Interview Completed:</strong> {' '}
                        {new Date(application.interview_datetime).toLocaleDateString()} at{' '}
                        {new Date(application.interview_datetime).toLocaleTimeString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {application.interview_scheduled && application.interview_datetime && application.status !== 'interviewed' && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <AlertDescription className="text-purple-800">
                        <strong>Interview Scheduled:</strong> {' '}
                        {new Date(application.interview_datetime).toLocaleDateString()} at{' '}
                        {new Date(application.interview_datetime).toLocaleTimeString()}
                        {application.interview_type && ` (${application.interview_type})`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {application.status === 'hired' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Congratulations!</strong> You have been selected for this position.
                        {application.offered_salary && (
                          <span className="block mt-1">
                            Offered Salary: {formatCurrency(application.offered_salary)}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {application.status === 'rejected' && application.feedback && (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Application Status:</strong> {application.feedback}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Application Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {application.source && (
                      <div>
                        <span className="font-medium text-gray-900">Source:</span>
                        <span className="ml-2 text-gray-600 capitalize">{application.source.replace('_', ' ')}</span>
                      </div>
                    )}
                    {application.resume_url && (
                      <div>
                        <span className="font-medium text-gray-900">Resume:</span>
                        <a 
                          href={application.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-500 inline-flex items-center"
                        >
                          View Resume <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                    {application.portfolio_url && (
                      <div>
                        <span className="font-medium text-gray-900">Portfolio:</span>
                        <a 
                          href={application.portfolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-500 inline-flex items-center"
                        >
                          View Portfolio <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/jobs/${application.job_id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Job
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/applications/${application.id}`}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                    
                    {['submitted', 'under_review', 'shortlisted'].includes(application.status) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleWithdrawApplication(application.id, application.job?.title)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} applications
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.has_prev}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {applications.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
              applications.reduce((acc, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]) => {
              const config = statusConfig[status];
              if (!config) return null;
              
              return (
                <Card key={status}>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{config.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;

