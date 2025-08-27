import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    logo_url: '',
    banner_url: '',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    benefits: [],
    values: [],
    specialties: []
  });

  const [newBenefit, setNewBenefit] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

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
          logo_url: response.logo_url || '',
          banner_url: response.banner_url || '',
          linkedin_url: response.social_media?.linkedin || '',
          twitter_url: response.social_media?.twitter || '',
          facebook_url: response.social_media?.facebook || '',
          instagram_url: response.social_media?.instagram || '',
          youtube_url: response.social_media?.youtube || '',
          benefits: response.benefits || [],
          values: response.values || [],
          specialties: response.specialties || []
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
      const updateData = {
        ...formData,
        address: {
          line1: formData.address_line1,
          line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code
        },
        social_media: {
          linkedin: formData.linkedin_url,
          twitter: formData.twitter_url,
          facebook: formData.facebook_url,
          instagram: formData.instagram_url,
          youtube: formData.youtube_url
        }
      };
      
      if (company?.id) {
        await apiService.updateCompany(company.id, updateData);
      } else {
        const newCompany = await apiService.createCompany(updateData);
        setCompany(newCompany);
      }
      
      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
      setIsEditing(false);
      loadCompany();
    } catch (error) {
      console.error('Failed to update company:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update company profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadCompany();
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addValue = () => {
    if (newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const removeValue = (index) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
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
                            {company.address?.city ? `${company.address.city}, ${company.address.state || ''}` : 'Location not set'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">
                            {company.founded_year ? `Founded ${company.founded_year}` : 'Founded date not set'}
                          </span>
                        </div>
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
                    <Label htmlFor="website">Website</Label>
                    {isEditing ? (
                      <Input
                        id="website"
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
                      {(!company.social_media?.linkedin && !company.social_media?.twitter && !company.social_media?.facebook) && (
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
