import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Briefcase, 
  Building, 
  Settings,
  Moon,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
// import { useNotifications } from '../../services/notifications.js';

const NotificationSettings = () => {
  // const { preferences, fetchPreferences, updatePreferences } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    email_notifications: {
      application_status: true,
      job_alerts: true,
      messages: true,
      promotions: false,
      system: true,
      company_updates: false
    },
    push_notifications: {
      application_status: true,
      job_alerts: false,
      messages: true,
      promotions: false,
      system: false,
      company_updates: false
    },
    in_app_notifications: {
      application_status: true,
      job_alerts: true,
      messages: true,
      promotions: false,
      system: true,
      company_updates: true
    },
    global_settings: {
      do_not_disturb: false,
      digest_enabled: false,
      digest_frequency: 'daily',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      sound_enabled: true
    }
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      // Temporarily disabled
      // if (fetchPreferences) {
      //   const prefs = await fetchPreferences();
      //   if (prefs) {
      //     setSettings(prefs);
      //   }
      // }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      // Temporarily disabled
      // if (updatePreferences) {
      //   await updatePreferences(settings);
      // }
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationSetting = (channel, type, value) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: value
      }
    }));
  };

  const updateGlobalSetting = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      global_settings: {
        ...prev.global_settings,
        [setting]: value
      }
    }));
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email_notifications':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'push_notifications':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'in_app_notifications':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'application_status':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'job_alerts':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'messages':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'promotions':
        return <Settings className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'company_updates':
        return <Building className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelName = (channel) => {
    switch (channel) {
      case 'email_notifications':
        return 'Email';
      case 'push_notifications':
        return 'Push';
      case 'in_app_notifications':
        return 'In-App';
      default:
        return channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'application_status':
        return 'Applications';
      case 'job_alerts':
        return 'Job Alerts';
      case 'messages':
        return 'Messages';
      case 'promotions':
        return 'Promotions';
      case 'system':
        return 'System';
      case 'company_updates':
        return 'Companies';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notification Settings</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive notifications
          </p>
        </div>
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Settings
          </CardTitle>
          <CardDescription>
            Global notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Moon className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Do Not Disturb</Label>
                <p className="text-xs text-muted-foreground">Pause all notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.global_settings?.do_not_disturb || false}
              onCheckedChange={(checked) => updateGlobalSetting('do_not_disturb', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Quiet Hours</Label>
                <p className="text-xs text-muted-foreground">Reduce notifications during specified hours</p>
              </div>
            </div>
            <Switch
              checked={settings.global_settings?.quiet_hours_enabled || false}
              onCheckedChange={(checked) => updateGlobalSetting('quiet_hours_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {settings.global_settings?.sound_enabled ? (
                <Volume2 className="h-4 w-4 text-gray-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <Label className="text-sm font-medium">Sound Notifications</Label>
                <p className="text-xs text-muted-foreground">Play sound for notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.global_settings?.sound_enabled || false}
              onCheckedChange={(checked) => updateGlobalSetting('sound_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Channels</CardTitle>
          <CardDescription>
            Configure notification preferences by type and delivery method
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-4 pb-4 border-b text-sm font-medium text-muted-foreground">
            <div>Notification Type</div>
            <div className="text-center">Email</div>
            <div className="text-center">Push</div>
            <div className="text-center">In-App</div>
            <div></div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4 pt-4">
            {Object.keys(settings.email_notifications || {}).map((type) => (
              <div key={type} className="grid grid-cols-5 gap-4 items-center">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(type)}
                  <span className="text-sm font-medium">{getTypeName(type)}</span>
                  {type === 'application_status' && (
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  )}
                </div>
                
                {/* Email */}
                <div className="flex justify-center">
                  <Switch
                    checked={settings.email_notifications?.[type] || false}
                    onCheckedChange={(checked) => updateNotificationSetting('email_notifications', type, checked)}
                    size="sm"
                  />
                </div>
                
                {/* Push */}
                <div className="flex justify-center">
                  <Switch
                    checked={settings.push_notifications?.[type] || false}
                    onCheckedChange={(checked) => updateNotificationSetting('push_notifications', type, checked)}
                    size="sm"
                  />
                </div>
                
                {/* In-App */}
                <div className="flex justify-center">
                  <Switch
                    checked={settings.in_app_notifications?.[type] || false}
                    onCheckedChange={(checked) => updateNotificationSetting('in_app_notifications', type, checked)}
                    size="sm"
                  />
                </div>

                <div></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Presets</CardTitle>
          <CardDescription>
            Apply common notification configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const essentialPrefs = {
                  email_notifications: {
                    application_status: true,
                    job_alerts: false,
                    messages: true,
                    promotions: false,
                    system: true,
                    company_updates: false
                  },
                  push_notifications: {
                    application_status: true,
                    job_alerts: false,
                    messages: true,
                    promotions: false,
                    system: false,
                    company_updates: false
                  },
                  in_app_notifications: {
                    application_status: true,
                    job_alerts: true,
                    messages: true,
                    promotions: false,
                    system: true,
                    company_updates: false
                  }
                };
                setSettings(prev => ({ ...prev, ...essentialPrefs }));
                toast.success('Applied essential notifications preset');
              }}
            >
              Essential Only
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allPrefs = Object.keys(settings.email_notifications).reduce((acc, type) => {
                  acc.email_notifications[type] = true;
                  acc.push_notifications[type] = type !== 'promotions';
                  acc.in_app_notifications[type] = true;
                  return acc;
                }, { email_notifications: {}, push_notifications: {}, in_app_notifications: {} });
                
                setSettings(prev => ({ ...prev, ...allPrefs }));
                toast.success('Enabled all notifications');
              }}
            >
              Enable All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const disabledPrefs = Object.keys(settings.email_notifications).reduce((acc, type) => {
                  acc.email_notifications[type] = false;
                  acc.push_notifications[type] = false;
                  acc.in_app_notifications[type] = false;
                  return acc;
                }, { email_notifications: {}, push_notifications: {}, in_app_notifications: {} });
                
                setSettings(prev => ({ ...prev, ...disabledPrefs }));
                toast.success('Disabled all notifications');
              }}
            >
              Disable All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
