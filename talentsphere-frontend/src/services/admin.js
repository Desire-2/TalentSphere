import api from './api';

export const adminService = {
  // Dashboard Overview
  getDashboard: async (days = 30) => {
    const response = await api.get(`/admin/dashboard?days=${days}`);
    return response;
  },

  // User Management
  getUsers: async (params = {}) => {
    // Filter out empty string values to avoid sending them as parameters
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        filteredParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(filteredParams).toString();
    const response = await api.get(`/admin/users?${queryString}`);
    return response;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/toggle-status`);
    return response;
  },

  changeUserRole: async (userId, newRole) => {
    const response = await api.post(`/admin/users/${userId}/change-role`, { new_role: newRole });
    return response;
  },

  // Job Management
  getJobsAdmin: async (params = {}) => {
    console.log('🔧 AdminService getJobsAdmin called with params:', params);
    
    // Filter out empty string values to avoid sending them as parameters
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined && params[key] !== 'all') {
        filteredParams[key] = params[key];
      }
    });
    
    console.log('🔧 Filtered params:', filteredParams);
    const queryString = new URLSearchParams(filteredParams).toString();
    const endpoint = `/admin/jobs${queryString ? `?${queryString}` : ''}`;
    console.log('🔧 Making API call to:', endpoint);
    
    try {
      const response = await api.get(endpoint);
      console.log('✅ AdminService getJobsAdmin successful:', response);
      return response;
    } catch (error) {
      console.error('❌ AdminService getJobsAdmin failed:', error);
      throw error;
    }
  },

  moderateJob: async (jobId, action, reason = '', notes = '') => {
    console.log('🔧 AdminService moderateJob called:', { jobId, action, reason, notes });
    const response = await api.post(`/admin/jobs/${jobId}/moderate`, { action, reason, notes });
    return response;
  },

  // Enhanced job management endpoints
  bulkJobAction: async (jobIds, action, reason = '') => {
    console.log('🔧 AdminService bulkJobAction called:', { jobIds, action, reason });
    const response = await api.post('/admin/jobs/bulk-action', { 
      job_ids: jobIds, 
      action, 
      reason 
    });
    return response;
  },

  getJobAnalytics: async (jobId) => {
    console.log('🔧 AdminService getJobAnalytics called for job:', jobId);
    const response = await api.get(`/admin/jobs/${jobId}/analytics`);
    return response;
  },

  getJobStats: async (days = 30) => {
    console.log('🔧 AdminService getJobStats called for days:', days);
    const response = await api.get(`/admin/jobs/stats?days=${days}`);
    return response;
  },

  // Company Management
  getCompaniesAdmin: async (params = {}) => {
    // Filter out empty string values to avoid sending them as parameters
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        filteredParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(filteredParams).toString();
    const response = await api.get(`/admin/companies?${queryString}`);
    return response;
  },

  verifyCompany: async (companyId) => {
    const response = await api.post(`/admin/companies/${companyId}/verify`);
    return response;
  },

  rejectCompanyVerification: async (companyId, notes = '') => {
    const response = await api.post(`/admin/companies/${companyId}/reject`, { notes });
    return response;
  },

  toggleCompanyFeatured: async (companyId) => {
    const response = await api.post(`/admin/companies/${companyId}/toggle-featured`);
    return response;
  },

  toggleCompanyStatus: async (companyId, reason = '') => {
    const response = await api.post(`/admin/companies/${companyId}/toggle-status`, { reason });
    return response;
  },

  sendCompanyEmail: async (companyId, subject, body) => {
    const response = await api.post(`/admin/companies/${companyId}/send-email`, { subject, body });
    return response;
  },

  bulkCompanyAction: async (companyIds, action) => {
    const response = await api.post('/admin/companies/bulk-action', { 
      company_ids: companyIds, 
      action 
    });
    return response;
  },

  deleteCompany: async (companyId) => {
    const response = await api.delete(`/admin/companies/${companyId}`);
    return response;
  },

  // Analytics
  getRevenueAnalytics: async (days = 30) => {
    const response = await api.get(`/admin/analytics/revenue?days=${days}`);
    return response;
  },

  getUserAnalytics: async (days = 30) => {
    const response = await api.get(`/admin/analytics/users?days=${days}`);
    return response;
  },

  // System Health
  getSystemHealth: async () => {
    const response = await api.get('/admin/system-health');
    return response;
  }
};
