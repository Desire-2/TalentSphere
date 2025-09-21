import React, { useState, useEffect } from 'react';
import {
  Bell,
  Settings,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  Shield,
  Volume2,
  VolumeX,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const EnhancedNotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/enhanced-notifications/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        console.error('Failed to fetch preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/enhanced-notifications/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Notification preferences saved successfully');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      email_preferences: {
        ...prev.email_preferences,
        [key]: value
      }
    }));
  };

  const updatePushPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      push_preferences: {
        ...prev.push_preferences,
        [key]: value
      }
    }));
  };

  const updateDigestPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      digest_preferences: {
        ...prev.digest_preferences,
        [key]: value
      }
    }));
  };

  const updateQuietHours = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [key]: value
      }
    }));
  };

  const updateFrequencySettings = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      frequency_settings: {
        ...prev.frequency_settings,
        [key]: value
      }
    }));
  };

  const notificationTypes = [
    {
      key: 'job_alerts',
      label: 'Job Alerts',
      description: 'New job matches based on your preferences',
      icon: <Star className="w-4 h-4" />,
      importance: 'medium'
    },
    {
      key: 'application_status',
      label: 'Application Updates',
      description: 'Updates on your job applications',
      icon: <CheckCircle className="w-4 h-4" />,
      importance: 'high'
    },
    {
      key: 'messages',
      label: 'Messages',
      description: 'Direct messages from employers',
      icon: <MessageSquare className="w-4 h-4" />,
      importance: 'high'
    },
    {
      key: 'interview_reminders',
      label: 'Interview Reminders',
      description: 'Upcoming interview notifications',
      icon: <Calendar className="w-4 h-4" />,
      importance: 'critical'
    },
    {
      key: 'deadline_reminders',
      label: 'Application Deadlines',
      description: 'Job application deadline alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      importance: 'critical'
    },
    {
      key: 'company_updates',
      label: 'Company Updates',
      description: 'News and updates from companies you follow',
      icon: <Info className="w-4 h-4" />,
      importance: 'low'
    },
    {
      key: 'system_notifications',
      label: 'System Notifications',
      description: 'Important system updates and security alerts',
      icon: <Shield className="w-4 h-4" />,
      importance: 'medium'
    },
    {
      key: 'promotions',
      label: 'Promotional Content',
      description: 'Featured jobs and special offers',
      icon: <Star className="w-4 h-4" />,
      importance: 'low'
    }
  ];

  const getImportanceBadge = (importance) => {
    const variants = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return (
      <Badge variant={variants[importance]} className="text-xs">
        {importance}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Notification Preferences
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize how and when you receive notifications
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="delivery">Delivery Methods</TabsTrigger>
          <TabsTrigger value="types">Notification Types</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Receive notifications via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled" className="flex items-center gap-2">
                    Enable Email Notifications
                  </Label>
                  <Switch
                    id="email-enabled"
                    checked={preferences.email_preferences.enabled}
                    onCheckedChange={(checked) => updateEmailPreference('enabled', checked)}
                  />
                </div>
                
                {preferences.email_preferences.enabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-100">
                    {notificationTypes.map((type) => (
                      <div key={type.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <span className="text-sm">{type.label}</span>
                          {getImportanceBadge(type.importance)}
                        </div>
                        <Switch
                          checked={preferences.email_preferences[type.key]}
                          onCheckedChange={(checked) => updateEmailPreference(type.key, checked)}
                          disabled={!preferences.email_preferences.enabled}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Push Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  In-App Notifications
                </CardTitle>
                <CardDescription>
                  Receive notifications within the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled" className="flex items-center gap-2">
                    Enable In-App Notifications
                  </Label>
                  <Switch
                    id="push-enabled"
                    checked={preferences.push_preferences.enabled}
                    onCheckedChange={(checked) => updatePushPreference('enabled', checked)}
                  />
                </div>
                
                {preferences.push_preferences.enabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-green-100">
                    {notificationTypes.map((type) => (
                      <div key={type.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <span className="text-sm">{type.label}</span>
                          {getImportanceBadge(type.importance)}
                        </div>
                        <Switch
                          checked={preferences.push_preferences[type.key]}
                          onCheckedChange={(checked) => updatePushPreference(type.key, checked)}
                          disabled={!preferences.push_preferences.enabled}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Configure specific notification types and their importance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {type.icon}
                        <div>
                          <h4 className="font-medium">{type.label}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      {getImportanceBadge(type.importance)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Email</span>
                        <Switch
                          checked={preferences.email_preferences[type.key]}
                          onCheckedChange={(checked) => updateEmailPreference(type.key, checked)}
                          disabled={!preferences.email_preferences.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>In-App</span>
                        <Switch
                          checked={preferences.push_preferences[type.key]}
                          onCheckedChange={(checked) => updatePushPreference(type.key, checked)}
                          disabled={!preferences.push_preferences.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Digest Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Digest Emails
                </CardTitle>
                <CardDescription>
                  Receive summary emails of your activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <Switch
                      id="weekly-digest"
                      checked={preferences.digest_preferences.weekly_digest_enabled}
                      onCheckedChange={(checked) => updateDigestPreference('weekly_digest_enabled', checked)}
                    />
                  </div>
                  
                  {preferences.digest_preferences.weekly_digest_enabled && (
                    <div className="pl-4">
                      <Label>Send on</Label>
                      <Select
                        value={preferences.digest_preferences.weekly_digest_day}
                        onValueChange={(value) => updateDigestPreference('weekly_digest_day', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="daily-digest">Daily Digest</Label>
                    <Switch
                      id="daily-digest"
                      checked={preferences.digest_preferences.daily_digest_enabled}
                      onCheckedChange={(checked) => updateDigestPreference('daily_digest_enabled', checked)}
                    />
                  </div>
                  
                  {preferences.digest_preferences.daily_digest_enabled && (
                    <div className="pl-4">
                      <Label>Send at</Label>
                      <Select
                        value={preferences.digest_preferences.daily_digest_time}
                        onValueChange={(value) => updateDigestPreference('daily_digest_time', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="19:00">7:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {preferences.quiet_hours.enabled ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Set times when you don't want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                  <Switch
                    id="quiet-hours"
                    checked={preferences.quiet_hours.enabled}
                    onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
                  />
                </div>
                
                {preferences.quiet_hours.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Select
                          value={preferences.quiet_hours.start}
                          onValueChange={(value) => updateQuietHours('start', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={hour} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>End Time</Label>
                        <Select
                          value={preferences.quiet_hours.end}
                          onValueChange={(value) => updateQuietHours('end', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={hour} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Note: Urgent notifications may still be delivered during quiet hours
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune your notification experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Maximum emails per day</Label>
                  <Select
                    value={preferences.frequency_settings.max_emails_per_day.toString()}
                    onValueChange={(value) => updateFrequencySettings('max_emails_per_day', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 emails</SelectItem>
                      <SelectItem value="10">10 emails</SelectItem>
                      <SelectItem value="20">20 emails</SelectItem>
                      <SelectItem value="50">50 emails</SelectItem>
                      <SelectItem value="-1">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Limit the number of notification emails per day
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Batch notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Group multiple notifications into single emails
                      </p>
                    </div>
                    <Switch
                      checked={preferences.frequency_settings.batch_notifications}
                      onCheckedChange={(checked) => updateFrequencySettings('batch_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Immediate urgent notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send urgent notifications immediately, even during quiet hours
                      </p>
                    </div>
                    <Switch
                      checked={preferences.frequency_settings.immediate_for_urgent}
                      onCheckedChange={(checked) => updateFrequencySettings('immediate_for_urgent', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedNotificationPreferences;