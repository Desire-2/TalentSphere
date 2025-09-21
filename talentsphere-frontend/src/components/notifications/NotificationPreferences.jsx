import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Briefcase,
  AlertCircle,
  Building,
  Settings,
  Save,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '../../services/api';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from enhanced API
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await api.get('/enhanced-notifications/notification-preferences');
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
      // Set default preferences
      setPreferences({
        email_preferences: {
          enabled: true,
          job_alerts: true,
          application_status: true,
          messages: true,
          interview_reminders: true,
          deadline_reminders: true,
          company_updates: false,
          system_notifications: true,
          promotions: false
        },
        push_preferences: {
          enabled: true,
          job_alerts: true,
          application_status: true,
          messages: true,
          interview_reminders: true,
          deadline_reminders: true,
          company_updates: true,
          system_notifications: true,
          promotions: false
        },
        sms_preferences: {
          enabled: false,
          interview_reminders: false,
          deadline_reminders: false
        },
        digest_preferences: {
          weekly_digest_enabled: true,
          weekly_digest_day: 'monday',
          daily_digest_enabled: false,
          daily_digest_time: '09:00'
        },
        quiet_hours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        },
        frequency_settings: {
          max_emails_per_day: 10,
          batch_notifications: true,
          immediate_for_urgent: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      await api.put('/enhanced-notifications/notification-preferences', preferences);
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading preferences...
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load notification preferences</p>
        <Button onClick={loadPreferences} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }
    do_not_disturb: false,
    digest_frequency: 'daily', // immediate, daily, weekly
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/notification-preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      setIsSaving(true);
      await api.put('/notification-preferences', {
        ...preferences,
        global_settings: globalSettings
      });
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelToggle = (channel, type, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: enabled
      }
    }));
  };

  const handleGlobalSettingChange = (setting, value) => {
    setGlobalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email_notifications':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'push_notifications':
        return <Bell className="h-5 w-5 text-green-500" />;
      case 'sms_notifications':
        return <Smartphone className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'application_status':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'job_alerts':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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
        return 'Email Notifications';
      case 'push_notifications':
        return 'Push Notifications';
      case 'sms_notifications':
        return 'SMS Notifications';
      default:
        return channel;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'application_status':
        return 'Application Status Updates';
      case 'job_alerts':
        return 'Job Alerts & Recommendations';
      case 'messages':
        return 'Direct Messages';
      case 'promotions':
        return 'Promotional Content';
      case 'system':
        return 'System Announcements';
      case 'company_updates':
        return 'Company Updates';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeDescription = (type) => {
    switch (type) {
      case 'application_status':
        return 'Updates about your job applications (accepted, rejected, interview scheduled)';
      case 'job_alerts':
        return 'New job postings matching your preferences and recommendations';
      case 'messages':
        return 'Messages from employers, recruiters, and other users';
      case 'promotions':
        return 'Special offers, premium features, and marketing communications';
      case 'system':
        return 'Important system updates, maintenance notices, and security alerts';
      case 'company_updates':
        return 'Updates from companies you follow or have applied to';
      default:
        return 'Notifications related to ' + getTypeName(type).toLowerCase();
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
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-muted-foreground">
            Choose how and when you want to receive notifications
          </p>
        </div>
        <Button onClick={updatePreferences} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Configure general notification behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Do Not Disturb</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily pause all non-urgent notifications
              </p>
            </div>
            <Switch
              checked={globalSettings.do_not_disturb}
              onCheckedChange={(checked) => handleGlobalSettingChange('do_not_disturb', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Suppress notifications during specified hours
              </p>
            </div>
            <Switch
              checked={globalSettings.quiet_hours_enabled}
              onCheckedChange={(checked) => handleGlobalSettingChange('quiet_hours_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <div className="space-y-4">
        {Object.entries(preferences).map(([channel, settings]) => (
          <Card key={channel}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getChannelIcon(channel)}
                {getChannelName(channel)}
              </CardTitle>
              <CardDescription>
                Configure {getChannelName(channel).toLowerCase()} for different types of activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings).map(([type, enabled]) => (
                  <div key={type} className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium text-sm">
                            {getTypeName(type)}
                          </Label>
                          {type === 'application_status' && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTypeDescription(type)}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleChannelToggle(channel, type, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common notification preference configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreferences(prev => ({
                  email_notifications: {
                    ...prev.email_notifications,
                    application_status: true,
                    job_alerts: true,
                    messages: true,
                    promotions: false,
                    system: true,
                    company_updates: false
                  },
                  push_notifications: {
                    ...prev.push_notifications,
                    application_status: true,
                    job_alerts: false,
                    messages: true,
                    promotions: false,
                    system: false,
                    company_updates: false
                  },
                  sms_notifications: {
                    ...prev.sms_notifications,
                    application_status: false,
                    job_alerts: false,
                    messages: false,
                    promotions: false,
                    system: false,
                    company_updates: false
                  }
                }));
                toast.success('Applied minimal notification settings');
              }}
            >
              Essential Only
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreferences(prev => ({
                  email_notifications: {
                    application_status: true,
                    job_alerts: true,
                    messages: true,
                    promotions: true,
                    system: true,
                    company_updates: true
                  },
                  push_notifications: {
                    application_status: true,
                    job_alerts: true,
                    messages: true,
                    promotions: false,
                    system: true,
                    company_updates: true
                  },
                  sms_notifications: {
                    application_status: true,
                    job_alerts: false,
                    messages: false,
                    promotions: false,
                    system: false,
                    company_updates: false
                  }
                }));
                toast.success('Applied recommended notification settings');
              }}
            >
              Recommended
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreferences(prev => ({
                  email_notifications: {
                    application_status: false,
                    job_alerts: false,
                    messages: false,
                    promotions: false,
                    system: false,
                    company_updates: false
                  },
                  push_notifications: {
                    application_status: false,
                    job_alerts: false,
                    messages: false,
                    promotions: false,
                    system: false,
                    company_updates: false
                  },
                  sms_notifications: {
                    application_status: false,
                    job_alerts: false,
                    messages: false,
                    promotions: false,
                    system: false,
                    company_updates: false
                  }
                }));
                toast.success('All notifications disabled');
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

export default NotificationPreferences;
