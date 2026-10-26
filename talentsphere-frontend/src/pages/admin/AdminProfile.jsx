import { createElement, useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  Calendar,
  Camera,
  Clock,
  Edit3,
  Save,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '../../services/api';

const initialProfile = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  profilePicture: '',
  role: '',
  createdAt: '',
  lastLogin: '',
};

const initialStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalJobs: 0,
  activeJobs: 0,
  totalApplications: 0,
  totalCompanies: 0,
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'Never');

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

const AdminProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState(initialProfile);
  const [stats, setStats] = useState(initialStats);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const [profileData, statsData] = await Promise.all([
          api.get('/admin/profile'),
          api.get('/admin/stats'),
        ]);
        if (!isActive) return;
        setProfile(profileData);
        setFormData(profileData);
        setStats(statsData);
        setLoadError('');
      } catch (error) {
        if (!isActive) return;
        setLoadError(error?.message || 'Unable to load administrator profile');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, []);

  const updateField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const saveProfile = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.put('/admin/profile', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
      });
      const updatedProfile = response?.profile || formData;
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.message || 'Unable to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      setIsUploadingAvatar(true);
      const response = await api.postForm('/admin/upload-avatar', uploadData);
      const updatedProfile = { ...profile, profilePicture: response.url };
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error?.message || 'Unable to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administrator Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details and review platform totals.
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={saveProfile} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile details</TabsTrigger>
          <TabsTrigger value="stats">Platform statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profile picture</CardTitle>
                <CardDescription>JPEG, PNG, WebP, or GIF up to 5 MB.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profilePicture} alt={fullName || 'Administrator'} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Upload profile picture</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={uploadAvatar}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h2 className="font-semibold">{fullName || 'Administrator'}</h2>
                  <Badge variant="secondary" className="mt-2">
                    <Shield className="mr-1 h-3 w-3" />
                    {profile.role?.replace('_', ' ') || 'Administrator'}
                  </Badge>
                </div>
                {isUploadingAvatar && <p className="text-sm text-muted-foreground">Uploading…</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contact information</CardTitle>
                <CardDescription>Update the details shown for your administrator account.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={isEditing ? formData.firstName : profile.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                    disabled={!isEditing}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={isEditing ? formData.lastName : profile.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                    disabled={!isEditing}
                    autoComplete="family-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={isEditing ? formData.email : profile.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    disabled={!isEditing}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={isEditing ? formData.phone : profile.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    disabled={!isEditing}
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profile-location">Location</Label>
                  <Input
                    id="profile-location"
                    value={isEditing ? formData.location : profile.location}
                    onChange={(event) => updateField('location', event.target.value)}
                    disabled={!isEditing}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profile-bio">Bio</Label>
                  <Textarea
                    id="profile-bio"
                    rows={4}
                    value={isEditing ? formData.bio : profile.bio}
                    onChange={(event) => updateField('bio', event.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>Current session and account information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member since</p>
                  <p className="text-sm text-muted-foreground">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last login</p>
                  <p className="text-sm text-muted-foreground">{formatDate(profile.lastLogin)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Access scope</p>
                  <p className="text-sm text-muted-foreground">Platform administration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total users" value={stats.totalUsers} icon={Users} />
            <MetricCard label="Active users" value={stats.activeUsers} icon={Activity} />
            <MetricCard label="Jobs" value={stats.totalJobs} icon={Briefcase} />
            <MetricCard label="Applications" value={stats.totalApplications} icon={Calendar} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Coverage</CardTitle>
              <CardDescription>Live aggregate counts from the platform database.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Published jobs</p>
                <p className="mt-1 text-2xl font-semibold">{stats.activeJobs.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="mt-1 text-2xl font-semibold">{stats.totalCompanies.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Active user rate</p>
                <p className="mt-1 text-2xl font-semibold">
                  {stats.totalUsers
                    ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfile;
