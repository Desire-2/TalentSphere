import api from './api';

export const externalAdminService = {
  // Get all external jobs
  getExternalJobs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const response = await api.get(`/external-jobs${queryString ? `?${queryString}` : ''}`);
    return response;
  },

  // Get external job by ID
  getExternalJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response;
  },

  // Create external job
  createExternalJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response;
  },

  // Update external job
  updateExternalJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response;
  },

  // Delete external job
  deleteExternalJob: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response;
  },

  // Bulk import external jobs
  bulkImportJobs: async (jobsData) => {
    const response = await api.post('/external-jobs/bulk-import', { jobs: jobsData });
    return response;
  },

  // Get external job statistics
  getExternalJobStats: async () => {
    const response = await api.get('/external-jobs/stats');
    return response;
  },

  // Update job status (publish, unpublish, archive)
  updateJobStatus: async (id, status) => {
    // Use the standard update endpoint - status updates are handled via PUT
    const response = await api.put(`/jobs/${id}`, { status });
    return response;
  },

  // Get applications for external job
  getJobApplications: async (jobId, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const response = await api.get(`/jobs/${jobId}/applications${queryString ? `?${queryString}` : ''}`);
    return response;
  },

  // Get job categories for form dropdowns
  getJobCategories: async () => {
    const response = await api.get('/job-categories');
    // Handle the response structure - API returns {categories: [...]}
    return response.categories || response || [];
  },

  // Search external jobs
  searchExternalJobs: async (searchParams) => {
    // Convert search parameters to query params and use the regular getExternalJobs method
    return await externalAdminService.getExternalJobs(searchParams);
  },

  // Export external jobs data (use the bulk export feature if available, or return jobs data)
  exportExternalJobs: async (format = 'csv', filters = {}) => {
    // Since there's no specific export endpoint, get the jobs data and let the frontend handle export
    const jobs = await externalAdminService.getExternalJobs(filters);
    return jobs;
  },

  // Bulk operations
  bulkDeleteJobs: async (jobIds) => {
    const response = await api.post('/jobs/bulk-action', {
      job_ids: jobIds,
      action: 'delete'
    });
    return response;
  },

  bulkUpdateJobStatus: async (jobIds, status) => {
    // Map frontend status to backend action
    let action;
    switch(status) {
      case 'published':
        action = 'publish';
        break;
      case 'paused':
        action = 'pause';
        break;
      case 'archived':
        action = 'archive';
        break;
      default:
        action = status;
    }
    
    const response = await api.post('/jobs/bulk-action', {
      job_ids: jobIds,
      action: action
    });
    return response;
  },

  // Profile and settings management
  getProfile: async () => {
    const response = await api.get('/profile');
    return response;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response;
  },

  // Settings management - most endpoints don't exist, so we'll use basic user endpoints
  getSettings: async () => {
    // Use profile endpoint for basic settings
    const response = await api.get('/profile');
    return response;
  },

  updateSettings: async (settings) => {
    // Use profile update endpoint
    const response = await api.put('/profile', settings);
    return response;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/change-password', passwordData);
    return response;
  },

  // API Key management - not implemented in backend yet
  generateApiKey: async () => {
    throw new Error('API key management not implemented yet');
  },

  revokeApiKey: async () => {
    throw new Error('API key management not implemented yet');
  },

  // Export user data - use basic profile export
  exportUserData: async () => {
    const response = await api.get('/profile');
    return response;
  },

  deleteAccount: async () => {
    throw new Error('Account deletion not implemented yet');
  },

  // Templates management - not implemented in backend yet
  getJobTemplates: async () => {
    // Return empty array for now since templates aren't implemented
    return [];
  },

  createJobTemplate: async (templateData) => {
    throw new Error('Job templates not implemented yet');
  },

  updateJobTemplate: async (id, templateData) => {
    throw new Error('Job templates not implemented yet');
  },

  deleteJobTemplate: async (id) => {
    throw new Error('Job templates not implemented yet');
  },

  duplicateJobTemplate: async (id) => {
    throw new Error('Job templates not implemented yet');
  },

  // Analytics data - use the external job stats endpoint
  getJobAnalytics: async (filters = {}) => {
    const response = await api.get('/external-jobs/stats');
    return response;
  },

  // Get external job analytics (alias for components that use this name)
  getExternalJobAnalytics: async (filters = {}) => {
    return await externalAdminService.getJobAnalytics(filters);
  },

  // Export analytics report - use stats data
  exportAnalyticsReport: async (filters = {}) => {
    const stats = await externalAdminService.getJobAnalytics(filters);
    return stats;
  },

  // Template management - additional methods (not implemented)
  exportJobTemplates: async () => {
    throw new Error('Job template export not implemented yet');
  },

  importJobTemplates: async (templatesData) => {
    throw new Error('Job template import not implemented yet');
  }
};
