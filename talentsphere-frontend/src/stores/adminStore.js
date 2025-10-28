import { create } from 'zustand';
import { adminService } from '../services/admin';

export const useAdminStore = create((set, get) => ({
  // State
  dashboardData: null,
  users: [],
  jobs: [],
  companies: [],
  revenueAnalytics: null,
  userAnalytics: null,
  systemHealth: null,
  isLoading: false,
  error: null,
  pagination: null,

  // Actions
  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getDashboard();
      set({
        dashboardData: data,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      set({
        dashboardData: null,
        isLoading: false,
        error: error.message || 'Failed to fetch dashboard data'
      });
      throw error;
    }
  },

  fetchUsers: async (params = {}) => {
    console.log('🚀 AdminStore fetchUsers called with params:', params);
    set({ isLoading: true, error: null });
    try {
      console.log('📡 Calling adminService.getUsers...');
      const data = await adminService.getUsers(params);
      console.log('✅ adminService.getUsers successful:', data);
      set({
        users: data.users,
        pagination: data.pagination,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('❌ Users fetch error:', error);
      set({
        users: [],
        pagination: { page: 1, per_page: 20, total: 0, pages: 0, has_prev: false, has_next: false },
        isLoading: false,
        error: error.message || 'Failed to fetch users'
      });
      throw error;
    }
  },

  toggleUserStatus: async (userId) => {
    try {
      const data = await adminService.toggleUserStatus(userId);
      // Update the user in the local state
      const users = get().users;
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, is_active: data.user.is_active } : user
      );
      set({ users: updatedUsers });
      return data;
    } catch (error) {
      console.error('Toggle user status error:', error);
      throw error;
    }
  },

  changeUserRole: async (userId, newRole) => {
    try {
      const data = await adminService.changeUserRole(userId, newRole);
      // Update the user in the local state
      const users = get().users;
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: data.user.role } : user
      );
      set({ users: updatedUsers });
      return data;
    } catch (error) {
      console.error('Change user role error:', error);
      throw error;
    }
  },

  deleteUser: async (userId, options = {}) => {
    try {
      const response = await adminService.deleteUser(userId, options);
      const users = get().users.filter(user => user.id !== userId);
      const pagination = get().pagination;
      let updatedPagination = pagination;
      if (pagination && typeof pagination.total === 'number') {
        const newTotal = Math.max(0, pagination.total - 1);
        updatedPagination = {
          ...pagination,
          total: newTotal,
          pages: pagination.per_page ? Math.max(1, Math.ceil(newTotal / pagination.per_page)) : pagination.pages
        };
      }
      set({ users, pagination: updatedPagination });
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  bulkDeleteUsers: async (userIds = [], options = {}) => {
    try {
      const result = await adminService.bulkDeleteUsers(userIds, options);
      if (Array.isArray(result.deleted) && result.deleted.length > 0) {
        const users = get().users.filter(user => !result.deleted.includes(user.id));
        const pagination = get().pagination;
        let updatedPagination = pagination;
        if (pagination && typeof pagination.total === 'number') {
          const newTotal = Math.max(0, pagination.total - result.deleted.length);
          updatedPagination = {
            ...pagination,
            total: newTotal,
            pages: pagination.per_page ? Math.max(1, Math.ceil(newTotal / pagination.per_page)) : pagination.pages
          };
          if (updatedPagination.page > updatedPagination.pages) {
            updatedPagination = {
              ...updatedPagination,
              page: updatedPagination.pages
            };
          }
        }
        set({ users, pagination: updatedPagination });
      }
      return result;
    } catch (error) {
      console.error('Bulk delete users error:', error);
      throw error;
    }
  },

  fetchJobs: async (params = {}) => {
    console.log('🏪 AdminStore fetchJobs called with params:', params);
    set({ isLoading: true, error: null });
    try {
      console.log('📡 Calling adminService.getJobsAdmin...');
      const data = await adminService.getJobsAdmin(params);
      console.log('✅ adminService.getJobsAdmin successful:', data);
      console.log('📊 Setting jobs in store:', data.jobs?.length || 0, 'jobs');
      
      set({
        jobs: data.jobs || [],
        pagination: data.pagination || { page: 1, per_page: 20, total: 0, pages: 0, has_prev: false, has_next: false },
        isLoading: false,
        error: null
      });
      
      console.log('🏪 Store updated with jobs:', data.jobs?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Jobs fetch error in store:', error);
      set({
        jobs: [],
        pagination: { page: 1, per_page: 20, total: 0, pages: 0, has_prev: false, has_next: false },
        isLoading: false,
        error: error.message || 'Failed to fetch jobs'
      });
      throw error;
    }
  },

  moderateJob: async (jobId, action, reason = '', notes = '') => {
    try {
      const data = await adminService.moderateJob(jobId, action, reason, notes);
      // Update the job in the local state
      const jobs = get().jobs;
      const updatedJobs = jobs.map(job => 
        job.id === jobId ? { ...job, ...data.job } : job
      );
      set({ jobs: updatedJobs });
      return data;
    } catch (error) {
      console.error('Moderate job error:', error);
      throw error;
    }
  },

  bulkJobAction: async (jobIds, action, reason = '') => {
    try {
      const data = await adminService.bulkJobAction(jobIds, action, reason);
      // Refresh jobs data after bulk action
      const currentFilters = get().filters || {};
      await get().fetchJobs(currentFilters);
      return data;
    } catch (error) {
      console.error('Bulk job action error:', error);
      throw error;
    }
  },

  getJobAnalytics: async (jobId) => {
    try {
      const data = await adminService.getJobAnalytics(jobId);
      return data;
    } catch (error) {
      console.error('Get job analytics error:', error);
      throw error;
    }
  },

  getJobStats: async (days = 30) => {
    try {
      const data = await adminService.getJobStats(days);
      return data;
    } catch (error) {
      console.error('Get job stats error:', error);
      throw error;
    }
  },

  fetchCompanies: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getCompaniesAdmin(params);
      set({
        companies: data.companies,
        pagination: data.pagination,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Companies fetch error:', error);
      set({
        companies: [],
        pagination: { page: 1, per_page: 20, total: 0, pages: 0, has_prev: false, has_next: false },
        isLoading: false,
        error: error.message || 'Failed to fetch companies'
      });
      throw error;
    }
  },

  verifyCompany: async (companyId) => {
    try {
      const data = await adminService.verifyCompany(companyId);
      // Update the company in the local state
      const companies = get().companies;
      const updatedCompanies = companies.map(company => 
        company.id === companyId ? { ...company, is_verified: true } : company
      );
      set({ companies: updatedCompanies });
      return data;
    } catch (error) {
      console.error('Verify company error:', error);
      throw error;
    }
  },

  rejectCompanyVerification: async (companyId, notes) => {
    try {
      const data = await adminService.rejectCompanyVerification(companyId, notes);
      // Update the company in the local state
      const companies = get().companies;
      const updatedCompanies = companies.map(company => 
        company.id === companyId ? { ...company, is_verified: false } : company
      );
      set({ companies: updatedCompanies });
      return data;
    } catch (error) {
      console.error('Reject company verification error:', error);
      throw error;
    }
  },

  toggleCompanyFeatured: async (companyId) => {
    try {
      const data = await adminService.toggleCompanyFeatured(companyId);
      // Update the company in the local state
      const companies = get().companies;
      const updatedCompanies = companies.map(company => 
        company.id === companyId ? { ...company, is_featured: data.company.is_featured } : company
      );
      set({ companies: updatedCompanies });
      return data;
    } catch (error) {
      console.error('Toggle company featured error:', error);
      throw error;
    }
  },

  toggleCompanyStatus: async (companyId, reason) => {
    try {
      const data = await adminService.toggleCompanyStatus(companyId, reason);
      // Update the company in the local state
      const companies = get().companies;
      const updatedCompanies = companies.map(company => 
        company.id === companyId ? { ...company, is_active: data.company.is_active } : company
      );
      set({ companies: updatedCompanies });
      return data;
    } catch (error) {
      console.error('Toggle company status error:', error);
      throw error;
    }
  },

  sendCompanyEmail: async (companyId, subject, body) => {
    try {
      const data = await adminService.sendCompanyEmail(companyId, subject, body);
      return data;
    } catch (error) {
      console.error('Send company email error:', error);
      throw error;
    }
  },

  bulkCompanyAction: async (companyIds, action) => {
    try {
      const data = await adminService.bulkCompanyAction(companyIds, action);
      // Refresh companies data after bulk action
      const currentFilters = get().filters || {};
      await get().fetchCompanies(currentFilters);
      return data;
    } catch (error) {
      console.error('Bulk company action error:', error);
      throw error;
    }
  },

  deleteCompany: async (companyId) => {
    try {
      const data = await adminService.deleteCompany(companyId);
      // Remove the company from local state
      const companies = get().companies;
      const updatedCompanies = companies.filter(company => company.id !== companyId);
      set({ companies: updatedCompanies });
      return data;
    } catch (error) {
      console.error('Delete company error:', error);
      throw error;
    }
  },

  fetchRevenueAnalytics: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getRevenueAnalytics(days);
      set({
        revenueAnalytics: data,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Revenue analytics fetch error:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch revenue analytics'
      });
      throw error;
    }
  },

  fetchUserAnalytics: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getUserAnalytics(days);
      set({
        userAnalytics: data,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('User analytics fetch error:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch user analytics'
      });
      throw error;
    }
  },

  fetchSystemHealth: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getSystemHealth();
      set({
        systemHealth: data,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('System health fetch error:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch system health'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
