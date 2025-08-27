import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Smartphone, 
  Globe, 
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const ProfileSettings = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('security');

  // Settings states
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    weeklyDigest: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showLastActive: true,
    allowMessages: true,
    showContactInfo: false,
    analyticsOptOut: false
  });

  const [accountSettings, setAccountSettings] = useState({
    emailVerified: false,
    phoneVerified: false,
    profileCompleted: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadSettings();
  }, [isAuthenticated, navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setProfile(response);
      
      // Load notification settings (from local storage or API)
      const savedNotifications = localStorage.getItem('notificationSettings');
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }
      
      // Load privacy settings
      const jobSeekerProfile = response.job_seeker_profile || {};
      setPrivacySettings({
        profileVisibility: jobSeekerProfile.profile_visibility || 'public',
        showLastActive: true,
        allowMessages: true,
        showContactInfo: false,
        analyticsOptOut: false
      });
      
      // Account verification status
      setAccountSettings({
        emailVerified: response.is_verified || false,
        phoneVerified: !!response.phone,
        profileCompleted: calculateProfileCompletion(response)
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.phone,
      profile.bio,
      profile.location,
      profile.job_seeker_profile?.desired_position,
      profile.job_seeker_profile?.skills,
      profile.job_seeker_profile?.years_of_experience,
      profile.job_seeker_profile?.education_level
    ];
    
    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    if (!securitySettings.currentPassword || !securitySettings.newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (securitySettings.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    try {
      setSaving(true);
      await apiService.post('/auth/change-password', {
        current_password: securitySettings.currentPassword,
        new_password: securitySettings.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      // Save to local storage for now
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      setMessage({ type: 'success', text: 'Notification preferences saved' });
    } catch (error) {
      console.error('Failed to save notifications:', error);
      setMessage({ type: 'error', text: 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      await apiService.updateProfile({
        profile_visibility: privacySettings.profileVisibility
      });
      setMessage({ type: 'success', text: 'Privacy settings updated successfully' });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      setMessage({ type: 'error', text: 'Failed to save privacy settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setSaving(true);
      await apiService.post('/auth/send-verification-email');
      setMessage({ type: 'success', text: 'Verification email sent. Please check your inbox.' });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      setMessage({ type: 'error', text: 'Failed to send verification email' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action can be reversed by logging in again.')) {
      try {
        setSaving(true);
        await apiService.post('/auth/deactivate-account');
        setMessage({ type: 'success', text: 'Account deactivated successfully' });
        logout();
        navigate('/');
      } catch (error) {
        console.error('Failed to deactivate account:', error);
        setMessage({ type: 'error', text: 'Failed to deactivate account' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE';
    const userInput = window.prompt(`This action cannot be undone. Type "${confirmText}" to confirm account deletion:`);
    
    if (userInput === confirmText) {
      try {
        setSaving(true);
        await apiService.delete('/auth/delete-account');
        setMessage({ type: 'success', text: 'Account deleted successfully' });
        logout();
        navigate('/');
      } catch (error) {
        console.error('Failed to delete account:', error);
        setMessage({ type: 'error', text: 'Failed to delete account' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      // In a real app, this would download a file
      const data = JSON.stringify(profile, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile-data.json';
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Profile data exported successfully' });
    } catch (error) {
      console.error('Failed to export data:', error);
      setMessage({ type: 'error', text: 'Failed to export profile data' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account security, privacy, and notification preferences</p>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={securitySettings.currentPassword}
                      onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={securitySettings.newPassword}
                      onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={securitySettings.confirmPassword}
                      onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <Button onClick={handleChangePassword} disabled={saving}>
                  <Lock className="w-4 h-4 mr-2" />
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                  />
                </div>
                {securitySettings.twoFactorEnabled && (
                  <Alert>
                    <Key className="w-4 h-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled. You'll need to provide a verification code when logging in.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Login Sessions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Sessions</h3>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500">
                        {navigator.platform} • {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}
                      </p>
                      <p className="text-sm text-gray-500">Last active: Now</p>
                    </div>
                    <Badge variant="secondary">Current</Badge>
                  </div>
                </div>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job Alerts</p>
                      <p className="text-sm text-gray-500">Get notified about new jobs matching your preferences</p>
                    </div>
                    <Switch
                      checked={notificationSettings.jobAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('jobAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Application Updates</p>
                      <p className="text-sm text-gray-500">Updates on your job applications and interview invitations</p>
                    </div>
                    <Switch
                      checked={notificationSettings.applicationUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('applicationUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-gray-500">Summary of new opportunities and profile activity</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Tips, career advice, and promotional content</p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Push Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Browser Notifications</p>
                    <p className="text-sm text-gray-500">Real-time notifications in your browser</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control your profile visibility and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Visibility */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Visibility</h3>
                
                <div className="space-y-3">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      privacySettings.profileVisibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handlePrivacyChange('profileVisibility', 'public')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacySettings.profileVisibility === 'public' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {privacySettings.profileVisibility === 'public' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <Globe className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-sm text-gray-500">Anyone can find and view your profile</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      privacySettings.profileVisibility === 'employers_only' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handlePrivacyChange('profileVisibility', 'employers_only')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacySettings.profileVisibility === 'employers_only' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {privacySettings.profileVisibility === 'employers_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <Eye className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Employers Only</p>
                        <p className="text-sm text-gray-500">Only verified employers can view your profile</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      privacySettings.profileVisibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handlePrivacyChange('profileVisibility', 'private')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacySettings.profileVisibility === 'private' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {privacySettings.profileVisibility === 'private' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <EyeOff className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-sm text-gray-500">Hidden from all searches and users</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Privacy Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Privacy Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Last Active</p>
                      <p className="text-sm text-gray-500">Let others see when you were last active</p>
                    </div>
                    <Switch
                      checked={privacySettings.showLastActive}
                      onCheckedChange={(checked) => handlePrivacyChange('showLastActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Allow Messages</p>
                      <p className="text-sm text-gray-500">Let employers and other users send you messages</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowMessages}
                      onCheckedChange={(checked) => handlePrivacyChange('allowMessages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Contact Information</p>
                      <p className="text-sm text-gray-500">Display your contact details on your public profile</p>
                    </div>
                    <Switch
                      checked={privacySettings.showContactInfo}
                      onCheckedChange={(checked) => handlePrivacyChange('showContactInfo', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Opt out of Analytics</p>
                      <p className="text-sm text-gray-500">Don't track my profile views and interactions for analytics</p>
                    </div>
                    <Switch
                      checked={privacySettings.analyticsOptOut}
                      onCheckedChange={(checked) => handlePrivacyChange('analyticsOptOut', checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSavePrivacy} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Management
              </CardTitle>
              <CardDescription>
                Manage your account status, verification, and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {accountSettings.emailVerified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {accountSettings.emailVerified ? 'Verified' : 'Not verified'}
                    </p>
                    {!accountSettings.emailVerified && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleVerifyEmail}>
                        <Mail className="w-4 h-4 mr-2" />
                        Verify Email
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {accountSettings.phoneVerified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span className="font-medium">Phone</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {accountSettings.phoneVerified ? 'Added' : 'Not added'}
                    </p>
                    {!accountSettings.phoneVerified && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/profile')}>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Add Phone
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {accountSettings.profileCompleted >= 80 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span className="font-medium">Profile</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {accountSettings.profileCompleted}% complete
                    </p>
                    {accountSettings.profileCompleted < 80 && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/job-seeker/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Data Management</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Export Your Data</p>
                      <p className="text-sm text-gray-500">Download a copy of your profile and application data</p>
                    </div>
                    <Button variant="outline" onClick={handleExportData} disabled={saving}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">View Public Profile</p>
                      <p className="text-sm text-gray-500">See how your profile appears to others</p>
                    </div>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                
                <div className="border-red-200 border rounded-lg p-4 bg-red-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Deactivate Account</p>
                        <p className="text-sm text-red-600">Temporarily disable your account (can be reactivated)</p>
                      </div>
                      <Button variant="destructive" onClick={handleDeactivateAccount} disabled={saving}>
                        Deactivate
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete your account and all data (cannot be undone)</p>
                      </div>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={saving}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
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

export default ProfileSettings;
