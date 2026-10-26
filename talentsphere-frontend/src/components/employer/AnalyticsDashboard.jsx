import React from 'react';
import { 
  BarChart3,
  TrendingUp,
  Target,
  Star,
  Lightbulb,
  Download,
  FileText,
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

const AnalyticsDashboard = ({
  analyticsData,
  onExport,
  loading
}) => {
  const totalApplications = Number(analyticsData.totalApplications) || 0;
  const funnelPercentage = (value) => (
    totalApplications > 0 ? Math.round((value / totalApplications) * 100) : 0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-gray-600">Track your hiring performance and get actionable insights</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Last 30 days</Badge>
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-blue-600">{analyticsData.totalApplications}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsData.applicationGrowth > 0 ? '+' : ''}{analyticsData.applicationGrowth}% vs last period
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData.activeJobs}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsData.totalJobs} total jobs
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Hires</p>
                <p className="text-3xl font-bold text-purple-600">{analyticsData.successfulHires}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsData.hireRate}% application-to-hire rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
                <p className="text-3xl font-bold text-orange-600">{analyticsData.avgTimeToHire}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Based on completed hires
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Application Trends
            </CardTitle>
            <CardDescription>Applications received over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1" aria-label="Applications received over the last 30 days">
              {analyticsData.applicationTrends.map((point) => {
                const maxApplications = Math.max(...analyticsData.applicationTrends.map((item) => item.applications), 1);
                return (
                  <div
                    key={point.date}
                    className="flex-1 min-w-1 rounded-t bg-blue-500"
                    style={{ height: `${Math.max((point.applications / maxApplications) * 100, point.applications ? 4 : 1)}%` }}
                    title={`${point.date}: ${point.applications} application${point.applications === 1 ? '' : 's'}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hiring Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Hiring Funnel
            </CardTitle>
            <CardDescription>Application to hire conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Applications Received</span>
                <span className="text-sm font-bold">{analyticsData.funnelData.applications}</span>
              </div>
              <Progress value={100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Awaiting Review</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.underReview} 
                  ({funnelPercentage(analyticsData.funnelData.underReview)}%)
                </span>
              </div>
              <Progress 
                value={funnelPercentage(analyticsData.funnelData.underReview)}
                className="h-2" 
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Interviewed</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.interviewed} 
                  ({funnelPercentage(analyticsData.funnelData.interviewed)}%)
                </span>
              </div>
              <Progress 
                value={funnelPercentage(analyticsData.funnelData.interviewed)}
                className="h-2" 
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hired</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.hired} 
                  ({funnelPercentage(analyticsData.funnelData.hired)}%)
                </span>
              </div>
              <Progress 
                value={funnelPercentage(analyticsData.funnelData.hired)}
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Performing Jobs
            </CardTitle>
            <CardDescription>Jobs with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topJobs.map((job, index) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.applications} applications</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{job.conversionRate}%</p>
                    <p className="text-xs text-gray-500">conversion</p>
                  </div>
                </div>
              ))}
              {analyticsData.topJobs.length === 0 && (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No performance data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Hiring Insights
            </CardTitle>
            <CardDescription>Calculated from your current hiring metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start gap-2">
                    {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                    {insight.type === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.action && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {analyticsData.insights.length === 0 && (
                <div className="text-center py-8">
                  <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Insights will appear as you gather more data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Performance Details</CardTitle>
            <CardDescription>Detailed metrics for all your jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Job Title</th>
                    <th className="text-left p-2">Views</th>
                    <th className="text-left p-2">Applications</th>
                    <th className="text-left p-2">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.jobDetails.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{job.title}</td>
                      <td className="p-2">{job.views}</td>
                      <td className="p-2">{job.applications}</td>
                      <td className="p-2">
                        <span className={`font-medium ${
                          job.conversion > 5 ? 'text-green-600' : 
                          job.conversion > 2 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {job.conversion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analyticsData.jobDetails.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No job performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
