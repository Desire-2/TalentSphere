import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  Key,
  Save,
  Upload,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { externalAdminService } from '../../services/externalAdmin';
import { useAuthStore } from '../../stores/authStore';

const ExternalAdminProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    company: '',
    website: '',
    location: '',
    timezone: 'UTC',
    avatar_url: ''
  });

  // Security state
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
    session_timeout: 30,
    api_key: '',
    allowed_ips: []
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    job_application_alerts: true,
    weekly_reports: true,
    system_updates: true,
    marketing_emails: false,
    digest_frequency: 'daily',
    notification_time: '09:00'
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'private',
    show_email: false,
    show_phone: false,
    allow_contact: true,
    data_sharing: false,
    analytics_tracking: true
  });

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await externalAdminService.getProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const loadSettings = async () => {
    try {
      const response = await externalAdminService.getSettings();
      setSecurity(response.security || security);
      setNotifications(response.notifications || notifications);
      setPrivacy(response.privacy || privacy);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await externalAdminService.updateProfile(profile);
      updateUser(response.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (security.new_password !== security.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await externalAdminService.changePassword({
        current_password: security.current_password,
        new_password: security.new_password
      });
      
      setSecurity(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await externalAdminService.updateSettings({
        notifications,
        privacy,
        security: {
          two_factor_enabled: security.two_factor_enabled,
          session_timeout: security.session_timeout,
          allowed_ips: security.allowed_ips
        }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setLoading(true);
      const response = await externalAdminService.generateApiKey();
      setSecurity(prev => ({ ...prev, api_key: response.api_key }));
      toast.success('API key generated successfully');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async () => {
    if (!confirm('Are you sure you want to revoke your API key? This action cannot be undone.')) return;

    try {
      setLoading(true);
      await externalAdminService.revokeApiKey();
      setSecurity(prev => ({ ...prev, api_key: '' }));
      toast.success('API key revoked successfully');
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const response = await externalAdminService.exportUserData();
      
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `external-admin-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') return;

    try {
      setLoading(true);
      await externalAdminService.deleteAccount();
      toast.success('Account deleted successfully');
      // Redirect to login or homepage
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        <p className="text-gray-600">Manage your external admin profile and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
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

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={security.current_password}
                  onChange={(e) => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={security.new_password}
                  onChange={(e) => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={security.confirm_password}
                  onChange={(e) => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                <Key className="h-4 w-4 mr-2" />
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={security.two_factor_enabled}
                  onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, two_factor_enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Key Management */}
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={security.api_key ? '••••••••••••••••' : 'No API key generated'}
                    readOnly
                  />
                  {security.api_key ? (
                    <Button variant="outline" onClick={revokeApiKey} disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={generateApiKey} disabled={loading}>
                      Generate
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Use this key to access TalentSphere API programmatically
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job Application Alerts</p>
                      <p className="text-sm text-gray-600">Get notified when someone applies to your jobs</p>
                    </div>
                    <Switch
                      checked={notifications.job_application_alerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, job_application_alerts: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
                    </div>
                    <Switch
                      checked={notifications.weekly_reports}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weekly_reports: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">System Updates</p>
                      <p className="text-sm text-gray-600">Get notified about platform updates</p>
                    </div>
                    <Switch
                      checked={notifications.system_updates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, system_updates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-600">Receive promotional content and tips</p>
                    </div>
                    <Switch
                      checked={notifications.marketing_emails}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing_emails: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Digest Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Digest Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="digest_frequency">Digest Frequency</Label>
                    <Select value={notifications.digest_frequency} onValueChange={(value) => setNotifications(prev => ({ ...prev, digest_frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notification_time">Preferred Time</Label>
                    <Input
                      id="notification_time"
                      type="time"
                      value={notifications.notification_time}
                      onChange={(e) => setNotifications(prev => ({ ...prev, notification_time: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Visibility */}
              <div className="space-y-4">
                <h3 className="font-medium">Profile Visibility</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="profile_visibility">Profile Visibility</Label>
                    <Select value={privacy.profile_visibility} onValueChange={(value) => setPrivacy(prev => ({ ...prev, profile_visibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="contacts">Contacts Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Email Address</p>
                      <p className="text-sm text-gray-600">Allow others to see your email</p>
                    </div>
                    <Switch
                      checked={privacy.show_email}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_email: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Phone Number</p>
                      <p className="text-sm text-gray-600">Allow others to see your phone</p>
                    </div>
                    <Switch
                      checked={privacy.show_phone}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_phone: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Allow Contact</p>
                      <p className="text-sm text-gray-600">Allow job seekers to contact you directly</p>
                    </div>
                    <Switch
                      checked={privacy.allow_contact}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allow_contact: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data & Analytics */}
              <div className="space-y-4">
                <h3 className="font-medium">Data & Analytics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Sharing</p>
                      <p className="text-sm text-gray-600">Share anonymized data for platform improvement</p>
                    </div>
                    <Switch
                      checked={privacy.data_sharing}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, data_sharing: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analytics Tracking</p>
                      <p className="text-sm text-gray-600">Allow usage analytics for better experience</p>
                    </div>
                    <Switch
                      checked={privacy.analytics_tracking}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, analytics_tracking: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="font-medium">Data Management</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportData} disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Download a copy of your data in JSON format
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExternalAdminProfile;
