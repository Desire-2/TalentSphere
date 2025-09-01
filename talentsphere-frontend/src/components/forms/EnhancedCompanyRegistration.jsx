import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Calendar, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Loader2,
  Save
} from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
  tagline: z.string().max(100, 'Tagline must be less than 100 characters').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  industry: z.string().min(1, 'Please select an industry'),
  company_size: z.string().min(1, 'Please select company size'),
  company_type: z.string().min(1, 'Please select company type'),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  linkedin_url: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
});

const EnhancedCompanyRegistration = ({ onSubmit, initialData = {}, isLoading = false }) => {
  const [logoPreview, setLogoPreview] = useState(initialData.logo_url || '');
  const [coverPreview, setCoverPreview] = useState(initialData.cover_image_url || '');
  const [currentSection, setCurrentSection] = useState('basic');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      ...initialData,
      founded_year: initialData.founded_year || new Date().getFullYear()
    }
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Construction', 'Transportation', 'Entertainment',
    'Food & Beverage', 'Real Estate', 'Consulting', 'Non-profit', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const companyTypes = [
    'Startup', 'Private Company', 'Public Company', 
    'Non-profit', 'Government', 'Agency', 'Freelance'
  ];

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setValue('logo_url', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
        setValue('cover_image_url', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateCompletion = () => {
    const allFields = [
      watch('name'),
      watch('description'),
      watch('industry'),
      watch('company_size'),
      watch('company_type'),
      watch('website'),
      watch('email'),
      watch('address_line1'),
      watch('city'),
      watch('country')
    ];
    
    const filledFields = allFields.filter(field => field && field !== '').length;
    return Math.round((filledFields / allFields.length) * 100);
  };

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: Building2 },
    { id: 'details', title: 'Company Details', icon: Users },
    { id: 'location', title: 'Location & Contact', icon: MapPin },
    { id: 'social', title: 'Social & Media', icon: Globe }
  ];

  const SectionNav = () => (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg mb-6">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setCurrentSection(section.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentSection === section.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Company Profile Setup
            </CardTitle>
            <CardDescription>
              Create a compelling company profile to attract top talent
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {calculateCompletion()}% Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <SectionNav />

          {/* Basic Information */}
          {currentSection === 'basic' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-8">
                  {/* Logo Upload */}
                  <div className="text-center">
                    <Label className="block text-sm font-medium mb-2">Company Logo</Label>
                    <div className="relative">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('logo-upload').click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="text-center">
                    <Label className="block text-sm font-medium mb-2">Cover Image</Label>
                    <div className="relative">
                      <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('cover-upload').click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Company Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Making the world a better place"
                    {...register('tagline')}
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500">A brief, catchy phrase that describes your company</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell candidates about your company, mission, and culture..."
                    rows={4}
                    {...register('description')}
                    className={errors.description ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {watch('description')?.length || 0}/1000 characters
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Details */}
          {currentSection === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="flex items-center gap-2">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue('industry', value)}>
                    <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry.toLowerCase().replace(/\s+/g, '_')}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.industry.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size" className="flex items-center gap-2">
                    Company Size <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue('company_size', value)}>
                    <SelectTrigger className={errors.company_size ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size.toLowerCase().replace(/\s+/g, '_')}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.company_size && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.company_size.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_type" className="flex items-center gap-2">
                    Company Type <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue('company_type', value)}>
                    <SelectTrigger className={errors.company_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.company_type && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.company_type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded_year" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Founded Year
                  </Label>
                  <Input
                    id="founded_year"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    {...register('founded_year', { valueAsNumber: true })}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location & Contact */}
          {currentSection === 'location' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Company Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://company.com"
                    {...register('website')}
                    className={errors.website ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.website.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Company Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...register('phone')}
                    className="border-gray-300"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Street Address</Label>
                    <Input
                      id="address_line1"
                      placeholder="123 Business Street"
                      {...register('address_line1')}
                      className="border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="San Francisco"
                        {...register('city')}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        placeholder="California"
                        {...register('state')}
                        className="border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="United States"
                        {...register('country')}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        placeholder="94105"
                        {...register('postal_code')}
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social & Media */}
          {currentSection === 'social' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Social Media Presence</h3>
                <p className="text-gray-600">Connect your social media accounts to build trust with candidates</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn Company Page</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/company/yourcompany"
                    {...register('linkedin_url')}
                    className={errors.linkedin_url ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.linkedin_url && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.linkedin_url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url">Twitter/X Handle</Label>
                  <Input
                    id="twitter_url"
                    type="url"
                    placeholder="https://twitter.com/yourcompany"
                    {...register('twitter_url')}
                    className={errors.twitter_url ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.twitter_url && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.twitter_url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook Page</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    placeholder="https://facebook.com/yourcompany"
                    {...register('facebook_url')}
                    className={errors.facebook_url ? 'border-red-500' : 'border-gray-300'}
                  />
                  {errors.facebook_url && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.facebook_url.message}
                    </p>
                  )}
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pro Tip:</strong> Adding social media links helps candidates learn more about your company culture and increases application rates by up to 40%.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation & Submit */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-600">
              Complete all sections for the best candidate experience
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedCompanyRegistration;
