import { useEffect, useState } from 'react';
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
  X,
  Grid3X3,
  List,
  PieChart,
  Layers,
  Building,
  UserCheck,
  Flame,
  Archive
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

const EnhancedJobManagement = () => {
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
  const [moderationDialog, setModerationDialog] = useState({ open: false, jobId: null, action: '', reason: '', notes: '' });

  // Authentication refresh function
  const refreshAuthentication = async () => {
    setIsRefreshing(true);
    setAuthError(false);
    
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
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
        localStorage.setItem('token', data.token);
        
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
        
        try {
          const result = await fetchJobsWithAuth(filters);
          console.log('✅ Jobs fetched successfully after auth refresh:', result);
        } catch (fetchError) {
          console.error('❌ Failed to fetch jobs even after auth refresh:', fetchError);
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
    setAuthError(false);
    
    try {
      console.log('📡 Calling fetchJobs...');
      const result = await fetchJobs(params);
      console.log('✅ fetchJobs successful, result:', result);
      
      if (result && result.jobs) {
        console.log('📊 Setting jobs data:', result.jobs.length, 'jobs');
      }
      
      setAuthError(false);
      return result;
    } catch (error) {
      console.error('❌ fetchJobs failed:', error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('unauthorized') || 
                         errorMessage.includes('expired') || 
                         errorMessage.includes('token') ||
                         errorMessage.includes('forbidden');
      
      if (isAuthError) {
        console.log('🔄 Authentication error detected, attempting refresh...');
        setAuthError(true);
        return null;
      } else {
        throw error;
      }
    }
  };

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
      const response = await fetch(`http://localhost:5001/api/admin/jobs/${jobId}/analytics`, {
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
      const response = await fetch('http://localhost:5001/api/admin/jobs/stats', {
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

  // Enhanced job moderation with reason and notes
  const handleJobModeration = async (jobId, action, reason = '', notes = '') => {
    setActionLoading(prev => ({ ...prev, [jobId]: action }));
    try {
      const response = await fetch(`http://localhost:5001/api/admin/jobs/${jobId}/moderate`, {
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
        await fetchJobsWithAuth(filters);
        setModerationDialog({ open: false, jobId: null, action: '', reason: '', notes: '' });
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

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs to perform bulk action');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/admin/jobs/bulk-action', {
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleViewJob = (job) => {
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

  // Enhanced badge functions
  const getStatusBadge = (status) => {
    const variants = {
      published: { variant: 'default', text: 'Published', className: 'bg-green-100 text-green-800 border-green-200' },
      draft: { variant: 'secondary', text: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      closed: { variant: 'destructive', text: 'Closed', className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { variant: 'outline', text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      suspended: { variant: 'destructive', text: 'Suspended', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      deleted: { variant: 'destructive', text: 'Deleted', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    return variants[status] || { variant: 'secondary', text: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const getEmploymentTypeBadge = (type) => {
    const variants = {
      'Full-time': { variant: 'default', text: 'Full-time', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Part-time': { variant: 'secondary', text: 'Part-time', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'Contract': { variant: 'outline', text: 'Contract', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'Remote': { variant: 'default', text: 'Remote', className: 'bg-green-100 text-green-800 border-green-200' },
      'Internship': { variant: 'secondary', text: 'Internship', className: 'bg-pink-100 text-pink-800 border-pink-200' }
    };
    return variants[type] || { variant: 'secondary', text: type || 'Not specified', className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const getExperienceLevelBadge = (level) => {
    const variants = {
      'Entry-level': { variant: 'outline', text: 'Entry', className: 'bg-green-100 text-green-800 border-green-200' },
      'Mid-level': { variant: 'default', text: 'Mid', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Senior': { variant: 'secondary', text: 'Senior', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'Executive': { variant: 'destructive', text: 'Executive', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    return variants[level] || { variant: 'secondary', text: level || 'Not specified', className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  // Use effects
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Initializing Enhanced JobManagement data...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        await refreshAuthentication();
      } else {
        try {
          const result = await fetchJobsWithAuth(filters);
          if (!result || !result.jobs || result.jobs.length === 0) {
            await refreshAuthentication();
          } else {
            await fetchJobStats();
          }
        } catch (error) {
          await refreshAuthentication();
        }
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      fetchJobsWithAuth(filters);
    }
  }, [filters.search, filters.status, filters.is_featured, filters.category_id, filters.sort_by, filters.sort_order, filters.page]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/job-categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (jobs.length > 0 && selectedJobs.length === jobs.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [jobs, selectedJobs]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load jobs: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const renderEnhancedStatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold">{jobStats?.overview?.total_jobs || pagination?.total || 0}</p>
              <p className="text-xs text-green-600">+{jobStats?.overview?.new_jobs_period || 0} this period</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-600">Published</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'published').length}</p>
              <p className="text-xs text-gray-500">{jobStats?.overview?.active_jobs || 0} active</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-gray-600">Featured</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.is_featured).length}</p>
              <p className="text-xs text-blue-600">{jobStats?.overview?.featured_jobs || 0} total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'pending').length}</p>
              <p className="text-xs text-orange-600">{jobStats?.overview?.pending_jobs || 0} review</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-gray-600">Urgent</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.is_urgent).length}</p>
              <p className="text-xs text-red-600">High priority</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-600">Applications</p>
              <p className="text-2xl font-bold">{jobs.reduce((sum, job) => sum + (job.statistics?.application_count || 0), 0)}</p>
              <p className="text-xs text-purple-600">Total received</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEnhancedFilters = () => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Jobs</Label>
              <Input
                id="search"
                placeholder="Search by title, description, or company..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="featured">Featured</Label>
              <Select value={filters.is_featured} onValueChange={(value) => handleFilterChange('is_featured', value === 'all' ? '' : value === 'true' ? 'true' : 'false')}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Featured</SelectItem>
                  <SelectItem value="false">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgent">Urgent</Label>
              <Select value={filters.is_urgent} onValueChange={(value) => handleFilterChange('is_urgent', value === 'all' ? '' : value === 'true' ? 'true' : 'false')}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Urgent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Urgent</SelectItem>
                  <SelectItem value="false">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employment-type">Employment Type</Label>
              <Select value={filters.employment_type} onValueChange={(value) => handleFilterChange('employment_type', value === 'all' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => fetchJobsWithAuth(filters)} disabled={isLoading} size="sm">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>

            <Button 
              variant="outline" 
              onClick={refreshAuthentication} 
              disabled={isRefreshing}
              size="sm"
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
                  is_urgent: 'all',
                  category_id: 'all',
                  employment_type: 'all',
                  experience_level: 'all',
                  sort_by: 'created_at',
                  sort_order: 'desc',
                  page: 1,
                  per_page: 20
                });
              }}
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>

            {selectedJobs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Bulk Actions ({selectedJobs.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'approve', reason: '' })}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bulk Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'reject', reason: '' })}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Bulk Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'feature', reason: '' })}>
                    <Star className="h-4 w-4 mr-2" />
                    Bulk Feature
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'suspend', reason: '' })}>
                    <Pause className="h-4 w-4 mr-2" />
                    Bulk Suspend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const renderJobTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jobs Management ({pagination?.total || 0})</CardTitle>
            <CardDescription>
              Showing {jobs.length} of {pagination?.total || 0} jobs
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex border rounded-md">
              <Button 
                variant={currentView === 'table' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('table')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={currentView === 'cards' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('cards')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={currentView === 'analytics' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('analytics')}
                className="rounded-l-none"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Job Details</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type & Level</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const status = getStatusBadge(job.status);
                  const employmentType = getEmploymentTypeBadge(job.employment_type);
                  const experienceLevel = getExperienceLevelBadge(job.experience_level);
                  
                  return (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedJobs.includes(job.id)}
                          onCheckedChange={(checked) => handleSelectJob(job.id, checked)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{job.title}</h4>
                            {job.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                            {job.is_urgent && (
                              <Flame className="h-4 w-4 text-red-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.location?.display || 'Location not specified'}
                            </span>
                            {job.salary?.min && job.salary?.max && (
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                              </span>
                            )}
                          </div>
                          {job.category && (
                            <Badge variant="outline" className="text-xs">
                              {job.category.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center">
                            <Building className="h-4 w-4 mr-1 text-gray-400" />
                            {job.company?.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {job.poster?.full_name}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={status.variant} className={status.className}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={employmentType.variant} className={`${employmentType.className} text-xs`}>
                            {employmentType.text}
                          </Badge>
                          <Badge variant={experienceLevel.variant} className={`${experienceLevel.className} text-xs`}>
                            {experienceLevel.text}
                          </Badge>
                        </div>
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
                          <div className="flex items-center space-x-1">
                            <Bookmark className="h-3 w-3" />
                            <span>{formatNumber(job.statistics?.bookmark_count || 0)} saved</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          <div>{formatRelativeTime(job.created_at)}</div>
                          {job.published_at && (
                            <div className="text-xs text-green-600">
                              Published {formatRelativeTime(job.published_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleViewJob(job)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => fetchJobAnalytics(job.id)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleContactEmployer(job)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Contact Employer
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {job.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setModerationDialog({ 
                                    open: true, 
                                    jobId: job.id, 
                                    action: 'approve', 
                                    reason: '', 
                                    notes: '' 
                                  })}
                                  className="text-green-600"
                                >
                                  {actionLoading[job.id] === 'approve' ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Approve Job
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={() => setModerationDialog({ 
                                    open: true, 
                                    jobId: job.id, 
                                    action: 'reject', 
                                    reason: '', 
                                    notes: '' 
                                  })}
                                  className="text-red-600"
                                >
                                  {actionLoading[job.id] === 'reject' ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Reject Job
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
                                  onClick={() => handleJobModeration(job.id, job.is_urgent ? 'remove_urgent' : 'urgent')}
                                  disabled={actionLoading[job.id] === (job.is_urgent ? 'remove_urgent' : 'urgent')}
                                >
                                  {actionLoading[job.id] === (job.is_urgent ? 'remove_urgent' : 'urgent') ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                  ) : (
                                    <Zap className="h-4 w-4 mr-2" />
                                  )}
                                  {job.is_urgent ? 'Remove Urgent' : 'Mark Urgent'}
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={() => setModerationDialog({ 
                                    open: true, 
                                    jobId: job.id, 
                                    action: 'suspend', 
                                    reason: '', 
                                    notes: '' 
                                  })}
                                  className="text-orange-600"
                                >
                                  {actionLoading[job.id] === 'suspend' ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                                  ) : (
                                    <Pause className="h-4 w-4 mr-2" />
                                  )}
                                  Suspend Job
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {job.status === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => handleJobModeration(job.id, 'reactivate')}
                                disabled={actionLoading[job.id] === 'reactivate'}
                                className="text-green-600"
                              >
                                {actionLoading[job.id] === 'reactivate' ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                ) : (
                                  <Play className="h-4 w-4 mr-2" />
                                )}
                                Reactivate Job
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => setModerationDialog({ 
                                open: true, 
                                jobId: job.id, 
                                action: 'delete', 
                                reason: '', 
                                notes: '' 
                              })}
                              className="text-red-600"
                            >
                              {actionLoading[job.id] === 'delete' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete Job
                            </DropdownMenuItem>
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

        {/* Enhanced Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} results
              </span>
              {selectedJobs.length > 0 && (
                <Badge variant="secondary">
                  {selectedJobs.length} selected
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={!pagination.has_prev || isLoading}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              
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
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-blue-600" />
            Enhanced Job Management
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced job moderation and analytics dashboard with comprehensive management tools
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchJobStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Job Template
          </Button>
        </div>
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

      {/* No Data Alert */}
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

      {/* Enhanced Stats Overview */}
      {renderEnhancedStatsOverview()}

      {/* Enhanced Filters */}
      {renderEnhancedFilters()}

      {/* Main Content based on current view */}
      {currentView === 'table' && renderJobTable()}
      
      {currentView === 'analytics' && jobStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Job Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobStats.distributions.status.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{item.status}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobStats.distributions.category.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.category}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Jobs by Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {jobStats.performance.top_jobs.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.company}</div>
                        </div>
                        <Badge variant="secondary">{item.applications}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog.open} onOpenChange={(open) => setModerationDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Job Moderation: {moderationDialog.action}</DialogTitle>
            <DialogDescription>
              Please provide a reason for this moderation action. This will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Brief reason for this action..."
                value={moderationDialog.reason}
                onChange={(e) => setModerationDialog(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details or instructions..."
                value={moderationDialog.notes}
                onChange={(e) => setModerationDialog(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModerationDialog({ open: false, jobId: null, action: '', reason: '', notes: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleJobModeration(
                moderationDialog.jobId, 
                moderationDialog.action, 
                moderationDialog.reason, 
                moderationDialog.notes
              )}
              disabled={!moderationDialog.reason.trim()}
            >
              Confirm {moderationDialog.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action: {bulkActionDialog.action}</DialogTitle>
            <DialogDescription>
              You are about to {bulkActionDialog.action} {selectedJobs.length} jobs. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <Label htmlFor="bulk-reason">Reason</Label>
            <Textarea
              id="bulk-reason"
              placeholder="Reason for bulk action..."
              value={bulkActionDialog.reason}
              onChange={(e) => setBulkActionDialog(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkActionDialog({ open: false, action: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAction}
              disabled={!bulkActionDialog.reason.trim()}
            >
              Confirm Bulk {bulkActionDialog.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedJobManagement;
