import { useEffect, useState } from 'react';
import config from '../../config/environment.js';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Mail,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Settings,
  Trash2,
  Pause,
  Play,
  Zap,
  ChevronDown,
  Plus,
  FileText,
  Target,
  Activity,
  Bookmark,
  MessageSquare,
  ExternalLink,
  Filter as FilterIcon,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAdminStore } from '../../stores/adminStore';
import { formatCurrency, formatRelativeTime, formatNumber } from '../../utils/helpers';

const JobManagement = () => {
  const { 
    jobs, 
    pagination, 
    isLoading, 
    error, 
    fetchJobs, 
    moderateJob 
  } = useAdminStore();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    is_featured: 'all',
    is_urgent: 'all',
    category_id: 'all',
    employment_type: 'all',
    experience_level: 'all',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 20
  });

  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [categories, setCategories] = useState([]);
  const [authError, setAuthError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState({ open: false, action: '', reason: '' });
  const [jobAnalytics, setJobAnalytics] = useState({});
  const [showAnalytics, setShowAnalytics] = useState({});
  const [jobStats, setJobStats] = useState(null);
  const [currentView, setCurrentView] = useState('table'); // table, cards, analytics

  // Authentication refresh function
  console.log('🎯 JobManagement render - jobs:', jobs);
  console.log('🎯 JobManagement render - isLoading:', isLoading);
  console.log('🎯 JobManagement render - error:', error);
  console.log('🎯 JobManagement render - authError:', authError);

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (jobId, checked) => {
    if (checked) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
      setSelectAll(false);
    }
  };

  // Enhanced analytics functions
  const fetchJobAnalytics = async (jobId) => {
    try {
      const response = await fetch(`${config.API.API_URL}/api/admin/jobs/${jobId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setJobAnalytics(prev => ({ ...prev, [jobId]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch job analytics:', error);
    }
  };

  const fetchJobStats = async () => {
    try {
      const response = await fetch(`${config.API.API_URL}/api/admin/jobs/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setJobStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch job stats:', error);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs to perform bulk action');
      return;
    }

    try {
      const response = await fetch(`${config.API.API_URL}/api/admin/jobs/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          job_ids: selectedJobs,
          action: bulkActionDialog.action,
          reason: bulkActionDialog.reason
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Bulk ${bulkActionDialog.action} completed successfully for ${data.affected_jobs} jobs`);
        setBulkActionDialog({ open: false, action: '', reason: '' });
        setSelectedJobs([]);
        setSelectAll(false);
        await fetchJobsWithAuth(filters);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert(`Failed to perform bulk action: ${error.message}`);
    }
  };

  const refreshAuthentication = async () => {
    setIsRefreshing(true);
    setAuthError(false);
    
    try {
      const response = await fetch(`${config.API.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@talentsphere.com',
          password: 'AdminPass123!'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        // Update auth store if it exists
        const authStore = {
          state: {
            token: data.token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          },
          version: 0
        };
        localStorage.setItem('auth-store', JSON.stringify(authStore));
        
        console.log('✅ Authentication refreshed successfully');
        
        // Retry fetching jobs after successful authentication
        console.log('🔄 Attempting to fetch jobs after authentication refresh...');
        try {
          const result = await fetchJobsWithAuth(filters);
          console.log('✅ Jobs fetched successfully after auth refresh:', result);
        } catch (fetchError) {
          console.error('❌ Failed to fetch jobs even after auth refresh:', fetchError);
          // Don't set auth error here, as auth was successful
        }
        
      } else {
        throw new Error(data.error || 'Failed to refresh authentication');
      }
    } catch (error) {
      console.error('❌ Failed to refresh authentication:', error);
      setAuthError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced fetchJobs with auth error handling
  const fetchJobsWithAuth = async (params = {}) => {
    console.log('🚀 fetchJobsWithAuth called with params:', params);
    setAuthError(false); // Clear any previous auth errors
    
    try {
      console.log('📡 Calling fetchJobs...');
      const result = await fetchJobs(params);
      console.log('✅ fetchJobs successful, result:', result);
      console.log('✅ Jobs count after fetch:', result?.jobs?.length || 'No jobs in result');
      
      // Force a re-render to make sure the UI updates
      if (result && result.jobs) {
        console.log('📊 Setting jobs data:', result.jobs.length, 'jobs');
      }
      
      setAuthError(false);
      return result;
    } catch (error) {
      console.error('❌ fetchJobs failed:', error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      
      // Check for various authentication error patterns
      const errorMessage = error.message?.toLowerCase() || '';
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('unauthorized') || 
                         errorMessage.includes('expired') || 
                         errorMessage.includes('token') ||
                         errorMessage.includes('forbidden');
      
      if (isAuthError) {
        console.log('🔄 Authentication error detected, attempting refresh...');
        setAuthError(true);
        // Don't throw the error here, let the component handle the auth error state
        return null;
      } else {
        // For non-auth errors, still throw so component can handle them
        throw error;
      }
    }
  };

  useEffect(() => {
    // Initial load with auth check
    const initializeData = async () => {
      console.log('🚀 Initializing JobManagement data...');
      const token = localStorage.getItem('token');
      console.log('📱 Current token:', token ? `${token.substring(0, 50)}...` : 'No token');
      
      if (!token) {
        console.log('🔄 No token found, attempting authentication...');
        await refreshAuthentication();
      } else {
        try {
          console.log('📡 Token found, fetching jobs...');
          const result = await fetchJobsWithAuth(filters);
          console.log('✅ Initial jobs fetch result:', result);
          
          if (!result || !result.jobs || result.jobs.length === 0) {
            console.log('⚠️ No jobs returned, might be an auth issue. Trying refresh...');
            await refreshAuthentication();
          } else {
            // Also fetch job stats for analytics
            await fetchJobStats();
          }
        } catch (error) {
          console.log('🔄 Initial fetch failed, refreshing authentication...');
          console.error('Initial fetch error:', error);
          await refreshAuthentication();
        }
      }
    };
    
    console.log('🔄 JobManagement useEffect triggered');
    initializeData();
  }, []); // Run only once on mount

  useEffect(() => {
    // Only fetch if this is not the initial load and filters have actually changed
    if (jobs.length > 0) {
      console.log('🔄 Filters changed, fetching jobs with new filters...');
      fetchJobsWithAuth(filters);
    }
  }, [filters.search, filters.status, filters.is_featured, filters.category_id, filters.sort_by, filters.sort_order, filters.page]);

  useEffect(() => {
    // Fetch job categories for the filter dropdown
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${config.API.API_URL}/api/job-categories`);
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Update selectAll state when jobs change
  useEffect(() => {
    if (jobs.length > 0 && selectedJobs.length === jobs.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [jobs, selectedJobs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleJobModeration = async (jobId, action, reason = '', notes = '') => {
    setActionLoading(prev => ({ ...prev, [jobId]: action }));
    try {
      const response = await fetch(`${config.API.API_URL}/api/admin/jobs/${jobId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, reason, notes })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Job ${action}d successfully:`, data);
        // Refresh the data
        await fetchJobsWithAuth(filters);
        
        // Show success message
        alert(`Job ${action}d successfully!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Failed to moderate job:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized') || 
          error.message?.includes('expired') || error.message?.includes('token')) {
        setAuthError(true);
        alert(`Authentication expired. Please click "Refresh Authentication" and try again.`);
      } else {
        alert(`Failed to ${action} job: ${error.message}`);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: null }));
    }
  };

  const handleViewJob = (job) => {
    // Navigate to job details view
    console.log('Opening job details for:', job);
    alert(`Job details viewing functionality would open here for "${job.title}"`);
  };

  const handleContactEmployer = (job) => {
    if (job.poster && job.poster.email) {
      const subject = encodeURIComponent(`Regarding Job Posting: ${job.title}`);
      const body = encodeURIComponent(`Dear ${job.poster.first_name},\n\nThis is a message from the TalentSphere administration team regarding your job posting "${job.title}".\n\nBest regards,\nTalentSphere Team`);
      const mailtoUrl = `mailto:${job.poster.email}?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, '_blank');
    } else {
      alert('Employer contact information not available');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      published: { variant: 'success', text: 'Published' },
      draft: { variant: 'secondary', text: 'Draft' },
      closed: { variant: 'destructive', text: 'Closed' },
      pending: { variant: 'default', text: 'Pending' }
    };
    return variants[status] || { variant: 'secondary', text: status };
  };

  const getJobTypeBadge = (type) => {
    const variants = {
      'Full-time': { variant: 'default', text: 'Full-time' },
      'Part-time': { variant: 'secondary', text: 'Part-time' },
      'Contract': { variant: 'outline', text: 'Contract' },
      'Remote': { variant: 'default', text: 'Remote' },
      // Fallback for lowercase versions
      full_time: { variant: 'default', text: 'Full-time' },
      part_time: { variant: 'secondary', text: 'Part-time' },
      contract: { variant: 'outline', text: 'Contract' },
      remote: { variant: 'default', text: 'Remote' }
    };
    return variants[type] || { variant: 'secondary', text: type || 'Not specified' };
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load jobs: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600 mt-1">Moderate and manage all job postings on the platform</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Jobs
        </Button>
      </div>

      {/* Authentication Error Alert */}
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Authentication token expired. Unable to load job data.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAuthentication}
              disabled={isRefreshing}
              className="ml-4"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Authentication
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* No Data Alert when jobs is empty but no auth error */}
      {!authError && !isLoading && jobs.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No job data found. This might be an authentication issue.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAuthentication}
              disabled={isRefreshing}
              className="ml-4"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Authentication
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {jobs.filter(j => j.status === 'published').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">
                  {jobs.filter(j => j.is_featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">
                  {jobs.filter(j => j.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search jobs by title or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_featured} onValueChange={(value) => handleFilterChange('is_featured', value === 'all' ? '' : value === 'true' ? 'true' : 'false')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Featured</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category_id} onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="title">Job Title</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="applications">Applications</SelectItem>
                <SelectItem value="views">Views</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sort_order} onValueChange={(value) => handleFilterChange('sort_order', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => fetchJobsWithAuth(filters)} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            <Button 
              variant="outline" 
              onClick={refreshAuthentication} 
              disabled={isRefreshing}
              title="Refresh authentication if data is not loading"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Auth
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  search: '',
                  status: 'all',
                  is_featured: 'all',
                  category_id: 'all',
                  sort_by: 'created_at',
                  sort_order: 'desc',
                  page: 1,
                  per_page: 20
                });
              }}
              disabled={isLoading}
              title="Clear all filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Active Filters Indicator */}
          {(filters.search || filters.status !== 'all' || filters.is_featured !== 'all' || 
            filters.category_id !== 'all' || filters.sort_by !== 'created_at' || filters.sort_order !== 'desc') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Active filters:</span>
                {filters.search && <span className="bg-blue-100 px-2 py-1 rounded">Search: "{filters.search}"</span>}
                {filters.status !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded">Status: {filters.status}</span>}
                {filters.is_featured !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded">Featured: {filters.is_featured === 'true' ? 'Yes' : 'No'}</span>}
                {filters.category_id !== 'all' && <span className="bg-blue-100 px-2 py-1 rounded">Category: {categories.find(c => c.id.toString() === filters.category_id)?.name || filters.category_id}</span>}
                {filters.sort_by !== 'created_at' && <span className="bg-blue-100 px-2 py-1 rounded">Sort: {filters.sort_by}</span>}
                {filters.sort_order !== 'desc' && <span className="bg-blue-100 px-2 py-1 rounded">Order: {filters.sort_order === 'asc' ? 'Oldest first' : 'Newest first'}</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({pagination?.total || 0})</CardTitle>
          <CardDescription>
            Showing {jobs.length} of {pagination?.total || 0} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const status = getStatusBadge(job.status);
                    const jobType = getJobTypeBadge(job.employment_type);
                    
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{job.title}</h4>
                              {job.is_featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {job.location?.display || job.location || 'Location not specified'}
                              </span>
                              {job.salary?.min && job.salary?.max && (
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant={jobType.variant} className="text-xs">
                                {jobType.text}
                              </Badge>
                              {job.category && (
                                <Badge variant="outline" className="text-xs">
                                  {job.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{job.company?.name}</div>
                            <div className="text-sm text-gray-500">
                              {job.poster?.full_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{formatNumber(job.statistics?.application_count || 0)} applications</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatNumber(job.statistics?.view_count || 0)} views</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(job.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewJob(job)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleContactEmployer(job)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Contact Employer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {job.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleJobModeration(job.id, 'approve')}
                                    disabled={actionLoading[job.id] === 'approve'}
                                    className="text-green-600"
                                  >
                                    {actionLoading[job.id] === 'approve' ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleJobModeration(job.id, 'reject')}
                                    disabled={actionLoading[job.id] === 'reject'}
                                    className="text-red-600"
                                  >
                                    {actionLoading[job.id] === 'reject' ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {job.status === 'published' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleJobModeration(job.id, job.is_featured ? 'unfeature' : 'feature')}
                                    disabled={actionLoading[job.id] === (job.is_featured ? 'unfeature' : 'feature')}
                                  >
                                    {actionLoading[job.id] === (job.is_featured ? 'unfeature' : 'feature') ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                    ) : (
                                      <Star className="h-4 w-4 mr-2" />
                                    )}
                                    {job.is_featured ? 'Remove Feature' : 'Make Featured'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleJobModeration(job.id, 'reject')}
                                    disabled={actionLoading[job.id] === 'reject'}
                                    className="text-red-600"
                                  >
                                    {actionLoading[job.id] === 'reject' ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Close Job
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={!pagination.has_prev || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={!pagination.has_next || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobManagement;
