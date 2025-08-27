import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import apiService from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  Youtube,
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
  Loader2
} from 'lucide-react';

const CompanyProfile = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
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
    instagram_url: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    benefits: [],
    team_members: []
  });

  const [newBenefit, setNewBenefit] = useState({ title: '', description: '', category: '' });
  const [newTeamMember, setNewTeamMember] = useState({ 
    name: '', 
    position: '', 
    bio: '', 
    photo_url: '', 
    email: '', 
    linkedin_url: '', 
    is_leadership: false 
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employer') {
      navigate('/dashboard');
      return;
    }
    loadCompany();
  }, [isAuthenticated, user, navigate]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyCompanyProfile();
      if (response) {
        setCompany(response);
        setFormData({
          name: response.name || '',
          description: response.description || '',
          tagline: response.tagline || '',
          website: response.website || '',
          email: response.email || '',
          phone: response.phone || '',
          address_line1: response.address?.line1 || '',
          address_line2: response.address?.line2 || '',
          city: response.address?.city || '',
          state: response.address?.state || '',
          country: response.address?.country || '',
          postal_code: response.address?.postal_code || '',
          industry: response.industry || '',
          company_size: response.company_size || '',
          founded_year: response.founded_year || '',
          company_type: response.company_type || '',
          logo_url: response.logo_url || '',
          cover_image_url: response.cover_image_url || '',
          linkedin_url: response.social_media?.linkedin || '',
          twitter_url: response.social_media?.twitter || '',
          facebook_url: response.social_media?.facebook || '',
          instagram_url: response.social_media?.instagram || '',
          meta_title: response.meta_title || '',
          meta_description: response.meta_description || '',
          keywords: response.keywords || '',
          benefits: response.benefits || [],
          team_members: response.team_members || []
        });
      }
    } catch (error) {
      console.error('Failed to load company:', error);
      setMessage({ type: 'error', text: 'Failed to load company profile' });
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
      
      // Validate required fields
      if (!formData.name || !formData.industry) {
        toast.error('Please fill in all required fields (Name and Industry)');
        return;
      }
      
      const updateData = {
        ...formData,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        linkedin_url: formData.linkedin_url,
        twitter_url: formData.twitter_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url
      };
      
      console.log('💾 Saving company profile:', updateData);
      
      if (company?.id) {
        const updatedCompany = await apiService.updateCompany(company.id, updateData);
        setCompany(updatedCompany);
        toast.success('Company profile updated successfully!');
        console.log('✅ Company updated:', updatedCompany);
      } else {
        const newCompany = await apiService.createCompany(updateData);
        setCompany(newCompany);
        toast.success('Company profile created successfully!');
        console.log('✅ Company created:', newCompany);
        
        // Check if user came from PostJob and redirect back
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get('from');
        if (from === 'postjob') {
          toast.success('Company profile complete! You can now post jobs.');
          setTimeout(() => {
            navigate('/jobs/post');
          }, 2000);
        }
      }
      
      setIsEditing(false);
      
      // Refresh user data to get updated company profile
      setTimeout(() => {
        window.location.reload(); // Simple way to refresh auth state
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to save company:', error);
      toast.error(error.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadCompany();
  };

  const addBenefit = () => {
    if (newBenefit.title.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, { 
          ...newBenefit,
          title: newBenefit.title.trim(),
          description: newBenefit.description.trim(),
          id: Date.now() // Temporary ID for frontend
        }]
      }));
      setNewBenefit({ title: '', description: '', category: '' });
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addTeamMember = () => {
    if (newTeamMember.name.trim()) {
      setFormData(prev => ({
        ...prev,
        team_members: [...prev.team_members, { 
          ...newTeamMember,
          name: newTeamMember.name.trim(),
          position: newTeamMember.position.trim(),
          bio: newTeamMember.bio.trim(),
          id: Date.now() // Temporary ID for frontend
        }]
      }));
      setNewTeamMember({ 
        name: '', 
        position: '', 
        bio: '', 
        photo_url: '', 
        email: '', 
        linkedin_url: '', 
        is_leadership: false 
      });
    }
  };

  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1001-5000', label: '1001-5000 employees' },
    { value: '5001+', label: '5001+ employees' }
  ];

  const companyTypeOptions = [
    { value: 'startup', label: 'Startup' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'non-profit', label: 'Non-profit' },
    { value: 'government', label: 'Government' },
    { value: 'agency', label: 'Agency' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  const benefitCategories = [
    'health',
    'financial',
    'time-off',
    'professional-development',
    'wellness',
    'family',
    'transportation',
    'equipment',
    'other'
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Marketing', 'Real Estate', 'Transportation',
    'Energy', 'Entertainment', 'Government', 'Non-profit', 'Other'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading company profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Create Company Profile */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold">Create Your Company Profile</CardTitle>
                <CardDescription className="text-lg">
                  Build your employer brand and attract top talent
                </CardDescription>
                
                {/* Show special message if coming from PostJob */}
                {new URLSearchParams(window.location.search).get('from') === 'postjob' && (
                  <Alert className="mt-4 border-blue-200 bg-blue-50">
                    <Target className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Complete your company profile to post jobs!</strong> 
                      <br />Fill in the required information below and you'll be redirected back to job posting.
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        placeholder="A brief company tagline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_type">Company Type</Label>
                      <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="founded_year">Founded Year</Label>
                      <Input
                        id="founded_year"
                        value={formData.founded_year}
                        onChange={(e) => handleInputChange('founded_year', e.target.value)}
                        placeholder="2020"
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contact@company.com"
                        type="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Tell us about your company, culture, and what makes you unique..."
                      rows={4}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line1">Address Line 1</Label>
                        <Input
                          id="address_line1"
                          value={formData.address_line1}
                          onChange={(e) => handleInputChange('address_line1', e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line2">Address Line 2</Label>
                        <Input
                          id="address_line2"
                          value={formData.address_line2}
                          onChange={(e) => handleInputChange('address_line2', e.target.value)}
                          placeholder="Suite 100 (optional)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="New York"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="United States"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">SEO & Marketing (Optional)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_title">Meta Title</Label>
                        <Input
                          id="meta_title"
                          value={formData.meta_title}
                          onChange={(e) => handleInputChange('meta_title', e.target.value)}
                          placeholder="Page title for search engines"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description</Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) => handleInputChange('meta_description', e.target.value)}
                          placeholder="Brief description for search engines"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                          id="keywords"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          placeholder="technology, software, innovation (comma separated)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                      Skip for Now
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !formData.name || !formData.industry}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Company Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Company Profile</h1>
                <p className="text-gray-600 text-lg mt-2">Manage your company information and employer brand</p>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <Button asChild variant="outline" className="hover:bg-blue-50">
                      <Link to={`/companies/${company.id}`} target="_blank">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Public Profile
                      </Link>
                    </Button>
                    <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-500 to-blue-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-green-500 to-green-700">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center">
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                )}
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Header */}
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                        <AvatarImage src={company.logo_url} alt={company.name} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-100 to-blue-200">
                          <Building2 className="w-16 h-16 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0">
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">{company.name}</h2>
                        {company.is_verified && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <p className="text-lg text-gray-600 mb-4">{company.tagline || 'No tagline set'}</p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600">{company.industry || 'No industry'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600">{company.company_size || 'Size not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-gray-600">
                            {company.address?.city ? `${company.address.city}, ${company.address.state || company.address.country || ''}` : 'Location not set'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">
                            {company.founded_year ? `Founded ${company.founded_year}` : 'Founded date not set'}
                          </span>
                        </div>
                        {company.company_type && (
                          <div className="flex items-center gap-2 col-span-2 lg:col-span-4">
                            <Building2 className="w-4 h-4 text-indigo-500" />
                            <span className="text-gray-600 capitalize">{company.company_type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Description */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    About the Company
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your company, mission, values, and culture..."
                      rows={6}
                      className="w-full"
                    />
                  ) : (
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {company.description || 'No company description available. Add a description to tell potential employees about your company culture, mission, and what makes you unique.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Company Information - Edit Mode */}
              {isEditing && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-blue-600" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Company Name *</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter company name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-tagline">Tagline</Label>
                        <Input
                          id="edit-tagline"
                          value={formData.tagline}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                          placeholder="A brief company tagline"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-industry">Industry *</Label>
                        <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industryOptions.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-company_size">Company Size</Label>
                        <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-company_type">Company Type</Label>
                        <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-founded_year">Founded Year</Label>
                        <Input
                          id="edit-founded_year"
                          value={formData.founded_year}
                          onChange={(e) => handleInputChange('founded_year', e.target.value)}
                          placeholder="2020"
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-logo_url">Logo URL</Label>
                        <Input
                          id="edit-logo_url"
                          value={formData.logo_url}
                          onChange={(e) => handleInputChange('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          type="url"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-cover_image_url">Cover Image URL</Label>
                        <Input
                          id="edit-cover_image_url"
                          value={formData.cover_image_url}
                          onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                          placeholder="https://example.com/cover.jpg"
                          type="url"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address Section - Edit Mode */}
              {isEditing && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-address_line1">Address Line 1</Label>
                        <Input
                          id="edit-address_line1"
                          value={formData.address_line1}
                          onChange={(e) => handleInputChange('address_line1', e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-address_line2">Address Line 2</Label>
                        <Input
                          id="edit-address_line2"
                          value={formData.address_line2}
                          onChange={(e) => handleInputChange('address_line2', e.target.value)}
                          placeholder="Suite 100 (optional)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-city">City</Label>
                        <Input
                          id="edit-city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="New York"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-state">State/Province</Label>
                        <Input
                          id="edit-state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-country">Country</Label>
                        <Input
                          id="edit-country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="United States"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-postal_code">Postal Code</Label>
                        <Input
                          id="edit-postal_code"
                          value={formData.postal_code}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits Section */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Company Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Benefit Title</Label>
                          <Input
                            value={newBenefit.title}
                            onChange={(e) => setNewBenefit(prev => ({...prev, title: e.target.value}))}
                            placeholder="Health Insurance"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newBenefit.category} onValueChange={(value) => setNewBenefit(prev => ({...prev, category: value}))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {benefitCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addBenefit} disabled={!newBenefit.title.trim()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Textarea
                          value={newBenefit.description}
                          onChange={(e) => setNewBenefit(prev => ({...prev, description: e.target.value}))}
                          placeholder="Describe this benefit..."
                          rows={3}
                        />
                      </div>

                      {formData.benefits && formData.benefits.length > 0 && (
                        <div className="space-y-2">
                          <Label>Current Benefits</Label>
                          <div className="space-y-2">
                            {formData.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-semibold">{benefit.title || benefit}</div>
                                  {benefit.description && (
                                    <div className="text-sm text-gray-600">{benefit.description}</div>
                                  )}
                                  {benefit.category && (
                                    <Badge variant="outline" className="mt-1">
                                      {benefit.category.replace('-', ' ')}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  onClick={() => removeBenefit(index)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {company.benefits && company.benefits.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {company.benefits.map((benefit, index) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-800 mb-2">
                                {benefit.title || benefit}
                              </h4>
                              {benefit.description && (
                                <p className="text-blue-700 text-sm">{benefit.description}</p>
                              )}
                              {benefit.category && (
                                <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                                  {benefit.category.replace('-', ' ')}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No benefits listed. Add benefits to attract top talent.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Members Section */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            value={newTeamMember.name}
                            onChange={(e) => setNewTeamMember(prev => ({...prev, name: e.target.value}))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input
                            value={newTeamMember.position}
                            onChange={(e) => setNewTeamMember(prev => ({...prev, position: e.target.value}))}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={newTeamMember.email}
                            onChange={(e) => setNewTeamMember(prev => ({...prev, email: e.target.value}))}
                            placeholder="john@company.com"
                            type="email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>LinkedIn URL</Label>
                          <Input
                            value={newTeamMember.linkedin_url}
                            onChange={(e) => setNewTeamMember(prev => ({...prev, linkedin_url: e.target.value}))}
                            placeholder="https://linkedin.com/in/johndoe"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Photo URL</Label>
                        <Input
                          value={newTeamMember.photo_url}
                          onChange={(e) => setNewTeamMember(prev => ({...prev, photo_url: e.target.value}))}
                          placeholder="https://example.com/photo.jpg"
                          type="url"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={newTeamMember.bio}
                          onChange={(e) => setNewTeamMember(prev => ({...prev, bio: e.target.value}))}
                          placeholder="Brief bio about the team member..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is-leadership"
                            checked={newTeamMember.is_leadership}
                            onChange={(e) => setNewTeamMember(prev => ({...prev, is_leadership: e.target.checked}))}
                          />
                          <Label htmlFor="is-leadership">Leadership Position</Label>
                        </div>
                        <Button onClick={addTeamMember} disabled={!newTeamMember.name.trim()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Team Member
                        </Button>
                      </div>

                      {formData.team_members && formData.team_members.length > 0 && (
                        <div className="space-y-2">
                          <Label>Current Team Members</Label>
                          <div className="space-y-3">
                            {formData.team_members.map((member, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={member.photo_url} alt={member.name} />
                                    <AvatarFallback>
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold flex items-center gap-2">
                                      {member.name}
                                      {member.is_leadership && (
                                        <Badge variant="outline" className="text-xs">
                                          Leadership
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">{member.position}</div>
                                    {member.email && (
                                      <div className="text-xs text-gray-500">{member.email}</div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => removeTeamMember(index)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {company.team_members && company.team_members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {company.team_members.map((member, index) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={member.photo_url} alt={member.name} />
                                  <AvatarFallback>
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    {member.name}
                                    {member.is_leadership && (
                                      <Badge variant="outline" className="text-xs">
                                        Leadership
                                      </Badge>
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600">{member.position}</p>
                                </div>
                              </div>
                              {member.bio && (
                                <p className="text-sm text-gray-700 mb-3">{member.bio}</p>
                              )}
                              <div className="flex gap-2">
                                {member.email && (
                                  <Button asChild variant="outline" size="sm">
                                    <a href={`mailto:${member.email}`}>
                                      <Mail className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                                {member.linkedin_url && (
                                  <Button asChild variant="outline" size="sm">
                                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                                      <Linkedin className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No team members added. Showcase your team to build trust with candidates.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Section - Edit Mode */}
              {isEditing && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      SEO & Marketing (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-meta_title">Meta Title</Label>
                        <Input
                          id="edit-meta_title"
                          value={formData.meta_title}
                          onChange={(e) => handleInputChange('meta_title', e.target.value)}
                          placeholder="Page title for search engines"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-meta_description">Meta Description</Label>
                        <Textarea
                          id="edit-meta_description"
                          value={formData.meta_description}
                          onChange={(e) => handleInputChange('meta_description', e.target.value)}
                          placeholder="Brief description for search engines"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-keywords">Keywords</Label>
                        <Input
                          id="edit-keywords"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          placeholder="technology, software, innovation (comma separated)"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Company Stats */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{company.statistics?.total_jobs_posted || 0}</div>
                      <div className="text-xs text-blue-700">Jobs Posted</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{company.statistics?.active_jobs || 0}</div>
                      <div className="text-xs text-green-700">Active Jobs</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{company.statistics?.profile_views || 0}</div>
                      <div className="text-xs text-purple-700">Profile Views</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{company.statistics?.total_employees_hired || 0}</div>
                      <div className="text-xs text-orange-700">Hires Made</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contact@company.com"
                        type="email"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {company.email ? (
                          <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                            {company.email}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {company.phone ? (
                          <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                            {company.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sidebar-website">Website</Label>
                    {isEditing ? (
                      <Input
                        id="sidebar-website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        type="url"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                          placeholder="LinkedIn company URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter</Label>
                        <Input
                          value={formData.twitter_url}
                          onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                          placeholder="Twitter profile URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Facebook</Label>
                        <Input
                          value={formData.facebook_url}
                          onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                          placeholder="Facebook page URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input
                          value={formData.instagram_url}
                          onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                          placeholder="Instagram profile URL"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {company.social_media?.linkedin && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media?.twitter && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media?.facebook && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {company.social_media?.instagram && (
                        <Button asChild variant="outline" size="sm">
                          <a href={company.social_media.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {(!company.social_media?.linkedin && !company.social_media?.twitter && !company.social_media?.facebook && !company.social_media?.instagram) && (
                        <p className="text-gray-500 text-sm">No social media links added</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
