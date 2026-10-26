import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

export const useEmployerDashboard = () => {
  const { user } = useAuthStore();
  
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
    applicationTrends: [],
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
    totalJobs: 0,
    successfulHires: 0,
    hireRate: 0,
    avgTimeToHire: '0 days',
    applicationTrends: [],
    funnelData: {
      applications: 0,
      underReview: 0,
      interviewed: 0,
      hired: 0
    },
    topJobs: [],
    insights: [],
    jobDetails: []
  });
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
          shortlistedApplications: statsResponse.shortlisted_applications || 0,
          totalViews: statsResponse.total_job_views || 0,
          totalApplications: statsResponse.total_applications || 0,
          pendingReviews: statsResponse.new_applications || 0,
          hiresMade: statsResponse.hires_made || 0,
          scheduledInterviews: statsResponse.interviews_scheduled || 0,
          recentActivity: statsResponse.new_applications || 0
        },
        recentJobs: recentJobsResponse.jobs || [],
        recentApplications: recentApplicationsResponse.applications || [],
        topPerformingJobs: statsResponse.job_performance || [],
        applicationTrends: statsResponse.application_trends || [],
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
          description: `"${bestPerforming.job_title}" has a ${bestPerforming.conversion_rate}% conversion rate.`
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
  const loadCandidates = useCallback(async (
    mode = candidateSearchMode,
    filters = candidateFilters,
    pagination = candidatePagination
  ) => {
    if (!user?.id) return;
    
    setLoading(prev => ({ ...prev, candidates: true }));
    setErrors(prev => ({ ...prev, candidates: null }));
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      };
      
      let response;
      if (mode === 'search') {
        response = await apiService.searchCandidates(params);
      } else {
        response = await apiService.getTopCandidates(params);
      }
      
      setCandidates(response.candidates || []);
      setCandidatePagination(response.pagination || pagination);
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
      const totalApplications = response.total_applications || 0;
      const successfulHires = response.hires_made || 0;
      const jobPerformance = (response.job_performance || []).map((job) => ({
        id: job.job_id,
        title: job.job_title,
        views: job.views || 0,
        applications: job.applications || 0,
        conversion: job.conversion_rate || 0,
        conversionRate: job.conversion_rate || 0
      }));

      const transformedAnalytics = {
        totalApplications,
        applicationGrowth: calculateGrowth(response.application_trends),
        activeJobs: response.active_jobs || 0,
        totalJobs: response.total_jobs || 0,
        successfulHires,
        hireRate: totalApplications > 0
          ? Math.round((successfulHires / totalApplications) * 100)
          : 0,
        avgTimeToHire: `${response.avg_time_to_hire || 0} days`,
        funnelData: {
          applications: totalApplications,
          underReview: response.new_applications || 0,
          interviewed: response.interviews_scheduled || 0,
          hired: successfulHires
        },
        topJobs: jobPerformance,
        insights: generateInsights(response),
        jobDetails: jobPerformance,
        applicationTrends: response.application_trends || []
      };
      
      setAnalyticsData(transformedAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setErrors(prev => ({ ...prev, analytics: 'Failed to load analytics' }));
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [user?.id]);

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
    const nextPage = Math.max(1, page);
    setCandidatePagination(prev => ({ ...prev, page: nextPage }));
    loadCandidates(candidateSearchMode, candidateFilters, {
      ...candidatePagination,
      page: nextPage
    });
  }, [candidateSearchMode, candidateFilters, candidatePagination, loadCandidates]);

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
    
    // Pagination
    jobPagination,
    applicationPagination,
    candidatePagination,
    
    // Actions
    setSelectedJobs,
    setCandidateSearchMode,
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
