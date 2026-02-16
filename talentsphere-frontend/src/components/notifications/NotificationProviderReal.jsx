import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import api from '../../services/api';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const lastFetchRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Real-time polling interval (30 seconds)
  const POLL_INTERVAL = 30000;
  
  // Notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  // Fetch notifications with caching
  const fetchNotifications = useCallback(async (options = {}) => {
    const { silent = false, force = false } = options;
    
    try {
      if (!silent) setLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        per_page: '50', // Get more for real-time updates
        ...options.params
      });

      const data = await api.get(`/enhanced-notifications/notifications?${params}`);
      
      const newNotifications = data.notifications || [];
      const newUnreadCount = data.unread_count || 0;
      
      // Check for new notifications using functional setState
      setNotifications(prevNotifications => {
        if (lastFetchRef.current && !silent) {
          const previousIds = new Set(prevNotifications.map(n => n.id));
          const reallyNewNotifications = newNotifications.filter(n => !previousIds.has(n.id));
          
          if (reallyNewNotifications.length > 0) {
            // Show toast for new notifications
            reallyNewNotifications.forEach(notification => {
              if (!notification.is_read) {
                toast.info(notification.title, {
                  description: notification.message,
                  action: {
                    label: 'View',
                    onClick: () => markAsRead(notification.id)
                  },
                  duration: 5000
                });
              }
            });
            
            // Play notification sound for unread notifications
            if (reallyNewNotifications.some(n => !n.is_read)) {
              playNotificationSound();
            }
          }
        }
        return newNotifications;
      });
      
      setUnreadCount(newUnreadCount);
      lastFetchRef.current = Date.now();
      
      return data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (!silent) {
        toast.error('Failed to load notifications');
      }
      throw error;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [playNotificationSound]);

  // Fetch notification stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/enhanced-notifications/notifications/stats');
      setStats(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      throw error;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.post(`/enhanced-notifications/notifications/${notificationId}/read`);
      
      // Optimistically update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh stats
      fetchStats();
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
      throw error;
    }
  }, [fetchStats]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/enhanced-notifications/notifications/mark-all-read');
      
      // Optimistically update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      
      // Refresh stats
      fetchStats();
      
      toast.success('All notifications marked as read');
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
      throw error;
    }
  }, [fetchStats]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/enhanced-notifications/notifications/${notificationId}`);
      
      // Optimistically update local state using functional setState
      setNotifications(prev => {
        const deletedNotification = prev.find(n => n.id === notificationId);
        const wasUnread = deletedNotification && !deletedNotification.is_read;
        
        if (wasUnread) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return prev.filter(notif => notif.id !== notificationId);
      });
      
      // Refresh stats
      fetchStats();
      
      toast.success('Notification deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      throw error;
    }
  }, [fetchStats]);

  // Create new notification
  const createNotification = useCallback(async (notificationData) => {
    try {
      const data = await api.post('/enhanced-notifications/notifications', notificationData);
      
      // Add to local state
      setNotifications(prev => [data, ...prev]);
      
      if (!data.is_read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Refresh stats
      fetchStats();
      
      toast.success('Notification created');
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast.error('Failed to create notification');
      throw error;
    }
  }, [fetchStats]);

  // Start real-time polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || isPolling) return;
    
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL);
  }, [isPolling, fetchNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Run initial fetch
    const initialize = async () => {
      try {
        await fetchNotifications();
        await fetchStats();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };
    
    initialize();
    
    // Start polling
    startPolling();
    
    return () => {
      // Cleanup on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Browser visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh when user comes back to the tab
        fetchNotifications({ silent: true });
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications, fetchStats]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Browser notifications enabled');
        }
      });
    }
  }, []);

  // Filter notifications
  const getFilteredNotifications = useCallback((filters = {}) => {
    let filtered = [...notifications];
    
    if (filters.isRead !== undefined) {
      filtered = filtered.filter(n => n.is_read === filters.isRead);
    }
    
    if (filters.type) {
      filtered = filtered.filter(n => n.notification_type === filters.type);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }
    
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [notifications]);

  const value = {
    // State
    notifications,
    unreadCount,
    stats,
    loading,
    isPolling,
    lastFetch,
    
    // Actions
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    startPolling,
    stopPolling,
    
    // Utilities
    getFilteredNotifications,
    
    // Helpers
    getUnreadNotifications: () => getFilteredNotifications({ isRead: false }),
    getReadNotifications: () => getFilteredNotifications({ isRead: true }),
    getNotificationsByType: (type) => getFilteredNotifications({ type }),
    getNotificationsByPriority: (priority) => getFilteredNotifications({ priority })
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;