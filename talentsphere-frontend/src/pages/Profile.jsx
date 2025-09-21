import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Edit,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  Shield,
  Bell
} from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form data for editing
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    location: '',
    profile_picture: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      setProfile(response);
      setFormData({
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        phone: response.phone || '',
        bio: response.bio || '',
        location: response.location || '',
        profile_picture: response.profile_picture || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original profile data
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      profile_picture: profile?.profile_picture || ''
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getUserRoleBadge = (role) => {
    const roleConfig = {
      job_seeker: { label: 'Job Seeker', color: 'bg-blue-100 text-blue-800' },
      employer: { label: 'Employer', color: 'bg-green-100 text-green-800' },
      admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = roleConfig[role] || roleConfig.job_seeker;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your basic profile information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.profile_picture} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {getInitials(formData.first_name, formData.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-medium">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a profile picture to personalize your account
                    </p>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        {profile?.first_name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        {profile?.last_name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {profile?.email}
                      {profile?.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {profile?.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Enter your location"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {profile?.location || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {getUserRoleBadge(profile?.role)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                      {profile?.bio || 'No bio provided'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your work experience, skills, and professional details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.role === 'job_seeker' && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Professional Profile</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Complete your professional profile to attract employers
                      </p>
                      <Button className="mt-4" variant="outline">
                        <Award className="w-4 h-4 mr-2" />
                        Add Professional Details
                      </Button>
                    </div>
                  </div>
                )}

                {profile?.role === 'employer' && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Company Profile</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage your company information and employer profile
                      </p>
                      <Button className="mt-4" variant="outline" onClick={() => navigate('/company-profile')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Company Profile
                      </Button>
                    </div>
                  </div>
                )}

                {profile?.role === 'admin' && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Administrator Access</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Access admin dashboard and system management tools
                      </p>
                      <Button className="mt-4" variant="outline" onClick={() => navigate('/admin')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {profile?.is_verified ? 'Verified' : 'Not verified'}
                      </p>
                    </div>
                    {!profile?.is_verified && (
                      <Button variant="outline">Verify Email</Button>
                    )}
                  </div>
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
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">Get instant notifications</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    </div>
  );
};

export default Profile;
