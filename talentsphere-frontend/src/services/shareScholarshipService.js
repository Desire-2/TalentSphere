/**
 * ShareScholarship Service
 * Handles scholarship sharing functionality, tracking, and analytics
 */

class ShareScholarshipService {
  constructor() {
    this.storageKey = 'talentsphere_scholarship_shares';
    this.analyticsKey = 'talentsphere_scholarship_analytics';
  }

  // Initialize or get existing share data
  getShareData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { shares: [], lastUpdated: new Date().toISOString() };
  }

  // Save share data
  saveShareData(data) {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Record a share action
  recordShare(scholarshipId, platform, customMessage = '', recipientInfo = '') {
    const shareData = this.getShareData();
    
    const share = {
      id: Date.now() + Math.random(),
      scholarshipId,
      platform,
      customMessage,
      recipientInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    shareData.shares.push(share);
    this.saveShareData(shareData);

    // Update analytics
    this.updateAnalytics(scholarshipId, platform);

    return share;
  }

  // Update analytics
  updateAnalytics(scholarshipId, platform) {
    const analytics = this.getAnalytics();
    
    if (!analytics.scholarships) {
      analytics.scholarships = {};
    }

    if (!analytics.scholarships[scholarshipId]) {
      analytics.scholarships[scholarshipId] = {
        totalShares: 0,
        platforms: {},
        lastShared: null
      };
    }

    const scholarshipStats = analytics.scholarships[scholarshipId];
    scholarshipStats.totalShares++;
    scholarshipStats.lastShared = new Date().toISOString();

    if (!scholarshipStats.platforms[platform]) {
      scholarshipStats.platforms[platform] = 0;
    }
    scholarshipStats.platforms[platform]++;

    // Update global analytics
    if (!analytics.global) {
      analytics.global = {
        totalShares: 0,
        platforms: {}
      };
    }

    analytics.global.totalShares++;
    if (!analytics.global.platforms[platform]) {
      analytics.global.platforms[platform] = 0;
    }
    analytics.global.platforms[platform]++;

    this.saveAnalytics(analytics);
  }

  // Get analytics data
  getAnalytics() {
    const data = localStorage.getItem(this.analyticsKey);
    return data ? JSON.parse(data) : { global: { totalShares: 0, platforms: {} }, scholarships: {} };
  }

  // Save analytics data
  saveAnalytics(analytics) {
    localStorage.setItem(this.analyticsKey, JSON.stringify(analytics));
  }

  // Get share statistics for a specific scholarship
  getScholarshipShareStats(scholarshipId) {
    const analytics = this.getAnalytics();
    const scholarshipStats = analytics.scholarships[scholarshipId];

    if (!scholarshipStats) {
      return {
        totalShares: 0,
        platforms: {},
        lastShared: null,
        topPlatform: null
      };
    }

    // Find top platform
    const topPlatform = Object.entries(scholarshipStats.platforms)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      totalShares: scholarshipStats.totalShares,
      platforms: scholarshipStats.platforms,
      lastShared: scholarshipStats.lastShared,
      topPlatform: topPlatform ? { name: topPlatform[0], count: topPlatform[1] } : null
    };
  }

  // Generate tracking URL with UTM parameters
  generateTrackingUrl(scholarshipId, platform, userId = null) {
    const baseUrl = `${window.location.origin}/scholarships/${scholarshipId}`;
    const params = new URLSearchParams({
      utm_source: 'talentsphere',
      utm_medium: 'social',
      utm_campaign: 'scholarship_share',
      utm_content: platform,
      shared_at: Date.now()
    });

    if (userId) {
      params.set('shared_by', userId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate personalized share templates
  generateShareTemplates(scholarship, organizationName) {
    const title = scholarship.title;
    const amount = scholarship.amount_max 
      ? `up to ${this.formatCurrency(scholarship.amount_max, scholarship.currency || 'USD')}`
      : 'financial support';
    const deadline = scholarship.application_deadline 
      ? new Date(scholarship.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'soon';
    
    const communityLink = '\n\n🌟 Join our community for more opportunities: http://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl';

    const templates = [
      {
        name: '💼 Professional',
        template: `🎓 Exciting scholarship opportunity! ${organizationName} is offering ${amount} for ${title}. Application deadline: ${deadline}. This could be a great fit for students in your network!${communityLink} #Scholarship #Education #Opportunity`
      },
      {
        name: '👋 Casual',
        template: `Hey! 👋 Just found an amazing scholarship - ${title} from ${organizationName}. Award: ${amount}. Know anyone who should apply? Deadline is ${deadline}! 📚✨${communityLink}`
      },
      {
        name: '⚡ Urgent',
        template: `⚡ DEADLINE ALERT: ${organizationName} scholarship (${amount}) closes ${deadline}! If you or someone you know fits ${title}, apply NOW! Don't miss this opportunity! 🎯${communityLink}`
      },
      {
        name: '💫 Inspirational',
        template: `💫 Education changes lives! ${organizationName} believes in investing in students through their ${title} scholarship (${amount}). Help spread the word - someone's future could start here! Apply by ${deadline}.${communityLink} #EducationMatters`
      },
      {
        name: '📋 Detailed',
        template: `📢 Scholarship Alert:\n🏆 ${title}\n🏢 ${organizationName}\n💰 ${amount}\n⏰ Deadline: ${deadline}\n\nPerfect opportunity for eligible students! Share with your network to help someone achieve their educational dreams!${communityLink}`
      },
      {
        name: '🌟 Student-Focused',
        template: `🌟 Students! Check out this scholarship from ${organizationName} - ${amount} available! ${title}. Applications close ${deadline}. Take this chance to invest in your future!${communityLink} #StudentLife #ScholarshipOpportunity`
      },
      {
        name: '🎯 Call-to-Action',
        template: `📣 Don't let this pass you by! ${organizationName} is offering ${title} with awards up to ${amount}. Deadline: ${deadline}. Tag a student who needs to see this!${communityLink} #EducationOpportunity #ApplyNow`
      }
    ];

    return templates;
  }

  // Generate share suggestions/tips
  generateShareSuggestions(scholarship) {
    const suggestions = [
      `💡 Share in student groups or forums where eligible candidates might be active`,
      `📱 Tag students, educators, or counselors who work with the target demographic`,
      `🎯 Post during peak engagement times (early morning or evening) for maximum visibility`,
      `✨ Add your personal experience or why you think this scholarship is valuable`,
      `🔄 Reshare closer to the deadline to remind people to apply`
    ];

    // Add field-specific suggestions
    if (scholarship.field_of_study) {
      suggestions.push(`🎓 Target students in ${scholarship.field_of_study} programs or related groups`);
    }

    if (scholarship.country) {
      suggestions.push(`🌍 Share in ${scholarship.country}-focused student communities`);
    }

    if (scholarship.study_level) {
      suggestions.push(`📚 Reach out to ${scholarship.study_level.replace('_', ' ')} students specifically`);
    }

    return suggestions;
  }

  // Generate email content
  generateEmailContent(scholarship, organizationName, recipientName, scholarshipUrl, customMessage = '') {
    const amount = scholarship.amount_max 
      ? this.formatCurrency(scholarship.amount_max, scholarship.currency || 'USD')
      : 'financial support';
    const deadline = scholarship.application_deadline 
      ? new Date(scholarship.application_deadline).toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Check scholarship page for details';

    return `Hi ${recipientName},

I wanted to share an exciting scholarship opportunity that I think might interest you:

${scholarship.title}
Offered by: ${organizationName}
Award Amount: ${amount}
Application Deadline: ${deadline}

${customMessage ? `\n${customMessage}\n` : ''}

${scholarship.summary || 'This scholarship provides financial support to help students achieve their educational goals.'}

You can find more details and apply here:
${scholarshipUrl}

${scholarship.study_level ? `Study Level: ${scholarship.study_level.replace('_', ' ')}\n` : ''}${scholarship.field_of_study ? `Field of Study: ${scholarship.field_of_study}\n` : ''}${scholarship.country ? `Location: ${scholarship.country}\n` : ''}

Don't miss this opportunity to invest in your education! If you have any questions, feel free to reach out.

🌟 Join our community for more opportunities like this:
http://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl

Best of luck with your application!

---
Shared via TalentSphere - Connecting Students with Opportunities
`;
  }

  // Format currency helper
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  // Get all shares for a scholarship
  getScholarshipShares(scholarshipId) {
    const shareData = this.getShareData();
    return shareData.shares.filter(share => share.scholarshipId === scholarshipId);
  }

  // Get shares by platform
  getSharesByPlatform(platform) {
    const shareData = this.getShareData();
    return shareData.shares.filter(share => share.platform === platform);
  }

  // Get recent shares
  getRecentShares(limit = 10) {
    const shareData = this.getShareData();
    return shareData.shares
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Export share data
  exportShareData() {
    const shareData = this.getShareData();
    const analytics = this.getAnalytics();
    
    const exportData = {
      shares: shareData.shares,
      analytics: analytics,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `scholarship-shares-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Clear all share data
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.analyticsKey);
  }

  // Get global statistics
  getGlobalStats() {
    const analytics = this.getAnalytics();
    return analytics.global || { totalShares: 0, platforms: {} };
  }

  // Get top shared scholarships
  getTopSharedScholarships(limit = 5) {
    const analytics = this.getAnalytics();
    
    if (!analytics.scholarships) {
      return [];
    }

    return Object.entries(analytics.scholarships)
      .map(([id, stats]) => ({
        scholarshipId: id,
        ...stats
      }))
      .sort((a, b) => b.totalShares - a.totalShares)
      .slice(0, limit);
  }

  // Check if scholarship has been shared before
  hasBeenShared(scholarshipId) {
    const stats = this.getScholarshipShareStats(scholarshipId);
    return stats.totalShares > 0;
  }

  // Get share trend (last 7 days)
  getShareTrend(scholarshipId = null) {
    const shareData = this.getShareData();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let shares = shareData.shares.filter(
      share => new Date(share.timestamp) >= sevenDaysAgo
    );

    if (scholarshipId) {
      shares = shares.filter(share => share.scholarshipId === scholarshipId);
    }

    // Group by day
    const trend = {};
    shares.forEach(share => {
      const date = new Date(share.timestamp).toLocaleDateString();
      trend[date] = (trend[date] || 0) + 1;
    });

    return trend;
  }
}

// Export singleton instance
const shareScholarshipService = new ShareScholarshipService();
export default shareScholarshipService;
