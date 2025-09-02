import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/enhancedNotificationService';
import { toast } from 'sonner';

export const useNotifications = (options = {}) => {
  const {
    autoFetch = true,
    enablePolling = false,
    pollingInterval = 30000,
    enableToast = true
  } = options;

  const [state, setState] = useState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    stats: null,
    hasMore: false,
    currentPage: 1
  });

  const listenerRef = useRef(null);

  // Event listener for real-time updates
  const handleServiceEvent = useCallback((event, data) => {
    switch (event) {
      case 'notifications_updated':
        setState(prev => ({
          ...prev,
          notifications: data.notifications || [],
          unreadCount: data.unread_count || 0,
          hasMore: data.pagination?.has_next || false
        }));
        break;

      case 'notification_read':
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notif =>
            notif.id === data.id
              ? { ...notif, is_read: true }
              : notif
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
        break;

      case 'all_notifications_read':
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notif => ({ ...notif, is_read: true })),
          unreadCount: 0
        }));
        if (enableToast) {
          toast.success('All notifications marked as read');
        }
        break;

      case 'new_notification':
        setState(prev => ({
          ...prev,
          notifications: [data, ...prev.notifications],
          unreadCount: prev.unreadCount + 1
        }));
        if (enableToast && data.priority === 'high') {
          toast.info(data.title, {
            description: data.message,
            action: data.action_url ? {
              label: data.action_text || 'View',
              onClick: () => window.location.href = data.action_url
            } : undefined
          });
        }
        break;

      default:
        break;
    }
  }, [enableToast]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await notificationService.getNotifications(params);
      
      setState(prev => ({
        ...prev,
        notifications: params.page > 1 
          ? [...prev.notifications, ...(data.notifications || [])]
          : data.notifications || [],
        unreadCount: data.unread_count || 0,
        hasMore: data.pagination?.has_next || false,
        currentPage: params.page || 1,
        isLoading: false
      }));

      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      
      if (enableToast) {
        toast.error('Failed to fetch notifications');
      }
      
      throw error;
    }
  }, [enableToast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // State update handled by event listener
    } catch (error) {
      if (enableToast) {
        toast.error('Failed to mark notification as read');
      }
      throw error;
    }
  }, [enableToast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      // State update handled by event listener
    } catch (error) {
      if (enableToast) {
        toast.error('Failed to mark all notifications as read');
      }
      throw error;
    }
  }, [enableToast]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (state.isLoading || !state.hasMore) return;
    
    await fetchNotifications({ 
      page: state.currentPage + 1,
      per_page: 10 
    });
  }, [state.isLoading, state.hasMore, state.currentPage, fetchNotifications]);

  // Fetch notification stats
  const fetchStats = useCallback(async () => {
    try {
      const stats = await notificationService.getNotificationStats();
      setState(prev => ({ ...prev, stats }));
      return stats;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications({ force: true });
  }, [fetchNotifications]);

  // Get formatted notifications
  const getFormattedNotifications = useCallback(() => {
    return state.notifications.map(notification => 
      notificationService.formatNotification(notification)
    );
  }, [state.notifications]);

  // Filter notifications by type
  const getNotificationsByType = useCallback((type) => {
    return state.notifications.filter(notif => notif.notification_type === type);
  }, [state.notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return state.notifications.filter(notif => !notif.is_read);
  }, [state.notifications]);

  // Setup effect
  useEffect(() => {
    // Add event listener
    listenerRef.current = notificationService.addListener(handleServiceEvent);

    // Auto fetch on mount
    if (autoFetch) {
      fetchNotifications();
      fetchStats();
    }

    // Enable polling if requested
    if (enablePolling) {
      notificationService.startPolling(pollingInterval);
    }

    // Cleanup
    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
      if (enablePolling) {
        notificationService.stopPolling();
      }
    };
  }, [autoFetch, enablePolling, pollingInterval, handleServiceEvent, fetchNotifications, fetchStats]);

  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error,
    stats: state.stats,
    hasMore: state.hasMore,
    currentPage: state.currentPage,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
    fetchStats,
    refresh,

    // Computed
    formattedNotifications: getFormattedNotifications(),
    unreadNotifications: getUnreadNotifications(),

    // Utilities
    getNotificationsByType,
    getUnreadNotifications,
    getFormattedNotifications
  };
};

export default useNotifications;
