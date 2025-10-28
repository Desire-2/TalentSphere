// API service for TalentSphere backend connection
import config from '../config/environment.js';

// Environment-based configuration from centralized config
const API_BASE_URL = config.API.BASE_URL;
const APP_NAME = config.APP.NAME;
const APP_VERSION = config.APP.VERSION;
const APP_ENVIRONMENT = config.APP.ENVIRONMENT;
const ENABLE_DEBUG_LOGS = config.FEATURES.ENABLE_DEBUG_LOGS;
const ENABLE_API_LOGGING = config.FEATURES.ENABLE_API_LOGGING;

// Log environment configuration (only in development)
if (APP_ENVIRONMENT === 'development') {
  console.log('🌐 API Configuration:', {
    API_BASE_URL,
    APP_NAME,
    APP_VERSION,
    APP_ENVIRONMENT,
    ENABLE_DEBUG_LOGS,
    ENABLE_API_LOGGING
  });
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication headers
  getHeaders() {
    // Always get fresh token from localStorage
    const token = localStorage.getItem('token');
    this.token = token;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      mode: 'cors',
      headers: this.getHeaders(),
      ...options,
    };

    if (ENABLE_API_LOGGING) {
      console.log('🌐 API Request:', {
        method: options.method || 'GET',
        url: url,
        headers: config.headers,
        body: options.body || 'No body',
        bodyParsed: options.body ? JSON.parse(options.body) : null
      });
    }

    try {
      const response = await fetch(url, config);
      
      if (ENABLE_API_LOGGING) {
        console.log('🌐 Raw Response:', {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          url: url
        });
      }

      let data;
      try {
        const responseText = await response.text();
        if (ENABLE_API_LOGGING) {
          console.log('🌐 Response text length:', responseText.length);
        }
        
        // Only parse if there's content
        if (responseText && responseText.trim().length > 0) {
          data = JSON.parse(responseText);
        } else {
          data = {};
        }
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        console.error('Response was:', response);
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (ENABLE_API_LOGGING) {
        console.log('🌐 API Response:', {
          status: response.status,
          ok: response.ok,
          url: url,
          dataKeys: data ? Object.keys(data) : [],
          dataPreview: data
        });
      }

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.error?.includes('expired')) {
          if (ENABLE_DEBUG_LOGS) {
            console.log('Token expired, clearing auth data...');
          }
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login if this is an admin page
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login';
          }
        }
        
        // Create detailed error message
        const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
        if (ENABLE_DEBUG_LOGS) {
          console.error('❌ API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage: errorMessage,
            fullResponse: data
          });
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = 'Cannot connect to server. Please check if the backend is running.';
        if (ENABLE_DEBUG_LOGS) {
          console.error('❌ Network Error:', {
            url: url,
            message: networkError,
            originalError: error.message,
            apiBaseUrl: API_BASE_URL
          });
        }
        throw new Error(networkError);
      }
      
      if (ENABLE_DEBUG_LOGS) {
        console.error('❌ API request failed:', {
          url: url,
          error: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  // Job endpoints
  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getJob(id) {
    return this.get(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.post('/jobs', jobData);
  }

  async updateJob(id, jobData) {
    return this.put(`/jobs/${id}`, jobData);
  }

  async deleteJob(id) {
    return this.delete(`/jobs/${id}`);
  }

  async getJobCategories() {
    return this.get('/job-categories');
  }

  async bookmarkJob(jobId) {
    return this.post(`/jobs/${jobId}/bookmark`);
  }

  async removeBookmark(jobId) {
    return this.delete(`/jobs/${jobId}/bookmark`);
  }

  async getMyBookmarks() {
    return this.get('/my-bookmarks');
  }

  // Application endpoints
  async applyForJob(jobId, applicationData) {
    return this.post(`/jobs/${jobId}/apply`, applicationData);
  }

  async getApplication(id) {
    return this.get(`/applications/${id}`);
  }

  async updateApplicationStatus(id, statusData) {
    return this.put(`/applications/${id}/status`, statusData);
  }

  async getMyApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/my-applications${queryString ? `?${queryString}` : ''}`);
  }

  async getJobApplications(jobId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/jobs/${jobId}/applications${queryString ? `?${queryString}` : ''}`);
  }

  async withdrawApplication(id) {
    return this.post(`/applications/${id}/withdraw`);
  }

  async scheduleInterview(id, interviewData) {
    return this.post(`/applications/${id}/interview`, interviewData);
  }

  // Check if user has applied for a job
  async checkApplicationStatus(jobId) {
    try {
      const applications = await this.getMyApplications();
      const jobApplication = applications.applications?.find(app => app.job_id === jobId);
      return jobApplication || null;
    } catch (error) {
      console.warn('Could not check application status:', error);
      return null;
    }
  }

  // Company endpoints
  async getCompanies(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/companies${queryString ? `?${queryString}` : ''}`);
  }

  async getCompany(id) {
    return this.get(`/companies/${id}`);
  }

  async createCompany(companyData) {
    return this.post('/companies', companyData);
  }

  async updateCompany(id, companyData) {
    return this.put(`/companies/${id}`, companyData);
  }

  async getMyCompany() {
    return this.get('/my-company');
  }

  // Featured ads endpoints
  async getFeaturedAdPackages() {
    return this.get('/featured-ad-packages');
  }

  async createFeaturedAd(adData) {
    return this.post('/featured-ads', adData);
  }

  async getMyFeaturedAds(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/featured-ads${queryString ? `?${queryString}` : ''}`);
  }

  async getFeaturedAdAnalytics(id) {
    return this.get(`/featured-ads/${id}/analytics`);
  }

  async processPayment(paymentId, paymentData) {
    return this.post(`/payments/${paymentId}/process`, paymentData);
  }

  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/payments${queryString ? `?${queryString}` : ''}`);
  }

  // Public endpoints (no authentication required)
  async getPublicFeaturedAds(limit = 10) {
    return this.get(`/public/featured-ads?limit=${limit}`);
  }

  async getPublicFeaturedJobs(limit = 10) {
    return this.get(`/public/featured-jobs?limit=${limit}`);
  }

  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/messages${queryString ? `?${queryString}` : ''}`);
  }

  async sendMessage(messageData) {
    return this.post('/messages', messageData);
  }

  async getConversations() {
    return this.get('/conversations');
  }

  // Recommendation endpoints
  async getJobRecommendations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/recommendations/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getCandidateRecommendations(jobId, params = {}) {
    const queryString = new URLSearchParams({ job_id: jobId, ...params }).toString();
    return this.get(`/recommendations/candidates?${queryString}`);
  }

  async getSimilarJobs(jobId, params = {}) {
    const queryString = new URLSearchParams({ job_id: jobId, ...params }).toString();
    return this.get(`/recommendations/similar-jobs?${queryString}`);
  }

  // Admin endpoints
  async getAdminDashboard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/dashboard${queryString ? `?${queryString}` : ''}`);
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async toggleUserStatus(userId) {
    return this.post(`/admin/users/${userId}/toggle-status`);
  }

  async getJobsAdmin(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async moderateJob(jobId, action) {
    return this.post(`/admin/jobs/${jobId}/moderate`, { action });
  }

  async getCompaniesAdmin(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/companies${queryString ? `?${queryString}` : ''}`);
  }

  async verifyCompany(companyId) {
    return this.post(`/admin/companies/${companyId}/verify`);
  }

  async getRevenueAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/analytics/revenue${queryString ? `?${queryString}` : ''}`);
  }

  async getUserAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/admin/analytics/users${queryString ? `?${queryString}` : ''}`);
  }

  async getSystemHealth() {
    return this.get('/admin/system-health');
  }

  // Statistics endpoints
  async getApplicationStats() {
    return this.get('/application-stats');
  }

  // Employer Dashboard specific endpoints
  async getMyJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getMyCompanyProfile() {
    try {
      return await this.get('/my-company');
    } catch (error) {
      console.warn('Company profile endpoint not available:', error);
      return null;
    }
  }

  async createCompanyProfile(companyData) {
    return this.post('/companies', companyData);
  }

  async updateCompanyProfile(companyData) {
    return this.put('/my-company', companyData);
  }

  async getRecentApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/my-applications${queryString ? `?${queryString}` : ''}`);
  }

  // Enhanced endpoints for employer dashboard
  async getJobPerformanceStats() {
    return this.get('/jobs/performance-stats');
  }

  async getCandidateRecommendationsForEmployer(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/employer/top-candidates${queryString ? `?${queryString}` : ''}`);
  }

  // New employer-specific endpoints
  async getEmployerDashboardStats() {
    return this.get('/employer/dashboard/stats');
  }

  async getEmployerApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/employer/applications${queryString ? `?${queryString}` : ''}`);
  }

  async bulkApplicationAction(actionData) {
    return this.post('/employer/applications/bulk-action', actionData);
  }

  async getTopCandidates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/employer/top-candidates${queryString ? `?${queryString}` : ''}`);
  }

  async searchCandidates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/employer/candidate-search${queryString ? `?${queryString}` : ''}`);
  }

  async bulkJobAction(actionData) {
    return this.post('/jobs/bulk-action', actionData);
  }

  // Additional job management methods
  async getMyJobsWithStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/my-jobs${queryString ? `?${queryString}` : ''}`);
  }

  async toggleJobStatus(jobId, status) {
    return this.put(`/jobs/${jobId}`, { status });
  }

  async promoteJobToFeatured(jobId, packageData) {
    return this.post(`/jobs/${jobId}/promote`, packageData);
  }

  async duplicateJob(jobId) {
    return this.post(`/jobs/${jobId}/duplicate`);
  }

  async getJobAnalytics(jobId) {
    return this.get(`/jobs/${jobId}/analytics`);
  }

  async archiveJob(jobId) {
    return this.put(`/jobs/${jobId}`, { status: 'archived' });
  }

  // ===== JOB SEEKER PROFILE ENDPOINTS =====

  // Get job seeker profile
  async getJobSeekerProfile() {
    return this.get('/user/profile');
  }

  // Update job seeker profile
  async updateJobSeekerProfile(profileData) {
    return this.put('/user/profile', profileData);
  }

  // Change password
  async changePassword(passwordData) {
    return this.put('/user/change-password', passwordData);
  }

  // Get notification preferences
  async getNotificationPreferences() {
    return this.get('/user/notification-preferences');
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    return this.put('/user/notification-preferences', preferences);
  }

  // Get privacy settings
  async getPrivacySettings() {
    return this.get('/user/privacy-settings');
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    return this.put('/user/privacy-settings', settings);
  }

  // Export profile data
  async exportProfileData() {
    return this.get('/user/export-data');
  }

  // Delete account
  async deleteAccount() {
    return this.delete('/user/account');
  }

  // Get profile completion
  async getProfileCompletion() {
    return this.get('/user/profile-completion');
  }

  // Get activity summary
  async getActivitySummary() {
    return this.get('/user/activity-summary');
  }

  // Send verification email
  async sendVerificationEmail() {
    return this.post('/auth/send-verification');
  }

  // Verify email
  async verifyEmail(token) {
    return this.post('/auth/verify-email', { token });
  }

  // ===== COMPANY PROFILE ENDPOINTS =====

  // Get company profile
  async getMyCompanyProfile() {
    return this.get('/my-company');
  }

  // Create company profile
  async createCompanyProfile(companyData) {
    return this.post('/companies', companyData);
  }

  // Update company profile
  async updateCompanyProfile(companyId, companyData) {
    return this.put(`/companies/${companyId}`, companyData);
  }

  // Add company benefit
  async addCompanyBenefit(companyId, benefitData) {
    return this.post(`/companies/${companyId}/benefits`, benefitData);
  }

  // Delete company benefit
  async deleteCompanyBenefit(benefitId) {
    return this.delete(`/my-company/benefits/${benefitId}`);
  }

  // Add company team member
  async addCompanyTeamMember(companyId, memberData) {
    return this.post(`/companies/${companyId}/team`, memberData);
  }

  // Delete company team member
  async deleteCompanyTeamMember(memberId) {
    return this.delete(`/my-company/team/${memberId}`);
  }

  // ===== COMPANY SETTINGS ENDPOINTS =====

  // Get company account settings
  async getCompanyAccountSettings() {
    return this.get('/my-company/settings/account');
  }

  // Update company account settings
  async updateCompanyAccountSettings(settings) {
    return this.put('/my-company/settings/account', settings);
  }

  // Get company security settings
  async getCompanySecuritySettings() {
    return this.get('/my-company/settings/security');
  }

  // Update company security settings
  async updateCompanySecuritySettings(settings) {
    return this.put('/my-company/settings/security', settings);
  }

  // Get company notification settings
  async getCompanyNotificationSettings() {
    return this.get('/my-company/settings/notifications');
  }

  // Update company notification settings
  async updateCompanyNotificationSettings(settings) {
    return this.put('/my-company/settings/notifications', settings);
  }

  // Get company privacy settings
  async getCompanyPrivacySettings() {
    return this.get('/my-company/settings/privacy');
  }

  // Update company privacy settings
  async updateCompanyPrivacySettings(settings) {
    return this.put('/my-company/settings/privacy', settings);
  }

  // Get company billing settings
  async getCompanyBillingSettings() {
    return this.get('/my-company/settings/billing');
  }

  // Update company billing settings
  async updateCompanyBillingSettings(settings) {
    return this.put('/my-company/settings/billing', settings);
  }

  // Export company data
  async exportCompanyData(dataType) {
    return this.get(`/my-company/export-data/${dataType}`);
  }

  // Delete company account
  async deleteCompanyAccount() {
    return this.delete('/my-company/delete');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

