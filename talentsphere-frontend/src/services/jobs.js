import api from './api';

class JobsService {
  // Job CRUD operations
  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getJob(id) {
    return api.get(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return api.post('/jobs', jobData);
  }

  async updateJob(id, jobData) {
    return api.put(`/jobs/${id}`, jobData);
  }

  async deleteJob(id) {
    return api.delete(`/jobs/${id}`);
  }

  // Job categories
  async getJobCategories() {
    return api.get('/job-categories');
  }

  async createJobCategory(categoryData) {
    return api.post('/job-categories', categoryData);
  }

  async updateJobCategory(id, categoryData) {
    return api.put(`/job-categories/${id}`, categoryData);
  }

  async deleteJobCategory(id) {
    return api.delete(`/job-categories/${id}`);
  }

  // Job bookmarks
  async bookmarkJob(jobId) {
    return api.post(`/jobs/${jobId}/bookmark`);
  }

  async removeBookmark(jobId) {
    return api.delete(`/jobs/${jobId}/bookmark`);
  }

  async getMyBookmarks() {
    return api.get('/my-bookmarks');
  }

  // Job applications
  async applyForJob(jobId, applicationData) {
    return api.post(`/jobs/${jobId}/apply`, applicationData);
  }

  async getJobApplications(jobId) {
    return api.get(`/jobs/${jobId}/applications`);
  }

  // Job sharing
  async shareJob(jobId, shareData) {
    return api.post(`/jobs/${jobId}/share`, shareData);
  }

  async getJobShares(jobId) {
    return api.get(`/jobs/${jobId}/shares`);
  }

  // Job search and filtering
  async searchJobs(searchTerm, filters = {}) {
    const params = {
      search: searchTerm,
      ...filters
    };
    return this.getJobs(params);
  }

  async getJobsByCategory(categoryId, params = {}) {
    return this.getJobs({ category_id: categoryId, ...params });
  }

  async getJobsByLocation(location, params = {}) {
    return this.getJobs({ location, ...params });
  }

  async getJobsByCompany(companyId, params = {}) {
    return this.getJobs({ company_id: companyId, ...params });
  }

  // Job statistics
  async getJobStats() {
    return api.get('/jobs/stats');
  }

  async getJobViewStats(jobId) {
    return api.get(`/jobs/${jobId}/stats`);
  }

  // Job alerts
  async createJobAlert(alertData) {
    return api.post('/job-alerts', alertData);
  }

  async getJobAlerts() {
    return api.get('/job-alerts');
  }

  async updateJobAlert(id, alertData) {
    return api.put(`/job-alerts/${id}`, alertData);
  }

  async deleteJobAlert(id) {
    return api.delete(`/job-alerts/${id}`);
  }

  // Job templates
  async getJobTemplates() {
    return api.get('/job-templates');
  }

  async getJobTemplate(id) {
    return api.get(`/job-templates/${id}`);
  }

  async createJobTemplate(templateData) {
    return api.post('/job-templates', templateData);
  }

  async updateJobTemplate(id, templateData) {
    return api.put(`/job-templates/${id}`, templateData);
  }

  async deleteJobTemplate(id) {
    return api.delete(`/job-templates/${id}`);
  }

  // Utility methods
  formatJobData(jobData) {
    // Format job data for display
    return {
      ...jobData,
      salary_range: jobData.salary_min && jobData.salary_max 
        ? `$${jobData.salary_min.toLocaleString()} - $${jobData.salary_max.toLocaleString()}`
        : 'Salary not specified',
      posted_date: jobData.created_at ? new Date(jobData.created_at).toLocaleDateString() : '',
      experience_level: jobData.experience_level || 'Not specified'
    };
  }

  validateJobData(jobData) {
    const errors = {};

    if (!jobData.title || jobData.title.trim() === '') {
      errors.title = 'Job title is required';
    }

    if (!jobData.description || jobData.description.trim() === '') {
      errors.description = 'Job description is required';
    }

    if (!jobData.company_id) {
      errors.company_id = 'Company is required';
    }

    if (!jobData.category_id) {
      errors.category_id = 'Job category is required';
    }

    if (!jobData.employment_type) {
      errors.employment_type = 'Employment type is required';
    }

    if (!jobData.location && !jobData.is_remote) {
      errors.location = 'Location is required for non-remote jobs';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Create singleton instance
export const jobsService = new JobsService();

// Export for named imports
export default jobsService;