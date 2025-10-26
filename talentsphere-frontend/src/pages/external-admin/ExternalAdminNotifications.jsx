import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Briefcase,
  Users,
  FileText,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Archive,
  Inbox,
  Star,
  StarOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { notificationService } from '../../services/notification';
import { format, formatDistanceToNow } from 'date-fns';

const ExternalAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, typeFilter, statusFilter, activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(activeTab === 'unread' && { unread_only: true }),
        ...(activeTab === 'important' && { priority: 'high' })
      };

      const response = await notificationService.getNotifications(params);
      
      setNotifications(response.notifications || []);
      setPagination({
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 20,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      });
      setUnreadCount(response.unread_count || 0);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await notificationService.markAsUnread(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: false, read_at: null }
            : notif
        )
      );
      setUnreadCount(prev => prev + 1);
      
      toast.success('Notification marked as unread');
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications first');
      return;
    }

    try {
      switch (action) {
        case 'read':
          await notificationService.bulkMarkAsRead(selectedNotifications);
          setNotifications(prev => 
            prev.map(notif => 
              selectedNotifications.includes(notif.id)
                ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                : notif
            )
          );
          toast.success(`${selectedNotifications.length} notifications marked as read`);
          break;
          
        case 'unread':
          await notificationService.bulkMarkAsUnread(selectedNotifications);
          setNotifications(prev => 
            prev.map(notif => 
              selectedNotifications.includes(notif.id)
                ? { ...notif, is_read: false, read_at: null }
                : notif
            )
          );
          toast.success(`${selectedNotifications.length} notifications marked as unread`);
          break;
          
        case 'delete':
          if (!confirm(`Delete ${selectedNotifications.length} notifications?`)) return;
          await notificationService.bulkDelete(selectedNotifications);
          setNotifications(prev => 
            prev.filter(notif => !selectedNotifications.includes(notif.id))
          );
          toast.success(`${selectedNotifications.length} notifications deleted`);
          break;
          
        default:
          break;
      }
      
      setSelectedNotifications([]);
      fetchNotifications(); // Refresh to update counts
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform action');
    }
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_application':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'job_status':
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      case 'application_update':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBadgeVariant = (type) => {
    switch (type) {
      case 'job_application':
        return 'default';
      case 'job_status':
        return 'secondary';
      case 'application_update':
        return 'success';
      case 'system':
        return 'outline';
      case 'warning':
        return 'warning';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatNotificationType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleRefresh = () => {
    fetchNotifications();
    toast.success('Notifications refreshed');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchNotifications();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your notifications and stay updated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/external-admin/profile">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-green-600">{pagination.total - unreadCount}</p>
              </div>
              <CheckCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Important</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="job_application">Job Applications</SelectItem>
                <SelectItem value="job_status">Job Status</SelectItem>
                <SelectItem value="application_update">Application Updates</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('unread')}
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Mark Unread
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
              <Checkbox 
                checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                className="mr-2"
              />
              {selectedNotifications.length === notifications.length && notifications.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            All
            <Badge variant="secondary">{pagination.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Unread
            {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="important" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Important
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {activeTab === 'unread'
                    ? "You're all caught up! No unread notifications."
                    : activeTab === 'important'
                    ? 'No important notifications at this time.'
                    : 'You have no notifications yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onCheckedChange={() => toggleSelectNotification(notification.id)}
                        className="mt-1"
                      />

                      {/* Icon */}
                      <div className="mt-1">
                        {getNotificationIcon(notification.notification_type || notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              <Badge variant={getNotificationBadgeVariant(notification.notification_type || notification.type)}>
                                {formatNotificationType(notification.notification_type || notification.type || 'info')}
                              </Badge>
                              {notification.priority === 'high' && (
                                <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            {notification.related_job && (
                              <Link
                                to={`/external-admin/jobs/${notification.related_job.id}`}
                                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                              >
                                <Briefcase className="h-3 w-3" />
                                {notification.related_job.title}
                              </Link>
                            )}
                            {notification.action_url && (
                              <Link
                                to={notification.action_url}
                                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 ml-4"
                              >
                                <Eye className="h-3 w-3" />
                                View Details
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notification.is_read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsUnread(notification.id)}
                            title="Mark as unread"
                          >
                            <BellOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {notifications.length > 0 && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} notifications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExternalAdminNotifications;
