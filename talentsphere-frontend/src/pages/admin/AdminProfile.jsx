import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Activity,
  Lock,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const AdminProfile = () => {
  const { user: currentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    id: '',
    username: '',
    email: '',
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    profilePicture: '',
    role: '',
    createdAt: '',
    lastLogin: '',
    permissions: [],
    settings: {}
  });

  const [adminStats, setAdminStats] = useState({
    totalActions: 0,
    activeUsers: 0,
    totalLogins: 0,
    lastActivity: '',
    systemHealth: 'healthy'
  });

  const [activityLog, setActivityLog] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchAdminProfile();
    fetchAdminStats();
    fetchActivityLog();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/profile');
      setProfileData(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      // Use current user data as fallback
      if (currentUser) {
        const fallbackData = {
          id: currentUser.id,
          username: currentUser.username || '',
          email: currentUser.email || '',
          fullName: currentUser.full_name || currentUser.name || '',
          phone: currentUser.phone || '',
          location: currentUser.location || '',
          bio: currentUser.bio || '',
          profilePicture: currentUser.profile_picture || '',
          role: currentUser.role || 'admin',
          createdAt: currentUser.created_at || new Date().toISOString(),
          lastLogin: currentUser.last_login || new Date().toISOString(),
          permissions: currentUser.permissions || ['read', 'write', 'delete', 'admin'],
          settings: currentUser.settings || {}
        };
        setProfileData(fallbackData);
        setFormData(fallbackData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Set mock data as fallback
      setAdminStats({
        totalActions: 1247,
        activeUsers: 89,
        totalLogins: 156,
        lastActivity: new Date().toISOString(),
        systemHealth: 'healthy'
      });
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await api.get('/admin/activity-log');
      setActivityLog(response.data.slice(0, 10)); // Latest 10 activities
    } catch (error) {
      console.error('Error fetching activity log:', error);
      // Set mock data as fallback
      setActivityLog([
        { id: 1, action: 'User management update', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'update' },
        { id: 2, action: 'System health check', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'system' },
        { id: 3, action: 'Job approval', timestamp: new Date(Date.now() - 10800000).toISOString(), type: 'approval' },
        { id: 4, action: 'Company verification', timestamp: new Date(Date.now() - 14400000).toISOString(), type: 'verification' },
        { id: 5, action: 'Revenue analytics review', timestamp: new Date(Date.now() - 18000000).toISOString(), type: 'analytics' }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.put('/admin/profile', formData);
      setProfileData(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating admin profile:', error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    try {
      setIsLoading(true);
      const response = await api.post('/admin/upload-avatar', formDataUpload);
      const newProfileData = { ...profileData, profilePicture: response.data.url };
      setProfileData(newProfileData);
      setFormData(newProfileData);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'update': return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'system': return <Activity className="h-4 w-4 text-green-500" />;
      case 'approval': return <Check className="h-4 w-4 text-purple-500" />;
      case 'verification': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'analytics': return <Activity className="h-4 w-4 text-indigo-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    return 'Just now';
  };

  if (isLoading && !profileData.id) {
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
          <h1 className="text-3xl font-bold">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your administrator account and settings</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="stats">Admin Statistics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Profile Details Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture and Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your admin profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.profilePicture} alt={profileData.fullName} />
                    <AvatarFallback className="text-lg">
                      {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{profileData.fullName || profileData.username}</h3>
                  <Badge variant="secondary" className="mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    {profileData.role?.toUpperCase() || 'ADMIN'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Your admin account contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={isEditing ? formData.fullName : profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={isEditing ? formData.username : profileData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? formData.email : profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={isEditing ? formData.phone : profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={isEditing ? formData.location : profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your location"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={isEditing ? formData.bio : profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your admin account information and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(profileData.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(profileData.lastLogin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {profileData.role || 'Administrator'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Permissions</p>
                    <p className="text-sm text-muted-foreground">
                      {profileData.permissions?.length || 0} granted
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                    <p className="text-2xl font-bold">{adminStats.totalActions.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{adminStats.activeUsers.toLocaleString()}</p>
                  </div>
                  <User className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                    <p className="text-2xl font-bold">{adminStats.totalLogins.toLocaleString()}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Health</p>
                    <p className="text-2xl font-bold capitalize">{adminStats.systemHealth}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    adminStats.systemHealth === 'healthy' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`h-4 w-4 rounded-full ${
                      adminStats.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfile;
