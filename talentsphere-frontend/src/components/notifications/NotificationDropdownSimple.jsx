import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Briefcase, Building, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdownSimple = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const dropdownRef = useRef(null);

  // Mock data
  useEffect(() => {
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
  }, []);

  // Handle click outside
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

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, is_read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    setUnreadCount(0);
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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
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
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-gray-400 text-sm">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md group ${
                          !notification.is_read
                            ? 'bg-blue-50/50 border border-blue-100 hover:bg-blue-50'
                            : 'bg-white hover:bg-gray-50 border border-gray-100'
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 relative">
                            {getNotificationIcon(notification.type)}
                            {!notification.is_read && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium text-gray-900 ${
                              !notification.is_read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="h-6 w-6 flex items-center justify-center hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {index < notifications.length - 1 && <div className="h-px bg-gray-100 mx-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 text-sm rounded-lg transition-colors"
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

export default NotificationDropdownSimple;
