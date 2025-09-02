import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bell,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  TestTube,
  Users,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  Info,
  Heart,
  Zap
} from 'lucide-react';
import { useNotifications } from '../services/notificationService';
import NotificationDropdownEnhanced from '../components/notifications/NotificationDropdownEnhanced';

const NotificationTestPage = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  } = useNotifications();

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [testStats, setTestStats] = useState({
    totalCreated: 0,
    totalRead: 0,
    totalDeleted: 0
  });

  useEffect(() => {
    // Load initial data
    refreshNotifications();
  }, [refreshNotifications]);

  const handleToggleAutoRefresh = () => {
    if (isAutoRefreshEnabled) {
      stopAutoRefresh();
      setIsAutoRefreshEnabled(false);
      toast.success('Auto-refresh disabled');
    } else {
      startAutoRefresh(30000); // 30 seconds
      setIsAutoRefreshEnabled(true);
      toast.success('Auto-refresh enabled (30s interval)');
    }
  };

  const createTestNotification = async (type = 'info', priority = 'normal') => {
    const testNotifications = {
      info: {
        title: 'System Information',
        message: 'Your profile has been updated successfully. All changes are now live.',
        type: 'system'
      },
      success: {
        title: 'Application Approved!',
        message: 'Great news! Your job application at TechCorp has been approved. Check your email for next steps.',
        type: 'application_status'
      },
      warning: {
        title: 'Profile Incomplete',
        message: 'Your profile is missing some important information. Complete it to improve your job matching.',
        type: 'job_alert'
      },
      error: {
        title: 'Payment Failed',
        message: 'We were unable to process your premium subscription payment. Please update your payment method.',
        type: 'payment'
      },
      message: {
        title: 'New Message from Recruiter',
        message: 'Sarah from Google has sent you a message about the Software Engineer position.',
        type: 'message'
      },
      promotion: {
        title: '🎉 Premium Features Unlocked',
        message: 'Congratulations! You now have access to premium job matching and advanced analytics.',
        type: 'promotion'
      }
    };

    const selectedNotification = testNotifications[type] || testNotifications.info;

    try {
      await createNotification({
        ...selectedNotification,
        priority,
        action_url: type === 'message' ? '/messages' : '/dashboard'
      });

      setTestStats(prev => ({
        ...prev,
        totalCreated: prev.totalCreated + 1
      }));

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} notification created!`);
    } catch (error) {
      toast.error('Failed to create notification');
      console.error('Create notification error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setTestStats(prev => ({
        ...prev,
        totalRead: prev.totalRead + unreadCount
      }));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const deletePromises = notifications.map(n => deleteNotification(n.id));
      await Promise.all(deletePromises);
      
      setTestStats(prev => ({
        ...prev,
        totalDeleted: prev.totalDeleted + notifications.length
      }));
      
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete all notifications');
    }
  };

  const createBulkNotifications = async () => {
    const bulkNotifications = [
      { type: 'success', priority: 'high' },
      { type: 'info', priority: 'normal' },
      { type: 'warning', priority: 'high' },
      { type: 'message', priority: 'normal' },
      { type: 'promotion', priority: 'urgent' }
    ];

    try {
      for (const notif of bulkNotifications) {
        await createTestNotification(notif.type, notif.priority);
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success('Bulk notifications created successfully!');
    } catch (error) {
      toast.error('Failed to create bulk notifications');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <TestTube className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Notification System Test
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive testing environment for the enhanced notification system with real-time updates, 
            backend integration, and advanced features.
          </p>
        </div>

        {/* Live Notification Demo */}
        <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">Live Notification Component</CardTitle>
                  <CardDescription>
                    This is the actual notification component integrated in the header
                  </CardDescription>
                </div>
              </div>
              <div className="scale-150">
                <NotificationDropdownEnhanced />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                <div className="text-sm text-gray-600">Total Notifications</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <div className="text-sm text-gray-600">Unread Count</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {isAutoRefreshEnabled ? 'On' : 'Off'}
                </div>
                <div className="text-sm text-gray-600">Auto Refresh</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <CardTitle>Test Controls</CardTitle>
              </div>
              <CardDescription>
                Create, manage, and test different types of notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={refreshNotifications}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleToggleAutoRefresh}
                    variant="outline"
                    className="w-full"
                  >
                    {isAutoRefreshEnabled ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Auto Refresh
                  </Button>
                  <Button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                  <Button
                    onClick={handleDeleteAll}
                    disabled={notifications.length === 0}
                    variant="outline"
                    className="w-full hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Create Single Notifications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notifications
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => createTestNotification('success', 'high')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Button>
                  <Button
                    onClick={() => createTestNotification('info', 'normal')}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    Info
                  </Button>
                  <Button
                    onClick={() => createTestNotification('warning', 'high')}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Warning
                  </Button>
                  <Button
                    onClick={() => createTestNotification('error', 'urgent')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Error
                  </Button>
                  <Button
                    onClick={() => createTestNotification('message', 'normal')}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                  <Button
                    onClick={() => createTestNotification('promotion', 'urgent')}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Promo
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Bulk Actions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Actions
                </h3>
                <Button
                  onClick={createBulkNotifications}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sample Set (5 notifications)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <CardTitle>Statistics & Status</CardTitle>
              </div>
              <CardDescription>
                Monitor notification system performance and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Backend Connection</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Auto Refresh</span>
                    <Badge 
                      variant="outline" 
                      className={isAutoRefreshEnabled 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {isAutoRefreshEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Loading State</span>
                    <Badge 
                      variant="outline" 
                      className={isLoading 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {isLoading ? 'Loading...' : 'Ready'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Statistics */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Test Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{testStats.totalCreated}</div>
                    <div className="text-xs text-blue-700">Created</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{testStats.totalRead}</div>
                    <div className="text-xs text-green-700">Read</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{testStats.totalDeleted}</div>
                    <div className="text-xs text-red-700">Deleted</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Current State */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current State</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Notifications:</span>
                    <span className="font-medium">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unread Count:</span>
                    <span className="font-medium text-orange-600">{unreadCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Read Count:</span>
                    <span className="font-medium text-green-600">{notifications.length - unreadCount}</span>
                  </div>
                  {error && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error:</span>
                      <span className="font-medium text-red-600">
                        {error.message || 'Unknown error'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Button
                  onClick={clearError}
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-red-50 hover:text-red-600"
                >
                  Clear Error
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Enhanced Notification Features</span>
            </CardTitle>
            <CardDescription>
              Comprehensive overview of all implemented features and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { feature: 'Real-time Updates', description: 'Auto-refresh every 30 seconds when dropdown is open', icon: RefreshCw },
                { feature: 'Backend Integration', description: 'Full API integration with fallback to mock data', icon: Settings },
                { feature: 'Advanced Filtering', description: 'Search, filter by read status, and priority sorting', icon: Users },
                { feature: 'Priority System', description: 'Urgent, High, Normal, Low priority levels with visual indicators', icon: AlertTriangle },
                { feature: 'Interactive Actions', description: 'Mark as read, delete, and bulk operations', icon: CheckCircle },
                { feature: 'Responsive Design', description: 'Optimized for desktop and mobile devices', icon: MessageSquare },
                { feature: 'Toast Notifications', description: 'User feedback for all actions with Sonner', icon: Bell },
                { feature: 'State Management', description: 'Zustand store for efficient state handling', icon: BarChart3 },
                { feature: 'Error Handling', description: 'Comprehensive error boundaries and fallbacks', icon: AlertTriangle }
              ].map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <item.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{item.feature}</h4>
                      <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationTestPage;
