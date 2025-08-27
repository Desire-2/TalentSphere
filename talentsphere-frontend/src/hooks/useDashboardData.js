import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentJobs: [],
    recentApplications: [],
    alerts: []
  });
  
  const [loading, setLoading] = useState({
    dashboard: true,
    jobs: false,
    applications: false
  });
  
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      setError(null);
      
      const statsData = await apiService.getEmployerDashboardStats();
      
      setDashboardData(prev => ({
        ...prev,
        stats: {
          activeJobs: statsData.active_jobs || 0,
          totalJobs: statsData.total_jobs || 0,
          draftJobs: statsData.draft_jobs || 0,
          pausedJobs: statsData.paused_jobs || 0,
          newApplications: statsData.new_applications || 0,
          totalApplications: statsData.total_applications || 0,
          shortlistedApplications: statsData.shortlisted_applications || 0,
          interviewsScheduled: statsData.interviews_scheduled || 0,
          hiresMade: statsData.hires_made || 0,
          profileViews: statsData.profile_views || 0,
          avgTimeToHire: statsData.avg_time_to_hire || 0,
          pendingReviews: statsData.new_applications || 0, // Using new_applications as pending reviews
          totalViews: 0 // Will be calculated from job performance data
        },
        jobPerformance: statsData.job_performance || [],
        applicationTrends: statsData.application_trends || []
      }));
      
      setLastFetch(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  // Fetch recent jobs
  const fetchRecentJobs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
      
      const jobsData = await apiService.get('/my-jobs?page=1&per_page=5&sort_by=created_at&sort_order=desc');
      
      // Calculate total views from jobs
      const totalViews = jobsData.jobs?.reduce((sum, job) => sum + (job.view_count || 0), 0) || 0;
      
      setDashboardData(prev => ({
        ...prev,
        recentJobs: jobsData.jobs || [],
        stats: {
          ...prev.stats,
          totalViews
        }
      }));
    } catch (err) {
      console.error('Failed to fetch recent jobs:', err);
      // Don't set error for non-critical data
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, []);

  // Fetch recent applications
  const fetchRecentApplications = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      
      const applicationsData = await apiService.getEmployerApplications({
        page: 1,
        per_page: 5,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      
      setDashboardData(prev => ({
        ...prev,
        recentApplications: applicationsData.applications || []
      }));
    } catch (err) {
      console.error('Failed to fetch recent applications:', err);
      // Don't set error for non-critical data
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  }, []);

  // Generate alerts based on data
  const generateAlerts = useCallback((data) => {
    const alerts = [];
    
    // Alert for high number of pending applications
    if (data.stats?.newApplications > 10) {
      alerts.push({
        type: 'warning',
        title: 'High Application Volume',
        message: `You have ${data.stats.newApplications} new applications waiting for review.`
      });
    }
    
    // Alert for jobs with no applications
    const jobsWithoutApps = data.recentJobs?.filter(job => 
      job.status === 'published' && (job.application_count || 0) === 0
    );
    
    if (jobsWithoutApps?.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Jobs Need Attention',
        message: `${jobsWithoutApps.length} published jobs haven't received applications yet.`
      });
    }
    
    // Alert for expiring jobs
    const expiringJobs = data.recentJobs?.filter(job => {
      if (!job.expires_at) return false;
      const expiryDate = new Date(job.expires_at);
      const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });
    
    if (expiringJobs?.length > 0) {
      alerts.push({
        type: 'urgent',
        title: 'Jobs Expiring Soon',
        message: `${expiringJobs.length} jobs will expire within 7 days.`
      });
    }
    
    return alerts;
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentJobs(), 
        fetchRecentApplications()
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [fetchDashboardStats, fetchRecentJobs, fetchRecentApplications]);

  // Update alerts when data changes
  useEffect(() => {
    const alerts = generateAlerts(dashboardData);
    setDashboardData(prev => ({ ...prev, alerts }));
  }, [dashboardData.stats, dashboardData.recentJobs, generateAlerts]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading.dashboard) {
        fetchDashboardStats();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardStats, loading.dashboard]);

  // Refresh functions
  const refreshStats = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const refreshJobs = useCallback(() => {
    fetchRecentJobs();
  }, [fetchRecentJobs]);

  const refreshApplications = useCallback(() => {
    fetchRecentApplications();
  }, [fetchRecentApplications]);

  const refreshAll = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    lastFetch,
    refreshStats,
    refreshJobs,
    refreshApplications,
    refreshAll
  };
};

export default useDashboardData;
