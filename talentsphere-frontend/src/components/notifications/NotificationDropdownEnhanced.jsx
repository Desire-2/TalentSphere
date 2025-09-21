import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Briefcase, 
  Building, 
  Settings,
  Search,
  Star,
  CreditCard,
  Trash2,
  CheckCheck,
  Loader2,
  Filter,
  ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../services/notificationService';
import { toast } from 'sonner';

const NotificationDropdownEnhanced = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getFilteredNotifications,
    setFilter: setStoreFilter,
    setSearchQuery: setStoreSearchQuery,
    startAutoRefresh,
    stopAutoRefresh
  } = useNotifications();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Auto-refresh when dropdown is open
  useEffect(() => {
    if (isOpen) {
      startAutoRefresh(30000); // Refresh every 30 seconds when open
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [isOpen, startAutoRefresh, stopAutoRefresh]);

  // Update store filters
  useEffect(() => {
    setStoreFilter(filter);
  }, [filter, setStoreFilter]);

  useEffect(() => {
    setStoreSearchQuery(searchQuery);
  }, [searchQuery, setStoreSearchQuery]);

  const handleMarkAsRead = async (notificationId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
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

  const handleDeleteNotification = async (notificationId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      setIsOpen(false);
      window.location.href = notification.action_url;
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'application_status':
        return <Briefcase {...iconProps} style={{ color: '#3B82F6' }} />;
      case 'job_alert':
        return <AlertCircle {...iconProps} style={{ color: '#F59E0B' }} />;
      case 'message':
        return <MessageSquare {...iconProps} style={{ color: '#10B981' }} />;
      case 'system':
        return <Settings {...iconProps} style={{ color: '#6B7280' }} />;
      case 'company':
        return <Building {...iconProps} style={{ color: '#8B5CF6' }} />;
      case 'payment':
        return <CreditCard {...iconProps} style={{ color: '#EF4444' }} />;
      case 'promotion':
        return <Star {...iconProps} style={{ color: '#F59E0B' }} />;
      default:
        return <Bell {...iconProps} style={{ color: '#3B82F6' }} />;
    }
  };

  const getPriorityIndicator = (priority) => {
    const baseClasses = "w-2 h-2 rounded-full";
    switch (priority) {
      case 'urgent':
        return <div className={`${baseClasses} bg-red-500 animate-pulse`} />;
      case 'high':
        return <div className={`${baseClasses} bg-orange-500`} />;
      case 'normal':
        return <div className={`${baseClasses} bg-blue-500`} />;
      case 'low':
        return <div className={`${baseClasses} bg-gray-400`} />;
      default:
        return <div className={`${baseClasses} bg-blue-500`} />;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Enhanced Bell Button */}
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (!isOpen && notifications.length === 0) {
            fetchNotifications({ force: true });
          }
        }}
        className="relative inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-md hover:bg-orange-100 hover:text-orange-700 transition-all duration-300 hover:scale-105 border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
        aria-label={`Toggle notifications (${unreadCount} unread)`}
        tabIndex={0}
      >
        <span className="relative flex items-center justify-center">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" aria-hidden="true" />
          {/* Animated ring for attention */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 text-xs font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 rounded-full border-2 border-white animate-pulse shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
              <span className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" aria-hidden="true"></span>
            </span>
          )}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs hover:bg-blue-50 hover:text-blue-600 px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
                    disabled={isLoading}
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                    <span>{filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                      {['all', 'unread', 'read'].map((filterOption) => (
                        <button
                          key={filterOption}
                          onClick={() => {
                            setFilter(filterOption);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            filter === filterOption ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fetchNotifications({ force: true })}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Bell className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  {searchQuery ? 'No matching notifications' : 'No notifications yet'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery ? 'Try adjusting your search' : "We'll notify you when something happens"}
                </p>
              </div>
            ) : (
              <div className="p-2">
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md group relative ${
                          !notification.is_read
                            ? 'bg-blue-50/50 border border-blue-100 hover:bg-blue-50'
                            : 'bg-white hover:bg-gray-50 border border-gray-100'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 relative">
                            {getNotificationIcon(notification.type)}
                            {!notification.is_read && (
                              <div className="absolute -top-1 -right-1">
                                {getPriorityIndicator(notification.priority)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium text-gray-900 line-clamp-2 ${
                                !notification.is_read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              
                              {notification.priority === 'urgent' && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                  Urgent
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {notification.timeAgo || formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              
                              {notification.action_url && (
                                <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  View →
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action buttons - show on hover */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="h-6 w-6 flex items-center justify-center hover:bg-blue-100 rounded transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="h-6 w-6 flex items-center justify-center hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && (
                        <div className="h-px bg-gray-100 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 text-sm rounded-lg transition-colors font-medium"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdownEnhanced;
