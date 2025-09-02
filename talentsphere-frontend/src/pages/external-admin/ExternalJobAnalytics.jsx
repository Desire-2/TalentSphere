import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { externalAdminService } from '../../services/externalAdmin';
import { format, subDays, subMonths } from 'date-fns';

const ExternalJobAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedCategory, setSelectedCategory] = useState('all-categories');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchCategories();
  }, [timeRange, selectedCategory]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        time_range: timeRange,
        ...(selectedCategory !== 'all-categories' && { category_id: selectedCategory })
      };
      const response = await externalAdminService.getExternalJobAnalytics(params);
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await externalAdminService.getJobCategories();
      setCategories(Array.isArray(response) ? response : response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const exportReport = async () => {
    try {
      setLoading(true);
      const params = {
        time_range: timeRange,
        format: 'csv',
        ...(selectedCategory !== 'all-categories' && { category_id: selectedCategory })
      };
      const response = await externalAdminService.exportAnalyticsReport(params);
      
      // Create and trigger download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `external-jobs-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, changeType, icon: Icon }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-sm flex items-center mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {change > 0 ? '+' : ''}{change}%
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">External Job Analytics</h1>
          <p className="text-gray-600">Analyze performance of your external job postings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={exportReport}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Jobs Posted"
              value={analytics.total_jobs}
              change={analytics.jobs_change}
              changeType={analytics.jobs_change > 0 ? 'positive' : 'negative'}
              icon={BarChart3}
            />
            <MetricCard
              title="Total Views"
              value={analytics.total_views?.toLocaleString() || '0'}
              change={analytics.views_change}
              changeType={analytics.views_change > 0 ? 'positive' : 'negative'}
              icon={Eye}
            />
            <MetricCard
              title="Total Applications"
              value={analytics.total_applications}
              change={analytics.applications_change}
              changeType={analytics.applications_change > 0 ? 'positive' : 'negative'}
              icon={Users}
            />
            <MetricCard
              title="Avg. Time to Fill"
              value={analytics.avg_time_to_fill ? `${analytics.avg_time_to_fill} days` : 'N/A'}
              icon={Calendar}
            />
          </div>

          {/* Detailed Analytics */}
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.top_jobs?.map((job, index) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-gray-600">{job.external_company_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {job.views} views
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {job.applications} applications
                              </Badge>
                            </div>
                          </div>
                          <Badge className="ml-2">#{index + 1}</Badge>
                        </div>
                      )) || (
                        <p className="text-center text-gray-500 py-4">No job performance data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Application Conversion Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>View to Application Rate</span>
                        <Badge variant="outline">
                          {analytics.conversion_rates?.view_to_application || '0'}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Application to Interview Rate</span>
                        <Badge variant="outline">
                          {analytics.conversion_rates?.application_to_interview || '0'}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Interview to Hire Rate</span>
                        <Badge variant="outline">
                          {analytics.conversion_rates?.interview_to_hire || '0'}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.category_performance?.map((category) => (
                      <div key={category.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge>{category.job_count} jobs</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Views</p>
                            <p className="font-medium">{category.total_views}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Applications</p>
                            <p className="font-medium">{category.total_applications}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Conversion</p>
                            <p className="font-medium">{category.conversion_rate}%</p>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-4">No category data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Daily Activity</h3>
                      <div className="grid grid-cols-7 gap-2">
                        {analytics.daily_trends?.map((day, index) => (
                          <div key={index} className="text-center">
                            <p className="text-xs text-gray-600">{day.date}</p>
                            <div className="mt-1 bg-blue-100 rounded p-2">
                              <p className="text-xs font-medium">{day.jobs} jobs</p>
                              <p className="text-xs">{day.applications} apps</p>
                            </div>
                          </div>
                        )) || (
                          <p className="col-span-7 text-center text-gray-500 py-4">No trend data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.location_performance?.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{location.location || 'Remote'}</p>
                          <p className="text-sm text-gray-600">{location.job_count} jobs</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{location.total_applications} applications</p>
                          <p className="text-sm text-gray-600">
                            {location.avg_applications_per_job} avg per job
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-4">No location data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {loading && !analytics && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default ExternalJobAnalytics;
