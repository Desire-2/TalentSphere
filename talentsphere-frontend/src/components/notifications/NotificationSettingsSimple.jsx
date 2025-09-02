import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Notification settings functionality coming soon!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature will allow you to customize how you receive notifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
