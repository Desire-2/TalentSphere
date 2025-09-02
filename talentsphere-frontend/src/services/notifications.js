// Simple notification service for testing
import { create } from 'zustand';
import api from './api';

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  
  // Actions
  fetchNotifications: async (options = {}) => {
    try {
      set({ isLoading: true });
      const response = await api.get('/notifications');
      set({
        notifications: response.data.notifications || [],
        unreadCount: response.data.unread_count || 0,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      set(state => ({
        notifications: state.notifications.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set(state => ({
        notifications: state.notifications.map(notif => ({
          ...notif,
          is_read: true
        })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.is_read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },

  // Mock function for demo
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1
    }));
  }
}));

export const useNotifications = () => useNotificationStore();
export default useNotificationStore;
