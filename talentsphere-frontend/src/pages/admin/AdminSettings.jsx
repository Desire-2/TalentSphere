import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Lock,
  Database,
  Mail,
  Globe,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Zap,
  BarChart3,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import api from '../../services/api';

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'TalentSphere',
    siteDescription: 'Premier job portal connecting talent with opportunities',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 30, // minutes
    passwordMinLength: 8,
    enableTwoFactor: false,
    apiRateLimit: 1000, // requests per hour
    enableAnalytics: true,
    enableNotifications: true
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@talentsphere.com',
    fromName: 'TalentSphere',
    enableWelcomeEmail: true,
    enableJobAlerts: true,
    enableSystemAlerts: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    enableBruteForceProtection: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    enableCaptcha: false,
    enableIPWhitelist: false,
    ipWhitelist: [],
    enableSSL: true,
    enableCSRF: true,
    enableRateLimit: true,
    apiKey: '',
    jwtSecret: '',
    enableAuditLog: true
  });

  // Database Settings
  const [databaseSettings, setDatabaseSettings] = useState({
    host: 'localhost',
    port: 5432,
    name: 'talentsphere',
    username: 'admin',
    password: '',
    maxConnections: 100,
    connectionTimeout: 30,
    enableBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30, // days
    lastBackup: null
  });

  // System Health
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms',
    databaseStatus: 'connected',
    memoryUsage: 65,
    diskUsage: 42,
    cpuUsage: 23,
    activeConnections: 45,
    totalUsers: 1247,
    activeUsers: 89
  });

  useEffect(() => {
    fetchSettings();
    fetchSystemHealth();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [systemResponse, emailResponse, securityResponse, dbResponse] = await Promise.all([
        api.get('/admin/settings/system').catch(() => ({ data: systemSettings })),
        api.get('/admin/settings/email').catch(() => ({ data: emailSettings })),
        api.get('/admin/settings/security').catch(() => ({ data: securitySettings })),
        api.get('/admin/settings/database').catch(() => ({ data: databaseSettings }))
      ]);

      setSystemSettings(systemResponse.data);
      setEmailSettings(emailResponse.data);
      setSecuritySettings(securityResponse.data);
      setDatabaseSettings(dbResponse.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error("Settings load error - using default settings. Some features may not be available.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await api.get('/admin/system/health');
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Keep mock data as fallback
    }
  };

  const saveSettings = async (settingsType, settingsData) => {
    try {
      setIsSaving(true);
      await api.put(`/admin/settings/${settingsType}`, settingsData);
      toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings updated successfully`);
    } catch (error) {
      console.error(`Error saving ${settingsType} settings:`, error);
      toast.error(`Failed to save ${settingsType} settings. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      setIsLoading(true);
      await api.post('/admin/settings/email/test', emailSettings);
      toast.success("Email configuration is working correctly");
    } catch (error) {
      toast.error("Email test failed - please check your configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const performDatabaseBackup = async () => {
    try {
      setIsLoading(true);
      await api.post('/admin/database/backup');
      toast.success("Database backup has been initiated");
      // Refresh database settings to get updated last backup time
      setTimeout(fetchSettings, 2000);
    } catch (error) {
      toast.error("Database backup could not be started");
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = () => {
    const newApiKey = 'ts_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSecuritySettings(prev => ({ ...prev, apiKey: newApiKey }));
  };

  const clearCache = async () => {
    try {
      setIsLoading(true);
      await api.post('/admin/system/clear-cache');
      toast.success("System cache has been cleared successfully");
    } catch (error) {
      toast.error("Failed to clear system cache");
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const allSettings = {
        system: systemSettings,
        email: emailSettings,
        security: { ...securitySettings, password: '', jwtSecret: '', apiKey: '' }, // Remove sensitive data
        database: { ...databaseSettings, password: '' }
      };
      
      const dataStr = JSON.stringify(allSettings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `talentsphere-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("Settings have been exported successfully");
    } catch (error) {
      toast.error("Failed to export settings");
    }
  };

  if (isLoading && !systemSettings.siteName) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Button onClick={clearCache} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General System Settings
              </CardTitle>
              <CardDescription>Configure basic system parameters and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileUploadSize">Max Upload Size (MB)</Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    value={systemSettings.maxFileUploadSize}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileUploadSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    placeholder="Enter site description"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Feature Toggles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Temporarily disable site access</p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new user registration</p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">Require email verification</p>
                    </div>
                    <Switch
                      checked={systemSettings.emailVerificationRequired}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Enable 2FA for admins</p>
                    </div>
                    <Switch
                      checked={systemSettings.enableTwoFactor}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableTwoFactor: checked }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={() => saveSettings('system', systemSettings)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>Manage system security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={securitySettings.apiKey}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Generated API key"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" onClick={generateApiKey}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Brute Force Protection</Label>
                      <p className="text-sm text-muted-foreground">Block repeated failed login attempts</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableBruteForceProtection}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableBruteForceProtection: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CAPTCHA Verification</Label>
                      <p className="text-sm text-muted-foreground">Enable CAPTCHA for forms</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableCaptcha}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableCaptcha: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SSL Enforcement</Label>
                      <p className="text-sm text-muted-foreground">Require HTTPS connections</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableSSL}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableSSL: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all admin actions</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableAuditLog}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableAuditLog: checked }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={() => saveSettings('security', securitySettings)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure SMTP settings for system emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder="Your app password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => saveSettings('email', emailSettings)} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
                <Button variant="outline" onClick={testEmailConnection} disabled={isLoading}>
                  <Mail className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>Manage database connection and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dbHost">Database Host</Label>
                  <Input
                    id="dbHost"
                    value={databaseSettings.host}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, host: e.target.value }))}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbPort">Port</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    value={databaseSettings.port}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={databaseSettings.backupFrequency}
                    onValueChange={(value) => setDatabaseSettings(prev => ({ ...prev, backupFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={databaseSettings.backupRetention}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, backupRetention: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Last Backup</p>
                  <p className="text-sm text-muted-foreground">
                    {databaseSettings.lastBackup ? 
                      new Date(databaseSettings.lastBackup).toLocaleString() : 
                      'Never'
                    }
                  </p>
                </div>
                <Button onClick={performDatabaseBackup} disabled={isLoading}>
                  <Database className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>
              
              <Button onClick={() => saveSettings('database', databaseSettings)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Database Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                    <p className="text-2xl font-bold">{systemHealth.memoryUsage}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={systemHealth.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold">{systemHealth.cpuUsage}%</p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={systemHealth.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                    <p className="text-2xl font-bold">{systemHealth.diskUsage}%</p>
                  </div>
                  <Server className="h-8 w-8 text-purple-500" />
                </div>
                <Progress value={systemHealth.diskUsage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{systemHealth.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Status</span>
                    <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                      {systemHealth.status === 'healthy' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">{systemHealth.responseTime}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-sm">{systemHealth.activeConnections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Users</span>
                    <span className="text-sm">{systemHealth.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm">{systemHealth.activeUsers}</span>
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

export default AdminSettings;
