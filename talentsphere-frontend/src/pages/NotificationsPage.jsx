import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Filter,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  RefreshCw,
  Archive,
  Star,
  Clock,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Building,
  User,
  MoreVertical,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
// import NotificationSettings from '../../components/notifications/NotificationSettingsSimple';

// Simple inline NotificationSettings component
const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">
              Notification settings functionality coming soon!
            </p>
            <p className="text-sm text-muted-foreground">
              This feature will allow you to customize how you receive notifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Temporary inline notification hook
const useNotifications = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    // Mock data for now
    setTimeout(() => {
      const mockNotifications = [
        {
          id: 1,
          type: 'application_status',
          priority: 'high',
          title: 'Application Update',
          message: 'Your application for Senior Developer has been reviewed.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'job_alert',
          priority: 'normal', 
          title: 'New Job Match',
          message: 'A new React Developer position matches your profile.',
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
      setIsLoading(false);
    }, 500);
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, is_read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

const NotificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  useEffect(() => {
    fetchNotifications({ force: true });
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'application_status':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'job_alert':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'company':
        return <Building className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50/50';
      default:
        return 'border-l-blue-500 bg-blue-50/50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      case 'urgent':
        return notification.priority === 'urgent';
      case 'application_status':
      case 'job_alert':
      case 'message':
      case 'system':
      case 'company':
        return notification.type === selectedFilter;
      default:
        return true;
    }
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        toast.error('Failed to mark as read');
      }
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No notifications selected');
      return;
    }

    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteNotification(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications deleted`);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const getFilterOptions = () => [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'read', label: 'Read', count: notifications.length - unreadCount },
    { value: 'urgent', label: 'Urgent', count: notifications.filter(n => n.priority === 'urgent').length },
    { value: 'application_status', label: 'Applications', count: notifications.filter(n => n.type === 'application_status').length },
    { value: 'job_alert', label: 'Job Alerts', count: notifications.filter(n => n.type === 'job_alert').length },
    { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your job search and applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchNotifications({ force: true })}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      <Badge variant="secondary" className="ml-1">
                        {getFilterOptions().find(opt => opt.value === selectedFilter)?.label}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {getFilterOptions().map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSelectedFilter(option.value)}
                        className={selectedFilter === option.value ? 'bg-accent' : ''}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <Badge variant="outline" className="ml-2">
                            {option.count}
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Actions */}
                {selectedIds.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Actions ({selectedIds.size})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedIds(new Set())}>
                        <X className="h-4 w-4 mr-2" />
                        Clear Selection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Bulk Selection */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {selectedIds.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span>•</span>
                <span>{filteredNotifications.length} notifications</span>
                {selectedIds.size > 0 && (
                  <>
                    <span>•</span>
                    <span>{selectedIds.size} selected</span>
                  </>
                )}
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery || selectedFilter !== 'all' ? 'No matching notifications' : 'No notifications yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      {searchQuery || selectedFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : "You'll receive notifications here when there are updates about your applications, new job alerts, and more."
                      }
                    </p>
                    {(searchQuery || selectedFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedFilter('all');
                        }}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                      getPriorityColor(notification.priority)
                    } ${!notification.is_read ? 'ring-1 ring-blue-200' : ''}`}
                    onClick={() => !selectedIds.has(notification.id) && handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Selection Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(notification.id);
                          }}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedIds.has(notification.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground hover:border-primary'
                          }`}
                        >
                          {selectedIds.has(notification.id) && <Check className="h-2 w-2" />}
                        </button>

                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                {notification.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                {notification.read_at && (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Read
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.is_read && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                    toast.success('Notification deleted');
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Load More */}
            {filteredNotifications.length > 0 && filteredNotifications.length >= 20 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications({ page: Math.floor(notifications.length / 20) + 1 })}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
