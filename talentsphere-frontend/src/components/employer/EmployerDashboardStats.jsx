import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Building2, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Award,
  Calendar,
  Target,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

const EmployerDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/auth/employer/dashboard-stats');
      setStats(response);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500 font-medium">+{trend}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load dashboard statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Welcome back, {user?.first_name}!
              </CardTitle>
              <CardDescription>
                Here's what's happening with your employer account
              </CardDescription>
            </div>
            {stats.company && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{stats.company.name}</span>
                  {stats.company.is_verified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{stats.company.industry}</p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Profile Completion Alert */}
      {stats.profile.completion_percentage < 100 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Complete your profile ({stats.profile.completion_percentage}%)</strong>
                <p className="mt-1">A complete profile attracts more quality candidates.</p>
              </div>
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700">
                Complete Now
              </Button>
            </div>
            <Progress value={stats.profile.completion_percentage} className="mt-3 h-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* Required Actions */}
      {stats.required_actions.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Target className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Action Required:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {stats.required_actions.map((action, index) => (
                <li key={index}>{action.description}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Briefcase}
          title="Active Jobs"
          value={stats.jobs.active}
          subtitle={`${stats.jobs.total} total jobs`}
          trend={5}
          color="blue"
        />
        
        <StatCard
          icon={Users}
          title="Total Applications"
          value={stats.applications.total}
          subtitle={`${stats.applications.pending} pending review`}
          trend={12}
          color="green"
        />
        
        <StatCard
          icon={Eye}
          title="Profile Views"
          value="2,847"
          subtitle="This month"
          trend={8}
          color="purple"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Response Rate"
          value="68%"
          subtitle="Above industry average"
          trend={3}
          color="orange"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Job Performance
            </CardTitle>
            <CardDescription>
              How your job postings are performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Senior Developer</p>
                  <p className="text-sm text-gray-600">Posted 5 days ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">47 applications</p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    High Interest
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Marketing Manager</p>
                  <p className="text-sm text-gray-600">Posted 2 weeks ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">23 applications</p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Good Response
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Sales Associate</p>
                  <p className="text-sm text-gray-600">Posted 1 month ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-600">8 applications</p>
                  <Badge variant="outline" className="text-gray-600 border-gray-200">
                    Low Interest
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              View All Jobs
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions on your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New application received</p>
                  <p className="text-xs text-gray-600">Senior Developer position • 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Job posting viewed</p>
                  <p className="text-xs text-gray-600">Marketing Manager position • 4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile updated</p>
                  <p className="text-xs text-gray-600">Company description modified • 1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New job posted</p>
                  <p className="text-xs text-gray-600">Sales Associate position • 2 days ago</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your employer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex-col items-center justify-center">
              <Briefcase className="w-6 h-6 mb-2" />
              <span className="font-medium">Post New Job</span>
              <span className="text-xs opacity-70">Create job posting</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              <span className="font-medium">Review Applications</span>
              <span className="text-xs opacity-70">{stats.applications.pending} pending</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col items-center justify-center">
              <Building2 className="w-6 h-6 mb-2" />
              <span className="font-medium">Update Company</span>
              <span className="text-xs opacity-70">Edit profile</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col items-center justify-center">
              <BarChart3 className="w-6 h-6 mb-2" />
              <span className="font-medium">View Analytics</span>
              <span className="text-xs opacity-70">Detailed insights</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      {!stats.profile.is_verified && (
        <Card className="border-gradient bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Unlock Premium Features</h3>
                  <p className="text-gray-600">Get verified and access advanced recruiting tools</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Verified employer badge</li>
                    <li>• Priority job listings</li>
                    <li>• Advanced analytics</li>
                  </ul>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Get Verified
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployerDashboardStats;
