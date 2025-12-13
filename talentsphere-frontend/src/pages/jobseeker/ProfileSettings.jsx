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
  ExternalLink,
  User,
  Bell,
  BellOff,
  Clock,
  Moon,
  Zap,
  MessageSquare,
  Briefcase,
  Calendar,
  TrendingUp,
  Info,
  Check,
  X,
  Loader2
} from 'lucide-react';

const ProfileSettings = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('security');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Settings states
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showLastActive: true,
    allowMessages: true,
    showContactInfo: false,
    analyticsOptOut: false
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
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

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Password strength calculator
  useEffect(() => {
    if (securitySettings.newPassword) {
      const password = securitySettings.newPassword;
      let strength = 0;
      
      if (password.length >= 8) strength += 25;
      if (password.length >= 12) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
      
      setPasswordStrength(Math.min(strength, 100));
    } else {
      setPasswordStrength(0);
    }
  }, [securitySettings.newPassword]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load profile and notification preferences in parallel
      const [profileResponse, preferencesResponse] = await Promise.all([
        apiService.getProfile(),
        apiService.getNotificationPreferences().catch(() => null)
      ]);
      
      setProfile(profileResponse);
      
      // Load privacy settings
      const jobSeekerProfile = profileResponse.job_seeker_profile || {};
      setPrivacySettings({
        profileVisibility: jobSeekerProfile.profile_visibility || 'public',
        showLastActive: true,
        allowMessages: true,
        showContactInfo: false,
        analyticsOptOut: false
      });
      
      // Load notification preferences
      if (preferencesResponse) {
        setNotificationPreferences(preferencesResponse);
      }
      
      // Account verification status
      setAccountSettings({
        emailVerified: profileResponse.is_verified || false,
        phoneVerified: !!profileResponse.phone,
        profileCompleted: calculateProfileCompletion(profileResponse)
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    // Weighted scoring system
    const weights = { critical: 10, important: 7, optional: 3 };
    
    const fields = {
      critical: [
        profile.first_name,
        profile.last_name,
        profile.email,
        profile.job_seeker_profile?.desired_position,
      ],
      important: [
        profile.phone,
        profile.bio,
        profile.job_seeker_profile?.skills,
        profile.job_seeker_profile?.years_of_experience,
        profile.job_seeker_profile?.education_level,
        profile.job_seeker_profile?.resume_url,
      ],
      optional: [
        profile.location,
        profile.profile_image,
        profile.job_seeker_profile?.certifications,
        profile.job_seeker_profile?.portfolio_url,
        profile.job_seeker_profile?.linkedin_url,
      ]
    };
    
    let earned = 0, total = 0;
    
    Object.entries(fields).forEach(([category, fieldList]) => {
      fieldList.forEach(field => {
        total += weights[category];
        if (field && field !== '' && field !== 0) earned += weights[category];
      });
    });
    
    return Math.round((earned / total) * 100);
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    // Validation
    if (!securitySettings.currentPassword || !securitySettings.newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (passwordStrength < 60) {
      setMessage({ type: 'error', text: 'Please choose a stronger password' });
      return;
    }

    try {
      setSaving(true);
      await apiService.post('/auth/change-password', {
        current_password: securitySettings.currentPassword,
        new_password: securitySettings.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully! Please log in again with your new password.' });
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Logout after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to change password. Please check your current password.' });
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
      setMessage({ type: 'error', text: error.message || 'Failed to save privacy settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await apiService.updateNotificationPreferences(notificationPreferences);
      setMessage({ type: 'success', text: 'Notification preferences updated successfully' });
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (category, field, value) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
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
    const password = window.prompt('Please enter your password to confirm account deactivation:');
    
    if (!password) {
      return; // User cancelled
    }

    try {
      setSaving(true);
      await apiService.post('/auth/deactivate-account', { password });
      setMessage({ type: 'success', text: 'Account deactivated successfully. Redirecting...' });
      
      setTimeout(() => {
        logout();
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to deactivate account. Please check your password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE MY ACCOUNT';
    const userInput = window.prompt(
      `⚠️ WARNING: This action CANNOT be undone!\n\n` +
      `All your data including:\n` +
      `• Profile information\n` +
      `• Job applications\n` +
      `• Saved jobs\n` +
      `• Messages and notifications\n\n` +
      `Will be PERMANENTLY DELETED.\n\n` +
      `Type "${confirmText}" to confirm:`
    );
    
    if (userInput !== confirmText) {
      if (userInput !== null) {
        setMessage({ type: 'error', text: 'Account deletion cancelled. Text did not match.' });
      }
      return;
    }

    const password = window.prompt('Enter your password to confirm deletion:');
    if (!password) {
      return;
    }

    try {
      setSaving(true);
      await apiService.delete('/auth/delete-account', { password });
      setMessage({ type: 'success', text: 'Account deleted successfully. Goodbye!' });
      
      setTimeout(() => {
        logout();
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete account. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      setMessage({ type: 'info', text: 'Preparing your data export...' });
      
      // Fetch comprehensive user data
      const data = {
        profile: profile,
        exported_at: new Date().toISOString(),
        privacy_settings: privacySettings,
        notification_preferences: notificationPreferences
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentsphere-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Profile data exported successfully' });
    } catch (error) {
      console.error('Failed to export data:', error);
      setMessage({ type: 'error', text: 'Failed to export profile data' });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-orange-500';
    if (passwordStrength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage your security, privacy, notifications, and account preferences</p>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert className={`mb-6 ${
          message.type === 'error' ? 'border-red-200 bg-red-50' : 
          message.type === 'success' ? 'border-green-200 bg-green-50' : 
          'border-blue-200 bg-blue-50'
        }`}>
          <AlertDescription className={`flex items-center gap-2 ${
            message.type === 'error' ? 'text-red-800' : 
            message.type === 'success' ? 'text-green-800' : 
            'text-blue-800'
          }`}>
            {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {message.type === 'info' && <Info className="w-4 h-4" />}
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Eye className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
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
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword.current ? "text" : "password"}
                        value={securitySettings.currentPassword}
                        onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPassword.new ? "text" : "password"}
                        value={securitySettings.newPassword}
                        onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {securitySettings.newPassword && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Password Strength:</span>
                          <span className={`font-medium ${
                            passwordStrength < 40 ? 'text-red-600' :
                            passwordStrength < 60 ? 'text-orange-600' :
                            passwordStrength < 80 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Use 8+ characters with mix of letters, numbers & symbols
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={securitySettings.confirmPassword}
                        onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {securitySettings.confirmPassword && securitySettings.newPassword !== securitySettings.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                    {securitySettings.confirmPassword && securitySettings.newPassword === securitySettings.confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={saving || !securitySettings.currentPassword || !securitySettings.newPassword || 
                            securitySettings.newPassword !== securitySettings.confirmPassword}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Two-Factor Authentication
                      <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                    disabled
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
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">
                          {navigator.platform} • {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                          navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                          navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Last active: Just now</p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  View All Sessions
                </Button>
              </div>
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

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {notificationPreferences.email_preferences.enabled ? (
                    <Mail className="w-5 h-5 text-blue-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-sm text-gray-600">
                      {notificationPreferences.email_preferences.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationPreferences.email_preferences.enabled}
                  onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'enabled', checked)}
                />
              </div>

              {notificationPreferences.email_preferences.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Job Alerts</p>
                        <p className="text-sm text-gray-500">New jobs matching your preferences</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.job_alerts}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'job_alerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Application Status</p>
                        <p className="text-sm text-gray-500">Updates on your job applications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.application_status}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'application_status', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Messages</p>
                        <p className="text-sm text-gray-500">New messages from employers</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.messages}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'messages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Interview Reminders</p>
                        <p className="text-sm text-gray-500">Upcoming interview notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.interview_reminders}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'interview_reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Deadline Reminders</p>
                        <p className="text-sm text-gray-500">Application deadline alerts</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.deadline_reminders}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'deadline_reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Company Updates</p>
                        <p className="text-sm text-gray-500">News from companies you follow</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.company_updates}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'company_updates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">System Notifications</p>
                        <p className="text-sm text-gray-500">Important system updates</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.system_notifications}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'system_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium">Promotions</p>
                        <p className="text-sm text-gray-500">Special offers and features</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_preferences.promotions}
                      onCheckedChange={(checked) => handleNotificationChange('email_preferences', 'promotions', checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* In-App/Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                In-App Notifications
              </CardTitle>
              <CardDescription>
                Manage real-time notifications within the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {notificationPreferences.push_preferences.enabled ? (
                    <Bell className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold">In-App Notifications</p>
                    <p className="text-sm text-gray-600">
                      {notificationPreferences.push_preferences.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationPreferences.push_preferences.enabled}
                  onCheckedChange={(checked) => handleNotificationChange('push_preferences', 'enabled', checked)}
                />
              </div>

              {notificationPreferences.push_preferences.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-green-200">
                  {[
                    { key: 'job_alerts', label: 'Job Alerts', icon: Briefcase },
                    { key: 'application_status', label: 'Application Status', icon: TrendingUp },
                    { key: 'messages', label: 'Messages', icon: MessageSquare },
                    { key: 'interview_reminders', label: 'Interview Reminders', icon: Calendar },
                    { key: 'deadline_reminders', label: 'Deadline Reminders', icon: Clock },
                    { key: 'company_updates', label: 'Company Updates', icon: Info },
                    { key: 'system_notifications', label: 'System Notifications', icon: Settings },
                    { key: 'promotions', label: 'Promotions', icon: Zap }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Switch
                        checked={notificationPreferences.push_preferences[key]}
                        onCheckedChange={(checked) => handleNotificationChange('push_preferences', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Digest & Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Digest & Quiet Hours
              </CardTitle>
              <CardDescription>
                Control notification frequency and timing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weekly Digest */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-gray-500">Get a weekly summary of your activity</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.digest_preferences.weekly_digest_enabled}
                    onCheckedChange={(checked) => handleNotificationChange('digest_preferences', 'weekly_digest_enabled', checked)}
                  />
                </div>

                {notificationPreferences.digest_preferences.weekly_digest_enabled && (
                  <div className="pl-4 border-l-2 border-blue-200">
                    <Label htmlFor="digest_day">Send on</Label>
                    <select
                      id="digest_day"
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                      value={notificationPreferences.digest_preferences.weekly_digest_day}
                      onChange={(e) => handleNotificationChange('digest_preferences', 'weekly_digest_day', e.target.value)}
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Quiet Hours</p>
                      <p className="text-sm text-gray-500">Pause non-urgent notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPreferences.quiet_hours.enabled}
                    onCheckedChange={(checked) => handleNotificationChange('quiet_hours', 'enabled', checked)}
                  />
                </div>

                {notificationPreferences.quiet_hours.enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200">
                    <div>
                      <Label htmlFor="quiet_start">Start Time</Label>
                      <Input
                        id="quiet_start"
                        type="time"
                        className="mt-2"
                        value={notificationPreferences.quiet_hours.start}
                        onChange={(e) => handleNotificationChange('quiet_hours', 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet_end">End Time</Label>
                      <Input
                        id="quiet_end"
                        type="time"
                        className="mt-2"
                        value={notificationPreferences.quiet_hours.end}
                        onChange={(e) => handleNotificationChange('quiet_hours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold">Advanced Settings</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Batch Notifications</p>
                    <p className="text-sm text-gray-500">Group similar notifications together</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.frequency_settings.batch_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('frequency_settings', 'batch_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Immediate for Urgent</p>
                    <p className="text-sm text-gray-500">Always send urgent notifications immediately</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.frequency_settings.immediate_for_urgent}
                    onCheckedChange={(checked) => handleNotificationChange('frequency_settings', 'immediate_for_urgent', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="max_emails">Max Emails Per Day</Label>
                  <Input
                    id="max_emails"
                    type="number"
                    min="1"
                    max="50"
                    className="mt-2"
                    value={notificationPreferences.frequency_settings.max_emails_per_day}
                    onChange={(e) => handleNotificationChange('frequency_settings', 'max_emails_per_day', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Limit daily notification emails (1-50)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveNotifications} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Preferences...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Preferences
              </>
            )}
          </Button>
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
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/jobseeker/profile')}>
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3 mb-3 sm:mb-0">
                      <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Export Your Data</p>
                        <p className="text-sm text-gray-500">Download a complete copy of your data in JSON format</p>
                        <p className="text-xs text-gray-400 mt-1">Includes profile, settings, and preferences</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleExportData} disabled={saving} className="w-full sm:w-auto">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3 mb-3 sm:mb-0">
                      <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">View Public Profile</p>
                        <p className="text-sm text-gray-500">See how your profile appears to employers</p>
                        <p className="text-xs text-gray-400 mt-1">Preview your profile visibility settings</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`/profile/${user?.id}`, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                </div>
                
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    <strong>Warning:</strong> These actions are permanent and cannot be easily reversed. Please proceed with caution.
                  </AlertDescription>
                </Alert>
                
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50 space-y-6">
                  {/* Deactivate Account */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <EyeOff className="w-5 h-5 text-red-700" />
                        <h4 className="font-semibold text-red-900">Deactivate Account</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-2">
                        Temporarily hide your profile and pause your account
                      </p>
                      <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                        <li>Your profile will be hidden from employers</li>
                        <li>Active applications will be paused</li>
                        <li>You can reactivate by logging in again</li>
                        <li>Your data will be preserved</li>
                      </ul>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeactivateAccount} 
                      disabled={saving}
                      className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deactivating...
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator className="bg-red-300" />

                  {/* Delete Account */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="w-5 h-5 text-red-800" />
                        <h4 className="font-semibold text-red-900">Delete Account Permanently</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-2 font-medium">
                        ⚠️ This action CANNOT be undone!
                      </p>
                      <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                        <li>All your personal data will be permanently deleted</li>
                        <li>Job applications and history will be removed</li>
                        <li>Saved jobs and preferences will be lost</li>
                        <li>Messages and notifications will be deleted</li>
                        <li>This action is irreversible</li>
                      </ul>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount} 
                      disabled={saving}
                      className="w-full sm:w-auto bg-red-700 hover:bg-red-800"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Forever
                        </>
                      )}
                    </Button>
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
