import apiService from './api';

export const jobsService = {
  // Get jobs with filtering and pagination
  getJobs: async (params = {}) => {
    const response = await apiService.getJobs(params);
    return response;
  },

  // Get job by ID
  getJobById: async (id) => {
    const response = await apiService.getJob(id);
    return response;
  },

  // Create new job (employer only)
  createJob: async (jobData) => {
    const response = await apiService.createJob(jobData);
    return response;
  },

  // Update job (employer only)
  updateJob: async (id, jobData) => {
    const response = await apiService.updateJob(id, jobData);
    return response;
  },

  // Delete job (employer only)
  deleteJob: async (id) => {
    const response = await apiService.deleteJob(id);
    return response;
  },

  // Get job categories
  getJobCategories: async () => {
    const response = await apiService.getJobCategories();
    return response;
  },

  // Bookmark job (job seeker only)
  bookmarkJob: async (id) => {
    const response = await apiService.bookmarkJob(id);
    return response;
  },

  // Remove bookmark
  removeBookmark: async (id) => {
    const response = await apiService.removeBookmark(id);
    return response;
  },

  // Get user's bookmarked jobs
  getBookmarkedJobs: async () => {
    const response = await apiService.getMyBookmarks();
    return response;
  },

  // Search jobs
  searchJobs: async (searchParams) => {
    const response = await apiService.getJobs(searchParams);
    return response;
  },

  // Get featured jobs
  getFeaturedJobs: async () => {
    const response = await apiService.getPublicFeaturedJobs();
    return response;
  },

  // Get recent jobs
  getRecentJobs: async (limit = 10) => {
    const response = await apiService.getJobs({ limit, sort: 'created_at', order: 'desc' });
    return response;
  }
};

