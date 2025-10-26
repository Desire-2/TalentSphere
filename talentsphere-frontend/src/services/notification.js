import api from './api';

export const notificationService = {
  // Get all notifications
  getNotifications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/notifications?${queryParams.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get notification by ID
  getNotificationById: async (id) => {
    try {
      const response = await api.get(`/notifications/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data || response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark notification as unread
  markAsUnread: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/unread`);
      return response.data || response;
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      return response.data || response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Bulk mark as read
  bulkMarkAsRead: async (notificationIds) => {
    try {
      const response = await api.post('/notifications/bulk-read', {
        notification_ids: notificationIds
      });
      return response.data || response;
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      throw error;
    }
  },

  // Bulk mark as unread
  bulkMarkAsUnread: async (notificationIds) => {
    try {
      const response = await api.post('/notifications/bulk-unread', {
        notification_ids: notificationIds
      });
      return response.data || response;
    } catch (error) {
      console.error('Error bulk marking as unread:', error);
      throw error;
    }
  },

  // Bulk delete notifications
  bulkDelete: async (notificationIds) => {
    try {
      const response = await api.post('/notifications/bulk-delete', {
        notification_ids: notificationIds
      });
      return response.data || response;
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw error;
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      const response = await api.get('/notification-preferences');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/notification-preferences', preferences);
      return response.data || response;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Archive notification
  archiveNotification: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/archive`);
      return response.data || response;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  },

  // Unarchive notification
  unarchiveNotification: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/unarchive`);
      return response.data || response;
    } catch (error) {
      console.error('Error unarchiving notification:', error);
      throw error;
    }
  },

  // Toggle important/star
  toggleImportant: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/toggle-important`);
      return response.data || response;
    } catch (error) {
      console.error('Error toggling important status:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAll: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data || response;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  },

  // Subscribe to push notifications (if PWA/service worker enabled)
  subscribeToPush: async (subscription) => {
    try {
      const response = await api.post('/notifications/subscribe-push', subscription);
      return response.data || response;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  },

  // Unsubscribe from push notifications
  unsubscribeFromPush: async () => {
    try {
      const response = await api.post('/notifications/unsubscribe-push');
      return response.data || response;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }
};
