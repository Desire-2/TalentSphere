import apiService from './api';

class ShareJobService {
  constructor() {
    this.shareHistory = this.loadShareHistory();
  }

  // Convert different requirement formats to a clean list for sharing
  normalizeRequirementItems(rawValue) {
    if (!rawValue) return [];

    if (Array.isArray(rawValue)) {
      return rawValue
        .map((item) => (typeof item === 'string' ? item : String(item || '')))
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof rawValue === 'object') {
      const flags = [];
      if (rawValue.resume) flags.push('Resume required');
      if (rawValue.cover_letter) flags.push('Cover letter required');
      if (rawValue.portfolio) flags.push('Portfolio required');
      return flags;
    }

    if (typeof rawValue === 'string') {
      return rawValue
        .split(/\n|,|;|\||•|\u2022/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  getExperienceRequirement(job) {
    const min = Number.isFinite(job?.years_experience_min) ? job.years_experience_min : null;
    const max = Number.isFinite(job?.years_experience_max) ? job.years_experience_max : null;

    if (min && max) return `${min}-${max} years`;
    if (min) return `${min}+ years`;
    if (max) return `Up to ${max} years`;
    return '';
  }

  getApplicationRequirementItems(job) {
    const applicationRequirements = [];

    if (job?.requires_resume || job?.requirements?.resume) {
      applicationRequirements.push('Resume');
    }
    if (job?.requires_cover_letter || job?.requirements?.cover_letter) {
      applicationRequirements.push('Cover Letter');
    }
    if (job?.requires_portfolio || job?.requirements?.portfolio) {
      applicationRequirements.push('Portfolio');
    }

    return applicationRequirements;
  }

  getShareRequirementSections(job) {
    const skills = this.normalizeRequirementItems(job?.required_skills).slice(0, 6);
    const education = job?.education_requirement ? String(job.education_requirement).trim() : '';
    const experience = this.getExperienceRequirement(job);
    const applicationRequirements = this.getApplicationRequirementItems(job);
    const additional = typeof job?.requirements === 'string'
      ? this.normalizeRequirementItems(job.requirements)
          .filter((item) => !skills.includes(item))
          .slice(0, 3)
      : [];

    const sections = [];
    if (skills.length) sections.push(`Skills: ${skills.join(', ')}`);
    if (education) sections.push(`Education: ${education}`);
    if (experience) sections.push(`Experience: ${experience}`);
    if (applicationRequirements.length) {
      sections.push(`Application: ${applicationRequirements.join(', ')}`);
    }
    if (additional.length) sections.push(`Other: ${additional.join(', ')}`);

    return sections;
  }

  getShareRequirements(job, maxItems = 4) {
    return this.getShareRequirementSections(job).slice(0, maxItems);
  }

  getSalaryText(job) {
    if (job?.salary?.display) return job.salary.display;
    if (job?.salary_min && job?.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    if (job?.salary_min) return `From $${job.salary_min.toLocaleString()}`;
    if (job?.salary_max) return `Up to $${job.salary_max.toLocaleString()}`;
    return '';
  }

  buildShareMessage(job, companyName, options = {}) {
    const {
      includeLinks = true,
      includeRequirements = true,
      applyUrl = `https://jobs.afritechbridge.online/jobs/${job.id}`,
      communityUrl = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl'
    } = options;

    const location = job?.location?.display || job?.location || '';
    const salary = this.getSalaryText(job);
    const requirementSections = includeRequirements ? this.getShareRequirementSections(job) : [];

    const lines = [
      `✨ New Opportunity: ${job.title} at ${companyName}`,
      location ? `📍 Location: ${location}` : '',
      salary ? `💰 Salary: ${salary}` : '',
      ...requirementSections.map((section) => `🧩 ${section}`)
    ].filter(Boolean);

    if (includeLinks) {
      lines.push(`🔗 Apply Here: ${applyUrl}`);
      lines.push(`🌍 Join Our Community: ${communityUrl}`);
    }

    return lines.join('\n');
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

  // Record a share event
  recordShare(jobId, platform, customMessage = '', recipientCount = 1, persistRemote = true) {
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

    // Save data
    this.saveShareHistory();

    if (persistRemote) {
      this.sendShareAnalytics(shareEvent).catch(console.error);
    }

    return shareEvent;
  }

  // Send share analytics to backend
  async sendShareAnalytics(shareEvent) {
    try {
      await apiService.post(`/jobs/${shareEvent.jobId}/share`, {
        platform: shareEvent.platform,
        custom_message: shareEvent.customMessage,
        recipient_count: shareEvent.recipientCount,
        share_url: shareEvent.url,
        user_agent: shareEvent.userAgent
      });
    } catch {
      // Sharing should still succeed if analytics persistence fails.
    }
  }

  // Send direct emails through backend
  async sendDirectEmails(jobId, recipients, customMessage = '') {
    try {
      const response = await apiService.post(`/jobs/${jobId}/share/email`, {
        recipients,
        customMessage,
        timestamp: new Date().toISOString()
      });

      if (!response.success_count) {
        throw new Error(response.message || 'Email delivery failed');
      }

      this.recordShare(
        jobId,
        'direct_email',
        customMessage,
        response.success_count,
        false
      );

      return response;
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

  async fetchJobShareStats(jobId) {
    return apiService.get(`/jobs/${jobId}/share/stats`);
  }

  async fetchUserShareAnalytics() {
    return apiService.get('/analytics/shares');
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

  // Get deterministic sharing tips based on the job itself.
  getShareSuggestions(job) {
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

    return suggestions;
  }

  // Generate personalized share templates
  generateShareTemplates(job, companyName) {
    const applyLink = `https://jobs.afritechbridge.online/jobs/${job.id}`;
    const communityLink = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl';
    const requirementSections = this.getShareRequirementSections(job);
    const requirementsBlock = requirementSections.length
      ? `\n${requirementSections.map((section) => `🧩 ${section}`).join('\n')}`
      : '';

    const linksBlock = `\n\n🔗 Apply Here: ${applyLink}\n🌍 Join Our Community: ${communityLink}`;
    
    const templates = [
      {
        name: '✨ Professional',
        template: `🔍 Exciting opportunity alert!\n\n${companyName} is hiring a ${job.title}. This could be a perfect fit for someone in your network.${requirementsBlock}${linksBlock}\n\n#JobOpportunity #Hiring #${job.title.replace(/\s+/g, '')}`
      },
      {
        name: '👋 Casual',
        template: `Hey friends! 👋\n\nKnow anyone looking for a ${job.title} role? I found this opening at ${companyName}.${requirementsBlock}${linksBlock}\n\nSharing is caring! 💼`
      },
      {
        name: '⚡ Urgent',
        template: `⚡ URGENT HIRING\n\n${companyName} needs a ${job.title} ASAP. If you know someone perfect for this role, don't wait.${requirementsBlock}${linksBlock}\n\n#UrgentHiring #${job.title.replace(/\s+/g, '')}`
      },
      {
        name: '🤝 Network Helper',
        template: `🤝 Helping our network grow\n\n${companyName} is looking for a talented ${job.title}. Tag someone who should see this.${requirementsBlock}${linksBlock}\n\n#Networking #CareerOpportunity`
      },
      {
        name: '🏢 Company Focused',
        template: `🏢 ${companyName} is expanding!\n\nThey're looking for a skilled ${job.title}. Great company, great opportunity.${requirementsBlock}${linksBlock}\n\n#CompanyGrowth #Hiring #TeamExpansion`
      },
      {
        name: '🎯 Detailed',
        template: `📢 JOB ALERT\n\n🏢 Company: ${companyName}\n💼 Position: ${job.title}\n${job.location ? `📍 Location: ${job.location}\n` : ''}${requirementSections.length ? `${requirementSections.map((section) => `🧩 ${section}`).join('\n')}\n` : ''}${linksBlock}\n\nDon't miss this opportunity to advance your career. #JobSearch #CareerGrowth`
      }
    ];

    // Add job-specific elements to templates
    if (job.salary_min || job.salary_max) {
      templates.forEach(template => {
        template.template = `${template.template}\n💰 Competitive salary offered.`;
      });
    }

    if (job.employment_type === 'remote') {
      templates.forEach(template => {
        template.template = `${template.template}\n🏠 Remote work available!`;
      });
    }

    return templates;
  }

}

export default new ShareJobService();
