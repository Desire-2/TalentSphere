import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Check, Trash2 } from 'lucide-react';
// import { useNotifications } from '../../services/notifications';
import { toast } from 'sonner';

// Simple inline notification hook for demo
const useNotifications = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchNotifications = async () => {
    // Mock implementation
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
    if (!notifications.find(n => n.id === notificationId)?.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };
};

const NotificationDemo = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  } = useNotifications();

  const [isCreating, setIsCreating] = useState(false);

  const createMockNotification = () => {
    setIsCreating(true);
    
    const mockTypes = ['application_status', 'job_alert', 'message', 'system', 'company'];
    const mockPriorities = ['low', 'normal', 'high', 'urgent'];
    const mockTitles = [
      'Your application was reviewed',
      'New job matching your criteria',
      'Message from HR Manager',
      'System maintenance scheduled',
      'Company profile updated'
    ];
    const mockContents = [
      'Great news! Your application for Senior Developer has been shortlisted.',
      'A new React Developer position at TechCorp matches your preferences.',
      'Sarah from HR wants to schedule an interview with you.',
      'Scheduled maintenance will occur tonight from 2-4 AM.',
      'Microsoft has updated their company profile and benefits.'
    ];

    const randomIndex = Math.floor(Math.random() * mockTypes.length);
    const mockNotification = {
      id: Date.now(),
      type: mockTypes[randomIndex],
      priority: mockPriorities[Math.floor(Math.random() * mockPriorities.length)],
      title: mockTitles[randomIndex],
      content: mockContents[randomIndex],
      is_read: false,
      created_at: new Date().toISOString(),
      user_id: 1
    };

    // Simulate adding notification via service
    addNotification(mockNotification);
    toast.success('Mock notification created!');
    setIsCreating(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notification System Demo
          </CardTitle>
          <CardDescription>
            Test the notification system functionality with mock data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Notifications:</span>
              <Badge variant="outline">{notifications.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Unread:</span>
              <Badge variant="secondary">{unreadCount}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={createMockNotification} 
              disabled={isCreating}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Mock Notification
            </Button>
            
            <Button 
              onClick={fetchNotifications} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Refresh Notifications
            </Button>
            
            {unreadCount > 0 && (
              <Button 
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {notifications.length === 0 
              ? 'No notifications yet. Create some mock notifications to test the system.'
              : `Showing ${notifications.length} notifications`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge 
                          variant={notification.is_read ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        {notification.priority !== 'normal' && (
                          <Badge 
                            variant={notification.priority === 'urgent' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {!notification.is_read && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDemo;
