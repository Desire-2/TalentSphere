// Advanced Analytics Service
// Leverages backend analytics endpoints for comprehensive data insights

import api from '../api';

export class AdvancedAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // ============ ADMIN ANALYTICS ============

  /**
   * Get comprehensive admin dashboard analytics
   */
  async getAdminDashboardAnalytics(timeRange = 30) {
    const cacheKey = `admin-dashboard-${timeRange}`;
    
    if (this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const [dashboard, userAnalytics, jobStats, revenueData, systemHealth] = await Promise.all([
        api.getAdminDashboard({ days: timeRange }),
        api.getUserAnalytics({ days: timeRange }),
        this.getJobStats(timeRange),
        api.getRevenueAnalytics({ days: timeRange }),
        api.getSystemHealth()
      ]);

      const analyticsData = {
        overview: dashboard.overview,
        userMetrics: {
          ...dashboard.user_breakdown,
          trends: userAnalytics.daily_registrations || [],
          activeUsers: userAnalytics.daily_active_users || [],
          verificationStats: userAnalytics.verification_stats || []
        },
        jobMetrics: {
          ...dashboard.job_metrics,
          performance: jobStats.performance || {},
          trends: jobStats.trends || {},
          categoryBreakdown: jobStats.distributions?.category || []
        },
        revenueMetrics: {
          ...dashboard.revenue_metrics,
          trends: revenueData.daily_revenue || [],
          breakdown: revenueData.revenue_by_purpose || [],
          topClients: revenueData.top_companies || []
        },
        systemHealth: {
          ...systemHealth,
          uptime: this.calculateUptime(systemHealth),
          performanceScore: this.calculatePerformanceScore(systemHealth)
        },
        insights: this.generateAdminInsights(dashboard, userAnalytics, jobStats, revenueData)
      };

      this.setCache(cacheKey, analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Failed to get admin dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for admin dashboard
   */
  async getRealTimeMetrics() {
    try {
      const [currentUsers, recentActivity, systemStatus] = await Promise.all([
        this.getCurrentActiveUsers(),
        this.getRecentActivity(),
        this.getSystemStatus()
      ]);

      return {
        currentUsers: currentUsers.count || 0,
        recentActivity: recentActivity.activities || [],
        systemStatus: systemStatus.status || 'unknown',
        alerts: this.generateRealTimeAlerts(currentUsers, recentActivity, systemStatus)
      };
    } catch (error) {
      console.error('Failed to get real-time metrics:', error);
      return {};
    }
  }

  /**
   * Get advanced job statistics
   */
  async getJobStats(timeRange = 30) {
    try {
      const response = await api.get(`/admin/jobs/stats?days=${timeRange}`);
      return {
        ...response,
        conversionRates: this.calculateJobConversionRates(response),
        performanceIndex: this.calculateJobPerformanceIndex(response),
        marketTrends: this.analyzeMarketTrends(response)
      };
    } catch (error) {
      console.error('Failed to get job stats:', error);
      return {};
    }
  }

  // ============ EMPLOYER ANALYTICS ============

  /**
   * Get employer dashboard analytics
   */
  async getEmployerAnalytics(employerId, timeRange = 30) {
    const cacheKey = `employer-${employerId}-${timeRange}`;
    
    if (this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const [jobPerformance, applicationMetrics, candidateInsights] = await Promise.all([
        this.getJobPerformanceMetrics(employerId, timeRange),
        this.getApplicationMetrics(employerId, timeRange),
        this.getCandidateInsights(employerId, timeRange)
      ]);

      const analyticsData = {
        jobPerformance: {
          ...jobPerformance,
          trends: this.calculateJobTrends(jobPerformance),
          benchmarks: this.calculateBenchmarks(jobPerformance)
        },
        applicationMetrics: {
          ...applicationMetrics,
          conversionFunnel: this.buildConversionFunnel(applicationMetrics),
          timeToHire: this.calculateTimeToHire(applicationMetrics)
        },
        candidateInsights: {
          ...candidateInsights,
          topSkills: this.extractTopSkills(candidateInsights),
          sourceAnalysis: this.analyzeCandidateSources(candidateInsights)
        },
        recommendations: this.generateEmployerRecommendations(
          jobPerformance, 
          applicationMetrics, 
          candidateInsights
        )
      };

      this.setCache(cacheKey, analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Failed to get employer analytics:', error);
      throw error;
    }
  }

  /**
   * Get job performance metrics
   */
  async getJobPerformanceMetrics(employerId, timeRange) {
    try {
      const response = await api.get(`/employer/job-performance?days=${timeRange}`);
      return {
        totalJobs: response.total_jobs || 0,
        activeJobs: response.active_jobs || 0,
        viewsPerJob: response.average_views || 0,
        applicationsPerJob: response.average_applications || 0,
        conversionRate: response.conversion_rate || 0,
        topPerformingJobs: response.top_jobs || [],
        performanceByCategory: response.category_performance || []
      };
    } catch (error) {
      console.warn('Failed to get job performance metrics:', error);
      return {};
    }
  }

  /**
   * Get application flow metrics
   */
  async getApplicationMetrics(employerId, timeRange) {
    try {
      const response = await api.get(`/employer/application-metrics?days=${timeRange}`);
      return {
        totalApplications: response.total_applications || 0,
        byStatus: response.status_breakdown || {},
        responseTime: response.average_response_time || 0,
        interviewRate: response.interview_rate || 0,
        hireRate: response.hire_rate || 0,
        withdrawalRate: response.withdrawal_rate || 0,
        dailyApplications: response.daily_applications || []
      };
    } catch (error) {
      console.warn('Failed to get application metrics:', error);
      return {};
    }
  }

  // ============ JOB SEEKER ANALYTICS ============

  /**
   * Get job seeker analytics
   */
  async getJobSeekerAnalytics(userId, timeRange = 30) {
    const cacheKey = `jobseeker-${userId}-${timeRange}`;
    
    if (this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const [applicationHistory, searchBehavior, marketPosition] = await Promise.all([
        this.getApplicationHistory(userId, timeRange),
        this.getSearchBehavior(userId, timeRange),
        this.getMarketPosition(userId)
      ]);

      const analyticsData = {
        applicationHistory: {
          ...applicationHistory,
          successTrends: this.calculateSuccessTrends(applicationHistory),
          responsePatterns: this.analyzeResponsePatterns(applicationHistory)
        },
        searchBehavior: {
          ...searchBehavior,
          preferences: this.extractSearchPreferences(searchBehavior),
          opportunities: this.identifyMissedOpportunities(searchBehavior)
        },
        marketPosition: {
          ...marketPosition,
          competitiveIndex: this.calculateCompetitiveIndex(marketPosition),
          improvementAreas: this.identifyImprovementAreas(marketPosition)
        },
        insights: this.generateJobSeekerInsights(applicationHistory, searchBehavior, marketPosition)
      };

      this.setCache(cacheKey, analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Failed to get job seeker analytics:', error);
      throw error;
    }
  }

  // ============ PREDICTIVE ANALYTICS ============

  /**
   * Get predictive hiring analytics
   */
  async getPredictiveHiringAnalytics(jobId) {
    try {
      const [historicalData, marketData, candidatePool] = await Promise.all([
        this.getHistoricalHiringData(jobId),
        this.getMarketTrendData(jobId),
        this.getCandidatePoolAnalysis(jobId)
      ]);

      return {
        timeToFill: this.predictTimeToFill(historicalData, marketData),
        candidateQuality: this.predictCandidateQuality(candidatePool),
        competitionLevel: this.assessCompetitionLevel(marketData),
        recommendedActions: this.generateRecommendedActions(
          historicalData, 
          marketData, 
          candidatePool
        ),
        successProbability: this.calculateSuccessProbability(
          historicalData, 
          marketData, 
          candidatePool
        )
      };
    } catch (error) {
      console.error('Failed to get predictive hiring analytics:', error);
      return {};
    }
  }

  /**
   * Get market intelligence
   */
  async getMarketIntelligence(filters = {}) {
    try {
      const [salaryTrends, skillDemand, locationAnalysis, industryGrowth] = await Promise.all([
        this.getSalaryTrends(filters),
        this.getSkillDemandAnalysis(filters),
        this.getLocationAnalysis(filters),
        this.getIndustryGrowthAnalysis(filters)
      ]);

      return {
        salaryTrends: {
          ...salaryTrends,
          projections: this.projectSalaryTrends(salaryTrends)
        },
        skillDemand: {
          ...skillDemand,
          emerging: this.identifyEmergingSkills(skillDemand),
          declining: this.identifyDecliningSkills(skillDemand)
        },
        locationAnalysis: {
          ...locationAnalysis,
          opportunities: this.identifyLocationOpportunities(locationAnalysis)
        },
        industryGrowth: {
          ...industryGrowth,
          forecasts: this.generateIndustryForecasts(industryGrowth)
        }
      };
    } catch (error) {
      console.error('Failed to get market intelligence:', error);
      return {};
    }
  }

  // ============ REAL-TIME ANALYTICS ============

  /**
   * Stream real-time analytics
   */
  startRealTimeStream(callback, filters = {}) {
    const eventSource = new EventSource(`/api/analytics/stream?${new URLSearchParams(filters)}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(this.processRealTimeData(data));
      } catch (error) {
        console.error('Error processing real-time data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time stream error:', error);
      setTimeout(() => this.startRealTimeStream(callback, filters), 5000); // Reconnect
    };

    return eventSource;
  }

  /**
   * Process real-time analytics data
   */
  processRealTimeData(rawData) {
    return {
      timestamp: new Date().toISOString(),
      metrics: rawData.metrics || {},
      alerts: this.detectAnomalies(rawData),
      trends: this.calculateInstantTrends(rawData),
      recommendations: this.generateRealTimeRecommendations(rawData)
    };
  }

  // ============ CACHE MANAGEMENT ============

  isCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // ============ HELPER METHODS ============

  /**
   * Generate admin insights
   */
  generateAdminInsights(dashboard, userAnalytics, jobStats, revenueData) {
    const insights = [];
    
    // User growth insight
    const userGrowth = this.calculateGrowthRate(userAnalytics.daily_registrations || []);
    if (userGrowth > 20) {
      insights.push({
        type: 'positive',
        category: 'user_growth',
        message: `User registrations increased by ${userGrowth.toFixed(1)}% this period`,
        action: 'Consider scaling infrastructure'
      });
    }

    // Revenue insight
    const revenueGrowth = this.calculateGrowthRate(revenueData.daily_revenue || []);
    if (revenueGrowth < -10) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        message: `Revenue declined by ${Math.abs(revenueGrowth).toFixed(1)}% this period`,
        action: 'Review pricing and marketing strategies'
      });
    }

    // Job posting trends
    const jobTrends = this.analyzeJobTrends(jobStats);
    if (jobTrends.peakDay) {
      insights.push({
        type: 'info',
        category: 'job_trends',
        message: `Peak job posting day is ${jobTrends.peakDay}`,
        action: 'Optimize featured ad campaigns for peak days'
      });
    }

    return insights;
  }

  /**
   * Calculate growth rate from time series data
   */
  calculateGrowthRate(timeSeries) {
    if (timeSeries.length < 2) return 0;
    
    const recent = timeSeries.slice(-7).reduce((sum, item) => sum + (item.count || item.value || 0), 0);
    const previous = timeSeries.slice(-14, -7).reduce((sum, item) => sum + (item.count || item.value || 0), 0);
    
    if (previous === 0) return 0;
    
    return ((recent - previous) / previous) * 100;
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptime(systemHealth) {
    // Mock calculation - in real implementation, this would use actual uptime data
    const errorCount = Object.values(systemHealth.error_indicators || {}).reduce((sum, val) => sum + val, 0);
    const totalRequests = systemHealth.database_stats?.total_records?.users || 1000;
    
    return Math.max(95, 100 - (errorCount / totalRequests * 100));
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(systemHealth) {
    const uptime = this.calculateUptime(systemHealth);
    const errorRate = Object.values(systemHealth.error_indicators || {}).reduce((sum, val) => sum + val, 0);
    
    let score = 100;
    score -= (100 - uptime); // Deduct for downtime
    score -= Math.min(errorRate / 10, 20); // Deduct for errors
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect anomalies in real-time data
   */
  detectAnomalies(data) {
    const anomalies = [];
    
    // Simple anomaly detection based on thresholds
    if (data.error_rate > 5) {
      anomalies.push({
        type: 'error_rate',
        severity: 'high',
        message: 'Error rate is unusually high',
        value: data.error_rate
      });
    }
    
    if (data.response_time > 2000) {
      anomalies.push({
        type: 'response_time',
        severity: 'medium',
        message: 'Response time is slower than usual',
        value: data.response_time
      });
    }
    
    return anomalies;
  }

  /**
   * Generate real-time recommendations
   */
  generateRealTimeRecommendations(data) {
    const recommendations = [];
    
    if (data.active_users > data.average_active_users * 1.5) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        message: 'Consider scaling up infrastructure due to high user activity'
      });
    }
    
    if (data.conversion_rate < data.average_conversion_rate * 0.8) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Conversion rate is below average - review user experience'
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const advancedAnalyticsService = new AdvancedAnalyticsService();
