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

  // Copy job link to clipboard
  copyJobLink: async (jobId) => {
    const baseUrl = window.location.origin;
    const jobUrl = `${baseUrl}/jobs/${jobId}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jobUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = jobUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      return { success: true, url: jobUrl };
    } catch (error) {
      console.error('Failed to copy job link:', error);
      return { success: false, error: error.message };
    }
  },

  // Duplicate external job
  duplicateExternalJob: async (id) => {
    try {
      const response = await api.post(`/jobs/${id}/duplicate`);
      
      // Return the job data from the response
      return response.job || response;
    } catch (error) {
      console.error('Failed to duplicate job:', error);
      throw error;
    }
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
    const response = await api.get('/auth/profile');
    return response;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response;
  },

  // Settings management - most endpoints don't exist, so we'll use basic user endpoints
  getSettings: async () => {
    // Use profile endpoint for basic settings
    const response = await api.get('/auth/profile');
    return response;
  },

  updateSettings: async (settings) => {
    // Use profile update endpoint
    const response = await api.put('/auth/profile', settings);
    return response;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
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
    const response = await api.get('/auth/profile');
    return response;
  },

  deleteAccount: async () => {
    throw new Error('Account deletion not implemented yet');
  },

    // Templates management - implemented with new backend endpoints
  getJobTemplates: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach(value => queryParams.append(key, value));
        } else {
          queryParams.append(key, params[key]);
        }
      }
    });
    
    const queryString = queryParams.toString();
    const response = await api.get(`/job-templates${queryString ? `?${queryString}` : ''}`);
    return response;
  },

  getJobTemplateById: async (id, incrementUsage = false) => {
    const params = incrementUsage ? '?increment_usage=true' : '';
    const response = await api.get(`/job-templates/${id}${params}`);
    return response;
  },

  createJobTemplate: async (templateData) => {
    const response = await api.post('/job-templates', templateData);
    return response;
  },

  updateJobTemplate: async (id, templateData) => {
    const response = await api.put(`/job-templates/${id}`, templateData);
    return response;
  },

  deleteJobTemplate: async (id) => {
    const response = await api.delete(`/job-templates/${id}`);
    return response;
  },

  duplicateJobTemplate: async (id, newData = {}) => {
    const response = await api.post(`/job-templates/${id}/duplicate`, newData);
    return response;
  },

  createTemplateFromJob: async (jobId, templateData) => {
    const response = await api.post(`/job-templates/create-from-job/${jobId}`, templateData);
    return response;
  },

  searchJobTemplates: async (searchParams = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== '') {
        if (Array.isArray(searchParams[key])) {
          searchParams[key].forEach(value => queryParams.append(key, value));
        } else {
          queryParams.append(key, searchParams[key]);
        }
      }
    });
    
    const queryString = queryParams.toString();
    const response = await api.get(`/job-templates/search${queryString ? `?${queryString}` : ''}`);
    return response;
  },

  exportJobTemplates: async (includePublic = false) => {
    const params = includePublic ? '?include_public=true' : '';
    const response = await api.get(`/job-templates/export${params}`);
    return response;
  },

  importJobTemplates: async (templatesData) => {
    const response = await api.post('/job-templates/bulk-import', templatesData);
    return response;
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

  // Template management - additional methods (implemented)
  exportJobTemplates: async (includePublic = false) => {
    const params = includePublic ? '?include_public=true' : '';
    const response = await api.get(`/job-templates/export${params}`);
    return response;
  },

  importJobTemplates: async (templatesData) => {
    const response = await api.post('/job-templates/bulk-import', templatesData);
    return response;
  }
};
