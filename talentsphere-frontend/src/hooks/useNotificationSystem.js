import { useState, useEffect } from 'react';
import { useNotifications as useNotificationStore } from '../services/notifications.js';

export const useNotificationSystem = () => {
  const store = useNotificationStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Initialize with some mock data if API is not available
      if (store.notifications.length === 0) {
        // Try to fetch real notifications first
        store.fetchNotifications().catch(() => {
          console.log('Using mock notifications for demo');
          // Add some mock notifications for demo purposes
          const mockNotifications = [
            {
              id: 1,
              type: 'application_status',
              priority: 'high',
              title: 'Application Update',
              content: 'Your application for Senior Developer has been reviewed.',
              is_read: false,
              created_at: new Date().toISOString(),
              user_id: 1
            },
            {
              id: 2,
              type: 'job_alert',
              priority: 'normal',
              title: 'New Job Match',
              content: 'A new React Developer position matches your profile.',
              is_read: true,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              user_id: 1
            }
          ];
          
          mockNotifications.forEach(notif => {
            store.addNotification(notif);
          });
        });
      }
      setIsInitialized(true);
    }
  }, [store, isInitialized]);

  return store;
};

export default useNotificationSystem;
