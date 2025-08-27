import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Calendar,
  Briefcase,
  Star,
  Clock,
  Target,
  Activity,
  Plus,
  AlertCircle,
  CheckCircle,
  Bell,
  Zap,
  Award,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDate, getStatusColor, generateInsights } from '../../utils/employer/dashboardUtils';
import { useDashboardData } from '../../hooks/useDashboardData';
import apiService from '../../services/api';

const DashboardOverview = ({ 
  onCreateJob, 
  onViewAllJobs, 
  onViewAllApplications, 
  onReviewApplication,
  onViewJob 
}) => {
  const { 
    dashboardData, 
    loading, 
    error, 
    lastFetch,
    refreshAll,
    refreshStats,
    refreshJobs,
    refreshApplications
  } = useDashboardData();

  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Fetch additional performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoadingPerformance(true);
        
        // Get application trends for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Mock performance data - in real implementation, this would come from backend
        setPerformanceData({
          applicationTrend: 23, // +23% increase
          responseRate: 12, // +12% improvement  
          timeToHireReduction: 5 // -5 days improvement
        });
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoadingPerformance(false);
      }
    };

    fetchPerformanceData();
  }, []);

  // Handle action clicks
  const handleCreateJob = () => {
    if (onCreateJob) {
      onCreateJob();
    }
  };

  const handleViewAllJobs = () => {
    if (onViewAllJobs) {
      onViewAllJobs();
    }
  };

  const handleViewAllApplications = () => {
    if (onViewAllApplications) {
      onViewAllApplications();
    }
  };

  const handleReviewApplication = (applicationId) => {
    if (onReviewApplication) {
      onReviewApplication(applicationId);
    }
  };

  const handleViewJob = (jobId) => {
    if (onViewJob) {
      onViewJob(jobId);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshAll();
  };

  // Navigate to search candidates
  const handleSearchCandidates = async () => {
    try {
      // This would typically navigate to a candidates search page
      console.log('Navigate to candidate search');
    } catch (err) {
      console.error('Failed to navigate to candidate search:', err);
    }
  };

  // Navigate to analytics
  const handleViewAnalytics = () => {
    // This would typically navigate to an analytics page
    console.log('Navigate to analytics');
  };

  const insights = generateInsights(dashboardData);

  if (loading.dashboard && !dashboardData.stats.activeJobs) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData.stats.activeJobs) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Failed to load dashboard data</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          {lastFetch && (
            <p className="text-sm text-gray-500">
              Last updated: {formatDate(lastFetch)}
            </p>
          )}
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={loading.dashboard}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading.dashboard ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Real-time Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.stats.activeJobs || 0}</p>
                <p className="text-xs text-gray-500">of {dashboardData.stats.totalJobs || 0} total</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Applications</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.stats.newApplications || 0}</p>
                <p className="text-xs text-gray-500">of {dashboardData.stats.totalApplications || 0} total</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.stats.totalViews || 0}</p>
                <p className="text-xs text-gray-500">across all jobs</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.stats.pendingReviews || 0}</p>
                <p className="text-xs text-gray-500">need attention</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Insights */}
      {(dashboardData.alerts.length > 0 || insights.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          {dashboardData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'urgent' ? 'border-l-red-500 bg-red-50' :
                    alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      {alert.type === 'urgent' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                      {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    {insight.action && (
                      <Button variant="link" size="sm" className="p-0 mt-2 h-auto">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks to manage your hiring process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={handleCreateJob} className="flex flex-col items-center gap-2 h-auto py-4">
              <Plus className="w-6 h-6" />
              <span>Post New Job</span>
            </Button>
            <Button variant="outline" onClick={handleViewAllApplications} className="flex flex-col items-center gap-2 h-auto py-4">
              <FileText className="w-6 h-6" />
              <span>Review Applications</span>
            </Button>
            <Button variant="outline" onClick={handleSearchCandidates} className="flex flex-col items-center gap-2 h-auto py-4">
              <Users className="w-6 h-6" />
              <span>Search Candidates</span>
            </Button>
            <Button variant="outline" onClick={handleViewAnalytics} className="flex flex-col items-center gap-2 h-auto py-4">
              <TrendingUp className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Trends</CardTitle>
            <CardDescription>Last 30 days vs previous period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Applications Received</span>
                <span className="font-bold text-green-600">
                  {performanceData ? `+${performanceData.applicationTrend}%` : 'Loading...'}
                </span>
              </div>
              <Progress value={performanceData?.applicationTrend || 0} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm">Response Rate</span>
                <span className="font-bold text-blue-600">
                  {performanceData ? `+${performanceData.responseRate}%` : 'Loading...'}
                </span>
              </div>
              <Progress value={performanceData?.responseRate || 0} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm">Time to Hire</span>
                <span className="font-bold text-purple-600">
                  {performanceData ? `-${performanceData.timeToHireReduction} days` : 'Loading...'}
                </span>
              </div>
              <Progress value={performanceData?.timeToHireReduction ? (performanceData.timeToHireReduction / 10) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hiring Funnel</CardTitle>
            <CardDescription>Current application pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Applied</span>
                <span className="font-bold">{dashboardData.stats.totalApplications || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Reviewed</span>
                <span className="font-bold">{Math.floor((dashboardData.stats.totalApplications || 0) * 0.7)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Shortlisted</span>
                <span className="font-bold">{dashboardData.stats.shortlistedApplications || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Interviewed</span>
                <span className="font-bold">{dashboardData.stats.interviewsScheduled || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Hired</span>
                <span className="font-bold">{dashboardData.stats.hiresMade || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.stats.newApplications > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New application received</span>
                  <span className="text-xs text-gray-500 ml-auto">Recent</span>
                </div>
              )}
              {dashboardData.stats.totalViews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Jobs viewed {dashboardData.stats.totalViews} times</span>
                  <span className="text-xs text-gray-500 ml-auto">Today</span>
                </div>
              )}
              {dashboardData.stats.interviewsScheduled > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Interview scheduled</span>
                  <span className="text-xs text-gray-500 ml-auto">Recent</span>
                </div>
              )}
              {dashboardData.stats.shortlistedApplications > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Application shortlisted</span>
                  <span className="text-xs text-gray-500 ml-auto">Recent</span>
                </div>
              )}
              {dashboardData.stats.totalApplications === 0 && dashboardData.stats.activeJobs === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No recent activity</p>
                  <p className="text-xs text-gray-400">Start by posting a job</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs and Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Recent Job Postings
            </CardTitle>
            <CardDescription>Your latest job postings and their performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentJobs.length > 0 ? (
              dashboardData.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium cursor-pointer hover:text-blue-600" onClick={() => handleViewJob(job.id)}>
                        {job.title}
                      </h4>
                      {job.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {job.application_count || 0} applications
                      </span>
                      <span className="capitalize">{job.employment_type || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(job.status)} text-white`}
                    >
                      {job.status}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleViewJob(job.id)}>
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No jobs posted yet</p>
                <p className="text-sm text-gray-400">Create your first job posting to get started</p>
                <Button onClick={handleCreateJob} className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={handleViewAllJobs}>
              View All Jobs ({dashboardData.stats.totalJobs || 0})
            </Button>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>Latest applications from candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentApplications.length > 0 ? (
                dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={application.applicant?.avatar} alt={application.applicant?.name} />
                        <AvatarFallback>
                          {application.applicant?.name?.split(' ').map(n => n[0]).join('') || 
                           `${application.applicant?.first_name?.[0] || ''}${application.applicant?.last_name?.[0] || ''}` || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">
                          {application.applicant?.name || 
                           `${application.applicant?.first_name || ''} ${application.applicant?.last_name || ''}`.trim() || 
                           'Anonymous'}
                        </h4>
                        <p className="text-sm text-gray-500">{application.job?.title || 'Job Title'}</p>
                        <p className="text-xs text-gray-400">{formatDate(application.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {application.match_score && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Match Score</p>
                          <p className="text-lg font-bold text-green-600">{application.match_score}%</p>
                        </div>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(application.status)} text-white`}
                      >
                        {application.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleReviewApplication(application.id)}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No applications yet</p>
                  <p className="text-sm text-gray-400">Applications will appear here once candidates apply to your jobs</p>
                  {dashboardData.stats.activeJobs === 0 && (
                    <Button onClick={handleCreateJob} className="mt-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Post a Job
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={handleViewAllApplications}>
              View All Applications ({dashboardData.stats.totalApplications || 0})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
