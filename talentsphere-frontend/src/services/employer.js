import apiService from './api';

class EmployerService {
  // Dashboard data
  async getDashboardStats() {
    try {
      return await apiService.getEmployerDashboardStats();
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  // Jobs management
  async getMyJobs(params = {}) {
    try {
      return await apiService.get(`/my-jobs?${new URLSearchParams(params).toString()}`);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  }

  async createJob(jobData) {
    try {
      return await apiService.createJob(jobData);
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  }

  async updateJob(jobId, jobData) {
    try {
      return await apiService.updateJob(jobId, jobData);
    } catch (error) {
      console.error('Failed to update job:', error);
      throw error;
    }
  }

  async deleteJob(jobId) {
    try {
      return await apiService.deleteJob(jobId);
    } catch (error) {
      console.error('Failed to delete job:', error);
      throw error;
    }
  }

  async bulkJobActions(actionData) {
    try {
      return await apiService.bulkJobAction(actionData);
    } catch (error) {
      console.error('Failed to perform bulk job action:', error);
      throw error;
    }
  }

  // Applications management
  async getApplications(params = {}) {
    try {
      return await apiService.getEmployerApplications(params);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      throw error;
    }
  }

  async getJobApplications(jobId, params = {}) {
    try {
      return await apiService.getJobApplications(jobId, params);
    } catch (error) {
      console.error('Failed to fetch job applications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId, statusData) {
    try {
      return await apiService.updateApplicationStatus(applicationId, statusData);
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw error;
    }
  }

  async bulkApplicationActions(actionData) {
    try {
      return await apiService.bulkApplicationAction(actionData);
    } catch (error) {
      console.error('Failed to perform bulk application action:', error);
      throw error;
    }
  }

  async scheduleInterview(applicationId, interviewData) {
    try {
      return await apiService.scheduleInterview(applicationId, interviewData);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      throw error;
    }
  }

  // Candidates management
  async getTopCandidates(params = {}) {
    try {
      return await apiService.getTopCandidates(params);
    } catch (error) {
      console.error('Failed to fetch top candidates:', error);
      throw error;
    }
  }

  async searchCandidates(params = {}) {
    try {
      return await apiService.searchCandidates(params);
    } catch (error) {
      console.error('Failed to search candidates:', error);
      throw error;
    }
  }

  // Company management
  async getMyCompany() {
    try {
      return await apiService.getMyCompany();
    } catch (error) {
      console.error('Failed to fetch company:', error);
      throw error;
    }
  }

  async updateCompany(companyData) {
    try {
      const company = await this.getMyCompany();
      if (company && company.id) {
        return await apiService.updateCompany(company.id, companyData);
      }
      throw new Error('Company not found');
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  }

  // Analytics and reports
  async getJobPerformanceStats() {
    try {
      return await apiService.getJobPerformanceStats();
    } catch (error) {
      console.error('Failed to fetch job performance stats:', error);
      throw error;
    }
  }

  async getApplicationStats() {
    try {
      return await apiService.getApplicationStats();
    } catch (error) {
      console.error('Failed to fetch application stats:', error);
      throw error;
    }
  }

  // Featured ads
  async getFeaturedAdPackages() {
    try {
      return await apiService.getFeaturedAdPackages();
    } catch (error) {
      console.error('Failed to fetch featured ad packages:', error);
      throw error;
    }
  }

  async createFeaturedAd(adData) {
    try {
      return await apiService.createFeaturedAd(adData);
    } catch (error) {
      console.error('Failed to create featured ad:', error);
      throw error;
    }
  }

  async getMyFeaturedAds(params = {}) {
    try {
      return await apiService.getMyFeaturedAds(params);
    } catch (error) {
      console.error('Failed to fetch featured ads:', error);
      throw error;
    }
  }

  async getFeaturedAdAnalytics(adId) {
    try {
      return await apiService.getFeaturedAdAnalytics(adId);
    } catch (error) {
      console.error('Failed to fetch featured ad analytics:', error);
      throw error;
    }
  }

  // Utility methods
  formatJobData(job) {
    return {
      ...job,
      formatted_salary: this.formatSalary(job),
      formatted_date: this.formatDate(job.created_at),
      status_color: this.getStatusColor(job.status)
    };
  }

  formatApplicationData(application) {
    return {
      ...application,
      applicant_name: this.getApplicantName(application.applicant),
      formatted_date: this.formatDate(application.created_at),
      status_color: this.getStatusColor(application.status)
    };
  }

  formatSalary(job) {
    if (!job) return 'Not specified';
    
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    
    if (job.salary_range) {
      return job.salary_range;
    }
    
    return 'Not specified';
  }

  formatDate(dateString) {
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
  }

  getStatusColor(status) {
    const colors = {
      active: 'bg-green-500',
      published: 'bg-green-500',
      inactive: 'bg-gray-500',
      paused: 'bg-yellow-500',
      closed: 'bg-red-500',
      draft: 'bg-blue-500',
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      shortlisted: 'bg-purple-500',
      interviewed: 'bg-indigo-500',
      hired: 'bg-green-500',
      rejected: 'bg-red-500',
      pending: 'bg-orange-500'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
  }

  getApplicantName(applicant) {
    if (!applicant) return 'Anonymous';
    
    if (applicant.name) return applicant.name;
    
    const firstName = applicant.first_name || '';
    const lastName = applicant.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || 'Anonymous';
  }

  // Data transformation helpers
  transformDashboardData(rawData) {
    return {
      stats: {
        activeJobs: rawData.active_jobs || 0,
        totalJobs: rawData.total_jobs || 0,
        draftJobs: rawData.draft_jobs || 0,
        pausedJobs: rawData.paused_jobs || 0,
        newApplications: rawData.new_applications || 0,
        totalApplications: rawData.total_applications || 0,
        shortlistedApplications: rawData.shortlisted_applications || 0,
        interviewsScheduled: rawData.interviews_scheduled || 0,
        hiresMade: rawData.hires_made || 0,
        profileViews: rawData.profile_views || 0,
        avgTimeToHire: rawData.avg_time_to_hire || 0,
        pendingReviews: rawData.new_applications || 0
      },
      trends: rawData.application_trends || [],
      performance: rawData.job_performance || []
    };
  }

  // Error handling wrapper
  async safeApiCall(apiCall, defaultValue = null) {
    try {
      return await apiCall();
    } catch (error) {
      console.error('API call failed:', error);
      return defaultValue;
    }
  }
}

// Create and export singleton instance
const employerService = new EmployerService();
export default employerService;
