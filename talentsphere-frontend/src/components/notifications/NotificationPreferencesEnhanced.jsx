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
  VolumeX,
  Calendar,
  CheckCircle
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_alerts':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'application_status':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'messages':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'interview_reminders':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'deadline_reminders':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'company_updates':
        return <Building className="h-4 w-4 text-indigo-500" />;
      case 'system_notifications':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'promotions':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationLabel = (type) => {
    switch (type) {
      case 'job_alerts':
        return 'Job Alerts';
      case 'application_status':
        return 'Application Status Updates';
      case 'messages':
        return 'Messages & Communications';
      case 'interview_reminders':
        return 'Interview Reminders';
      case 'deadline_reminders':
        return 'Application Deadlines';
      case 'company_updates':
        return 'Company Updates';
      case 'system_notifications':
        return 'System Notifications';
      case 'promotions':
        return 'Promotions & Marketing';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-1">Customize how and when you receive notifications</p>
        </div>
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email to stay updated on important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled" className="text-base font-medium">
              Enable Email Notifications
            </Label>
            <Switch
              id="email-enabled"
              checked={preferences.email_preferences?.enabled || false}
              onCheckedChange={(checked) => updatePreference('email_preferences', 'enabled', checked)}
            />
          </div>
          
          {preferences.email_preferences?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-4 border-l-2 border-blue-100">
              {Object.entries(preferences.email_preferences)
                .filter(([key]) => key !== 'enabled')
                .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(key)}
                    <Label className="text-sm">{getNotificationLabel(key)}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updatePreference('email_preferences', key, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-500" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant notifications in your browser or mobile device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-enabled" className="text-base font-medium">
              Enable Push Notifications
            </Label>
            <Switch
              id="push-enabled"
              checked={preferences.push_preferences?.enabled || false}
              onCheckedChange={(checked) => updatePreference('push_preferences', 'enabled', checked)}
            />
          </div>
          
          {preferences.push_preferences?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-4 border-l-2 border-green-100">
              {Object.entries(preferences.push_preferences)
                .filter(([key]) => key !== 'enabled')
                .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(key)}
                    <Label className="text-sm">{getNotificationLabel(key)}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updatePreference('push_preferences', key, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-500" />
            SMS Notifications
            <Badge variant="secondary">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>
            Receive critical notifications via text message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-enabled" className="text-base font-medium">
              Enable SMS Notifications
            </Label>
            <Switch
              id="sms-enabled"
              checked={preferences.sms_preferences?.enabled || false}
              onCheckedChange={(checked) => updatePreference('sms_preferences', 'enabled', checked)}
            />
          </div>
          
          {preferences.sms_preferences?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-4 border-l-2 border-purple-100">
              {Object.entries(preferences.sms_preferences)
                .filter(([key]) => key !== 'enabled')
                .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(key)}
                    <Label className="text-sm">{getNotificationLabel(key)}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updatePreference('sms_preferences', key, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digest Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Digest Settings
          </CardTitle>
          <CardDescription>
            Configure how often you receive summary emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Weekly Digest</Label>
                <Switch
                  checked={preferences.digest_preferences?.weekly_digest_enabled || false}
                  onCheckedChange={(checked) => updatePreference('digest_preferences', 'weekly_digest_enabled', checked)}
                />
              </div>
              {preferences.digest_preferences?.weekly_digest_enabled && (
                <Select
                  value={preferences.digest_preferences?.weekly_digest_day || 'monday'}
                  onValueChange={(value) => updatePreference('digest_preferences', 'weekly_digest_day', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Daily Digest</Label>
                <Switch
                  checked={preferences.digest_preferences?.daily_digest_enabled || false}
                  onCheckedChange={(checked) => updatePreference('digest_preferences', 'daily_digest_enabled', checked)}
                />
              </div>
              {preferences.digest_preferences?.daily_digest_enabled && (
                <Input
                  type="time"
                  value={preferences.digest_preferences?.daily_digest_time || '09:00'}
                  onChange={(e) => updatePreference('digest_preferences', 'daily_digest_time', e.target.value)}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preferences.quiet_hours?.enabled ? 
              <VolumeX className="h-5 w-5 text-red-500" /> : 
              <Volume2 className="h-5 w-5 text-gray-500" />
            }
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive non-urgent notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Enable Quiet Hours</Label>
            <Switch
              checked={preferences.quiet_hours?.enabled || false}
              onCheckedChange={(checked) => updatePreference('quiet_hours', 'enabled', checked)}
            />
          </div>
          
          {preferences.quiet_hours?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pl-4 border-l-2 border-gray-100">
              <div>
                <Label className="text-sm">Start Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours?.start || '22:00'}
                  onChange={(e) => updatePreference('quiet_hours', 'start', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">End Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours?.end || '08:00'}
                  onChange={(e) => updatePreference('quiet_hours', 'end', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Timezone</Label>
                <Select
                  value={preferences.quiet_hours?.timezone || 'UTC'}
                  onValueChange={(value) => updatePreference('quiet_hours', 'timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frequency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Frequency Settings
          </CardTitle>
          <CardDescription>
            Control how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">
              Maximum emails per day: {preferences.frequency_settings?.max_emails_per_day || 10}
            </Label>
            <Slider
              value={[preferences.frequency_settings?.max_emails_per_day || 10]}
              onValueChange={(value) => updatePreference('frequency_settings', 'max_emails_per_day', value[0])}
              max={50}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Batch Notifications</Label>
                <p className="text-xs text-gray-500">Group similar notifications together</p>
              </div>
              <Switch
                checked={preferences.frequency_settings?.batch_notifications || false}
                onCheckedChange={(checked) => updatePreference('frequency_settings', 'batch_notifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Immediate Urgent Notifications</Label>
                <p className="text-xs text-gray-500">Send urgent notifications immediately</p>
              </div>
              <Switch
                checked={preferences.frequency_settings?.immediate_for_urgent || false}
                onCheckedChange={(checked) => updatePreference('frequency_settings', 'immediate_for_urgent', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;