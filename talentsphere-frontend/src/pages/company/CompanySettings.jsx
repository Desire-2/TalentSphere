import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import {
  Settings,
  Shield,
  Bell,
  Eye,
  UserCog,
  Lock,
  Key,
  Mail,
  Phone,
  Globe,
  Database,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Loader2,
  Save,
  Building2,
  CreditCard,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Zap
} from 'lucide-react';

const CompanySettings = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [company, setCompany] = useState(null);
  
  // Settings state
  const [accountSettings, setAccountSettings] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    billing_email: '',
    timezone: '',
    language: 'en',
    currency: 'USD'
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_notifications: true,
    password_expiry: false,
    session_timeout: 24,
    ip_whitelist_enabled: false,
    allowed_ips: []
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: {
      new_applications: true,
      application_updates: true,
      job_expiry_warnings: true,
      system_updates: true,
      marketing_emails: false,
      weekly_reports: true
    },
    push_notifications: {
      instant_messages: true,
      new_applications: true,
      urgent_updates: true
    },
    sms_notifications: {
      urgent_only: false,
      application_deadlines: false
    }
  });

  const [privacySettings, setPrivacySettings] = useState({
    company_visibility: 'public',
    show_employee_count: true,
    show_salary_ranges: true,
    show_company_reviews: true,
    data_retention_days: 365,
    allow_job_alerts: true,
    analytics_tracking: true
  });

  const [billingSettings, setBillingSettings] = useState({
    subscription_plan: 'basic',
    billing_cycle: 'monthly',
    auto_renewal: true,
    invoice_email: '',
    payment_method: null,
    billing_address: {},
    usage_alerts: true
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Data export state
  const [exportRequests, setExportRequests] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employer') {
      navigate('/dashboard');
      return;
    }
    loadSettings();
  }, [isAuthenticated, user, navigate]);

  // Load all settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load company profile
      const companyResponse = await apiService.getMyCompanyProfile();
      setCompany(companyResponse.data);
      
      // Load various settings
      const [
        accountResponse,
        securityResponse,
        notificationResponse,
        privacyResponse,
        billingResponse
      ] = await Promise.all([
        apiService.getCompanyAccountSettings(),
        apiService.getCompanySecuritySettings(),
        apiService.getCompanyNotificationSettings(),
        apiService.getCompanyPrivacySettings(),
        apiService.getCompanyBillingSettings()
      ]);

      setAccountSettings(accountResponse.data);
      setSecuritySettings(securityResponse.data);
      setNotificationSettings(notificationResponse.data);
      setPrivacySettings(privacyResponse.data);
      setBillingSettings(billingResponse.data);
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async (settingsType, data) => {
    try {
      setSaving(true);
      
      switch (settingsType) {
        case 'account':
          await apiService.updateCompanyAccountSettings(data);
          setAccountSettings(data);
          break;
        case 'security':
          await apiService.updateCompanySecuritySettings(data);
          setSecuritySettings(data);
          break;
        case 'notifications':
          await apiService.updateCompanyNotificationSettings(data);
          setNotificationSettings(data);
          break;
        case 'privacy':
          await apiService.updateCompanyPrivacySettings(data);
          setPrivacySettings(data);
          break;
        case 'billing':
          await apiService.updateCompanyBillingSettings(data);
          setBillingSettings(data);
          break;
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await apiService.changePassword(passwordData);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  // Export data
  const exportData = async (dataType) => {
    try {
      setIsExporting(true);
      const response = await apiService.exportCompanyData(dataType);
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `company-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (deleteConfirmation !== company?.name) {
      toast.error('Please enter your company name exactly as shown');
      return;
    }

    try {
      await apiService.deleteCompanyAccount();
      toast.success('Account deleted successfully');
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-600 mt-1">Manage your company account, security, and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Account Information
              </CardTitle>
              <CardDescription>
                Manage your company's basic account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={accountSettings.company_name}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={accountSettings.contact_email}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={accountSettings.contact_phone}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="billing_email">Billing Email</Label>
                  <Input
                    id="billing_email"
                    type="email"
                    value={accountSettings.billing_email}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, billing_email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={accountSettings.timezone} onValueChange={(value) => setAccountSettings(prev => ({ ...prev, timezone: value }))}>
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
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={accountSettings.currency} onValueChange={(value) => setAccountSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={() => saveSettings('account', accountSettings)} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Account Settings
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={changePassword}>
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security features for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={securitySettings.two_factor_enabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Login Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                </div>
                <Switch
                  checked={securitySettings.login_notifications}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, login_notifications: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Password Expiry</Label>
                  <p className="text-sm text-gray-600">Require password changes every 90 days</p>
                </div>
                <Switch
                  checked={securitySettings.password_expiry}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, password_expiry: checked }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (hours)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  min="1"
                  max="168"
                  value={securitySettings.session_timeout}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">IP Whitelist</Label>
                  <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                </div>
                <Switch
                  checked={securitySettings.ip_whitelist_enabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, ip_whitelist_enabled: checked }))}
                />
              </div>
              
              <Button onClick={() => saveSettings('security', securitySettings)} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings.email_notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base capitalize">{key.replace(/_/g, ' ')}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        email_notifications: { ...prev.email_notifications, [key]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings.push_notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base capitalize">{key.replace(/_/g, ' ')}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        push_notifications: { ...prev.push_notifications, [key]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                SMS Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings.sms_notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base capitalize">{key.replace(/_/g, ' ')}</Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        sms_notifications: { ...prev.sms_notifications, [key]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Button onClick={() => saveSettings('notifications', notificationSettings)} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Notification Settings
          </Button>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy & Visibility
              </CardTitle>
              <CardDescription>
                Control how your company appears to job seekers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_visibility">Company Visibility</Label>
                <Select 
                  value={privacySettings.company_visibility} 
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, company_visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="registered">Registered Users Only</SelectItem>
                    <SelectItem value="private">Private - Hidden from search</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Show Employee Count</Label>
                  <p className="text-sm text-gray-600">Display company size information</p>
                </div>
                <Switch
                  checked={privacySettings.show_employee_count}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, show_employee_count: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Show Salary Ranges</Label>
                  <p className="text-sm text-gray-600">Display salary information in job postings</p>
                </div>
                <Switch
                  checked={privacySettings.show_salary_ranges}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, show_salary_ranges: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Show Company Reviews</Label>
                  <p className="text-sm text-gray-600">Allow reviews to be visible on your profile</p>
                </div>
                <Switch
                  checked={privacySettings.show_company_reviews}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, show_company_reviews: checked }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data_retention">Data Retention Period (days)</Label>
                <Input
                  id="data_retention"
                  type="number"
                  min="30"
                  max="2555"
                  value={privacySettings.data_retention_days}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) }))}
                />
              </div>
              
              <Button onClick={() => saveSettings('privacy', privacySettings)} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Current Plan</Label>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium capitalize">{billingSettings.subscription_plan}</div>
                    <div className="text-sm text-gray-600">Billed {billingSettings.billing_cycle}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Next Billing Date</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">January 15, 2025</div>
                    <div className="text-sm text-gray-600">Auto-renewal enabled</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Auto Renewal</Label>
                  <p className="text-sm text-gray-600">Automatically renew your subscription</p>
                </div>
                <Switch
                  checked={billingSettings.auto_renewal}
                  onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, auto_renewal: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Usage Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified when approaching plan limits</p>
                </div>
                <Switch
                  checked={billingSettings.usage_alerts}
                  onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, usage_alerts: checked }))}
                />
              </div>
              
              <div className="space-y-4">
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Update Payment Method
                </Button>
                
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Billing History
                </Button>
                
                <Button variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Download your company data for backup or migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => exportData('profile')} disabled={isExporting}>
                  {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  Export Profile Data
                </Button>
                
                <Button variant="outline" onClick={() => exportData('jobs')} disabled={isExporting}>
                  {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  Export Job Postings
                </Button>
                
                <Button variant="outline" onClick={() => exportData('applications')} disabled={isExporting}>
                  {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  Export Applications
                </Button>
                
                <Button variant="outline" onClick={() => exportData('all')} disabled={isExporting}>
                  {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600">
                These actions cannot be undone. Please proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  Deleting your company account will permanently remove all data including job postings, 
                  applications, and company profile. This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Company Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Company Account</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your company account and all associated data.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delete_confirmation">
                        Type "{company?.name}" to confirm deletion:
                      </Label>
                      <Input
                        id="delete_confirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={company?.name}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={deleteAccount}
                      disabled={deleteConfirmation !== company?.name}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySettings;
