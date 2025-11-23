import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Eye, 
  Download, 
  Search,
  Filter,
  MapPin,
  Building,
  DollarSign,
  User,
  Mail,
  Phone,
  ExternalLink,
  RefreshCw,
  Archive,
  Trash2,
  MessageSquare,
  BookmarkCheck,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import { LeaderboardAd, ResponsiveAd, SquareAd } from '../../components/ads/AdComponents';

const ApplicationsDashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviews: 0,
    offers: 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedApplications, setSelectedApplications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'job_seeker') {
      navigate('/dashboard');
      return;
    }
    
    loadApplications();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchQuery, statusFilter, sortBy, sortOrder, activeTab]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyApplications({ per_page: 100 });
      const apps = response.applications || [];
      
      setApplications(apps);
      
      // Calculate stats
      const stats = {
        total: apps.length,
        pending: apps.filter(app => ['submitted', 'under_review'].includes(app.status)).length,
        interviews: apps.filter(app => ['interviewed', 'shortlisted'].includes(app.status)).length,
        offers: apps.filter(app => app.status === 'hired').length
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Failed to load applications:', error);
      setMessage({ type: 'error', text: 'Failed to load applications' });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    // Filter by tab
    if (activeTab !== 'all') {
      const tabFilters = {
        pending: ['submitted', 'under_review'],
        interviews: ['interviewed', 'shortlisted'],
        offers: ['hired'],
        rejected: ['rejected'],
        archived: ['withdrawn', 'archived']
      };
      filtered = filtered.filter(app => tabFilters[activeTab]?.includes(app.status));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Sort applications
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'job_title') {
        aValue = a.job?.title || '';
        bValue = b.job?.title || '';
      } else if (sortBy === 'company_name') {
        aValue = a.job?.company?.name || a.company?.name || '';
        bValue = b.job?.company?.name || b.company?.name || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: FileText,
      under_review: Clock,
      shortlisted: CheckCircle,
      interviewed: User,
      hired: CheckCircle,
      rejected: XCircle,
      withdrawn: Archive
    };
    const Icon = icons[status] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleWithdrawApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await apiService.withdrawApplication(applicationId);
        setMessage({ type: 'success', text: 'Application withdrawn successfully' });
        loadApplications();
      } catch (error) {
        console.error('Failed to withdraw application:', error);
        setMessage({ type: 'error', text: 'Failed to withdraw application' });
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedApplications.length === 0) return;
    
    if (action === 'withdraw') {
      if (window.confirm(`Are you sure you want to withdraw ${selectedApplications.length} application(s)?`)) {
        try {
          await Promise.all(selectedApplications.map(id => apiService.withdrawApplication(id)));
          setMessage({ type: 'success', text: 'Applications withdrawn successfully' });
          setSelectedApplications([]);
          loadApplications();
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to withdraw applications' });
        }
      }
    }
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">Track and manage your job applications</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadApplications} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/jobs">
                <Search className="w-4 h-4 mr-2" />
                Find Jobs
              </Link>
            </Button>
          </div>
        </div>

        {/* Google Ads - Leaderboard */}
      <div className="mb-6">
        <div className="flex justify-center">
          <LeaderboardAd className="rounded-lg shadow-sm" />
        </div>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">In Review</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Interviews</p>
                  <p className="text-3xl font-bold">{stats.interviews}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Job Offers</p>
                  <p className="text-3xl font-bold">{stats.offers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                <SelectItem value="job_title-asc">Job Title A-Z</SelectItem>
                <SelectItem value="job_title-desc">Job Title Z-A</SelectItem>
                <SelectItem value="company_name-asc">Company A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedApplications.length} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleBulkAction('withdraw')}
              >
                <Archive className="w-4 h-4 mr-2" />
                Withdraw Selected
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedApplications([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Ads - Responsive between sections */}
      <div className="mb-6">
        <div className="flex justify-center">
          <ResponsiveAd className="rounded-lg shadow-sm" />
        </div>
      </div>

      {/* Applications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews ({stats.interviews})</TabsTrigger>
          <TabsTrigger value="offers">Offers ({stats.offers})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No matching applications found' : 'No applications yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start applying to jobs to see them here'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button asChild>
                    <Link to="/jobs">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Jobs
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2 px-4">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  Select all ({filteredApplications.length})
                </span>
              </div>

              {/* Applications List */}
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className="rounded mt-1"
                      />

                      {/* Company Logo */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={application.job?.company?.logo_url || application.company?.logo_url} 
                          alt={application.job?.company?.name || application.company?.name}
                        />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {(application.job?.company?.name || application.company?.name || 'C')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Application Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              <Link to={`/jobs/${application.job_id}`}>
                                {application.job?.title || 'Unknown Job Title'}
                              </Link>
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <Building className="w-4 h-4" />
                              <span>{application.job?.company?.name || application.company?.name || 'Unknown Company'}</span>
                              {application.job?.location && (
                                <>
                                  <span>•</span>
                                  <MapPin className="w-4 h-4" />
                                  <span>
                                    {typeof application.job.location === 'object' 
                                      ? application.job.location.display || 
                                        `${application.job.location.city || ''}${application.job.location.city && application.job.location.state ? ', ' : ''}${application.job.location.state || ''}`
                                      : application.job.location
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                            {getStatusIcon(application.status)}
                            {application.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Application Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Applied {formatRelativeTime(application.created_at)}</span>
                          </div>
                          
                          {application.updated_at !== application.created_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>Updated {formatRelativeTime(application.updated_at)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Application #{application.id}</span>
                          </div>
                        </div>

                        {/* Cover Letter Preview */}
                        {application.cover_letter && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <span className="font-medium">Cover Letter:</span> {application.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* Progress Bar for certain statuses */}
                        {['under_review', 'shortlisted', 'interviewed'].includes(application.status) && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Application Progress</span>
                              <span className="text-sm text-gray-600">
                                {application.status === 'under_review' ? '25%' : 
                                 application.status === 'shortlisted' ? '50%' : '75%'}
                              </span>
                            </div>
                            <Progress 
                              value={
                                application.status === 'under_review' ? 25 : 
                                application.status === 'shortlisted' ? 50 : 75
                              } 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Submitted</span>
                              <span>Under Review</span>
                              <span>Shortlisted</span>
                              <span>Interview</span>
                              <span>Decision</span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/jobs/${application.job_id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Job
                              </Link>
                            </Button>
                            
                            {application.resume_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-2" />
                                  Resume
                                </a>
                              </Button>
                            )}
                            
                            {['submitted', 'under_review'].includes(application.status) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleWithdrawApplication(application.id)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Withdraw
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Applied on {formatDate(application.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationsDashboard;
