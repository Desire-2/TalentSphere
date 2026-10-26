import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useJobManagement = () => {
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    jobs: true,
    action: false
  });
  
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    employment_type: 'all',
    experience_level: 'all',
    location: '',
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

  // Job statistics
  const [jobStats, setJobStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    paused: 0,
    applications: 0,
    views: 0
  });

  // Fetch jobs from backend
  const fetchJobs = useCallback(async (params = {}) => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
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
      
      
      const response = await apiService.get(`/my-jobs?${new URLSearchParams(queryParams).toString()}`);
      
      // Transform jobs data to ensure all required fields are present
      const transformedJobs = response.jobs.map(job => ({
        ...job,
        // Ensure proper formatting
        location: job.city || job.state || job.country || (job.is_remote ? 'Remote' : 'Location not specified'),
        employment_type: job.employment_type || 'Not specified',
        // Calculate conversion rate
        conversion_rate: job.view_count > 0 ? ((job.application_count || 0) / job.view_count * 100) : 0,
        // Ensure status is properly set
        status: job.status || 'draft',
        // Add formatted dates
        formatted_date: formatDate(job.created_at),
        // Add salary formatting
        formatted_salary: formatSalary(job)
      }));
      
      setJobs(transformedJobs);
      setPagination(response.pagination || pagination);
      
      // Calculate job statistics
      const stats = {
        total: response.pagination?.total || transformedJobs.length,
        active: transformedJobs.filter(job => job.status === 'published').length,
        draft: transformedJobs.filter(job => job.status === 'draft').length,
        paused: transformedJobs.filter(job => job.status === 'paused').length,
        applications: transformedJobs.reduce((sum, job) => sum + (job.application_count || 0), 0),
        views: transformedJobs.reduce((sum, job) => sum + (job.view_count || 0), 0)
      };
      setJobStats(stats);
      
      setLastFetch(new Date());
      
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, [filters, pagination.page, pagination.per_page]);

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  };

  const formatSalary = (job) => {
    if (!job) return 'Not specified';
    
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    
    if (job.salary_min) {
      return `From $${job.salary_min.toLocaleString()}`;
    }
    
    if (job.salary_max) {
      return `Up to $${job.salary_max.toLocaleString()}`;
    }
    
    return 'Salary not specified';
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

  // Job actions
  const handleDuplicateJob = useCallback(async (jobId) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      
      // Create a copy of the job without ID and with modified title
      const duplicatedJob = {
        ...job,
        title: `${job.title} (Copy)`,
        status: 'draft',
        view_count: 0,
        application_count: 0
      };
      
      // Remove fields that shouldn't be duplicated
      delete duplicatedJob.id;
      delete duplicatedJob.created_at;
      delete duplicatedJob.updated_at;
      delete duplicatedJob.published_at;
      
      await apiService.createJob(duplicatedJob);
      
      // Refresh jobs list
      fetchJobs();
      
      
    } catch (err) {
      console.error('Failed to duplicate job:', err);
      setError(`Failed to duplicate job: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [jobs, fetchJobs]);

  const handleToggleJobStatus = useCallback(async (jobId) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      
      const newStatus = job.status === 'published' ? 'paused' : 'published';
      
      await apiService.updateJob(jobId, { status: newStatus });
      
      // Update local state
      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: newStatus, updated_at: new Date().toISOString() } : j
      ));
      
      
    } catch (err) {
      console.error('Failed to toggle job status:', err);
      setError(`Failed to update job status: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [jobs]);

  const handleDeleteJob = useCallback(async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiService.deleteJob(jobId);
      
      // Remove from local state
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
      
      
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError(`Failed to delete job: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, []);

  const handleBulkActions = useCallback(async (action) => {
    if (selectedJobs.length === 0) {
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      await apiService.bulkJobAction({
        job_ids: selectedJobs,
        action
      });
      
      // Update local state based on action
      const statusMap = {
        publish: 'published',
        pause: 'paused',
        archive: 'archived',
        delete: 'deleted'
      };
      
      const newStatus = statusMap[action];
      if (newStatus) {
        if (action === 'delete') {
          setJobs(prev => prev.filter(job => !selectedJobs.includes(job.id)));
        } else {
          setJobs(prev => prev.map(job => 
            selectedJobs.includes(job.id) 
              ? { ...job, status: newStatus, updated_at: new Date().toISOString() }
              : job
          ));
        }
      }
      
      // Clear selections
      setSelectedJobs([]);
      
      
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      setError(`Failed to perform bulk action: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [selectedJobs]);

  const handleExportJobs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Fetch all jobs without pagination for export
      const response = await apiService.get(`/my-jobs?${new URLSearchParams({
        ...filters,
        per_page: 1000 // Large number to get all
      }).toString()}`);
      
      const exportData = response.jobs.map(job => ({
        'Job Title': job.title,
        'Status': job.status,
        'Employment Type': job.employment_type,
        'Location': job.city || job.state || job.country || (job.is_remote ? 'Remote' : 'N/A'),
        'Salary Min': job.salary_min || 'N/A',
        'Salary Max': job.salary_max || 'N/A',
        'Views': job.view_count || 0,
        'Applications': job.application_count || 0,
        'Created Date': new Date(job.created_at).toLocaleDateString(),
        'Is Featured': job.is_featured ? 'Yes' : 'No',
        'Is Remote': job.is_remote ? 'Yes' : 'No'
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
      link.download = `jobs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Failed to export jobs:', err);
      setError(`Failed to export jobs: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [filters]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Initial data load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page, pagination.per_page]);

  // Auto-refresh every 2 minutes for job statistics
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading.jobs && !loading.action) {
        fetchJobs();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchJobs, loading.jobs, loading.action]);

  return {
    // Data
    jobs,
    selectedJobs,
    jobStats,
    
    // States
    loading,
    error,
    lastFetch,
    filters,
    pagination,
    
    // Computed values
    selectedCount: selectedJobs.length,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handlePerPageChange,
    setSelectedJobs,
    
    // Job actions
    handleDuplicateJob,
    handleToggleJobStatus,
    handleDeleteJob,
    handleBulkActions,
    handleExportJobs,
    handleRefresh,
    
    // Utilities
    setError,
    clearSelection: () => setSelectedJobs([])
  };
};

export default useJobManagement;
