import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../useAuth.jsx';
import apiService from '../../services/api';

export const useEmployerDashboard = () => {
  const { user } = useAuth();
  
  // Main dashboard state
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      newApplications: 0,
      totalViews: 0,
      totalApplications: 0,
      pendingReviews: 0,
      scheduledInterviews: 0,
      recentActivity: 0
    },
    recentJobs: [],
    recentApplications: [],
    topPerformingJobs: [],
    alerts: [],
    insights: []
  });

  // Loading and error states
  const [loading, setLoading] = useState({
    dashboard: false,
    jobs: false,
    applications: false,
    candidates: false,
    analytics: false
  });

  const [errors, setErrors] = useState({
    dashboard: null,
    jobs: null,
    applications: null,
    candidates: null,
    analytics: null
  });

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [jobFilters, setJobFilters] = useState({
    search: '',
    status: 'all',
    employment_type: 'all',
    date_range: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [jobPagination, setJobPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  });

  // Applications state
  const [applications, setApplications] = useState([]);
  const [applicationFilters, setApplicationFilters] = useState({
    search: '',
    status: 'all',
    job_id: 'all',
    date_range: 'all'
  });
  const [applicationPagination, setApplicationPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  });

  // Candidates state
  const [candidates, setCandidates] = useState([]);
  const [candidateFilters, setCandidateFilters] = useState({
    search: '',
    experience_level: 'any',
    availability: 'any',
    skills: '',
    location: '',
    job_id: 'all',
    min_rating: 'any',
    application_status: 'any'
  });
  const [candidatePagination, setCandidatePagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0
  });
  const [candidateSearchMode, setCandidateSearchMode] = useState('top');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    totalApplications: 0,
    applicationGrowth: 0,
    activeJobs: 0,
    jobGrowth: 0,
    successfulHires: 0,
    hireGrowth: 0,
    avgTimeToHire: '0 days',
    timeToHireChange: 0,
    funnelData: {
      applications: 0,
      underReview: 0,
      interviewed: 0,
      hired: 0
    },
    topJobs: [],
    sources: [],
    insights: [],
    jobDetails: [],
    timeMetrics: {
      firstReview: '24',
      interview: '7',
      hire: '14',
      response: '2'
    }
  });
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    setErrors(prev => ({ ...prev, dashboard: null }));
    
    try {
      // Use the actual backend endpoint for dashboard stats
      const [statsResponse, recentJobsResponse, recentApplicationsResponse] = await Promise.all([
        apiService.getEmployerDashboardStats(),
        apiService.getJobs({ status: 'published', per_page: 5, sort_by: 'created_at', sort_order: 'desc' }),
        apiService.getEmployerApplications({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' })
      ]);

      // Transform the backend data to match our dashboard structure
      const transformedData = {
        stats: {
          totalJobs: statsResponse.total_jobs || 0,
          activeJobs: statsResponse.active_jobs || 0,
          newApplications: statsResponse.new_applications || 0,
          totalViews: statsResponse.profile_views || 0,
          totalApplications: statsResponse.total_applications || 0,
          pendingReviews: statsResponse.new_applications || 0,
          scheduledInterviews: statsResponse.interviews_scheduled || 0,
          recentActivity: statsResponse.new_applications || 0
        },
        recentJobs: recentJobsResponse.jobs || [],
        recentApplications: recentApplicationsResponse.applications || [],
        topPerformingJobs: statsResponse.job_performance || [],
        alerts: generateAlerts(statsResponse),
        insights: generateInsights(statsResponse)
      };

      setDashboardData(transformedData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setErrors(prev => ({ ...prev, dashboard: 'Failed to load dashboard data' }));
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [user?.id]);

  // Helper function to generate alerts based on stats
  const generateAlerts = (stats) => {
    const alerts = [];
    
    if (stats.new_applications > 10) {
      alerts.push({
        type: 'info',
        title: 'High Application Volume',
        message: `You have ${stats.new_applications} new applications waiting for review.`
      });
    }
    
    if (stats.active_jobs === 0) {
      alerts.push({
        type: 'warning',
        title: 'No Active Jobs',
        message: 'Consider posting new jobs to attract candidates.'
      });
    }
    
    if (stats.avg_time_to_hire > 30) {
      alerts.push({
        type: 'warning',
        title: 'Long Hiring Process',
        message: `Your average time to hire is ${stats.avg_time_to_hire} days. Consider streamlining your process.`
      });
    }
    
    return alerts;
  };

  // Helper function to generate insights based on stats
  const generateInsights = (stats) => {
    const insights = [];
    
    if (stats.job_performance && stats.job_performance.length > 0) {
      const bestPerforming = stats.job_performance
        .sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
      
      if (bestPerforming.conversion_rate > 5) {
        insights.push({
          type: 'success',
          title: 'High-Performing Job',
          description: `"${bestPerforming.job_title}" has a ${bestPerforming.conversion_rate}% conversion rate.`,
          action: 'View Details'
        });
      }
    }
    
    return insights;
  };

  // Load jobs
  const loadJobs = useCallback(async (filters = jobFilters, pagination = jobPagination) => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, jobs: true }));
    setErrors(prev => ({ ...prev, jobs: null }));
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      };
      
      // Use the jobs API endpoint which should work for employers
      const response = await apiService.getJobs(params);
      
      setJobs(response.jobs || []);
      setJobPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setErrors(prev => ({ ...prev, jobs: 'Failed to load jobs' }));
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, [user?.id, jobFilters, jobPagination]);

  // Load applications
  const loadApplications = useCallback(async (filters = applicationFilters, pagination = applicationPagination) => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, applications: true }));
    setErrors(prev => ({ ...prev, applications: null }));
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      };
      
      // Use the employer applications endpoint
      const response = await apiService.getEmployerApplications(params);
      
      setApplications(response.applications || []);
      setApplicationPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error loading applications:', error);
      setErrors(prev => ({ ...prev, applications: 'Failed to load applications' }));
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  }, [user?.id, applicationFilters, applicationPagination]);

  // Load candidates
  const loadCandidates = useCallback(async (mode = candidateSearchMode, filters = candidateFilters) => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, candidates: true }));
    setErrors(prev => ({ ...prev, candidates: null }));
    
    try {
      const params = {
        ...filters,
        page: candidatePagination.page,
        per_page: candidatePagination.per_page
      };
      
      let response;
      if (mode === 'search') {
        response = await apiService.searchCandidates(params);
      } else {
        response = await apiService.getTopCandidates(params);
      }
      
      setCandidates(response.candidates || []);
      setCandidatePagination(response.pagination || candidatePagination);
    } catch (error) {
      console.error('Error loading candidates:', error);
      setErrors(prev => ({ ...prev, candidates: 'Failed to load candidates' }));
    } finally {
      setLoading(prev => ({ ...prev, candidates: false }));
    }
  }, [user?.id, candidateSearchMode, candidateFilters, candidatePagination]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, analytics: true }));
    setErrors(prev => ({ ...prev, analytics: null }));
    
    try {
      // Use the dashboard stats endpoint which includes analytics data
      const response = await apiService.getEmployerDashboardStats();
      
      // Transform the stats data into analytics format
      const transformedAnalytics = {
        totalApplications: response.total_applications || 0,
        applicationGrowth: calculateGrowth(response.application_trends),
        activeJobs: response.active_jobs || 0,
        jobGrowth: 0, // Would need historical data for this
        successfulHires: response.hires_made || 0,
        hireGrowth: 0, // Would need historical data for this
        avgTimeToHire: `${response.avg_time_to_hire || 0} days`,
        timeToHireChange: 0, // Would need historical data for this
        funnelData: {
          applications: response.total_applications || 0,
          underReview: response.shortlisted_applications || 0,
          interviewed: response.interviews_scheduled || 0,
          hired: response.hires_made || 0
        },
        topJobs: response.job_performance || [],
        sources: [], // Not available in current backend
        insights: [],
        jobDetails: response.job_performance || [],
        timeMetrics: {
          firstReview: '24',
          interview: '7',
          hire: Math.floor(response.avg_time_to_hire || 14).toString(),
          response: '2'
        }
      };
      
      setAnalyticsData(transformedAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setErrors(prev => ({ ...prev, analytics: 'Failed to load analytics' }));
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [user?.id, analyticsDateRange]);

  // Helper function to calculate growth from trends data
  const calculateGrowth = (trends) => {
    if (!trends || trends.length < 2) return 0;
    
    const recent = trends.slice(-7).reduce((sum, day) => sum + day.applications, 0);
    const previous = trends.slice(-14, -7).reduce((sum, day) => sum + day.applications, 0);
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  };

  // Filter handlers
  const handleJobFilterChange = useCallback((key, value) => {
    setJobFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplicationFilterChange = useCallback((key, value) => {
    setApplicationFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Pagination handlers
  const handleJobPageChange = useCallback((page) => {
    setJobPagination(prev => ({ ...prev, page }));
  }, []);

  const handleApplicationPageChange = useCallback((page) => {
    setApplicationPagination(prev => ({ ...prev, page }));
  }, []);

  const handleCandidatePageChange = useCallback((page) => {
    setCandidatePagination(prev => ({ ...prev, page }));
  }, []);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      loadJobs();
      loadApplications();
      loadCandidates();
      loadAnalytics();
    }
  }, [user?.id]);

  // Reload when filters change
  useEffect(() => {
    if (user?.id) {
      loadJobs(jobFilters, { ...jobPagination, page: 1 });
    }
  }, [jobFilters]);

  useEffect(() => {
    if (user?.id) {
      loadApplications(applicationFilters, { ...applicationPagination, page: 1 });
    }
  }, [applicationFilters]);

  useEffect(() => {
    if (user?.id) {
      loadCandidates(candidateSearchMode, candidateFilters);
    }
  }, [candidateFilters, candidateSearchMode]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [analyticsDateRange]);

  return {
    // Data
    dashboardData,
    jobs,
    applications,
    candidates,
    analyticsData,
    
    // States
    loading,
    errors,
    selectedJobs,
    jobFilters,
    applicationFilters,
    candidateFilters,
    candidateSearchMode,
    analyticsDateRange,
    
    // Pagination
    jobPagination,
    applicationPagination,
    candidatePagination,
    
    // Actions
    setSelectedJobs,
    setCandidateSearchMode,
    setAnalyticsDateRange,
    setCandidateFilters,
    
    // Handlers
    handleJobFilterChange,
    handleApplicationFilterChange,
    handleJobPageChange,
    handleApplicationPageChange,
    handleCandidatePageChange,
    
    // Load functions
    loadDashboardData,
    loadJobs,
    loadApplications,
    loadCandidates,
    loadAnalytics
  };
};
