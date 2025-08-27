// Advanced Application Management Service
// Leverages backend application endpoints for comprehensive application handling

import api from '../api';

export class ApplicationManagementService {
  constructor() {
    this.eventListeners = new Map();
  }

  // ============ JOB SEEKER FEATURES ============

  /**
   * Get comprehensive application dashboard data
   */
  async getApplicationDashboard() {
    try {
      const [applications, stats, recommendations] = await Promise.all([
        this.getMyApplicationsWithDetails(),
        this.getApplicationStats(),
        this.getRecommendations()
      ]);

      return {
        applications: applications.applications || [],
        stats: stats,
        recommendations: recommendations,
        summary: this.calculateApplicationSummary(applications.applications || [])
      };
    } catch (error) {
      console.error('Failed to load application dashboard:', error);
      throw error;
    }
  }

  /**
   * Get applications with enhanced details and activity logs
   */
  async getMyApplicationsWithDetails(params = {}) {
    try {
      const applications = await api.getMyApplications(params);
      
      // Enhance each application with additional data
      const enhancedApplications = await Promise.all(
        applications.applications.map(async (app) => {
          try {
            // Get job details if not included
            const [jobDetails, activityLog] = await Promise.all([
              app.job ? Promise.resolve(app.job) : api.getJob(app.job_id),
              this.getApplicationActivity(app.id)
            ]);

            return {
              ...app,
              job: jobDetails,
              activities: activityLog,
              timeline: this.buildApplicationTimeline(app, activityLog),
              insights: this.generateApplicationInsights(app),
              nextActions: this.getNextActions(app)
            };
          } catch (error) {
            console.warn(`Failed to enhance application ${app.id}:`, error);
            return app;
          }
        })
      );

      return {
        ...applications,
        applications: enhancedApplications
      };
    } catch (error) {
      console.error('Failed to get applications with details:', error);
      throw error;
    }
  }

  /**
   * Get application activity log from backend
   */
  async getApplicationActivity(applicationId) {
    try {
      // Backend endpoint: /applications/:id/activities
      const response = await api.get(`/applications/${applicationId}/activities`);
      return response.activities || [];
    } catch (error) {
      console.warn('Failed to get application activities:', error);
      return [];
    }
  }

  /**
   * Get application performance statistics
   */
  async getApplicationStats() {
    try {
      const applications = await api.getMyApplications();
      const apps = applications.applications || [];
      
      return {
        total: apps.length,
        byStatus: this.groupByStatus(apps),
        responseRate: this.calculateResponseRate(apps),
        averageResponseTime: this.calculateAverageResponseTime(apps),
        successRate: this.calculateSuccessRate(apps),
        topIndustries: this.getTopIndustries(apps),
        monthlyTrend: this.getMonthlyApplicationTrend(apps),
        skillMatchAverage: this.getAverageSkillMatch(apps)
      };
    } catch (error) {
      console.error('Failed to get application stats:', error);
      return {};
    }
  }

  /**
   * Get AI-powered recommendations based on application history
   */
  async getRecommendations() {
    try {
      const [jobRecommendations, profileSuggestions] = await Promise.all([
        api.getJobRecommendations({ limit: 10 }),
        this.getProfileOptimizationSuggestions()
      ]);

      return {
        jobs: jobRecommendations.recommendations || [],
        profileImprovements: profileSuggestions,
        skillGaps: await this.identifySkillGaps(),
        marketInsights: await this.getMarketInsights()
      };
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return {};
    }
  }

  /**
   * Track application with enhanced analytics
   */
  async trackApplicationView(jobId, source = 'dashboard') {
    try {
      // Enhanced tracking with source and user behavior
      await api.post('/applications/track-view', {
        job_id: jobId,
        source: source,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });
    } catch (error) {
      console.warn('Failed to track application view:', error);
    }
  }

  /**
   * Withdraw application with reason
   */
  async withdrawApplication(applicationId, reason = '') {
    try {
      const response = await api.post(`/applications/${applicationId}/withdraw`, {
        reason: reason,
        timestamp: new Date().toISOString()
      });

      // Trigger event for real-time updates
      this.triggerEvent('applicationWithdrawn', { applicationId, reason });
      
      return response;
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      throw error;
    }
  }

  // ============ EMPLOYER FEATURES ============

  /**
   * Get comprehensive candidate pipeline
   */
  async getCandidatePipeline(jobId) {
    try {
      const [applications, analytics, insights] = await Promise.all([
        api.getJobApplications(jobId, { include_details: true }),
        this.getJobApplicationAnalytics(jobId),
        this.getHiringInsights(jobId)
      ]);

      // Group applications by status for pipeline view
      const pipeline = this.groupApplicationsByStatus(applications.applications || []);
      
      return {
        pipeline,
        analytics,
        insights,
        totalCandidates: applications.total || 0,
        conversionRates: this.calculateConversionRates(applications.applications || []),
        timeToHire: this.calculateTimeToHire(applications.applications || [])
      };
    } catch (error) {
      console.error('Failed to get candidate pipeline:', error);
      throw error;
    }
  }

  /**
   * Update application status with activity tracking
   */
  async updateApplicationStatus(applicationId, newStatus, notes = '', rating = null) {
    try {
      const response = await api.post(`/applications/${applicationId}/status`, {
        status: newStatus,
        notes: notes,
        rating: rating,
        updated_by: 'employer',
        timestamp: new Date().toISOString()
      });

      // Trigger real-time updates
      this.triggerEvent('applicationStatusUpdated', { 
        applicationId, 
        newStatus, 
        notes, 
        rating 
      });

      return response;
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw error;
    }
  }

