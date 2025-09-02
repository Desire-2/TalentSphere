import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save,
  ArrowLeft,
  Building2,
  Globe,
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  Users,
  FileText,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const CreateExternalJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    // Job Details
    title: '',
    description: '',
    summary: '',
    
    // External Company Info
    external_company_name: '',
    external_company_website: '',
    external_company_logo: '',
    
    // Source Info
    job_source: 'external',
    source_url: '',
    
    // Job Specifications
    employment_type: 'full-time',
    experience_level: 'mid',
    category_id: undefined,
    
    // Location
    location_type: 'remote',
    location_city: '',
    location_state: '',
    location_country: '',
    
    // Salary
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    salary_period: 'yearly',
    show_salary: true,
    salary_negotiable: false,
    
    // Requirements
    required_skills: '',
    preferred_skills: '',
    years_experience_min: 0,
    years_experience_max: '',
    education_requirement: '',
    
    // Application
    application_type: 'external',
    application_url: '',
    application_email: '',
    application_instructions: '',
    
    // Publishing
    status: 'published'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await externalAdminService.getJobCategories();
      // Ensure we always set an array
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load job categories');
      setCategories([]); // Ensure categories is always an array
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    
    if (!formData.external_company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Job description is required');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare the job data
      const jobData = {
        ...formData,
        // Convert salary fields to numbers where appropriate
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        years_experience_min: formData.years_experience_min ? parseInt(formData.years_experience_min) : 0,
        years_experience_max: formData.years_experience_max ? parseInt(formData.years_experience_max) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      await externalAdminService.createExternalJob(jobData);
      toast.success('External job created successfully!');
      navigate('/external-admin/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/external-admin/jobs')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create External Job</h1>
          <p className="text-gray-600 mt-1">
            Post a job from an external source or partner company
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Job Information
            </CardTitle>
            <CardDescription>
              Basic details about the job position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Senior Frontend Developer"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="summary">Job Summary</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief one-line description of the role"
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the role, responsibilities, and requirements..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category_id">Job Category</Label>
                <Select value={formData.category_id || undefined} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).length > 0 ? (
                      categories
                        .filter(category => category && category.id && category.name && String(category.id).trim() !== '') 
                        .map((category) => {
                          const categoryValue = String(category.id);
                          // Extra safety check to ensure value is never empty
                          if (!categoryValue || categoryValue.trim() === '') {
                            return null;
                          }
                          return (
                            <SelectItem 
                              key={category.id} 
                              value={categoryValue}
                            >
                              {category.name}
                            </SelectItem>
                          );
                        })
                        .filter(Boolean) // Remove any null entries
                    ) : (
                      <SelectItem value="loading-placeholder" disabled>
                        Loading categories...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* External Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
            <CardDescription>
              Details about the hiring company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="external_company_name">Company Name *</Label>
              <Input
                id="external_company_name"
                value={formData.external_company_name}
                onChange={(e) => handleInputChange('external_company_name', e.target.value)}
                placeholder="e.g., TechCorp Solutions"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="external_company_website">Company Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="external_company_website"
                    type="url"
                    value={formData.external_company_website}
                    onChange={(e) => handleInputChange('external_company_website', e.target.value)}
                    placeholder="https://company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="external_company_logo">Company Logo URL</Label>
                <Input
                  id="external_company_logo"
                  type="url"
                  value={formData.external_company_logo}
                  onChange={(e) => handleInputChange('external_company_logo', e.target.value)}
                  placeholder="https://company.com/logo.png"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location_type">Location Type</Label>
              <Select value={formData.location_type} onValueChange={(value) => handleInputChange('location_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.location_type !== 'remote' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => handleInputChange('location_city', e.target.value)}
                    placeholder="e.g., San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="location_state">State/Province</Label>
                  <Input
                    id="location_state"
                    value={formData.location_state}
                    onChange={(e) => handleInputChange('location_state', e.target.value)}
                    placeholder="e.g., California"
                  />
                </div>
                <div>
                  <Label htmlFor="location_country">Country</Label>
                  <Input
                    id="location_country"
                    value={formData.location_country}
                    onChange={(e) => handleInputChange('location_country', e.target.value)}
                    placeholder="e.g., USA"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Salary Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="salary_min">Minimum Salary</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => handleInputChange('salary_min', e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Maximum Salary</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => handleInputChange('salary_max', e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div>
                <Label htmlFor="salary_currency">Currency</Label>
                <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary_period">Period</Label>
                <Select value={formData.salary_period} onValueChange={(value) => handleInputChange('salary_period', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="required_skills">Required Skills</Label>
              <Input
                id="required_skills"
                value={formData.required_skills}
                onChange={(e) => handleInputChange('required_skills', e.target.value)}
                placeholder="React, TypeScript, Node.js (comma-separated)"
              />
            </div>

            <div>
              <Label htmlFor="preferred_skills">Preferred Skills</Label>
              <Input
                id="preferred_skills"
                value={formData.preferred_skills}
                onChange={(e) => handleInputChange('preferred_skills', e.target.value)}
                placeholder="AWS, Docker, GraphQL (comma-separated)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years_experience_min">Minimum Years of Experience</Label>
                <Input
                  id="years_experience_min"
                  type="number"
                  min="0"
                  value={formData.years_experience_min}
                  onChange={(e) => handleInputChange('years_experience_min', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="years_experience_max">Maximum Years of Experience</Label>
                <Input
                  id="years_experience_max"
                  type="number"
                  value={formData.years_experience_max}
                  onChange={(e) => handleInputChange('years_experience_max', e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="education_requirement">Education Requirement</Label>
              <Input
                id="education_requirement"
                value={formData.education_requirement}
                onChange={(e) => handleInputChange('education_requirement', e.target.value)}
                placeholder="e.g., Bachelor's degree in Computer Science"
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Application Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="application_type">Application Type</Label>
              <Select value={formData.application_type} onValueChange={(value) => handleInputChange('application_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External Link</SelectItem>
                  <SelectItem value="email">Email Application</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.application_type === 'external' ? (
              <div>
                <Label htmlFor="application_url">Application URL *</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="application_url"
                    type="url"
                    value={formData.application_url}
                    onChange={(e) => handleInputChange('application_url', e.target.value)}
                    placeholder="https://company.com/apply/job-123"
                    className="pl-10"
                    required={formData.application_type === 'external'}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="application_email">Application Email *</Label>
                <Input
                  id="application_email"
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => handleInputChange('application_email', e.target.value)}
                  placeholder="jobs@company.com"
                  required={formData.application_type === 'email'}
                />
              </div>
            )}

            <div>
              <Label htmlFor="application_instructions">Application Instructions</Label>
              <Textarea
                id="application_instructions"
                value={formData.application_instructions}
                onChange={(e) => handleInputChange('application_instructions', e.target.value)}
                placeholder="Additional instructions for applicants..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Source Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Source Information
            </CardTitle>
            <CardDescription>
              Information about the job source
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="job_source">Job Source</Label>
              <Input
                id="job_source"
                value={formData.job_source}
                onChange={(e) => handleInputChange('job_source', e.target.value)}
                placeholder="e.g., LinkedIn, Indeed, Company Website"
              />
            </div>

            <div>
              <Label htmlFor="source_url">Original Source URL</Label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => handleInputChange('source_url', e.target.value)}
                placeholder="https://linkedin.com/jobs/123456"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/external-admin/jobs')}
          >
            Cancel
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData(prev => ({ ...prev, status: 'draft' }));
                handleSubmit();
              }}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create & Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateExternalJob;
