/**
 * ShareScholarship Service
 * Handles scholarship sharing functionality, tracking, and analytics
 */

class ShareScholarshipService {
  constructor() {
    this.storageKey = 'talentsphere_scholarship_shares';
    this.analyticsKey = 'talentsphere_scholarship_analytics';
  }

  // Normalize mixed requirement formats into clean text items
  normalizeRequirementItems(rawValue) {
    if (!rawValue) return [];

    if (Array.isArray(rawValue)) {
      return rawValue
        .map((item) => (typeof item === 'string' ? item : String(item || '')))
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof rawValue === 'string') {
      return rawValue
        .split(/\n|,|;|\||•|\u2022/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  getEligibilitySections(scholarship) {
    const sections = [];

    const eligibility = this.normalizeRequirementItems(scholarship?.eligibility_requirements).slice(0, 5);
    const fieldOfStudy = scholarship?.field_of_study ? String(scholarship.field_of_study).trim() : '';
    const studyLevel = scholarship?.study_level ? String(scholarship.study_level).replace(/_/g, ' ').trim() : '';
    const nationality = scholarship?.nationality_requirements ? String(scholarship.nationality_requirements).trim() : '';
    const gender = scholarship?.gender_requirements ? String(scholarship.gender_requirements).trim() : '';
    const otherRequirements = this.normalizeRequirementItems(scholarship?.other_requirements).slice(0, 3);
    const minGpa = scholarship?.min_gpa;
    const maxAge = scholarship?.max_age;

    if (eligibility.length) sections.push(`Eligibility: ${eligibility.join(', ')}`);
    if (fieldOfStudy) sections.push(`Field: ${fieldOfStudy}`);
    if (studyLevel) sections.push(`Study Level: ${studyLevel}`);
    if (nationality) sections.push(`Nationality: ${nationality}`);
    if (gender && gender.toLowerCase() !== 'any') sections.push(`Gender: ${gender}`);
    if (minGpa) sections.push(`Minimum GPA: ${minGpa}`);
    if (maxAge) sections.push(`Age Limit: Up to ${maxAge}`);
    if (otherRequirements.length) sections.push(`Other: ${otherRequirements.join(', ')}`);

    return sections;
  }

  buildShareMessage(scholarship, organizationName, options = {}) {
    const {
      includeLinks = true,
      includeEligibility = true,
      applyUrl = `https://jobs.afritechbridge.online/scholarships/${scholarship.id}`,
      communityUrl = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl'
    } = options;

    const scholarshipTitle = scholarship.title;
    const amount = scholarship.amount_max
      ? this.formatCurrency(scholarship.amount_max, scholarship.currency || 'USD')
      : 'Various amounts';
    const deadline = scholarship.application_deadline
      ? new Date(scholarship.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Open';

    const eligibilitySections = includeEligibility ? this.getEligibilitySections(scholarship) : [];

    const lines = [
      `🎓 Scholarship Opportunity: ${scholarshipTitle}`,
      `🏢 Provider: ${organizationName}`,
      `💰 Award: ${amount}`,
      `⏰ Deadline: ${deadline}`,
      ...eligibilitySections.map((section) => `🧩 ${section}`)
    ];

    if (includeLinks) {
      lines.push(`🔗 Apply Here: ${applyUrl}`);
      lines.push(`🌍 Join Our Community: ${communityUrl}`);
    }

    return lines.filter(Boolean).join('\n');
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

    const scholarshipLink = `${window.location.origin}/scholarships/${scholarship.id}`;
    const applyLink = `https://jobs.afritechbridge.online/scholarships/${scholarship.id}`;
    const communityLink = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl';
    const eligibilitySections = this.getEligibilitySections(scholarship);
    const eligibilityBlock = eligibilitySections.length
      ? `\n${eligibilitySections.map((section) => `🧩 ${section}`).join('\n')}`
      : '';
    const linksBlock = `\n\n🔗 Apply Here: ${applyLink}\n🌍 Join Our Community: ${communityLink}`;

    const templates = [
      {
        name: '💼 Professional',
        template: `🎓 Exciting scholarship opportunity\n\n${organizationName} is offering ${amount} for ${title}. Deadline: ${deadline}.${eligibilityBlock}${linksBlock}\n\n#Scholarship #Education #Opportunity`
      },
      {
        name: '👋 Casual',
        template: `Hey! 👋\n\nI found an amazing scholarship: ${title} from ${organizationName}. Award: ${amount}. Deadline: ${deadline}.${eligibilityBlock}${linksBlock}\n\n📚✨`
      },
      {
        name: '⚡ Urgent',
        template: `⚡ DEADLINE ALERT\n\n${organizationName} scholarship (${amount}) closes ${deadline}. If you or someone you know fits ${title}, apply now.${eligibilityBlock}${linksBlock}\n\n🎯`
      },
      {
        name: '💫 Inspirational',
        template: `💫 Education changes lives\n\n${organizationName} is investing in students through ${title} (${amount}). Help spread the word. Deadline: ${deadline}.${eligibilityBlock}${linksBlock}\n\n#EducationMatters`
      },
      {
        name: '📋 Detailed',
        template: `📢 SCHOLARSHIP ALERT\n\n🏆 ${title}\n🏢 ${organizationName}\n💰 ${amount}\n⏰ Deadline: ${deadline}${eligibilitySections.length ? `\n${eligibilitySections.map((section) => `🧩 ${section}`).join('\n')}` : ''}${linksBlock}\n\nPerfect opportunity for eligible students.`
      },
      {
        name: '🌟 Student-Focused',
        template: `🌟 Students, this is for you\n\n${organizationName} is offering ${title} with ${amount} available. Applications close ${deadline}.${eligibilityBlock}${linksBlock}\n\n#StudentLife #ScholarshipOpportunity`
      },
      {
        name: '🎯 Call-to-Action',
        template: `📣 Don't miss this\n\n${organizationName} is offering ${title} with awards up to ${amount}. Deadline: ${deadline}. Tag a student who should see this.${eligibilityBlock}${linksBlock}\n\n#EducationOpportunity #ApplyNow`
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

    const applyLink = `https://jobs.afritechbridge.online/scholarships/${scholarship.id}`;
    const communityLink = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl';
    const eligibilitySections = this.getEligibilitySections(scholarship);
    const eligibilityBlock = eligibilitySections.length
      ? `Eligibility Snapshot:\n${eligibilitySections.map((section) => `- ${section}`).join('\n')}\n\n`
      : '';

    return `Hi ${recipientName},

I wanted to share an exciting scholarship opportunity that I think might interest you:

${scholarship.title}
Offered by: ${organizationName}
Award Amount: ${amount}
Application Deadline: ${deadline}

${customMessage ? `\n${customMessage}\n` : ''}

${scholarship.summary || 'This scholarship provides financial support to help students achieve their educational goals.'}

${eligibilityBlock}You can find more details and apply here:

Apply Link:
${applyLink}

Community Link:
${communityLink}

${scholarship.study_level ? `Study Level: ${scholarship.study_level.replace('_', ' ')}\n` : ''}${scholarship.field_of_study ? `Field of Study: ${scholarship.field_of_study}\n` : ''}${scholarship.country ? `Location: ${scholarship.country}\n` : ''}

Don't miss this opportunity to invest in your education! If you have any questions, feel free to reach out.

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
