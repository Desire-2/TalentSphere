import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';

import {
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Edit,
  Save,
  Camera,
  Upload,
  Plus,
  Trash2,
  Eye,
  TrendingUp,
  Award,
  Target,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Image as ImageIcon,
  UserPlus,
  Gift,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Link as LinkIcon
} from 'lucide-react';

const CompanyProfileManagement = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Form data state
  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    tagline: '',
    website: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    industry: '',
    company_size: '',
    founded_year: '',
    company_type: '',
    logo_url: '',
    cover_image_url: '',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    instagram_url: ''
  });

  // Benefits and team management
  const [benefits, setBenefits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newBenefit, setNewBenefit] = useState({ title: '', description: '', category: '', icon: '' });
  const [newTeamMember, setNewTeamMember] = useState({ 
    name: '', 
    position: '', 
    bio: '', 
    photo_url: '', 
    email: '', 
    linkedin_url: '', 
    is_leadership: false 
  });

  // Gallery and media
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Constants
  const COMPANY_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '500-1000',
    '1000+'
  ];

  const COMPANY_TYPES = [
    'startup',
    'corporation',
    'non-profit',
    'government',
    'agency',
    'consultancy'
  ];

  const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Entertainment',
    'Real Estate',
    'Consulting',
    'Marketing',
    'Other'
  ];

  const BENEFIT_CATEGORIES = [
    'health',
    'financial',
    'time-off',
    'professional-development',
    'work-life-balance',
    'perks',
    'other'
  ];

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employer') {
      navigate('/dashboard');
      return;
    }
    loadCompanyData();
  }, [isAuthenticated, user, navigate]);

  // Load company data
  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyCompanyProfile();
      
      if (response) {
        setCompany(response);
        setCompanyData(response);
        setBenefits(response.benefits || []);
        setTeamMembers(response.team_members || []);
        setGalleryImages(response.gallery_images || []);
        calculateProfileCompletion(response);
      }
    } catch (error) {
      console.error('Error loading company:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        // No company profile yet - show creation form
        setCompany(null);
      } else {
        toast.error('Failed to load company profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (data) => {
    const fields = [
      'name', 'description', 'tagline', 'website', 'email', 'phone',
      'city', 'state', 'country', 'industry', 'company_size',
      'founded_year', 'company_type', 'logo_url'
    ];
    
    const completedFields = fields.filter(field => data[field] && data[field].toString().trim() !== '');
    const completion = Math.round((completedFields.length / fields.length) * 100);
    setProfileCompletion(completion);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save company data
  const saveCompanyData = async () => {
    try {
      setSaving(true);
      
      let response;
      if (company?.id) {
        response = await apiService.updateCompanyProfile(company.id, companyData);
      } else {
        response = await apiService.createCompanyProfile(companyData);
      }
      
      setCompany(response);
      calculateProfileCompletion(response);
      toast.success('Company profile saved successfully');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  // Add benefit
  const addBenefit = async () => {
    if (!newBenefit.title.trim()) {
      toast.error('Benefit title is required');
      return;
    }

    try {
      const response = await apiService.addCompanyBenefit(company.id, newBenefit);
      setBenefits(prev => [...prev, response.benefit]);
      setNewBenefit({ title: '', description: '', category: '', icon: '' });
      toast.success('Benefit added successfully');
    } catch (error) {
      toast.error('Failed to add benefit');
    }
  };

  // Add team member
  const addTeamMember = async () => {
    if (!newTeamMember.name.trim()) {
      toast.error('Team member name is required');
      return;
    }

    try {
      const response = await apiService.addCompanyTeamMember(company.id, newTeamMember);
      setTeamMembers(prev => [...prev, response.team_member]);
      setNewTeamMember({ 
        name: '', 
        position: '', 
        bio: '', 
        photo_url: '', 
        email: '', 
        linkedin_url: '', 
        is_leadership: false 
      });
      toast.success('Team member added successfully');
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };

  // Remove benefit
  const removeBenefit = async (benefitId) => {
    try {
      await apiService.deleteCompanyBenefit(benefitId);
      setBenefits(prev => prev.filter(benefit => benefit.id !== benefitId));
      toast.success('Benefit removed');
    } catch (error) {
      toast.error('Failed to remove benefit');
    }
  };

  // Remove team member
  const removeTeamMember = async (memberId) => {
    try {
      await apiService.deleteCompanyTeamMember(memberId);
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success('Team member removed');
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Create Company Profile
            </CardTitle>
            <CardDescription>
              Set up your company profile to attract top talent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to create a company profile before you can post jobs or manage applications.
              </AlertDescription>
            </Alert>
            <Button onClick={saveCompanyData} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Profile Management</h1>
            <p className="text-gray-600 mt-1">Manage your company's presence and attract top talent</p>
          </div>
          
          {/* Profile Completion */}
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">Profile Completion</div>
            <div className="flex items-center gap-2">
              <Progress value={profileCompletion} className="w-24" />
              <span className="text-sm font-medium">{profileCompletion}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Company Details</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="media">Media & Gallery</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companyData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="Brief tagline or motto"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={companyData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell us about your company..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={companyData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@yourcompany.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Company Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{company.statistics?.total_jobs_posted || 0}</div>
                    <div className="text-sm text-gray-600">Jobs Posted</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{company.statistics?.active_jobs || 0}</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{company.statistics?.profile_views || 0}</div>
                    <div className="text-sm text-gray-600">Profile Views</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{company.statistics?.average_rating || 0}</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveCompanyData} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Company Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={companyData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select value={companyData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map(size => (
                        <SelectItem key={size} value={size}>{size} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="company_type">Company Type</Label>
                  <Select value={companyData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="founded_year">Founded Year</Label>
                  <Input
                    id="founded_year"
                    type="number"
                    value={companyData.founded_year}
                    onChange={(e) => handleInputChange('founded_year', e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={companyData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={companyData.address_line2}
                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={companyData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={companyData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={companyData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                        <Linkedin className="h-4 w-4 text-blue-600" />
                      </div>
                      <Input
                        id="linkedin_url"
                        className="rounded-l-none"
                        value={companyData.linkedin_url}
                        onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                        <Twitter className="h-4 w-4 text-blue-400" />
                      </div>
                      <Input
                        id="twitter_url"
                        className="rounded-l-none"
                        value={companyData.twitter_url}
                        onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                        <Facebook className="h-4 w-4 text-blue-700" />
                      </div>
                      <Input
                        id="facebook_url"
                        className="rounded-l-none"
                        value={companyData.facebook_url}
                        onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                        <Instagram className="h-4 w-4 text-pink-600" />
                      </div>
                      <Input
                        id="instagram_url"
                        className="rounded-l-none"
                        value={companyData.instagram_url}
                        onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveCompanyData} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Add Team Member */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Team Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_name">Name</Label>
                  <Input
                    id="member_name"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Team member name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="member_position">Position</Label>
                  <Input
                    id="member_position"
                    value={newTeamMember.position}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Job title"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="member_bio">Bio</Label>
                  <Textarea
                    id="member_bio"
                    value={newTeamMember.bio}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief bio about the team member"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="member_email">Email</Label>
                  <Input
                    id="member_email"
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@company.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="member_linkedin">LinkedIn Profile</Label>
                  <Input
                    id="member_linkedin"
                    value={newTeamMember.linkedin_url}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_leadership"
                    checked={newTeamMember.is_leadership}
                    onCheckedChange={(checked) => setNewTeamMember(prev => ({ ...prev, is_leadership: checked }))}
                  />
                  <Label htmlFor="is_leadership">Leadership Team</Label>
                </div>
              </div>
              
              <div className="mt-4">
                <Button onClick={addTeamMember}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No team members added yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map((member, index) => (
                    <div key={member.id || index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={member.photo_url} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{member.name}</h4>
                          {member.is_leadership && (
                            <Badge variant="secondary">Leadership</Badge>
                          )}
                        </div>
                        {member.position && (
                          <p className="text-sm text-gray-600">{member.position}</p>
                        )}
                        {member.bio && (
                          <p className="text-sm text-gray-500 mt-1">{member.bio}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          {member.email && (
                            <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                              <Mail className="h-3 w-3" />
                            </a>
                          )}
                          {member.linkedin_url && (
                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              <Linkedin className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6">
          {/* Add Benefit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Add Company Benefit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="benefit_title">Benefit Title</Label>
                  <Input
                    id="benefit_title"
                    value={newBenefit.title}
                    onChange={(e) => setNewBenefit(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Health Insurance, Remote Work, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="benefit_category">Category</Label>
                  <Select value={newBenefit.category} onValueChange={(value) => setNewBenefit(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFIT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="benefit_description">Description</Label>
                  <Textarea
                    id="benefit_description"
                    value={newBenefit.description}
                    onChange={(e) => setNewBenefit(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this benefit..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="benefit_icon">Icon (optional)</Label>
                  <Input
                    id="benefit_icon"
                    value={newBenefit.icon}
                    onChange={(e) => setNewBenefit(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="heart, shield, coffee, etc."
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button onClick={addBenefit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Benefits List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Company Benefits ({benefits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {benefits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No benefits added yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={benefit.id || index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {benefit.icon && <span className="text-lg">{benefit.icon}</span>}
                            <h4 className="font-medium">{benefit.title}</h4>
                          </div>
                          {benefit.category && (
                            <Badge variant="outline" className="mt-1 mb-2">
                              {benefit.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          )}
                          {benefit.description && (
                            <p className="text-sm text-gray-600">{benefit.description}</p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(benefit.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Gallery Tab */}
        <TabsContent value="media" className="space-y-6">
          {/* Logo and Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Company Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="logo_url">Company Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={companyData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  {companyData.logo_url && (
                    <div className="mt-2">
                      <img
                        src={companyData.logo_url}
                        alt="Company Logo"
                        className="h-20 w-20 object-contain border rounded"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="cover_image_url">Cover Image URL</Label>
                  <Input
                    id="cover_image_url"
                    value={companyData.cover_image_url}
                    onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                    placeholder="https://example.com/cover.png"
                  />
                  {companyData.cover_image_url && (
                    <div className="mt-2">
                      <img
                        src={companyData.cover_image_url}
                        alt="Cover Image"
                        className="h-20 w-full object-cover border rounded"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Company Gallery
              </CardTitle>
              <CardDescription>
                Upload images that showcase your company culture, office, team events, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {galleryImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No gallery images added yet
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => {
                          const newImages = galleryImages.filter((_, i) => i !== index);
                          setGalleryImages(newImages);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4">
                <Button variant="outline" disabled={uploadingImage}>
                  {uploadingImage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyProfileManagement;
