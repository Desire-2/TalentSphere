import apiService from './api';

class ShareJobService {
  constructor() {
    this.shareHistory = this.loadShareHistory();
    this.analytics = {
      totalShares: 0,
      sharesByPlatform: {},
      sharesByJob: {},
      sharesByDate: {}
    };
    this.loadAnalytics();
  }

  // Load share history from localStorage
  loadShareHistory() {
    try {
      const history = localStorage.getItem('talentsphere_share_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading share history:', error);
      return [];
    }
  }

  // Save share history to localStorage
  saveShareHistory() {
    try {
      localStorage.setItem('talentsphere_share_history', JSON.stringify(this.shareHistory));
    } catch (error) {
      console.error('Error saving share history:', error);
    }
  }

  // Load analytics from localStorage
  loadAnalytics() {
    try {
      const analytics = localStorage.getItem('talentsphere_share_analytics');
      if (analytics) {
        this.analytics = { ...this.analytics, ...JSON.parse(analytics) };
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  // Save analytics to localStorage
  saveAnalytics() {
    try {
      localStorage.setItem('talentsphere_share_analytics', JSON.stringify(this.analytics));
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }

  // Record a share event
  recordShare(jobId, platform, customMessage = '', recipientCount = 1) {
    const shareEvent = {
      id: Date.now().toString(),
      jobId,
      platform,
      customMessage,
      recipientCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to history
    this.shareHistory.unshift(shareEvent);
    
    // Keep only last 100 shares
    if (this.shareHistory.length > 100) {
      this.shareHistory = this.shareHistory.slice(0, 100);
    }

    // Update analytics
    this.updateAnalytics(shareEvent);
    
    // Save data
    this.saveShareHistory();
    this.saveAnalytics();

    // Send to backend (optional)
    this.sendShareAnalytics(shareEvent).catch(console.error);

    return shareEvent;
  }

  // Update analytics
  updateAnalytics(shareEvent) {
    const { jobId, platform, recipientCount, timestamp } = shareEvent;
    const date = new Date(timestamp).toDateString();

    // Update total shares
    this.analytics.totalShares += recipientCount;

    // Update shares by platform
    if (!this.analytics.sharesByPlatform[platform]) {
      this.analytics.sharesByPlatform[platform] = 0;
    }
    this.analytics.sharesByPlatform[platform] += recipientCount;

    // Update shares by job
    if (!this.analytics.sharesByJob[jobId]) {
      this.analytics.sharesByJob[jobId] = 0;
    }
    this.analytics.sharesByJob[jobId] += recipientCount;

    // Update shares by date
    if (!this.analytics.sharesByDate[date]) {
      this.analytics.sharesByDate[date] = 0;
    }
    this.analytics.sharesByDate[date] += recipientCount;
  }

  // Send share analytics to backend
  async sendShareAnalytics(shareEvent) {
    try {
      await apiService.post('/analytics/job-shares', shareEvent);
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.log('Analytics not sent:', error.message);
    }
  }

  // Send direct emails through backend
  async sendDirectEmails(jobId, recipients, customMessage = '') {
    try {
      const response = await apiService.post('/jobs/share/email', {
        jobId,
        recipients,
        customMessage,
        timestamp: new Date().toISOString()
      });

      // Record the share event
      this.recordShare(jobId, 'direct_email', customMessage, recipients.length);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send emails: ${error.message}`);
    }
  }

  // Get job share statistics
  getJobShareStats(jobId) {
    const jobShares = this.shareHistory.filter(share => share.jobId === jobId);
    const platformStats = {};
    let totalShares = 0;

    jobShares.forEach(share => {
      totalShares += share.recipientCount;
      if (!platformStats[share.platform]) {
        platformStats[share.platform] = 0;
      }
      platformStats[share.platform] += share.recipientCount;
    });

    return {
      totalShares,
      platformStats,
      shareHistory: jobShares,
      lastShared: jobShares.length > 0 ? jobShares[0].timestamp : null
    };
  }

  // Get user's share analytics
  getUserShareAnalytics() {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentShares = this.shareHistory.filter(
      share => new Date(share.timestamp) >= last30Days
    );

    const topPlatforms = Object.entries(this.analytics.sharesByPlatform)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const dailyStats = {};
    recentShares.forEach(share => {
      const date = new Date(share.timestamp).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = 0;
      }
      dailyStats[date] += share.recipientCount;
    });

    return {
      totalShares: this.analytics.totalShares,
      recentShares: recentShares.length,
      topPlatforms,
      dailyStats,
      averageSharesPerDay: Object.values(dailyStats).reduce((a, b) => a + b, 0) / Object.keys(dailyStats).length || 0
    };
  }

  // Generate share URL with tracking parameters
  generateTrackingUrl(jobId, platform, userId = null) {
    const baseUrl = `${window.location.origin}/jobs/${jobId}`;
    const params = new URLSearchParams({
      utm_source: 'talentsphere',
      utm_medium: 'social',
      utm_campaign: 'job_share',
      utm_content: platform,
      shared_at: Date.now()
    });

    if (userId) {
      params.set('shared_by', userId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Get popular sharing times
  getOptimalSharingTimes() {
    const hourStats = {};
    
    this.shareHistory.forEach(share => {
      const hour = new Date(share.timestamp).getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = 0;
      }
      hourStats[hour]++;
    });

    const sortedHours = Object.entries(hourStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        timeLabel: this.formatHour(parseInt(hour))
      }));

    return sortedHours;
  }

  // Format hour for display
  formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  // Get share suggestions based on user behavior
  getShareSuggestions(job) {
    const jobStats = this.getJobShareStats(job.id);
    const userAnalytics = this.getUserShareAnalytics();
    
    const suggestions = [];

    // Suggest based on job type
    if (job.employment_type === 'remote') {
      suggestions.push({
        platform: 'linkedin',
        reason: 'Remote jobs perform well on LinkedIn',
        tip: 'Mention the remote work benefit in your message'
      });
    }

    if (job.is_urgent) {
      suggestions.push({
        platform: 'whatsapp',
        reason: 'Urgent jobs need quick sharing',
        tip: 'Share with your close network first'
      });
    }

    // Suggest based on user's top platforms
    userAnalytics.topPlatforms.forEach(([platform, count], index) => {
      if (index < 2) {
        suggestions.push({
          platform,
          reason: `You've had success sharing on ${platform} (${count} shares)`,
          tip: 'Use your proven platform'
        });
      }
    });

    // Time-based suggestions
    const optimalTimes = this.getOptimalSharingTimes();
    if (optimalTimes.length > 0) {
      const currentHour = new Date().getHours();
      const bestTime = optimalTimes[0];
      
      if (Math.abs(currentHour - bestTime.hour) <= 1) {
        suggestions.push({
          platform: 'any',
          reason: `Great time to share! You typically share successfully around ${bestTime.timeLabel}`,
          tip: 'Strike while the iron is hot'
        });
      }
    }

    return suggestions;
  }

  // Generate personalized share templates
  generateShareTemplates(job, companyName) {
    const templates = [
      {
        name: 'Professional',
        template: `🔍 Exciting opportunity alert! Looking for a ${job.title} role? ${companyName} is hiring! This could be perfect for someone in your network. #JobOpportunity #Hiring #${job.title.replace(/\s+/g, '')}`
      },
      {
        name: 'Casual',
        template: `Hey friends! 👋 Know anyone looking for a ${job.title} position? Found this great opportunity at ${companyName}. Sharing is caring! 💼`
      },
      {
        name: 'Urgent',
        template: `⚡ URGENT: ${companyName} needs a ${job.title} ASAP! If you know someone perfect for this role, don't wait - opportunities like this move fast! #UrgentHiring #${job.title.replace(/\s+/g, '')}`
      },
      {
        name: 'Network Helper',
        template: `🤝 Helping grow our professional network! ${companyName} is looking for a talented ${job.title}. Tag someone who might be interested or share to help a fellow professional! #Networking #CareerOpportunity`
      },
      {
        name: 'Company Focused',
        template: `🏢 ${companyName} is expanding their team! They're looking for a skilled ${job.title}. Great company, great opportunity. Know someone who'd be a perfect fit? #CompanyGrowth #Hiring #TeamExpansion`
      }
    ];

    // Add job-specific elements to templates
    if (job.salary_min || job.salary_max) {
      templates.forEach(template => {
        template.template += ` 💰 Competitive salary offered.`;
      });
    }

    if (job.employment_type === 'remote') {
      templates.forEach(template => {
        template.template += ` 🏠 Remote work available!`;
      });
    }

    return templates;
  }

  // Clear all share data
  clearAllData() {
    this.shareHistory = [];
    this.analytics = {
      totalShares: 0,
      sharesByPlatform: {},
      sharesByJob: {},
      sharesByDate: {}
    };
    
    localStorage.removeItem('talentsphere_share_history');
    localStorage.removeItem('talentsphere_share_analytics');
  }

  // Export share data
  exportShareData() {
    const data = {
      shareHistory: this.shareHistory,
      analytics: this.analytics,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `talentsphere-share-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export default new ShareJobService();
