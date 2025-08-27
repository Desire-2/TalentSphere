import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  Star,
  Clock,
  Target,
  Activity,
  BarChart3,
  Plus,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Copy,
  Archive,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Settings,
  Bell,
  Heart,
  Share2,
  PieChart,
  LineChart,
  Globe,
  Phone,
  Zap,
  Award,
  Camera,
  Upload,
  Save,
  RotateCcw,
  UserPlus,
  Shield,
  Megaphone,
  Bookmark,
  Flag,
  Timer,
  TrendingDown,
  ArrowUpDown,
  FilterX,
  SortAsc,
  SortDesc,
  MousePointer,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  VideoIcon as Video,
  Clipboard,
  FileCheck,
  Database,
  Layers,
  Network,
  GitBranch,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Lightbulb,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '../components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Slider } from '../components/ui/slider';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Real-time updates
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Job Management State
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [jobFilters, setJobFilters] = useState({
    status: 'all',
    search: '',
    employment_type: 'all',
    experience_level: 'all',
    salary_range: 'all',
    location: '',
    is_remote: 'all',
    is_featured: 'all',
    date_range: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [jobPagination, setJobPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0
  });
  const [jobCategories, setJobCategories] = useState([]);
  
  // Application Management State
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [applicationFilters, setApplicationFilters] = useState({
    status: 'all',
    job_id: 'all',
    search: '',
    date_range: 'all',
    rating_min: '',
    match_score_min: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [applicationPagination, setApplicationPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  });

  // Candidates Management State
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [candidateSearchMode, setCandidateSearchMode] = useState('top'); // 'top' or 'search'
  const [savedCandidates, setSavedCandidates] = useState([]);
  const [candidateFilters, setCandidateFilters] = useState({
    search: '',
    skills: '',
    experience_level: '',
    location: '',
    availability: '',
    job_id: '',
    min_rating: '',
    application_status: '',
    salary_range: '',
    education_level: '',
    years_experience_min: '',
    years_experience_max: ''
  });
  const [candidatePagination, setCandidatePagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0
  });

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    // Key Metrics
    totalApplications: 0,
    applicationGrowth: 0,
    activeJobs: 0,
    jobGrowth: 0,
    successfulHires: 0,
    hireGrowth: 0,
    avgTimeToHire: '0 days',
    timeToHireChange: 0,
    
    // Funnel Data
    funnelData: {
      applications: 0,
      underReview: 0,
      interviewed: 0,
      hired: 0
    },
    
    // Top Jobs
    topJobs: [],
    
    // Application Sources
    sources: [],
    
    // AI Insights
    insights: [],
    
    // Job Details
    jobDetails: [],
    
    // Time Metrics
    timeMetrics: {
      firstReview: 0,
      interview: 0,
      hire: 0,
      response: 0
    },
    
    // Legacy structure for backward compatibility
    performanceMetrics: {},
    hiringFunnel: {},
    applicationTrends: [],
    jobPerformance: [],
    candidateInsights: {},
    competitorAnalysis: {},
    timeToHire: {},
    costPerHire: {},
    sourceEffectiveness: {}
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30');

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileEditMode, setProfileEditMode] = useState(false);
  
  // Bulk Actions State
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');

  // Quick Actions State
  const [quickActionDialogs, setQuickActionDialogs] = useState({
    postJob: false,
    sendMessage: false,
    scheduleInterview: false,
    exportData: false,
    manageTeam: false
  });

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      draftJobs: 0,
      pausedJobs: 0,
      totalApplications: 0,
      newApplications: 0,
      shortlistedApplications: 0,
      interviewsScheduled: 0,
      hiresMade: 0,
      profileViews: 0,
      companyFollowers: 0,
      avgTimeToHire: 0,
      responseRate: 0,
      qualityScore: 0
    },
    recentJobs: [],
    recentApplications: [],
    topPerformingJobs: [],
    candidateRecommendations: [],
    companyProfile: null,
    analytics: {
      applicationTrends: [],
      hiringFunnel: {},
      jobPerformance: [],
      sourcingMetrics: {}
    },
    alerts: [],
    insights: []
  });

  // Auto-refresh mechanism
  const setupAutoRefresh = useCallback(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      if (activeTab === 'overview') {
        loadDashboardData(true); // Silent refresh
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, activeTab]);

  useEffect(() => {
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, [setupAutoRefresh]);

  useEffect(() => {
    loadDashboardData();
    loadJobCategories();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs();
    } else if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'candidates') {
      if (candidateSearchMode === 'top') {
        loadTopCandidates();
      }
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [
    activeTab, 
    jobFilters, 
    jobPagination.page, 
    applicationFilters, 
    applicationPagination.page, 
    candidateSearchMode, 
    candidatePagination.page,
    analyticsDateRange
  ]);

  // Enhanced Dashboard Data Loading
  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      console.log('🔄 Loading enhanced dashboard data...');
      
      // Load all dashboard data in parallel
      const [
        dashboardStatsResponse,
        myJobsResponse,
        myCompanyResponse,
        candidateRecsResponse,
        notificationsResponse,
        analyticsResponse
      ] = await Promise.all([
        apiService.getEmployerDashboardStats().catch(err => {
          console.warn('⚠️ Dashboard stats failed:', err);
          return { 
            total_jobs: 0, 
            active_jobs: 0, 
            total_applications: 0, 
            new_applications: 0, 
            interviews_scheduled: 0, 
            hires_made: 0,
            profile_views: 0,
            application_trends: [],
            job_performance: []
          };
        }),
        apiService.getMyJobs({ 
          limit: 8, 
          sort_by: 'created_at', 
          sort_order: 'desc' 
        }).catch(err => {
          console.warn('⚠️ My jobs failed:', err);
          return { jobs: [], pagination: { total: 0 } };
        }),
        apiService.getMyCompanyProfile().catch(err => {
          console.warn('⚠️ Company profile failed:', err);
          return null;
        }),
        apiService.getCandidateRecommendationsForEmployer({ limit: 6 }).catch(err => {
          console.warn('⚠️ Candidate recommendations failed:', err);
          return { candidates: [] };
        }),
        apiService.getNotifications({ limit: 5, unread_only: true }).catch(err => {
          console.warn('⚠️ Notifications failed:', err);
          return { notifications: [], total: 0 };
        }),
        apiService.getEmployerDashboardStats().catch(err => {
          console.warn('⚠️ Analytics failed:', err);
          return { application_trends: [], job_performance: [] };
        })
      ]);

      console.log('📊 Enhanced dashboard stats response:', dashboardStatsResponse);
      console.log('💼 Enhanced jobs response:', myJobsResponse);
      console.log('🏢 Enhanced company response:', myCompanyResponse);
      console.log('👥 Enhanced candidates response:', candidateRecsResponse);

      // Process job data to get enhanced statistics
      const jobs = myJobsResponse.jobs || [];
      const activeJobs = dashboardStatsResponse.active_jobs || jobs.filter(job => job.status === 'published' && job.is_active).length;
      const totalJobs = dashboardStatsResponse.total_jobs || jobs.length;
      const draftJobs = dashboardStatsResponse.draft_jobs || jobs.filter(job => job.status === 'draft').length;
      const pausedJobs = dashboardStatsResponse.paused_jobs || jobs.filter(job => job.status === 'paused').length;

      // Get recent applications for dashboard
      const recentApplicationsPromises = jobs.slice(0, 5).map(async (job) => {
        try {
          const applicationsResponse = await apiService.getJobApplications(job.id, { 
            limit: 5, 
            sort_by: 'created_at', 
            sort_order: 'desc' 
          });
          return applicationsResponse.applications?.map(app => ({
            ...app,
            job: { 
              id: job.id,
              title: job.title,
              company_name: job.company_name
            }
          })) || [];
        } catch (err) {
          console.warn(`Failed to get applications for job ${job.id}:`, err);
          return [];
        }
      });

      const applicationArrays = await Promise.all(recentApplicationsPromises);
      const recentApplications = applicationArrays.flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);

      // Enhanced top performing jobs calculation
      const topPerformingJobs = dashboardStatsResponse.job_performance || jobs
        .filter(job => job.application_count > 0)
        .map(job => ({
          id: job.id,
          title: job.title,
          applications: job.application_count || 0,
          views: job.view_count || 0,
          conversion_rate: job.view_count > 0 ? ((job.application_count / job.view_count) * 100).toFixed(1) : 0,
          avg_match_score: Math.floor(Math.random() * 20) + 75, // Mock data for now
          status: job.status,
          created_at: job.created_at,
          performance_score: calculatePerformanceScore(job)
        }))
        .sort((a, b) => b.performance_score - a.performance_score)
        .slice(0, 5);

      // Calculate enhanced profile completion
      const profileCompletionData = myCompanyResponse ? calculateEnhancedProfileCompletion(myCompanyResponse) : { percentage: 0, missing: [] };

      // Process notifications
      setNotifications(notificationsResponse.notifications || []);
      setUnreadCount(notificationsResponse.total || 0);

      // Generate insights and alerts
      const insights = generateDashboardInsights({
        stats: dashboardStatsResponse,
        jobs: jobs,
        applications: recentApplications,
        profile: myCompanyResponse
      });

      const alerts = generateDashboardAlerts({
        stats: dashboardStatsResponse,
        jobs: jobs,
        profile: myCompanyResponse
      });

      setDashboardData({
        stats: {
          totalJobs: totalJobs,
          activeJobs: activeJobs,
          draftJobs: draftJobs,
          pausedJobs: pausedJobs,
          totalApplications: dashboardStatsResponse.total_applications || 0,
          newApplications: dashboardStatsResponse.new_applications || 0,
          shortlistedApplications: dashboardStatsResponse.shortlisted_applications || 0,
          interviewsScheduled: dashboardStatsResponse.interviews_scheduled || 0,
          hiresMade: dashboardStatsResponse.hires_made || 0,
          profileViews: dashboardStatsResponse.profile_views || myCompanyResponse?.profile_views || 0,
          companyFollowers: myCompanyResponse?.follower_count || 0,
          avgTimeToHire: dashboardStatsResponse.avg_time_to_hire || 0,
          responseRate: calculateResponseRate(recentApplications),
          qualityScore: calculateQualityScore(dashboardStatsResponse, myCompanyResponse)
        },
        recentJobs: jobs.slice(0, 8),
        recentApplications: recentApplications,
        topPerformingJobs: topPerformingJobs,
        candidateRecommendations: candidateRecsResponse.candidates || [],
        companyProfile: myCompanyResponse ? {
          ...myCompanyResponse,
          profile_completion: profileCompletionData.percentage,
          missing_fields: profileCompletionData.missing
        } : null,
        analytics: {
          applicationTrends: dashboardStatsResponse.application_trends || [],
          hiringFunnel: calculateHiringFunnel(dashboardStatsResponse),
          jobPerformance: topPerformingJobs,
          sourcingMetrics: calculateSourcingMetrics(recentApplications)
        },
        insights: insights,
        alerts: alerts
      });

      setCompanyProfile(myCompanyResponse);
      setProfileCompletion(profileCompletionData.percentage);
      
    } catch (error) {
      console.error('Error loading enhanced dashboard data:', error);
      if (!silent) {
        setError(error.message || 'Failed to load dashboard data');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  // Load job categories for filters
  const loadJobCategories = async () => {
    try {
      const response = await apiService.getJobCategories();
      setJobCategories(response.categories || []);
    } catch (error) {
      console.warn('Failed to load job categories:', error);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications({ 
        limit: 10, 
        unread_only: false 
      });
      setNotifications(response.notifications || []);
      setUnreadCount(response.notifications?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }
  };

  // Enhanced Job CRUD Operations
  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      setJobsError(null);
      
      const params = {
        page: jobPagination.page,
        per_page: jobPagination.per_page,
        status: jobFilters.status !== 'all' ? jobFilters.status : undefined,
        employment_type: jobFilters.employment_type !== 'all' ? jobFilters.employment_type : undefined,
        experience_level: jobFilters.experience_level !== 'all' ? jobFilters.experience_level : undefined,
        search: jobFilters.search || undefined,
        location: jobFilters.location || undefined,
        is_remote: jobFilters.is_remote !== 'all' ? jobFilters.is_remote === 'true' : undefined,
        is_featured: jobFilters.is_featured !== 'all' ? jobFilters.is_featured === 'true' : undefined,
        date_range: jobFilters.date_range !== 'all' ? jobFilters.date_range : undefined,
        sort_by: jobFilters.sort_by,
        sort_order: jobFilters.sort_order
      };

      // Clean undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiService.getMyJobs(params);
      setJobs(response.jobs || []);
      setJobPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobsError(error.message || 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const createJob = () => {
    navigate('/jobs/post');
  };

  const editJob = (jobId) => {
    navigate(`/jobs/${jobId}/edit`);
  };

  const viewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const duplicateJob = async (jobId) => {
    try {
      setJobsLoading(true);
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Create a copy with modified title
      const jobData = {
        ...job,
        title: `${job.title} (Copy)`,
        status: 'draft',
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        published_at: undefined,
        slug: undefined
      };

      await apiService.createJob(jobData);
      await loadJobs();
      await loadDashboardData(true); // Silent refresh dashboard
      
      // Show success notification
      showNotification('Job duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating job:', error);
      setJobsError(error.message || 'Failed to duplicate job');
      showNotification('Failed to duplicate job', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      setJobsLoading(true);
      const newStatus = currentStatus === 'published' ? 'paused' : 'published';
      
      await apiService.updateJob(jobId, { status: newStatus });
      await loadJobs();
      await loadDashboardData(true);
      
      showNotification(`Job ${newStatus} successfully`, 'success');
    } catch (error) {
      console.error('Error updating job status:', error);
      setJobsError(error.message || 'Failed to update job status');
      showNotification('Failed to update job status', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const promoteJob = async (jobId) => {
    try {
      setJobsLoading(true);
      await apiService.updateJob(jobId, { is_featured: true });
      await loadJobs();
      await loadDashboardData(true);
      
      showNotification('Job promoted successfully', 'success');
    } catch (error) {
      console.error('Error promoting job:', error);
      showNotification('Failed to promote job', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const archiveJob = async (jobId) => {
    try {
      setJobsLoading(true);
      await apiService.updateJob(jobId, { status: 'closed' });
      await loadJobs();
      await loadDashboardData(true);
      
      showNotification('Job archived successfully', 'success');
    } catch (error) {
      console.error('Error archiving job:', error);
      setJobsError(error.message || 'Failed to archive job');
      showNotification('Failed to archive job', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      setJobsLoading(true);
      await apiService.deleteJob(jobId);
      await loadJobs();
      await loadDashboardData(true);
      
      showNotification('Job deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting job:', error);
      setJobsError(error.message || 'Failed to delete job');
      showNotification('Failed to delete job', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const bulkJobAction = async (action) => {
    if (selectedJobs.length === 0) return;

    try {
      setBulkActionLoading(true);
      setBulkActionType(action);
      
      const actionData = {
        job_ids: selectedJobs,
        action: action
      };

      await apiService.bulkJobAction(actionData);
      
      setSelectedJobs([]);
      await loadJobs();
      await loadDashboardData(true);
      
      showNotification(`Successfully ${action}ed ${selectedJobs.length} job(s)`, 'success');
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setJobsError(error.message || 'Failed to perform bulk action');
      showNotification('Failed to perform bulk action', 'error');
    } finally {
      setBulkActionLoading(false);
      setBulkActionType('');
    }
  };

  // Enhanced Application Management
  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      setApplicationsError(null);
      
      const params = {
        page: applicationPagination.page,
        per_page: applicationPagination.per_page,
        status: applicationFilters.status !== 'all' ? applicationFilters.status : undefined,
        job_id: applicationFilters.job_id !== 'all' ? applicationFilters.job_id : undefined,
        search: applicationFilters.search || undefined,
        date_range: applicationFilters.date_range !== 'all' ? applicationFilters.date_range : undefined,
        rating_min: applicationFilters.rating_min || undefined,
        match_score_min: applicationFilters.match_score_min || undefined,
        sort_by: applicationFilters.sort_by,
        sort_order: applicationFilters.sort_order
      };

      // Clean undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiService.getEmployerApplications(params);
      setApplications(response.applications || []);
      setApplicationPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplicationsError(error.message || 'Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    try {
      await apiService.updateApplicationStatus(applicationId, { 
        status, 
        notes: notes || undefined 
      });
      await loadApplications();
      await loadDashboardData(true);
      
      showNotification('Application status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating application status:', error);
      setApplicationsError(error.message || 'Failed to update application status');
      showNotification('Failed to update application status', 'error');
    }
  };

  const bulkApplicationAction = async (action) => {
    if (selectedApplications.length === 0) return;

    try {
      setApplicationsLoading(true);
      
      await apiService.bulkApplicationAction({
        application_ids: selectedApplications,
        action: action
      });

      setSelectedApplications([]);
      await loadApplications();
      await loadDashboardData(true);
      
      showNotification(`Successfully ${action}ed ${selectedApplications.length} application(s)`, 'success');
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setApplicationsError(error.message || 'Failed to perform bulk action');
      showNotification('Failed to perform bulk action', 'error');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const scheduleInterview = (applicationId) => {
    navigate(`/applications/${applicationId}/interview`);
  };

  const sendMessage = (applicationId) => {
    navigate(`/applications/${applicationId}/message`);
  };

  const rateCandidate = async (applicationId, rating, notes = '') => {
    try {
      await apiService.updateApplicationStatus(applicationId, { 
        rating, 
        notes: notes || undefined 
      });
      await loadApplications();
      
      showNotification('Candidate rated successfully', 'success');
    } catch (error) {
      console.error('Error rating candidate:', error);
      showNotification('Failed to rate candidate', 'error');
    }
  };

  // Enhanced Candidate Management
  const loadTopCandidates = async () => {
    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      
      const params = {
        page: candidatePagination.page,
        per_page: candidatePagination.per_page,
        job_id: candidateFilters.job_id || undefined,
        skills: candidateFilters.skills || undefined,
        experience_level: candidateFilters.experience_level || undefined,
        location: candidateFilters.location || undefined,
        availability: candidateFilters.availability || undefined,
        min_rating: candidateFilters.min_rating || undefined,
        application_status: candidateFilters.application_status || undefined
      };

      // Clean undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiService.getTopCandidates(params);
      setCandidates(response.candidates || []);
      setCandidatePagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error loading top candidates:', error);
      setCandidatesError(error.message || 'Failed to load candidates');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const searchCandidates = async () => {
    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      setCandidateSearchMode('search');
      
      const params = {
        page: 1, // Reset to first page for new search
        per_page: candidatePagination.per_page,
        search: candidateFilters.search || undefined,
        skills: candidateFilters.skills || undefined,
        experience_level: candidateFilters.experience_level || undefined,
        location: candidateFilters.location || undefined,
        availability: candidateFilters.availability || undefined,
        salary_range: candidateFilters.salary_range || undefined,
        education_level: candidateFilters.education_level || undefined,
        years_experience_min: candidateFilters.years_experience_min || undefined,
        years_experience_max: candidateFilters.years_experience_max || undefined
      };

      // Clean undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiService.searchCandidates(params);
      setCandidates(response.candidates || []);
      setCandidatePagination(prev => ({
        ...prev,
        page: 1,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error searching candidates:', error);
      setCandidatesError(error.message || 'Failed to search candidates');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const saveCandidate = async (candidateId) => {
    try {
      // This would typically call an API to save the candidate
      setSavedCandidates(prev => [...prev, candidateId]);
      showNotification('Candidate saved to your talent pool', 'success');
    } catch (error) {
      console.error('Error saving candidate:', error);
      showNotification('Failed to save candidate', 'error');
    }
  };

  const contactCandidate = (candidateId) => {
    navigate(`/candidates/${candidateId}/contact`);
  };

  // Analytics Functions
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      
      const [
        dashboardStats,
        performanceMetrics,
        hiringFunnelData
      ] = await Promise.all([
        apiService.getEmployerDashboardStats(),
        apiService.getJobPerformanceStats?.() || Promise.resolve({}),
        apiService.getHiringFunnelData?.() || Promise.resolve({})
      ]);

      // Calculate mock analytics data based on current data
      const totalApps = applications.length;
      const activeJobsCount = jobs.filter(job => job.status === 'published').length;
      const hiredCount = applications.filter(app => app.status === 'hired').length;
      
      setAnalyticsData(prev => ({
        ...prev,
        // Key Metrics
        totalApplications: totalApps,
        applicationGrowth: Math.floor(Math.random() * 20) - 10, // Mock growth
        activeJobs: activeJobsCount,
        jobGrowth: Math.floor(Math.random() * 15) - 5, // Mock growth
        successfulHires: hiredCount,
        hireGrowth: Math.floor(Math.random() * 25) - 10, // Mock growth
        avgTimeToHire: `${Math.floor(Math.random() * 20) + 10} days`,
        timeToHireChange: Math.floor(Math.random() * 10) - 5, // Mock change
        
        // Funnel Data
        funnelData: {
          applications: totalApps,
          underReview: applications.filter(app => app.status === 'under_review').length,
          interviewed: applications.filter(app => app.status === 'interviewed').length,
          hired: hiredCount
        },
        
        // Top Jobs (sample data)
        topJobs: jobs.slice(0, 5).map((job, index) => ({
          id: job.id,
          title: job.title,
          applications: job.application_count || 0,
          conversionRate: Math.floor(Math.random() * 15) + 5
        })),
        
        // Application Sources (sample data)
        sources: [
          { name: 'Direct Applications', count: Math.floor(totalApps * 0.4), percentage: 40 },
          { name: 'Job Boards', count: Math.floor(totalApps * 0.3), percentage: 30 },
          { name: 'Social Media', count: Math.floor(totalApps * 0.2), percentage: 20 },
          { name: 'Referrals', count: Math.floor(totalApps * 0.1), percentage: 10 }
        ],
        
        // AI Insights (sample)
        insights: [
          {
            type: 'success',
            title: 'Strong Application Rate',
            description: 'Your jobs are receiving above-average applications',
            action: 'View top performing jobs'
          },
          {
            type: 'warning',
            title: 'Slow Response Time',
            description: 'Consider responding to applications faster to improve candidate experience',
            action: 'Review pending applications'
          }
        ],
        
        // Job Details
        jobDetails: jobs.map(job => ({
          id: job.id,
          title: job.title,
          views: job.view_count || 0,
          applications: job.application_count || 0,
          conversion: job.view_count > 0 ? Math.round((job.application_count || 0) / job.view_count * 100) : 0
        })),
        
        // Time Metrics
        timeMetrics: {
          firstReview: Math.floor(Math.random() * 48) + 6, // 6-54 hours
          interview: Math.floor(Math.random() * 10) + 3, // 3-13 days
          hire: Math.floor(Math.random() * 20) + 10, // 10-30 days
          response: Math.floor(Math.random() * 24) + 2 // 2-26 hours
        }
      }));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCandidatePageChange = (page) => {
    setCandidatePagination(prev => ({ ...prev, page }));
  };

  // Helper Functions
  const calculateEnhancedProfileCompletion = (profile) => {
    const required = [
      'name', 'description', 'industry', 'company_size', 'website', 
      'email', 'city', 'state', 'country'
    ];
    const optional = [
      'logo_url', 'cover_image', 'tagline', 'founded_year', 'employees_count',
      'phone', 'social_media', 'benefits', 'culture_description'
    ];
    
    const completedRequired = required.filter(field => profile[field] && profile[field].toString().trim() !== '');
    const completedOptional = optional.filter(field => profile[field] && profile[field].toString().trim() !== '');
    
    const requiredScore = (completedRequired.length / required.length) * 70;
    const optionalScore = (completedOptional.length / optional.length) * 30;
    
    const percentage = Math.round(requiredScore + optionalScore);
    const missing = required.filter(field => !profile[field] || profile[field].toString().trim() === '');
    
    return { percentage, missing };
  };

  const calculatePerformanceScore = (job) => {
    const applications = job.application_count || 0;
    const views = job.view_count || 0;
    const conversionRate = views > 0 ? (applications / views) * 100 : 0;
    const daysActive = job.created_at ? Math.floor((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24)) : 0;
    
    // Weighted score based on multiple factors
    const applicationScore = Math.min(applications * 2, 100);
    const conversionScore = Math.min(conversionRate * 10, 100);
    const freshnessScore = Math.max(100 - (daysActive * 2), 0);
    
    return Math.round((applicationScore * 0.4) + (conversionScore * 0.4) + (freshnessScore * 0.2));
  };

  const calculateResponseRate = (applications) => {
    if (!applications.length) return 0;
    const responded = applications.filter(app => 
      app.status !== 'submitted' && app.status !== 'withdrawn'
    ).length;
    return Math.round((responded / applications.length) * 100);
  };

  const calculateQualityScore = (stats, profile) => {
    const factors = [
      profile?.is_verified ? 20 : 0,
      stats.avg_time_to_hire < 14 ? 20 : stats.avg_time_to_hire < 30 ? 10 : 0,
      stats.total_applications > 50 ? 20 : stats.total_applications > 10 ? 10 : 0,
      stats.hires_made > 5 ? 20 : stats.hires_made > 0 ? 10 : 0,
      profile?.description?.length > 500 ? 20 : profile?.description?.length > 200 ? 10 : 0
    ];
    return factors.reduce((sum, score) => sum + score, 0);
  };

  const calculateHiringFunnel = (stats) => {
    const total = stats.total_applications || 0;
    return {
      applied: total,
      reviewed: stats.shortlisted_applications || 0,
      interviewed: stats.interviews_scheduled || 0,
      hired: stats.hires_made || 0,
      conversionRate: total > 0 ? Math.round((stats.hires_made / total) * 100) : 0
    };
  };

  const calculateSourcingMetrics = (applications) => {
    const sources = applications.reduce((acc, app) => {
      const source = app.source || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(sources).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / applications.length) * 100)
    }));
  };

  const generateDashboardInsights = ({ stats, jobs, applications, profile }) => {
    const insights = [];
    
    // Performance insights
    if (stats.total_applications > 0 && stats.hires_made === 0) {
      insights.push({
        type: 'warning',
        title: 'No Hires Yet',
        message: 'You have received applications but haven\'t made any hires. Consider reviewing your selection criteria.',
        action: () => setActiveTab('applications')
      });
    }
    
    if (jobs.filter(j => j.status === 'published').length === 0) {
      insights.push({
        type: 'info',
        title: 'No Active Jobs',
        message: 'You don\'t have any active job postings. Post a job to start receiving applications.',
        action: () => navigate('/jobs/post')
      });
    }
    
    if (profile && profile.profile_completion < 70) {
      insights.push({
        type: 'warning',
        title: 'Incomplete Profile',
        message: 'Complete your company profile to attract better candidates and improve visibility.',
        action: () => navigate('/company/profile')
      });
    }
    
    const avgApplicationsPerJob = jobs.length > 0 ? stats.total_applications / jobs.length : 0;
    if (avgApplicationsPerJob < 5 && jobs.length > 0) {
      insights.push({
        type: 'tip',
        title: 'Low Application Rate',
        message: 'Your jobs are receiving fewer applications. Consider improving job descriptions or salary offers.',
        action: () => setActiveTab('jobs')
      });
    }
    
    return insights;
  };

  const generateDashboardAlerts = ({ stats, jobs, profile }) => {
    const alerts = [];
    
    // Urgent alerts
    const expiringSoon = jobs.filter(job => {
      if (!job.application_deadline) return false;
      const daysUntilExpiry = Math.floor((new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    });
    
    if (expiringSoon.length > 0) {
      alerts.push({
        type: 'urgent',
        title: 'Jobs Expiring Soon',
        message: `${expiringSoon.length} job(s) will expire within 3 days`,
        count: expiringSoon.length
      });
    }
    
    // Pending actions
    if (stats.new_applications > 0) {
      alerts.push({
        type: 'action',
        title: 'New Applications',
        message: `${stats.new_applications} new applications need review`,
        count: stats.new_applications,
        action: () => setActiveTab('applications')
      });
    }
    
    if (stats.interviews_scheduled > 0) {
      alerts.push({
        type: 'info',
        title: 'Upcoming Interviews',
        message: `${stats.interviews_scheduled} interviews scheduled`,
        count: stats.interviews_scheduled
      });
    }
    
    return alerts;
  };

  const generateCandidateInsights = (applications) => {
    if (!applications.length) return {};
    
    const skills = applications.flatMap(app => 
      app.applicant_profile?.skills || []
    ).reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});
    
    const topSkills = Object.entries(skills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
    
    const experienceLevels = applications.reduce((acc, app) => {
      const level = app.applicant_profile?.experience_level || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    return {
      topSkills,
      experienceLevels,
      totalCandidates: applications.length,
      avgRating: applications.reduce((sum, app) => sum + (app.rating || 0), 0) / applications.length
    };
  };

  const generateCompetitorAnalysis = (jobs) => {
    // This would typically involve external data
    return {
      marketSalaryRange: 'Competitive',
      industryBenchmarks: {},
      suggestions: [
        'Consider increasing salary range for better candidates',
        'Add remote work options to attract wider talent pool',
        'Improve job descriptions with more specific requirements'
      ]
    };
  };

  const calculateTimeToHireMetrics = (applications) => {
    const hiredApps = applications.filter(app => app.status === 'hired');
    if (!hiredApps.length) return { avg: 0, median: 0, fastest: 0, slowest: 0 };
    
    const hireTimes = hiredApps.map(app => {
      const start = new Date(app.created_at);
      const end = new Date(app.updated_at);
      return Math.floor((end - start) / (1000 * 60 * 60 * 24));
    });
    
    const avg = hireTimes.reduce((sum, time) => sum + time, 0) / hireTimes.length;
    const sorted = hireTimes.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return {
      avg: Math.round(avg),
      median,
      fastest: Math.min(...hireTimes),
      slowest: Math.max(...hireTimes)
    };
  };

  const calculateCostPerHire = (stats) => {
    // This would typically include job board costs, recruiting fees, etc.
    const estimatedCost = stats.total_jobs * 100; // Mock calculation
    return stats.hires_made > 0 ? Math.round(estimatedCost / stats.hires_made) : 0;
  };

  const calculateSourceEffectiveness = (applications) => {
    const sources = applications.reduce((acc, app) => {
      const source = app.source || 'direct';
      if (!acc[source]) {
        acc[source] = { total: 0, hired: 0 };
      }
      acc[source].total++;
      if (app.status === 'hired') {
        acc[source].hired++;
      }
      return acc;
    }, {});
    
    return Object.entries(sources).map(([source, data]) => ({
      source,
      total: data.total,
      hired: data.hired,
      hireRate: data.total > 0 ? Math.round((data.hired / data.total) * 100) : 0
    }));
  };

  const showNotification = (message, type = 'info') => {
    // This would typically integrate with a toast library
    console.log(`${type.toUpperCase()}: ${message}`);
    // You could add react-hot-toast or similar here
  };

  const refreshData = async () => {
    setRefreshing(true);
    setLastRefresh(new Date());
    await loadDashboardData(true);
    if (activeTab === 'jobs') await loadJobs();
    if (activeTab === 'applications') await loadApplications();
    if (activeTab === 'candidates') {
      if (candidateSearchMode === 'top') {
        await loadTopCandidates();
      }
    }
    if (activeTab === 'analytics') await loadAnalytics();
  };

  const exportData = async (type) => {
    try {
      let data = [];
      let filename = '';
      
      switch (type) {
        case 'jobs':
          data = jobs;
          filename = 'jobs_export.csv';
          break;
        case 'applications':
          data = applications;
          filename = 'applications_export.csv';
          break;
        case 'candidates':
          data = candidates;
          filename = 'candidates_export.csv';
          break;
        case 'analytics':
          data = analyticsData;
          filename = 'analytics_export.json';
          break;
      }
      
      // This would typically create and download a file
      console.log(`Exporting ${type}:`, data);
      showNotification(`${type} data exported successfully`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export data', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-500',
      draft: 'bg-yellow-500',
      paused: 'bg-orange-500',
      closed: 'bg-red-500',
      submitted: 'bg-blue-500',
      under_review: 'bg-orange-500',
      shortlisted: 'bg-purple-500',
      interviewed: 'bg-indigo-500',
      hired: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      published: Play,
      draft: Edit,
      paused: Pause,
      closed: Archive,
      submitted: FileText,
      under_review: Eye,
      shortlisted: Star,
      interviewed: MessageSquare,
      hired: CheckCircle,
      rejected: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-3 h-3" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSalary = (job) => {
    if (!job.salary_min && !job.salary_max) return 'Not specified';
    
    const currency = job.salary_currency || 'USD';
    const period = job.salary_period || 'yearly';
    
    if (job.salary_negotiable) return 'Negotiable';
    
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${period}`;
    } else if (job.salary_min) {
      return `${currency} ${job.salary_min.toLocaleString()}+ ${period}`;
    } else {
      return `Up to ${currency} ${job.salary_max.toLocaleString()} ${period}`;
    }
  };

  const exportAnalytics = async () => {
    await exportData('analytics');
  };

  // Event Handlers
  const handlePostNewJob = () => {
    navigate('/jobs/post');
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleViewAllJobs = () => {
    setActiveTab('jobs');
  };

  const handleViewAllApplications = () => {
    setActiveTab('applications');
  };

  const handleReviewApplication = (applicationId) => {
    navigate(`/applications/${applicationId}`);
  };

  const handleCompanyProfile = () => {
    navigate('/company/profile');
  };

  const handleJobSelection = (jobId, checked) => {
    if (checked) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  const handleSelectAllJobs = (checked) => {
    if (checked) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleJobFilterChange = (key, value) => {
    setJobFilters(prev => ({ ...prev, [key]: value }));
    setJobPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleApplicationFilterChange = (key, value) => {
    setApplicationFilters(prev => ({ ...prev, [key]: value }));
    setApplicationPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleJobPageChange = (page) => {
    setJobPagination(prev => ({ ...prev, page }));
  };

  const handleApplicationPageChange = (page) => {
    setApplicationPagination(prev => ({ ...prev, page }));
  };

  // Enhanced Dashboard Overview Component
  const DashboardOverview = () => (
    <div className="space-y-8">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium">
              {realTimeEnabled ? 'Live Updates' : 'Manual Refresh'}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-gray-600">
            Last updated: {formatDate(lastRefresh)}
          </span>
          {unreadCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-orange-600">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">{unreadCount} new alerts</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={realTimeEnabled} 
            onCheckedChange={setRealTimeEnabled}
            className="data-[state=checked]:bg-green-600"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts and Insights */}
      {(dashboardData.alerts?.length > 0 || dashboardData.insights?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          {dashboardData.alerts?.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  Urgent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.alerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">{alert.title}</p>
                      <p className="text-sm text-red-700">{alert.message}</p>
                    </div>
                    {alert.action && (
                      <Button size="sm" variant="outline" onClick={alert.action}>
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {dashboardData.insights?.length > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <TrendingUp className="w-5 h-5" />
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">{insight.title}</p>
                      <p className="text-sm text-blue-700">{insight.message}</p>
                    </div>
                    {insight.action && (
                      <Button size="sm" variant="outline" onClick={insight.action}>
                        Action
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-900">{dashboardData.stats.activeJobs}</p>
                <div className="flex items-center mt-2 text-xs">
                  <span className="text-blue-600">
                    {dashboardData.stats.draftJobs} drafts • {dashboardData.stats.pausedJobs} paused
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(dashboardData.stats.activeJobs / Math.max(dashboardData.stats.totalJobs, 1)) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">New Applications</p>
                <p className="text-3xl font-bold text-green-900">{dashboardData.stats.newApplications}</p>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    {dashboardData.stats.totalApplications} total
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(dashboardData.stats.newApplications / Math.max(dashboardData.stats.totalApplications, 1)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Interviews</p>
                <p className="text-3xl font-bold text-purple-900">{dashboardData.stats.interviewsScheduled}</p>
                <div className="flex items-center mt-2 text-xs">
                  <Calendar className="w-3 h-3 mr-1 text-purple-600" />
                  <span className="text-purple-600">
                    {dashboardData.stats.shortlistedApplications} shortlisted
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(dashboardData.stats.interviewsScheduled / Math.max(dashboardData.stats.shortlistedApplications, 1)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/20" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Quality Score</p>
                <p className="text-3xl font-bold text-orange-900">{dashboardData.stats.qualityScore}%</p>
                <div className="flex items-center mt-2 text-xs">
                  <Award className="w-3 h-3 mr-1 text-orange-600" />
                  <span className="text-orange-600">
                    {dashboardData.stats.hiresMade} hires made
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={dashboardData.stats.qualityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used actions for faster workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-blue-50"
              onClick={() => navigate('/jobs/post')}
            >
              <Plus className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Post Job</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-green-50"
              onClick={() => setActiveTab('applications')}
            >
              <Eye className="w-6 h-6 text-green-600" />
              <span className="text-sm">Review Apps</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-purple-50"
              onClick={() => setActiveTab('candidates')}
            >
              <Search className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Find Talent</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-orange-50"
              onClick={() => exportData('analytics')}
            >
              <Download className="w-6 h-6 text-orange-600" />
              <span className="text-sm">Export Data</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-indigo-50"
              onClick={() => navigate('/company/profile')}
            >
              <Settings className="w-6 h-6 text-indigo-600" />
              <span className="text-sm">Profile</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-pink-50"
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-6 h-6 text-pink-600" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Application Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>Daily application volume and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.analytics.applicationTrends?.length > 0 ? (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart would be rendered here</p>
                  <p className="text-sm text-gray-400">
                    {dashboardData.analytics.applicationTrends.length} data points
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                  <p className="text-sm text-gray-400">Start receiving applications to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hiring Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Hiring Funnel
            </CardTitle>
            <CardDescription>Conversion rates at each stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(dashboardData.analytics.hiringFunnel).map(([stage, count], index) => (
              <div key={stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-blue-${Math.max(200 + index * 100, 600)}`} />
                  <span className="font-medium capitalize">{stage.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{count}</p>
                  {index > 0 && (
                    <p className="text-xs text-gray-500">
                      {Math.round((count / Object.values(dashboardData.analytics.hiringFunnel)[0]) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Recent Job Postings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleViewAllJobs}>
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentJobs.length > 0 ? (
              dashboardData.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleViewJob(job.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h4>
                      {job.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {job.is_urgent && (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <Zap className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {job.application_count || 0} applications
                      </span>
                      <span className="capitalize">{job.employment_type || 'N/A'}</span>
                      {job.is_remote && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Globe className="w-3 h-3" />
                          Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        Posted {formatDate(job.created_at)}
                      </span>
                      {job.application_deadline && (
                        <span className="text-xs text-orange-600">
                          Expires {formatDate(job.application_deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(job.status)} text-white border-0`}
                    >
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status}</span>
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); viewJob(job.id); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); editJob(job.id); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateJob(job.id); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                <p className="text-gray-500 mb-6">Get started by posting your first job</p>
                <Button onClick={handlePostNewJob} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Latest Applications
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleViewAllApplications}>
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentApplications.length > 0 ? (
              dashboardData.recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleReviewApplication(application.id)}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 border-2 border-gray-200">
                      <AvatarImage src={application.applicant?.avatar} alt={application.applicant?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {application.applicant?.name?.split(' ').map(n => n[0]).join('') || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate group-hover:text-blue-600 transition-colors">
                          {application.applicant?.name || 'Anonymous'}
                        </h4>
                        {application.match_score && application.match_score > 80 && (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            High Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {application.job?.title || 'Job Title'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(application.created_at)}</span>
                        {application.match_score && (
                          <span className="text-green-600 font-medium">
                            {application.match_score}% match
                          </span>
                        )}
                        {application.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{application.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(application.status)} text-white border-0`}
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1 capitalize">{application.status?.replace('_', ' ') || 'pending'}</span>
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReviewApplication(application.id); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateApplicationStatus(application.id, 'shortlisted'); }}>
                          <Star className="w-4 h-4 mr-2" />
                          Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); scheduleInterview(application.id); }}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Interview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); sendMessage(application.id); }}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-500 mb-6">Applications will appear here when candidates apply</p>
                <Button variant="outline" onClick={() => setActiveTab('jobs')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Your Jobs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Jobs & Recommended Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Jobs
            </CardTitle>
            <CardDescription>Jobs with highest engagement and conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.topPerformingJobs.length > 0 ? (
              dashboardData.topPerformingJobs.map((job, index) => (
                <div key={job.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                        #{index + 1}
                      </div>
                      <h4 className="font-medium">{job.title}</h4>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Score: {job.performance_score}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-gray-600">Views</p>
                      <p className="font-semibold text-blue-700">{job.views}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-gray-600">Applications</p>
                      <p className="font-semibold text-green-700">{job.applications}</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-gray-600">Conversion</p>
                      <p className="font-semibold text-purple-700">{job.conversion_rate}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Performance Score</span>
                      <span className="font-medium">{job.performance_score}/100</span>
                    </div>
                    <Progress value={job.performance_score} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No performance data yet</p>
                <p className="text-sm text-gray-400">Post jobs and receive applications to see metrics</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Recommended Candidates
            </CardTitle>
            <CardDescription>High-potential candidates for your open positions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.candidateRecommendations.length > 0 ? (
              dashboardData.candidateRecommendations.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 border-2 border-purple-200">
                      <AvatarImage src={candidate.profile_picture} alt={candidate.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {candidate.name?.split(' ').map(n => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{candidate.name}</h4>
                        {candidate.match_score && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            {candidate.match_score}% match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {candidate.title || candidate.profile?.title || 'No title specified'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {candidate.profile?.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {candidate.profile.location}
                          </span>
                        )}
                        {candidate.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{candidate.rating}</span>
                          </div>
                        )}
                        {candidate.availability_status && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              candidate.availability_status === 'available' 
                                ? 'text-green-700 border-green-300' 
                                : 'text-gray-700 border-gray-300'
                            }`}
                          >
                            {candidate.availability_status === 'available' ? 'Available' : 'Passive'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => saveCandidate(candidate.id)}>
                            <Heart className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save to talent pool</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button size="sm" onClick={() => contactCandidate(candidate.id)}>
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No recommendations yet</p>
                <p className="text-sm text-gray-400">Post jobs to get candidate recommendations</p>
                <Button className="mt-4" onClick={() => setActiveTab('candidates')}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Candidates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Loading and Error States
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your job postings and track applications</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handlePostNewJob}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
          <Button variant="outline" onClick={handleCompanyProfile}>
            <Building2 className="w-4 h-4 mr-2" />
            Company Profile
          </Button>
        </div>
      </div>

      {/* Company Profile Completion */}
      {dashboardData.companyProfile && dashboardData.companyProfile.profile_completion < 100 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">Complete Your Company Profile</h3>
                <p className="text-orange-700 text-sm">
                  {dashboardData.companyProfile.profile_completion}% complete - Add more details to attract better candidates
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCompanyProfile}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Company Profile Warning */}
      {!dashboardData.companyProfile && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Company Profile Required</h3>
                <p className="text-red-700 text-sm">
                  Create your company profile to start posting jobs and attracting candidates
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCompanyProfile}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Jobs</p>
                <p className="text-3xl font-bold">{dashboardData.stats.activeJobs}</p>
                <p className="text-blue-100 text-xs">of {dashboardData.stats.totalJobs} total</p>
              </div>
              <div className="p-3 bg-blue-600 rounded-lg">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">New Applications</p>
                <p className="text-3xl font-bold">{dashboardData.stats.newApplications}</p>
                <p className="text-green-100 text-xs">of {dashboardData.stats.totalApplications} total</p>
              </div>
              <div className="p-3 bg-green-600 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Interviews Scheduled</p>
                <p className="text-3xl font-bold">{dashboardData.stats.interviewsScheduled}</p>
                <p className="text-purple-100 text-xs">this week</p>
              </div>
              <div className="p-3 bg-purple-600 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Successful Hires</p>
                <p className="text-3xl font-bold">{dashboardData.stats.hiresMade}</p>
                <p className="text-orange-100 text-xs">this month</p>
              </div>
              <div className="p-3 bg-orange-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            My Jobs ({dashboardData.stats.totalJobs})
          </TabsTrigger>
          <TabsTrigger value="applications">
            <FileText className="w-4 h-4 mr-2" />
            Applications ({dashboardData.stats.newApplications})
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <Target className="w-4 h-4 mr-2" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Job Management
                  </CardTitle>
                  <CardDescription>Manage all your job postings</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createJob} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button variant="outline" onClick={loadJobs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search jobs..."
                    value={jobFilters.search}
                    onChange={(e) => handleJobFilterChange('search', e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={jobFilters.status} onValueChange={(value) => handleJobFilterChange('status', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobFilters.employment_type} onValueChange={(value) => handleJobFilterChange('employment_type', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobFilters.date_range} onValueChange={(value) => handleJobFilterChange('date_range', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedJobs.length > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedJobs.length} job(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => bulkJobAction('publish')}>
                      <Play className="w-3 h-3 mr-1" />
                      Publish
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkJobAction('pause')}>
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkJobAction('archive')}>
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Jobs</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedJobs.length} job(s)? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => bulkJobAction('delete')}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* Jobs Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">
                          <input
                            type="checkbox"
                            checked={selectedJobs.length === jobs.length && jobs.length > 0}
                            onChange={(e) => handleSelectAllJobs(e.target.checked)}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left p-3 font-medium">Job Title</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Applications</th>
                        <th className="text-left p-3 font-medium">Views</th>
                        <th className="text-left p-3 font-medium">Posted</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobsLoading ? (
                        <tr>
                          <td colSpan="8" className="text-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p>Loading jobs...</p>
                          </td>
                        </tr>
                      ) : jobs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center p-8">
                            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No jobs found</p>
                            <p className="text-sm text-gray-400 mb-4">Get started by posting your first job</p>
                            <Button onClick={createJob}>
                              <Plus className="w-4 h-4 mr-2" />
                              Post Job
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedJobs.includes(job.id)}
                                onChange={(e) => handleJobSelection(job.id, e.target.checked)}
                                className="rounded"
                              />
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{job.title}</div>
                                <div className="text-sm text-gray-500">{formatSalary(job)}</div>
                                {job.is_featured && (
                                  <Badge className="mt-1 bg-yellow-100 text-yellow-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={`${getStatusColor(job.status)} text-white`}>
                                {getStatusIcon(job.status)}
                                <span className="ml-1 capitalize">{job.status}</span>
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="capitalize">{job.employment_type}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{job.application_count || 0}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{job.view_count || 0}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">{formatDate(job.created_at)}</span>
                            </td>
                            <td className="p-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => viewJob(job.id)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => editJob(job.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateJob(job.id)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleJobStatus(job.id, job.status)}>
                                    {job.status === 'published' ? (
                                      <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Publish
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => archiveJob(job.id)}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{job.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteJob(job.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {jobPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((jobPagination.page - 1) * jobPagination.per_page) + 1} to{' '}
                    {Math.min(jobPagination.page * jobPagination.per_page, jobPagination.total)} of{' '}
                    {jobPagination.total} jobs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobPagination.page === 1}
                      onClick={() => handleJobPageChange(jobPagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobPagination.page === jobPagination.pages}
                      onClick={() => handleJobPageChange(jobPagination.page + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {jobsError && (
                <div className="text-center p-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-600 mb-4">{jobsError}</p>
                  <Button onClick={loadJobs} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Application Management
                  </CardTitle>
                  <CardDescription>Review and manage candidate applications</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadApplications}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search applications..."
                    value={applicationFilters.search}
                    onChange={(e) => handleApplicationFilterChange('search', e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select 
                  value={applicationFilters.status} 
                  onValueChange={(value) => handleApplicationFilterChange('status', value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={applicationFilters.job_id} 
                  onValueChange={(value) => handleApplicationFilterChange('job_id', value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.slice(0, 10).map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={applicationFilters.date_range} 
                  onValueChange={(value) => handleApplicationFilterChange('date_range', value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {applications.some(app => app.selected) && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {applications.filter(app => app.selected).length} application(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => bulkApplicationAction('shortlist')}>
                      <Star className="w-3 h-3 mr-1" />
                      Shortlist
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkApplicationAction('mark_reviewed')}>
                      <Eye className="w-3 h-3 mr-1" />
                      Mark Reviewed
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => bulkApplicationAction('reject')}>
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Applications List */}
              <div className="space-y-4">
                {applicationsLoading ? (
                  <div className="text-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center p-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No applications found</p>
                    <p className="text-sm text-gray-400">Applications will appear here when candidates apply to your jobs</p>
                  </div>
                ) : (
                  applications.map((application) => (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <input
                              type="checkbox"
                              checked={application.selected || false}
                              onChange={(e) => {
                                const updated = applications.map(app => 
                                  app.id === application.id 
                                    ? { ...app, selected: e.target.checked }
                                    : app
                                );
                                setApplications(updated);
                              }}
                              className="mt-2 rounded"
                            />
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={application.applicant?.avatar} alt={application.applicant?.name} />
                              <AvatarFallback>
                                {application.applicant?.name?.split(' ').map(n => n[0]).join('') || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{application.applicant?.name || 'Anonymous'}</h4>
                                <Badge className={`${getStatusColor(application.status)} text-white`}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1 capitalize">{application.status?.replace('_', ' ')}</span>
                                </Badge>
                                {application.match_score && (
                                  <Badge variant="outline" className="text-green-600">
                                    {application.match_score}% match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{application.job?.title}</p>
                              <p className="text-xs text-gray-500 mb-3">
                                Applied {formatDate(application.created_at)}
                              </p>
                              
                              {/* Application Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {application.applicant_profile?.title && (
                                  <div>
                                    <span className="font-medium">Title:</span>
                                    <p className="text-gray-600">{application.applicant_profile.title}</p>
                                  </div>
                                )}
                                {application.applicant_profile?.experience_level && (
                                  <div>
                                    <span className="font-medium">Experience:</span>
                                    <p className="text-gray-600 capitalize">{application.applicant_profile.experience_level}</p>
                                  </div>
                                )}
                                {application.applicant_profile?.location && (
                                  <div>
                                    <span className="font-medium">Location:</span>
                                    <p className="text-gray-600">{application.applicant_profile.location}</p>
                                  </div>
                                )}
                              </div>

                              {/* Cover Letter Preview */}
                              {application.cover_letter && (
                                <div className="mt-3 p-3 bg-gray-50 rounded">
                                  <p className="text-sm font-medium mb-1">Cover Letter:</p>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {application.cover_letter.slice(0, 200)}
                                    {application.cover_letter.length > 200 && '...'}
                                  </p>
                                </div>
                              )}

                              {/* Interview Info */}
                              {application.interview_scheduled && (
                                <div className="mt-3 p-3 bg-blue-50 rounded flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-blue-800">
                                    Interview scheduled for {formatDate(application.interview_datetime)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {application.resume_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => sendMessage(application.id)}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateApplicationStatus(application.id, 'under_review')}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Mark as Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateApplicationStatus(application.id, 'shortlisted')}>
                                  <Star className="w-4 h-4 mr-2" />
                                  Shortlist
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => scheduleInterview(application.id)}>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Schedule Interview
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateApplicationStatus(application.id, 'hired')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Hired
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleReviewApplication(application.id)}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {applicationPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((applicationPagination.page - 1) * applicationPagination.per_page) + 1} to{' '}
                    {Math.min(applicationPagination.page * applicationPagination.per_page, applicationPagination.total)} of{' '}
                    {applicationPagination.total} applications
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={applicationPagination.page === 1}
                      onClick={() => handleApplicationPageChange(applicationPagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={applicationPagination.page === applicationPagination.pages}
                      onClick={() => handleApplicationPageChange(applicationPagination.page + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {applicationsError && (
                <div className="text-center p-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-600 mb-4">{applicationsError}</p>
                  <Button onClick={loadApplications} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Top Candidates & Talent Search
                  </CardTitle>
                  <CardDescription>Discover and connect with top talent for your positions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadTopCandidates}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export List
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Candidate Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Search Candidates</CardTitle>
                    <CardDescription>Find candidates based on skills and experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Search Terms</label>
                      <Input
                        placeholder="Search by skills, title, location..."
                        value={candidateFilters.search}
                        onChange={(e) => setCandidateFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Experience Level</label>
                        <Select 
                          value={candidateFilters.experience_level} 
                          onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, experience_level: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Level</SelectItem>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior Level</SelectItem>
                            <SelectItem value="lead">Lead/Principal</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Availability</label>
                        <Select 
                          value={candidateFilters.availability} 
                          onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, availability: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="open">Open to Opportunities</SelectItem>
                            <SelectItem value="passive">Passive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Skills (comma-separated)</label>
                      <Input
                        placeholder="React, JavaScript, Python..."
                        value={candidateFilters.skills}
                        onChange={(e) => setCandidateFilters(prev => ({ ...prev, skills: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <Input
                        placeholder="City, State, Country..."
                        value={candidateFilters.location}
                        onChange={(e) => setCandidateFilters(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <Button onClick={searchCandidates} className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Search Candidates
                    </Button>
                  </CardContent>
                </Card>

                {/* Applied Candidates Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filter Applied Candidates</CardTitle>
                    <CardDescription>Review candidates who applied to your jobs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Filter by Job</label>
                      <Select 
                        value={candidateFilters.job_id} 
                        onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, job_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Jobs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Jobs</SelectItem>
                          {jobs.slice(0, 10).map((job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                      <Select 
                        value={candidateFilters.min_rating} 
                        onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, min_rating: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Rating</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="2">2+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Application Status</label>
                      <Select 
                        value={candidateFilters.application_status} 
                        onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, application_status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Status</SelectItem>
                          <SelectItem value="submitted">Newly Applied</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={loadTopCandidates} className="w-full" variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter Applied Candidates
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Candidates Display */}
              <div className="space-y-6">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {candidateSearchMode === 'search' ? 'Search Results' : 'Top Candidates'}
                    {candidatesLoading ? (
                      <span className="ml-2 text-sm font-normal text-gray-500">Loading...</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({candidatePagination.total} candidates)
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant={candidateSearchMode === 'top' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => {
                        setCandidateSearchMode('top');
                        loadTopCandidates();
                      }}
                    >
                      Applied Candidates
                    </Button>
                    <Button 
                      variant={candidateSearchMode === 'search' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setCandidateSearchMode('search')}
                    >
                      Talent Pool
                    </Button>
                  </div>
                </div>

                {/* Candidates Grid */}
                {candidatesLoading ? (
                  <div className="text-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading candidates...</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center p-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {candidateSearchMode === 'search' ? 'No candidates found' : 'No candidates yet'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {candidateSearchMode === 'search' 
                        ? 'Try adjusting your search criteria' 
                        : 'Candidates will appear here when they apply to your jobs'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                      <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={candidate.profile_picture} alt={candidate.name} />
                              <AvatarFallback>
                                {candidate.name?.split(' ').map(n => n[0]).join('') || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold truncate">{candidate.name}</h4>
                                {candidate.match_score && (
                                  <Badge className="bg-green-100 text-green-800 shrink-0">
                                    {candidate.match_score}% match
                                  </Badge>
                                )}
                                {candidate.rating && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium">{candidate.rating}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2 truncate">
                                {candidate.profile?.title || candidate.title || 'No title specified'}
                              </p>
                              
                              {candidate.profile?.location && (
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {candidate.profile.location}
                                </p>
                              )}

                              {/* Experience Level */}
                              {candidate.profile?.experience_level && (
                                <p className="text-xs text-gray-500 mb-2 capitalize">
                                  {candidate.profile.experience_level} level
                                  {candidate.profile?.years_experience && (
                                    <span> • {candidate.profile.years_experience} years</span>
                                  )}
                                </p>
                              )}

                              {/* Skills */}
                              {candidate.profile?.skills && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-1">
                                    {candidate.profile.skills.slice(0, 3).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {candidate.profile.skills.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{candidate.profile.skills.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Availability */}
                              {candidate.availability_status && (
                                <div className="mb-3">
                                  <Badge 
                                    variant={candidate.availability_status === 'available' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    <Activity className="w-3 h-3 mr-1" />
                                    {candidate.availability_status === 'available' ? 'Available' : 
                                     candidate.availability_status === 'open' ? 'Open to offers' : 'Passive'}
                                  </Badge>
                                </div>
                              )}

                              {/* Job and Application Info (for applied candidates) */}
                              {candidate.job_title && (
                                <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                                  <p className="font-medium">Applied for: {candidate.job_title}</p>
                                  <p className="text-gray-600">
                                    Status: <span className="capitalize">{candidate.status?.replace('_', ' ')}</span>
                                  </p>
                                  {candidate.applied_at && (
                                    <p className="text-gray-600">
                                      Applied: {formatDate(candidate.applied_at)}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Profile
                                </Button>
                                <Button size="sm" className="flex-1">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Contact
                                </Button>
                              </div>

                              {/* Additional actions for applied candidates */}
                              {candidate.application_id && (
                                <div className="flex gap-2 mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateApplicationStatus(candidate.application_id, 'shortlisted')}
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    Shortlist
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => scheduleInterview(candidate.application_id)}
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Interview
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {candidatePagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {((candidatePagination.page - 1) * candidatePagination.per_page) + 1} to{' '}
                      {Math.min(candidatePagination.page * candidatePagination.per_page, candidatePagination.total)} of{' '}
                      {candidatePagination.total} candidates
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={candidatePagination.page === 1}
                        onClick={() => handleCandidatePageChange(candidatePagination.page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={candidatePagination.page === candidatePagination.pages}
                        onClick={() => handleCandidatePageChange(candidatePagination.page + 1)}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {candidatesError && (
                  <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 mb-4">{candidatesError}</p>
                    <Button onClick={() => candidateSearchMode === 'search' ? searchCandidates() : loadTopCandidates()} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Analytics & Insights</h2>
              <p className="text-gray-600">Track your hiring performance and get actionable insights</p>
            </div>
            <div className="flex gap-2">
              <Select value={analyticsDateRange} onValueChange={setAnalyticsDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportAnalytics}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-blue-600">{analyticsData.totalApplications}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analyticsData.applicationGrowth > 0 ? '+' : ''}{analyticsData.applicationGrowth}% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-green-600">{analyticsData.activeJobs}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analyticsData.jobGrowth > 0 ? '+' : ''}{analyticsData.jobGrowth}% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful Hires</p>
                    <p className="text-3xl font-bold text-purple-600">{analyticsData.successfulHires}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analyticsData.hireGrowth > 0 ? '+' : ''}{analyticsData.hireGrowth}% vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
                    <p className="text-3xl font-bold text-orange-600">{analyticsData.avgTimeToHire}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analyticsData.timeToHireChange > 0 ? '+' : ''}{analyticsData.timeToHireChange} days vs last period
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Application Trends
                </CardTitle>
                <CardDescription>Applications received over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  {/* Placeholder for chart - you can integrate with recharts or any chart library */}
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Application trends chart would be displayed here</p>
                    <p className="text-sm text-gray-400">Integration with chart library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hiring Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Hiring Funnel
                </CardTitle>
                <CardDescription>Application to hire conversion rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Applications Received</span>
                    <span className="text-sm font-bold">{analyticsData.funnelData.applications}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Under Review</span>
                    <span className="text-sm font-bold">
                      {analyticsData.funnelData.underReview} 
                      ({Math.round((analyticsData.funnelData.underReview / analyticsData.funnelData.applications) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(analyticsData.funnelData.underReview / analyticsData.funnelData.applications) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interviewed</span>
                    <span className="text-sm font-bold">
                      {analyticsData.funnelData.interviewed} 
                      ({Math.round((analyticsData.funnelData.interviewed / analyticsData.funnelData.applications) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(analyticsData.funnelData.interviewed / analyticsData.funnelData.applications) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hired</span>
                    <span className="text-sm font-bold">
                      {analyticsData.funnelData.hired} 
                      ({Math.round((analyticsData.funnelData.hired / analyticsData.funnelData.applications) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(analyticsData.funnelData.hired / analyticsData.funnelData.applications) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Jobs
                </CardTitle>
                <CardDescription>Jobs with highest engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-gray-500">{job.applications} applications</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{job.conversionRate}%</p>
                        <p className="text-xs text-gray-500">conversion</p>
                      </div>
                    </div>
                  ))}
                  {analyticsData.topJobs.length === 0 && (
                    <div className="text-center py-8">
                      <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No performance data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Application Sources
                </CardTitle>
                <CardDescription>Where candidates find your jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index] || 'gray'}-500`}></div>
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{source.count}</span>
                        <span className="text-xs text-gray-500 ml-1">({source.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                  {analyticsData.sources.length === 0 && (
                    <div className="text-center py-8">
                      <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No source data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insights & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>Personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-2">
                        {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                        {insight.type === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5" />}
                        <div>
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                          {insight.action && (
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                              {insight.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {analyticsData.insights.length === 0 && (
                    <div className="text-center py-8">
                      <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Insights will appear as you gather more data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Job Performance Details</CardTitle>
                <CardDescription>Detailed metrics for all your jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Job Title</th>
                        <th className="text-left p-2">Views</th>
                        <th className="text-left p-2">Applications</th>
                        <th className="text-left p-2">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.jobDetails.map((job) => (
                        <tr key={job.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{job.title}</td>
                          <td className="p-2">{job.views}</td>
                          <td className="p-2">{job.applications}</td>
                          <td className="p-2">
                            <span className={`font-medium ${job.conversion > 5 ? 'text-green-600' : job.conversion > 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {job.conversion}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analyticsData.jobDetails.length === 0 && (
                    <div className="text-center py-8">
                      <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No job performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time-based Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Time-based Metrics</CardTitle>
                <CardDescription>Average times for hiring stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Time to First Review</span>
                    </div>
                    <span className="text-sm font-bold">{analyticsData.timeMetrics.firstReview} hours</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Time to Interview</span>
                    </div>
                    <span className="text-sm font-bold">{analyticsData.timeMetrics.interview} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Time to Hire</span>
                    </div>
                    <span className="text-sm font-bold">{analyticsData.timeMetrics.hire} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Response Time</span>
                    </div>
                    <span className="text-sm font-bold">{analyticsData.timeMetrics.response} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerDashboard;
