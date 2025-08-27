import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import employerService from '../services/employer';

export const useApplicationManagement = () => {
  // Applications state
  const [applications, setApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    applications: true,
    jobs: false,
    action: false
  });
  
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    job_id: 'all',
    date_range: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  // Fetch applications from backend
  const fetchApplications = useCallback(async (params = {}) => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      setError(null);
      
      const queryParams = {
        ...filters,
        ...params,
        page: pagination.page,
        per_page: pagination.per_page
      };
      
      // Remove 'all' values as they're not needed by the API
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all') {
          delete queryParams[key];
        }
      });
      
      console.log('Fetching applications with params:', queryParams);
      
      const response = await apiService.getEmployerApplications(queryParams);
      
      // Transform applications data
      const transformedApplications = response.applications.map(app => ({
        ...app,
        selected: selectedApplications.has(app.id),
        // Ensure applicant name is properly formatted
        applicant: {
          ...app.applicant,
          name: app.applicant?.name || 
                `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`.trim() ||
                'Anonymous'
        },
        // Calculate match score if not present (mock for now)
        match_score: app.match_score || calculateMockMatchScore(app),
        // Ensure proper status formatting
        status: app.status || 'submitted'
      }));
      
      setApplications(transformedApplications);
      setPagination(response.pagination);
      setLastFetch(new Date());
      
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  }, [filters, pagination.page, pagination.per_page, selectedApplications]);

  // Fetch jobs for filter dropdown
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
      
      const response = await apiService.get('/my-jobs?status=published&per_page=50');
      setJobs(response.jobs || []);
      
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      // Don't set error for non-critical data
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, []);

  // Calculate mock match score based on application data
  const calculateMockMatchScore = (application) => {
    let score = 50; // Base score
    
    // Add score based on cover letter
    if (application.cover_letter && application.cover_letter.length > 100) {
      score += 20;
    }
    
    // Add score based on resume
    if (application.resume_url) {
      score += 15;
    }
    
    // Add score based on profile completeness
    if (application.applicant_profile) {
      const profile = application.applicant_profile;
      if (profile.title) score += 5;
      if (profile.skills) score += 5;
      if (profile.years_experience > 0) score += 5;
    }
    
    // Add some randomness to make it more realistic
    score += Math.floor(Math.random() * 20) - 10;
    
    return Math.min(Math.max(score, 0), 100);
  };

  // Filter change handler
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handlePerPageChange = useCallback((perPage) => {
    setPagination(prev => ({ ...prev, per_page: perPage, page: 1 }));
  }, []);

  // Selection handlers
  const handleSelectApplication = useCallback((applicationId, selected) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(applicationId);
      } else {
        newSet.delete(applicationId);
      }
      return newSet;
    });
    
    // Update applications with selection state
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, selected } : app
    ));
  }, []);

  const handleSelectAll = useCallback((selected) => {
    const newSet = selected ? new Set(applications.map(app => app.id)) : new Set();
    setSelectedApplications(newSet);
    
    setApplications(prev => prev.map(app => ({ ...app, selected })));
  }, [applications]);

  // Action handlers
  const handleUpdateApplicationStatus = useCallback(async (applicationId, status) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiService.updateApplicationStatus(applicationId, { status });
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status, updated_at: new Date().toISOString() }
          : app
      ));
      
      // Show success message (you might want to add a toast notification)
      console.log(`Application ${applicationId} status updated to ${status}`);
      
    } catch (err) {
      console.error('Failed to update application status:', err);
      setError(`Failed to update application status: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, []);

  const handleBulkAction = useCallback(async (action) => {
    const selectedIds = Array.from(selectedApplications);
    
    if (selectedIds.length === 0) {
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiService.bulkApplicationAction({
        application_ids: selectedIds,
        action
      });
      
      // Update local state based on action
      const statusMap = {
        shortlist: 'shortlisted',
        mark_reviewed: 'under_review',
        reject: 'rejected'
      };
      
      const newStatus = statusMap[action];
      if (newStatus) {
        setApplications(prev => prev.map(app => 
          selectedIds.includes(app.id) 
            ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
            : app
        ));
      }
      
      // Clear selections
      setSelectedApplications(new Set());
      setApplications(prev => prev.map(app => ({ ...app, selected: false })));
      
      console.log(`Bulk action ${action} completed for ${selectedIds.length} applications`);
      
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      setError(`Failed to perform bulk action: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [selectedApplications]);

  const handleScheduleInterview = useCallback(async (applicationId, interviewData) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiService.scheduleInterview(applicationId, interviewData);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              interview_scheduled: true,
              interview_datetime: interviewData.interview_datetime,
              updated_at: new Date().toISOString()
            }
          : app
      ));
      
      console.log(`Interview scheduled for application ${applicationId}`);
      
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      setError(`Failed to schedule interview: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, []);

  // Export applications
  const handleExport = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Fetch all applications without pagination for export
      const response = await apiService.getEmployerApplications({
        ...filters,
        per_page: 1000 // Large number to get all
      });
      
      const exportData = response.applications.map(app => ({
        'Applicant Name': app.applicant?.name || 'Anonymous',
        'Email': app.applicant?.email || 'N/A',
        'Job Title': app.job?.title || 'N/A',
        'Status': app.status,
        'Applied Date': new Date(app.created_at).toLocaleDateString(),
        'Match Score': app.match_score || 'N/A',
        'Resume': app.resume_url ? 'Yes' : 'No',
        'Cover Letter': app.cover_letter ? 'Yes' : 'No'
      }));
      
      // Simple CSV export
      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Failed to export applications:', err);
      setError(`Failed to export applications: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [filters]);

  // Send message to applicant
  const handleSendMessage = useCallback(async (applicationId) => {
    // This would typically open a modal or navigate to messaging
    console.log('Send message to application:', applicationId);
    // For now, just log - implement messaging modal later
  }, []);

  // Review application details
  const handleReviewApplication = useCallback((applicationId) => {
    // This would typically navigate to application details page
    console.log('Review application:', applicationId);
    // For now, just log - implement navigation later
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchApplications();
    fetchJobs();
  }, [fetchApplications, fetchJobs]);

  // Initial data load
  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchApplications();
  }, [filters, pagination.page, pagination.per_page]);

  // Auto-refresh every 30 seconds for new applications
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading.applications && !loading.action) {
        fetchApplications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchApplications, loading.applications, loading.action]);

  return {
    // Data
    applications,
    jobs,
    selectedApplications,
    
    // States
    loading,
    error,
    lastFetch,
    filters,
    pagination,
    
    // Computed values
    selectedCount: selectedApplications.size,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handlePerPageChange,
    handleSelectApplication,
    handleSelectAll,
    handleUpdateApplicationStatus,
    handleBulkAction,
    handleScheduleInterview,
    handleExport,
    handleSendMessage,
    handleReviewApplication,
    handleRefresh,
    
    // Actions
    setError,
    clearSelection: () => {
      setSelectedApplications(new Set());
      setApplications(prev => prev.map(app => ({ ...app, selected: false })));
    }
  };
};

export default useApplicationManagement;