  /**
   * Schedule interview with enhanced features
   */
  async scheduleInterview(applicationId, interviewData) {
    try {
      const enhancedData = {
        ...interviewData,
        scheduled_by: 'employer',
        created_at: new Date().toISOString(),
        calendar_integration: true, // Enable calendar sync
        reminder_settings: {
          candidate_reminder: true,
          employer_reminder: true,
          reminder_times: [24, 2] // hours before
        }
      };

      const response = await api.post(`/applications/${applicationId}/interview`, enhancedData);
      
      // Trigger calendar integration
      await this.integrateWithCalendar(applicationId, enhancedData);
      
      return response;
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      throw error;
    }
  }

  /**
   * Bulk update applications
   */
  async bulkUpdateApplications(applicationIds, action, data = {}) {
    try {
      const response = await api.post('/applications/bulk-action', {
        application_ids: applicationIds,
        action: action,
        data: data,
        timestamp: new Date().toISOString()
      });

      // Trigger bulk update event
      this.triggerEvent('bulkApplicationUpdate', { 
        applicationIds, 
        action, 
        data 
      });

      return response;
    } catch (error) {
      console.error('Failed to bulk update applications:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered candidate insights
   */
  async getCandidateInsights(applicationId) {
    try {
      const response = await api.get(`/applications/${applicationId}/insights`);
      
      return {
        skillMatch: response.skill_match || 0,
        experienceLevel: response.experience_level || 'Unknown',
        culturalFit: response.cultural_fit || 0,
        growthPotential: response.growth_potential || 0,
        riskFactors: response.risk_factors || [],
        strengths: response.strengths || [],
        recommendations: response.recommendations || []
      };
    } catch (error) {
      console.warn('Failed to get candidate insights:', error);
      return {};
    }
  }

  // ============ HELPER METHODS ============

  /**
   * Calculate application summary statistics
   */
  calculateApplicationSummary(applications) {
    const total = applications.length;
    const statusCounts = this.groupByStatus(applications);
    
    return {
      total,
      pending: statusCounts.submitted + statusCounts.under_review,
      interviewed: statusCounts.interviewed,
      successful: statusCounts.hired,
      responseRate: this.calculateResponseRate(applications),
      averageDaysToResponse: this.calculateAverageResponseTime(applications)
    };
  }

  /**
   * Group applications by status
   */
  groupByStatus(applications) {
    return applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Build application timeline
   */
  buildApplicationTimeline(application, activities) {
    const timeline = [
      {
        date: application.created_at,
        event: 'Application Submitted',
        status: 'submitted',
        icon: 'send'
      }
    ];

    activities.forEach(activity => {
      timeline.push({
        date: activity.created_at,
        event: activity.description,
        status: activity.activity_type,
        icon: this.getActivityIcon(activity.activity_type),
        details: activity.details
      });
    });

    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Generate application insights
   */
  generateApplicationInsights(application) {
    const insights = [];
    
    // Days since application
    const daysSince = Math.floor(
      (new Date() - new Date(application.created_at)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSince > 14 && application.status === 'submitted') {
      insights.push({
        type: 'warning',
        message: 'No response after 14 days - consider following up'
      });
    }
    
    if (application.match_score && application.match_score > 80) {
      insights.push({
        type: 'success',
        message: 'High skill match - strong candidate profile'
      });
    }
    
    return insights;
  }

  /**
   * Get next suggested actions
   */
  getNextActions(application) {
    const actions = [];
    
    switch (application.status) {
      case 'submitted':
        if (!application.cover_letter) {
          actions.push({
            type: 'improve',
            action: 'Add cover letter to strengthen application'
          });
        }
        break;
      case 'under_review':
        actions.push({
          type: 'wait',
          action: 'Application is being reviewed - sit tight!'
        });
        break;
      case 'shortlisted':
        actions.push({
          type: 'prepare',
          action: 'Prepare for potential interview invitation'
        });
        break;
    }
    
    return actions;
  }

  /**
   * Calculate response rate
   */
  calculateResponseRate(applications) {
    const total = applications.length;
    const responded = applications.filter(app => 
      ['under_review', 'shortlisted', 'interviewed', 'hired', 'rejected'].includes(app.status)
    ).length;
    
    return total > 0 ? (responded / total * 100).toFixed(1) : 0;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(applications) {
    const responseTimes = applications
      .filter(app => app.reviewed_at)
      .map(app => {
        const applied = new Date(app.created_at);
        const reviewed = new Date(app.reviewed_at);
        return Math.floor((reviewed - applied) / (1000 * 60 * 60 * 24));
      });
    
    if (responseTimes.length === 0) return 0;
    
    return Math.floor(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
  }

  /**
   * Event system for real-time updates
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(activityType) {
    const icons = {
      'application_submitted': 'send',
      'status_changed': 'update',
      'interview_scheduled': 'calendar_today',
      'interview_completed': 'done',
      'notes_added': 'note_add',
      'rating_updated': 'star',
      'application_withdrawn': 'cancel'
    };
    
    return icons[activityType] || 'info';
  }

  // ============ ADVANCED ANALYTICS ============

  /**
   * Get job application analytics
   */
  async getJobApplicationAnalytics(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/application-analytics`);
      return response;
    } catch (error) {
      console.warn('Failed to get job application analytics:', error);
      return {};
    }
  }

  /**
   * Get hiring insights
   */
  async getHiringInsights(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/hiring-insights`);
      return response;
    } catch (error) {
      console.warn('Failed to get hiring insights:', error);
      return {};
    }
  }

  /**
   * Calendar integration
   */
  async integrateWithCalendar(applicationId, interviewData) {
    // Implementation would integrate with Google Calendar, Outlook, etc.
    console.log('Calendar integration for application:', applicationId);
  }
}

// Export singleton instance
export const applicationManagementService = new ApplicationManagementService();
