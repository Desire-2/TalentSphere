import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  Clock,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Building,
  Settings,
  CheckCircle,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
// import { useNotifications } from '../../services/notifications';

// Simple inline notification hook for dropdown
const useNotifications = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(2);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchNotifications = async () => {
    // Mock data for dropdown
    const mockNotifications = [
      {
        id: 1,
        type: 'application_status',
        priority: 'high',
        title: 'Application Update',
        message: 'Your application has been reviewed.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'job_alert',
        priority: 'normal',
        title: 'New Job Match',
        message: 'New position available.',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    setNotifications(mockNotifications);
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

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  console.log('NotificationDropdown render - isOpen:', isOpen, 'unreadCount:', unreadCount);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadMoreNotifications = async () => {
    try {
      const nextPage = page + 1;
      await fetchNotifications({ page: nextPage });
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more notifications:', error);
      toast.error('Failed to load more notifications');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error('Failed to mark as read');
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

  const getNotificationIcon = (type) => {
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
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      setIsOpen(false);
      window.location.href = notification.action_url;
    }
  };

  const loadMore = async () => {
    if (!isLoading) {
      await loadMoreNotifications();
    }
  };

  return (
    <div className="relative inline-block">
      {/* Notification Bell Button */}
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Bell button clicked, toggling from', isOpen, 'to', !isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 hover:scale-105 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
        aria-label="Toggle notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Panel */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] flex flex-col"
            style={{ 
              animation: 'slideIn 200ms ease-out',
              transformOrigin: 'top right'
            }}
          >
            {console.log('Dropdown panel is rendering')}
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs hover:bg-blue-50 hover:text-blue-600 px-3 py-1 rounded"
              >
                <CheckCheck className="h-3 w-3 mr-1 inline" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-gray-400 text-sm">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
                      !notification.is_read
                        ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 relative">
                          {getNotificationIcon(notification.notification_type)}
                          {!notification.is_read && (
                            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium text-gray-900 line-clamp-2 ${
                              !notification.is_read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-1 ml-2">
                              {notification.priority === 'urgent' && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            
                            {notification.action_text && (
                              <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                {notification.action_text} →
                              </span>
                            )}
                          </div>
                        </div>

                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {index < notifications.length - 1 && <div className="h-px bg-gray-100 mx-2" />}
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && notifications.length > 0 && (
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isLoading}
                className="w-full hover:bg-gray-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                ) : null}
                Load more notifications
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => {
              setIsOpen(false);
              window.location.href = '/notifications';
            }}
          >
            View all notifications
          </Button>
        </div>
      )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
