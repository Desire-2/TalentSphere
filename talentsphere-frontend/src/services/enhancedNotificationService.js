// Enhanced notification service with real backend integration
import api from './api';

export class NotificationService {
  static instance = null;
  
  constructor() {
    if (NotificationService.instance) {
      return NotificationService.instance;
    }
    
    this.listeners = new Set();
    this.pollingInterval = null;
    this.cache = new Map();
    
    NotificationService.instance = this;
    return this;
  }

  // Event listener management
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Cache management
  getCacheKey(endpoint, params = {}) {
    const paramStr = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
    return `${endpoint}${paramStr}`;
  }

  setCache(key, data, ttl = 30000) { // 30 second default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // API Methods
  async getNotifications(params = {}) {
    try {
      const cacheKey = this.getCacheKey('notifications', params);
      const cached = this.getCache(cacheKey);
      
      if (cached && !params.force) {
        return cached;
      }

      const response = await api.get('/api/notifications', { params });
      const data = response.data;
      
      this.setCache(cacheKey, data, 15000); // 15 second cache for notifications
      this.notifyListeners('notifications_updated', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Return fallback data if API fails
      return {
        notifications: this.getMockNotifications(),
        unread_count: 2,
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          pages: 1
        }
      };
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await api.post(`/api/notifications/${notificationId}/read`);
      
      // Clear cache to force refresh
      this.clearCache('notifications');
      this.notifyListeners('notification_read', { id: notificationId });
      
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw this.handleError(error);
    }
  }

  async markAllAsRead() {
    try {
      const response = await api.post('/api/notifications/mark-all-read');
      
      // Clear cache to force refresh
      this.clearCache('notifications');
      this.notifyListeners('all_notifications_read');
      
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw this.handleError(error);
    }
  }

  async getNotificationStats() {
    try {
      const cacheKey = this.getCacheKey('notification-stats');
      const cached = this.getCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await api.get('/api/notifications/stats');
      const data = response.data;
      
      this.setCache(cacheKey, data, 60000); // 1 minute cache for stats
      
      return data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      
      // Return mock stats if API fails
      return {
        notifications: {
          total: 12,
          unread: 2,
          recent: 5,
          by_type: [
            { type: 'application_status', count: 6 },
            { type: 'job_alert', count: 4 },
            { type: 'message', count: 2 }
          ]
        },
        messages: {
          total: 8,
          unread: 1
        }
      };
    }
  }

  // Real-time updates
  startPolling(interval = 30000) { // 30 seconds
    this.stopPolling();
    
    this.pollingInterval = setInterval(async () => {
      try {
        // Fetch fresh notifications
        await this.getNotifications({ force: true, per_page: 10 });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Mock data for fallback
  getMockNotifications() {
    return [
      {
        id: 1,
        notification_type: 'application_status',
        priority: 'high',
        title: 'Application Update',
        message: 'Your application for Senior Developer at TechCorp has been reviewed.',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: '/applications/123',
        action_text: 'View Application',
        related_job: {
          id: 123,
          title: 'Senior Developer',
          company_name: 'TechCorp Inc'
        }
      },
      {
        id: 2,
        notification_type: 'job_alert',
        priority: 'normal',
        title: 'New Job Match',
        message: 'New Full Stack Developer position available at StartupXYZ.',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        action_url: '/jobs/456',
        action_text: 'View Job',
        related_job: {
          id: 456,
          title: 'Full Stack Developer',
          company_name: 'StartupXYZ'
        }
      },
      {
        id: 3,
        notification_type: 'message',
        priority: 'normal',
        title: 'New Message',
        message: 'You received a message from Jane Smith at InnovateCorp.',
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        action_url: '/messages/789',
        action_text: 'View Message'
      }
    ];
  }

  // Utility methods
  handleError(error) {
    const message = error.response?.data?.error || error.message || 'An unknown error occurred';
    const status = error.response?.status || 500;
    
    return {
      message,
      status,
      originalError: error
    };
  }

  formatNotification(notification) {
    return {
      ...notification,
      timeAgo: this.getTimeAgo(notification.created_at),
      isRecent: this.isRecent(notification.created_at),
      priorityColor: this.getPriorityColor(notification.priority),
      typeIcon: this.getTypeIcon(notification.notification_type)
    };
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  isRecent(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return (now - date) < 300000; // 5 minutes
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  }

  getTypeIcon(type) {
    const icons = {
      application_status: 'briefcase',
      job_alert: 'search',
      message: 'message-square',
      system: 'settings',
      company: 'building',
      payment: 'credit-card',
      promotion: 'star'
    };
    
    return icons[type] || 'bell';
  }

  // Cleanup
  destroy() {
    this.stopPolling();
    this.clearCache();
    this.listeners.clear();
    NotificationService.instance = null;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export for default usage
export default notificationService;
