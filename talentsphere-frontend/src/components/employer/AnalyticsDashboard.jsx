import React from 'react';
import { 
  BarChart3,
  TrendingUp,
  Target,
  Star,
  Globe,
  Lightbulb,
  Download,
  FileText,
  Briefcase,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const AnalyticsDashboard = ({
  analyticsData,
  dateRange,
  onDateRangeChange,
  onExport,
  loading
}) => {
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
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
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
                  {analyticsData.jobGrowth > 0 ? '+' : ''}{analyticsData.jobGrowth}% vs last period
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
                  {analyticsData.hireGrowth > 0 ? '+' : ''}{analyticsData.hireGrowth}% vs last period
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
                  {analyticsData.timeToHireChange > 0 ? '+' : ''}{analyticsData.timeToHireChange} days vs last period
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
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Application trends chart would be displayed here</p>
                <p className="text-sm text-gray-400">Integration with chart library needed</p>
              </div>
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
                <span className="text-sm font-medium">Under Review</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.underReview} 
                  ({Math.round((analyticsData.funnelData.underReview / analyticsData.funnelData.applications) * 100)}%)
                </span>
              </div>
              <Progress 
                value={(analyticsData.funnelData.underReview / analyticsData.funnelData.applications) * 100} 
                className="h-2" 
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Interviewed</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.interviewed} 
                  ({Math.round((analyticsData.funnelData.interviewed / analyticsData.funnelData.applications) * 100)}%)
                </span>
              </div>
              <Progress 
                value={(analyticsData.funnelData.interviewed / analyticsData.funnelData.applications) * 100} 
                className="h-2" 
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hired</span>
                <span className="text-sm font-bold">
                  {analyticsData.funnelData.hired} 
                  ({Math.round((analyticsData.funnelData.hired / analyticsData.funnelData.applications) * 100)}%)
                </span>
              </div>
              <Progress 
                value={(analyticsData.funnelData.hired / analyticsData.funnelData.applications) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Application Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Application Sources
            </CardTitle>
            <CardDescription>Where candidates find your jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{source.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({source.percentage}%)</span>
                  </div>
                </div>
              ))}
              {analyticsData.sources.length === 0 && (
                <div className="text-center py-8">
                  <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No source data yet</p>
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
              AI Insights
            </CardTitle>
            <CardDescription>Personalized recommendations</CardDescription>
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

        {/* Time-based Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Time-based Metrics</CardTitle>
            <CardDescription>Average times for hiring stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Time to First Review</span>
                </div>
                <span className="text-sm font-bold">{analyticsData.timeMetrics.firstReview} hours</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Time to Interview</span>
                </div>
                <span className="text-sm font-bold">{analyticsData.timeMetrics.interview} days</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Time to Hire</span>
                </div>
                <span className="text-sm font-bold">{analyticsData.timeMetrics.hire} days</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Response Time</span>
                </div>
                <span className="text-sm font-bold">{analyticsData.timeMetrics.response} hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
