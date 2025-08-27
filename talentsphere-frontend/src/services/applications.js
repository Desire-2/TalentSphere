import apiService from './api';

export const applicationsService = {
  // Apply for a job
  applyForJob: async (jobId, applicationData) => {
    const response = await apiService.applyForJob(jobId, applicationData);
    return response;
  },

  // Get application details
  getApplication: async (id) => {
    const response = await apiService.getApplication(id);
    return response;
  },

  // Update application status (employer only)
  updateApplicationStatus: async (id, statusData) => {
    const response = await apiService.updateApplicationStatus(id, statusData);
    return response;
  },

  // Get user's applications (job seeker)
  getMyApplications: async (params = {}) => {
    const response = await apiService.getMyApplications(params);
    return response;
  },

  // Get applications for a job (employer)
  getJobApplications: async (jobId, params = {}) => {
    const response = await apiService.getJobApplications(jobId, params);
    return response;
  },

  // Withdraw application
  withdrawApplication: async (id) => {
    const response = await apiService.withdrawApplication(id);
    return response;
  },

  // Schedule interview (employer)
  scheduleInterview: async (id, interviewData) => {
    const response = await apiService.scheduleInterview(id, interviewData);
    return response;
  },

  // Get application statistics
  getApplicationStats: async () => {
    const response = await apiService.getApplicationStats();
    return response;
  },

  // Check if user has applied for a specific job
  checkApplicationStatus: async (jobId) => {
    const response = await apiService.checkApplicationStatus(jobId);
    return response;
  }
};

export default applicationsService;

