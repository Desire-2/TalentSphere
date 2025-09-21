import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Building,
  Star,
  Calendar,
  Mail,
  Smartphone,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationContext } from '../components/notifications/NotificationProviderReal';
import NotificationPreferencesEnhanced from '../components/notifications/NotificationPreferencesEnhanced';

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    stats,
    loading,
    getFilteredNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationContext();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_alert':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'application_status':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'interview_reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'deadline_reminder':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'company_update':
      case 'company':
        return <Building className="h-4 w-4 text-indigo-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'promotion':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Manage your notifications and preferences</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Notifications List */}
  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_notifications}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.unread_notifications}</div>
                  <div className="text-sm text-gray-600">Unread</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.read_notifications}</div>
                  <div className="text-sm text-gray-600">Read</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.email_delivery?.reduce((sum, item) => sum + item.count, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Emails Sent</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>
                Your latest notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 sm:h-96">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notifications found</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                          !notification.is_read ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </span>
                                  {notification.is_sent && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                      <Mail className="h-3 w-3 mr-1" />
                                      Email Sent
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-0 sm:ml-2 mt-2 sm:mt-0">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
  <div className="space-y-4 sm:space-y-6">
          {/* Quick Stats */}
          {stats?.by_type && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  By Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {stats.by_type.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(item.type)}
                        <span className="text-sm capitalize">{item.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.total}
                        </Badge>
                        {item.unread > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {item.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="#preferences">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/jobs">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Email Delivery Stats */}
          {stats?.email_delivery && stats.email_delivery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 sm:space-y-2">
                  {stats.email_delivery.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.status}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="mt-8 sm:mt-12">
        <Separator className="mb-6 sm:mb-8" />
        <div id="preferences">
          <NotificationPreferencesEnhanced />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;