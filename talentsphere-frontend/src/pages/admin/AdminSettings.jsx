import { createElement, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Mail,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Users,
  Cloud,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '../../services/api';

const formatDuration = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const MetricCard = ({ label, value, icon }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{Number(value || 0).toLocaleString()}</p>
      </div>
      {createElement(icon, { className: 'h-8 w-8 text-primary', 'aria-hidden': true })}
    </CardContent>
  </Card>
);

const ConfigurationRow = ({ label, configured, description, icon }) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
    <div className="flex items-start gap-3">
      {createElement(icon, { className: 'mt-0.5 h-5 w-5 text-primary', 'aria-hidden': true })}
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <Badge variant={configured ? 'default' : 'secondary'}>
      {configured ? 'Configured' : 'Not configured'}
    </Badge>
  </div>
);

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      try {
        const [profile, healthData] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/admin/system/health'),
        ]);
        if (!isActive) return;
        setAdminEmail(profile?.email || '');
        setHealth(healthData);
        setHealthError('');
      } catch (error) {
        if (!isActive) return;
        setHealthError(error?.message || 'Unable to load system status');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  const refreshHealth = async () => {
    try {
      setHealthError('');
      const healthData = await api.get('/admin/system/health');
      setHealth(healthData);
      toast.success('System status refreshed');
    } catch (error) {
      setHealthError(error?.message || 'Unable to refresh system status');
      toast.error('Unable to refresh system status');
    }
  };

  const saveAdminEmail = async () => {
    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    try {
      setIsSaving(true);
      await api.put('/auth/profile', { email: normalizedEmail });
      setAdminEmail(normalizedEmail);
      toast.success('Admin email updated');
    } catch (error) {
      toast.error(error?.message || 'Unable to update admin email');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your administrator account and inspect verified system status.
          </p>
        </div>
        <Button variant="outline" onClick={refreshHealth} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh status
        </Button>
      </div>

      {healthError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {healthError}
        </div>
      )}

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <Settings className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="system">
            <Activity className="mr-2 h-4 w-4" />
            System status
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Server className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrator account</CardTitle>
              <CardDescription>
                Update the email address used for this administrator account.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button onClick={saveAdminEmail} disabled={isSaving || !adminEmail.trim()}>
                {isSaving ? 'Saving…' : 'Save email'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total users" value={health?.totalUsers} icon={Users} />
            <MetricCard label="Active users" value={health?.activeUsers} icon={Shield} />
            <MetricCard label="Applications" value={health?.totalApplications} icon={Activity} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Runtime health
                {health?.status === 'healthy' && (
                  <Badge>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Healthy
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                These values are checked when this page loads; no estimates are shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="mt-1 font-medium capitalize">{health?.database?.status || 'Unknown'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {health?.database?.dialect || 'Unknown dialect'} · {health?.database?.responseTimeMs ?? '—'} ms
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Process uptime</p>
                <p className="mt-1 font-medium">{formatDuration(health?.uptimeSeconds)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Environment: {health?.configuration?.environment || 'unknown'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Jobs</p>
                <p className="mt-1 text-2xl font-semibold">{Number(health?.totalJobs || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="mt-1 text-2xl font-semibold">{Number(health?.totalCompanies || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Service configuration</CardTitle>
              <CardDescription>
                Secret values are never returned. Deployment environment variables control these services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ConfigurationRow
                label="Object storage"
                configured={Boolean(health?.configuration?.blobStorageConfigured)}
                description="Uploads profile images, resumes, and other files."
                icon={Cloud}
              />
              <ConfigurationRow
                label="Email delivery"
                configured={Boolean(health?.configuration?.emailConfigured)}
                description="Sends verification, reset, and notification emails."
                icon={Mail}
              />
              <ConfigurationRow
                label="Response cache"
                configured={Boolean(health?.cache?.enabled)}
                description="Caches selected read-heavy API responses."
                icon={Database}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
