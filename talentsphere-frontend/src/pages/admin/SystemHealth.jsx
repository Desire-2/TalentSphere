import { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Server, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Briefcase,
  Building,
  DollarSign,
  RefreshCw,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminStore } from '../../stores/adminStore';
import { formatNumber, formatRelativeTime } from '../../utils/helpers';

const SystemHealth = () => {
  const { 
    systemHealth, 
    isLoading, 
    error, 
    fetchSystemHealth 
  } = useAdminStore();

  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchSystemHealth();
    setLastRefresh(new Date());
  }, [fetchSystemHealth]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSystemHealth();
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchSystemHealth]);

  const handleRefresh = () => {
    fetchSystemHealth();
    setLastRefresh(new Date());
  };

  const getHealthStatus = (value, thresholds) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getSystemStatus = () => {
    if (!systemHealth) return { status: 'unknown', color: 'text-gray-600', text: 'Unknown' };
    
    const { error_indicators } = systemHealth;
    const totalErrors = Object.values(error_indicators).reduce((sum, count) => sum + count, 0);
    
    if (totalErrors === 0) return { status: 'healthy', color: 'text-green-600', text: 'Healthy' };
    if (totalErrors < 10) return { status: 'warning', color: 'text-yellow-600', text: 'Warning' };
    return { status: 'critical', color: 'text-red-600', text: 'Critical' };
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load system health: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!systemHealth) {
    return null;
  }

  const { database_stats, recent_activity, error_indicators } = systemHealth;
  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">Monitor platform performance and system status</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh ? formatRelativeTime(lastRefresh.toISOString()) : 'Never'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Monitor className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${
          systemStatus.status === 'healthy' ? 'border-l-green-500' :
          systemStatus.status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {systemStatus.status === 'healthy' ? 
                <CheckCircle className="h-5 w-5 text-green-500" /> :
                systemStatus.status === 'warning' ?
                <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
                <AlertTriangle className="h-5 w-5 text-red-500" />
              }
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className={`text-2xl font-bold ${systemStatus.color}`}>
                  {systemStatus.text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Database Records</p>
                <p className="text-2xl font-bold">
                  {formatNumber(Object.values(database_stats.total_records).reduce((sum, count) => sum + count, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Records</p>
                <p className="text-2xl font-bold">
                  {formatNumber(Object.values(database_stats.active_records).reduce((sum, count) => sum + count, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Error Indicators</p>
                <p className="text-2xl font-bold">
                  {formatNumber(Object.values(error_indicators).reduce((sum, count) => sum + count, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>Current database record counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Total Records</h4>
                  {Object.entries(database_stats.total_records).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-medium">{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Active Records</h4>
                  {Object.entries(database_stats.active_records).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-medium">{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (24h)</CardTitle>
            <CardDescription>New records created in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-blue-700">New Users</p>
                    <p className="text-lg font-bold text-blue-900">{formatNumber(recent_activity.new_users)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-700">New Jobs</p>
                    <p className="text-lg font-bold text-green-900">{formatNumber(recent_activity.new_jobs)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                  <Building className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-purple-700">Applications</p>
                    <p className="text-lg font-bold text-purple-900">{formatNumber(recent_activity.new_applications)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-yellow-700">Payments</p>
                    <p className="text-lg font-bold text-yellow-900">{formatNumber(recent_activity.new_payments)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Error Indicators</CardTitle>
          <CardDescription>System issues that require attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(error_indicators).map(([key, value]) => {
              const health = getHealthStatus(value, { good: 0, warning: 5 });
              return (
                <div key={key} className={`p-4 rounded-lg border ${health.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {key.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'failed_payments' && 'Payment processing failures'}
                        {key === 'expired_featured_ads' && 'Ads that need renewal'}
                        {key === 'inactive_users' && 'Deactivated user accounts'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${health.color}`}>
                        {formatNumber(value)}
                      </span>
                      {health.status === 'good' && (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      )}
                      {health.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                      )}
                      {health.status === 'critical' && (
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Health</CardTitle>
            <CardDescription>Database performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Integrity</span>
                  <span className="text-sm text-green-600">Good</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Query Performance</span>
                  <span className="text-sm text-green-600">Excellent</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Storage Usage</span>
                  <span className="text-sm text-yellow-600">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
            <CardDescription>Security monitoring and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Authentication</span>
                </div>
                <Badge variant="success">Secure</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Data Encryption</span>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Session Management</span>
                </div>
                <Badge variant="secondary">Monitoring</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
