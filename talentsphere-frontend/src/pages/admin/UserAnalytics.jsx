import { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX,
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Eye,
  Activity,
  Clock,
  Shield,
  UserPlus,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAdminStore } from '../../stores/adminStore';
import { formatNumber, formatPercentage } from '../../utils/helpers';

const chartColors = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
};

// Lightweight chart component backed by real analytics data.
const SimpleBarChart = ({ data, title, color = 'blue' }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium">{title}</h4>
    <div className="h-32 flex items-end space-x-1">
      {(data || []).map((point, index) => (
        <div
          key={index}
          className={`${chartColors[color] || chartColors.blue} w-4 rounded-t`}
          style={{
            height: `${Math.min(
              100,
              (point.value / Math.max(...(data || []).map(d => d.value), 1)) * 100
            )}%`
          }}
          title={`${point.date}: ${point.value}`}
        />
      ))}
    </div>
  </div>
);

const UserAnalytics = () => {
  const { 
    userAnalytics, 
    dashboardData,
    isLoading, 
    error, 
    fetchUserAnalytics,
    fetchDashboard
  } = useAdminStore();

  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchUserAnalytics(parseInt(timeRange));
    fetchDashboard(parseInt(timeRange));
  }, [timeRange, fetchUserAnalytics, fetchDashboard]);

  if (isLoading && !userAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load user analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const currentUserAnalytics = userAnalytics || {
    daily_registrations: [],
    role_distribution: [],
    daily_active_users: [],
    verification_stats: []
  };

  // Calculate metrics
  const totalUsers = dashboardData?.overview?.total_users || 0;
  const newUsers = dashboardData?.overview?.new_users || 0;
  const activeUsers = dashboardData?.overview?.active_users || 0;
  const totalRegistrations = currentUserAnalytics.daily_registrations?.reduce(
    (sum, day) => sum + day.registrations, 0
  ) || newUsers;
  
  const averageDailyRegistrations = totalRegistrations / (currentUserAnalytics.daily_registrations?.length || 30);
  const activationRate = totalUsers > 0 ? (activeUsers / totalUsers * 100) : 0;
  const verifiedUsers = currentUserAnalytics.verification_stats?.find(s => s.verified)?.count || 0;
  const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers * 100) : 0;

  const roleColors = {
    job_seeker: 'blue',
    employer: 'green', 
    admin: 'purple'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed insights into user behavior and demographics</p>
        </div>
        <div className="flex space-x-2">
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalUsers)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+{newUsers} this period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Registrations</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyRegistrations.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(activationRate)}</div>
            <Progress value={activationRate} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(activeUsers)} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(verificationRate)}</div>
            <Progress value={verificationRate} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Email verified users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Registrations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily User Registrations</CardTitle>
                <CardDescription>New user signups over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={currentUserAnalytics.daily_registrations?.map(d => ({ 
                    date: d.date, 
                    value: d.registrations 
                  })) || []} 
                  title="Registrations"
                  color="blue"
                />
              </CardContent>
            </Card>

            {/* Registration Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Analysis of registration patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Peak Registration Day</div>
                    <div className="text-sm text-gray-500">
                      {currentUserAnalytics.daily_registrations?.reduce((max, day) => 
                        day.registrations > max.registrations ? day : max, 
                        { date: 'N/A', registrations: 0 }
                      )?.date || 'N/A'}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {Math.max(...(currentUserAnalytics.daily_registrations?.map(d => d.registrations) || [0]))} users
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>Users who logged in each day</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={currentUserAnalytics.daily_active_users?.map(d => ({ 
                    date: d.date, 
                    value: d.active_users 
                  })) || []} 
                  title="Active Users"
                  color="green"
                />
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
                <CardDescription>Breakdown by user type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUserAnalytics.role_distribution?.map((role, index) => {
                  const percentage = (role.count / totalUsers) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${chartColors[roleColors[role.role]] || chartColors.blue}`}></div>
                          <span className="text-sm font-medium capitalize">
                            {role.role.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatNumber(role.count)} ({formatPercentage(percentage)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${chartColors[roleColors[role.role]] || chartColors.blue} h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Email verification breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUserAnalytics.verification_stats?.map((stat, index) => {
                  const percentage = (stat.count / totalUsers) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {stat.verified ? (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserX className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            {stat.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatNumber(stat.count)} ({formatPercentage(percentage)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${stat.verified ? 'bg-green-500' : 'bg-gray-400'} h-2 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default UserAnalytics;
