import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '../services/notificationService';

export const useNotificationToasts = () => {
  const { notifications, unreadCount } = useNotifications();
  const prevUnreadCount = useRef(unreadCount);
  const prevNotifications = useRef(notifications);

  useEffect(() => {
    // Check for new notifications
    if (notifications.length > prevNotifications.current.length) {
      const newNotifications = notifications.slice(0, notifications.length - prevNotifications.current.length);
      
      // Show toast for each new notification
      newNotifications.forEach(notification => {
        if (!notification.is_read) {
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to notifications page or handle action
                window.location.href = '/notifications';
              }
            }
          });
        }
      });
    }

    // Check for unread count changes
    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current !== null) {
      const diff = unreadCount - prevUnreadCount.current;
      if (diff > 0) {
        toast.success(`${diff} new notification${diff > 1 ? 's' : ''}`, {
          duration: 3000
        });
      }
    }

    prevUnreadCount.current = unreadCount;
    prevNotifications.current = notifications;
  }, [notifications, unreadCount]);

  return null; // This hook doesn't render anything
};

export default useNotificationToasts;
