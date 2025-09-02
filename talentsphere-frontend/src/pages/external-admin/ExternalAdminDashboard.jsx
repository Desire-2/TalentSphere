import React, { useState, useEffect } from 'react';
import { 
  Briefcase,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Upload,
  ExternalLink,
  Building2,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const ExternalAdminDashboard = () => {
  const [stats, setStats] = useState({
    total_external_jobs: 0,
    published_external_jobs: 0,
    draft_external_jobs: 0,
    applications_count: 0,
    views_count: 0,
    recent_applications: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch external jobs stats
      const [jobsResponse, statsResponse] = await Promise.all([
        externalAdminService.getExternalJobs({ page: 1, per_page: 5 }),
        externalAdminService.getExternalJobStats()
      ]);

      setRecentJobs(jobsResponse.external_jobs || []);
      setStats(statsResponse || stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total External Jobs',
      value: stats.total_external_jobs,
      change: '+12% from last month',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Published Jobs',
      value: stats.published_external_jobs,
      change: 'Active listings',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Applications',
      value: stats.applications_count,
      change: '+8% from last week',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Views',
      value: stats.views_count,
      change: '+15% engagement',
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const quickActions = [
    {
      title: 'Post New Job',
      description: 'Create a new external job posting',
      icon: Plus,
      href: '/external-admin/jobs/create',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Import Jobs',
      description: 'Bulk import jobs from external sources',
      icon: Upload,
      href: '/external-admin/jobs/import',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Manage Sources',
      description: 'Configure external job sources',
      icon: ExternalLink,
      href: '/external-admin/sources',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">External Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your external job postings and track performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing external job postings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <div className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent External Jobs</CardTitle>
              <CardDescription>
                Latest job postings from external sources
              </CardDescription>
            </div>
            <Link to="/external-admin/jobs">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0">
                      {job.external_company_logo ? (
                        <img 
                          src={job.external_company_logo} 
                          alt={job.external_company_name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {job.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {job.external_company_name} • {job.location?.display || 'Remote'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {job.employment_type}
                        </Badge>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{job.statistics?.view_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No jobs yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Get started by creating your first external job posting.
                  </p>
                  <Link to="/external-admin/jobs/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Job posting metrics and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Published Jobs</span>
                  <span className="text-sm text-gray-500">
                    {stats.published_external_jobs}/{stats.total_external_jobs}
                  </span>
                </div>
                <Progress 
                  value={stats.total_external_jobs > 0 ? (stats.published_external_jobs / stats.total_external_jobs) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Application Rate</span>
                  <span className="text-sm text-gray-500">
                    {stats.applications_count} applications
                  </span>
                </div>
                <Progress 
                  value={stats.views_count > 0 ? (stats.applications_count / stats.views_count) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.applications_count}</div>
                    <div className="text-xs text-gray-500">Total Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.views_count}</div>
                    <div className="text-xs text-gray-500">Total Views</div>
                  </div>
                </div>
              </div>

              <Link to="/external-admin/analytics">
                <Button variant="outline" className="w-full mb-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </Link>

              <Link to="/external-admin/templates">
                <Button variant="outline" className="w-full mb-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
              </Link>

              <Link to="/external-admin/profile">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Profile & Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExternalAdminDashboard;
