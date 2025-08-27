import { useEffect, useState } from 'react';
import { 
  Users, 
  Briefcase, 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminStore } from '../../stores/adminStore';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/helpers';
import AdvertisementManagement from '../../components/admin/AdvertisementManagement';

const AdminDashboardOverview = () => {
  const { 
    dashboardData, 
    isLoading, 
    error, 
    fetchDashboard 
  } = useAdminStore();
  
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchDashboard(parseInt(timeRange));
  }, [timeRange, fetchDashboard]);

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { overview, user_breakdown, job_metrics, application_metrics, company_metrics, revenue_metrics, recent_activity } = dashboardData;

  // Calculate growth rates and trends
  const userGrowthRate = overview.new_users > 0 ? ((overview.new_users / overview.total_users) * 100).toFixed(1) : 0;
  const jobGrowthRate = job_metrics.new_jobs > 0 ? ((job_metrics.new_jobs / job_metrics.total_jobs) * 100).toFixed(1) : 0;
  const revenueGrowthRate = overview.period_revenue > 0 ? ((overview.period_revenue / overview.total_revenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete platform overview and analytics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.total_users)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{overview.new_users} new ({userGrowthRate}%)</span>
            </div>
            <div className="mt-2">
              <Progress value={(overview.active_users / overview.total_users) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(overview.active_users)} active users
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Jobs */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.total_jobs)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{job_metrics.new_jobs} new ({jobGrowthRate}%)</span>
            </div>
            <div className="mt-2">
              <Progress value={(overview.active_jobs / overview.total_jobs) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(overview.active_jobs)} active jobs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.total_applications)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3 text-blue-500" />
              <span>{application_metrics.new_applications} new applications</span>
            </div>
            <div className="mt-2">
              <Progress 
                value={(application_metrics.pending_applications / overview.total_applications) * 100} 
                className="h-1" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(application_metrics.pending_applications)} pending review
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.total_revenue)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{formatCurrency(overview.period_revenue)} period ({revenueGrowthRate}%)</span>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {revenue_metrics.active_featured_ads} active ads
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="advertisements">Ads</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown by user roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Job Seekers</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(user_breakdown.job_seekers)}</span>
                    <div className="text-xs text-muted-foreground">
                      {((user_breakdown.job_seekers / overview.total_users) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Employers</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(user_breakdown.employers)}</span>
                    <div className="text-xs text-muted-foreground">
                      {((user_breakdown.employers / overview.total_users) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Admins</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(user_breakdown.admins)}</span>
                    <div className="text-xs text-muted-foreground">
                      {((user_breakdown.admins / overview.total_users) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Application Pipeline</CardTitle>
                <CardDescription>Current application statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-medium">{formatNumber(application_metrics.pending_applications)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Under Review</span>
                  </div>
                  <span className="font-medium">{formatNumber(application_metrics.under_review)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Hired</span>
                  </div>
                  <span className="font-medium">{formatNumber(application_metrics.hired)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-medium">{formatNumber(application_metrics.rejected)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent_activity.users?.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.role === 'employer' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Jobs</CardTitle>
                <CardDescription>Latest job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent_activity.jobs?.slice(0, 5).map((job) => (
                    <div key={job.id} className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company?.name}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {job.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(job.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
                <CardDescription>Latest revenue transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent_activity.payments?.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.purpose}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant="success" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="users" className="space-y-6">
          {/* User Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{overview.new_users}</div>
                <p className="text-xs text-muted-foreground">
                  {((overview.new_users / overview.total_users) * 100).toFixed(1)}% of total users
                </p>
                <div className="mt-2">
                  <Progress value={(overview.new_users / overview.total_users) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(overview.active_users)}</div>
                <p className="text-xs text-muted-foreground">
                  {((overview.active_users / overview.total_users) * 100).toFixed(1)}% activity rate
                </p>
                <div className="mt-2">
                  <Progress value={(overview.active_users / overview.total_users) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.total_users > 0 ? ((overview.active_users / overview.total_users) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  User verification completion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Management Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Registrations</CardTitle>
              <CardDescription>Latest users who joined the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent_activity.users?.slice(0, 8).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {formatRelativeTime(user.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'employer' ? 'default' : user.role === 'job_seeker' ? 'secondary' : 'destructive'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.is_active ? 'success' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Job Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(job_metrics.active_jobs)}</div>
                <p className="text-xs text-muted-foreground">
                  {((job_metrics.active_jobs / job_metrics.total_jobs) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Jobs</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(job_metrics.featured_jobs)}</div>
                <p className="text-xs text-muted-foreground">
                  Premium listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft Jobs</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(job_metrics.draft_jobs)}</div>
                <p className="text-xs text-muted-foreground">
                  Pending publication
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Closed Jobs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(job_metrics.closed_jobs)}</div>
                <p className="text-xs text-muted-foreground">
                  No longer active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Postings</CardTitle>
              <CardDescription>Latest jobs posted on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent_activity.jobs?.slice(0, 6).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {job.company?.name?.[0] || 'C'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company?.name}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="outline">{job.type}</Badge>
                            <span className="text-xs text-gray-500">
                              Posted {formatRelativeTime(job.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={job.status === 'published' ? 'success' : job.status === 'draft' ? 'secondary' : 'destructive'}>
                        {job.status}
                      </Badge>
                      {job.is_featured && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Zap className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          {/* Company Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(company_metrics.total_companies)}</div>
                <p className="text-xs text-muted-foreground">
                  +{company_metrics.new_companies} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Companies</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(company_metrics.verified_companies)}</div>
                <p className="text-xs text-muted-foreground">
                  {((company_metrics.verified_companies / company_metrics.total_companies) * 100).toFixed(1)}% verified
                </p>
                <div className="mt-2">
                  <Progress value={(company_metrics.verified_companies / company_metrics.total_companies) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Companies</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(company_metrics.featured_companies)}</div>
                <p className="text-xs text-muted-foreground">
                  Premium company profiles
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Company Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Verification Status</CardTitle>
                <CardDescription>Breakdown of company verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Verified</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(company_metrics.verified_companies)}</span>
                    <div className="text-xs text-muted-foreground">
                      {((company_metrics.verified_companies / company_metrics.total_companies) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending Verification</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatNumber(company_metrics.total_companies - company_metrics.verified_companies)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {(((company_metrics.total_companies - company_metrics.verified_companies) / company_metrics.total_companies) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Featured</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(company_metrics.featured_companies)}</span>
                    <div className="text-xs text-muted-foreground">
                      Premium profiles
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Activity</CardTitle>
                <CardDescription>Recent company engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Job Postings</span>
                    <span className="font-medium">{formatNumber(overview.active_jobs)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Featured Ads</span>
                    <span className="font-medium">{formatNumber(revenue_metrics.active_featured_ads)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Companies This Period</span>
                    <span className="font-medium">{formatNumber(company_metrics.new_companies)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Applications Received</span>
                    <span className="font-medium">{formatNumber(overview.total_applications)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advertisements">
          <AdvertisementManagement />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenue_metrics.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  All-time earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenue_metrics.period_revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(revenue_metrics.active_featured_ads)}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(revenue_metrics.pending_payments)}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting processing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown by revenue type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Featured Job Ads</span>
                  </div>
                  <span className="font-medium">{formatCurrency(revenue_metrics.period_revenue * 0.7)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Company Profiles</span>
                  </div>
                  <span className="font-medium">{formatCurrency(revenue_metrics.period_revenue * 0.2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Premium Features</span>
                  </div>
                  <span className="font-medium">{formatCurrency(revenue_metrics.period_revenue * 0.1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest revenue transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent_activity.payments?.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.purpose || 'Featured Ad Payment'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant="success" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Performance</CardTitle>
              <CardDescription>Growth metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {revenueGrowthRate}%
                  </div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-xs text-gray-500">vs previous period</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(revenue_metrics.total_revenue / revenue_metrics.total_featured_ads || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Avg Revenue per Ad</p>
                  <p className="text-xs text-gray-500">lifetime value</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(revenue_metrics.active_featured_ads)}
                  </div>
                  <p className="text-sm text-gray-600">Active Revenue Streams</p>
                  <p className="text-xs text-gray-500">currently generating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardOverview;
