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
  const [validationErrors, setValidationErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [formProgress, setFormProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Form sections for progress tracking
  const formSections = [
    { id: 'basic', title: 'Basic Information', fields: ['title', 'external_company_name', 'location_city'] },
    { id: 'details', title: 'Job Details', fields: ['description', 'employment_type', 'experience_level'] },
    { id: 'requirements', title: 'Requirements', fields: ['required_skills', 'years_experience_min', 'education_requirement'] },
    { id: 'compensation', title: 'Compensation', fields: ['salary_min', 'salary_max'] },
    { id: 'application', title: 'Application Info', fields: ['application_method', 'application_email', 'apply_url'] },
  ];
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

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [
      'title', 'external_company_name', 'description', 'employment_type', 
      'experience_level', 'location_city', 'required_skills'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      return value !== '' && value !== undefined && value !== null;
    });
    
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [formData]);

  // Auto-save functionality (save to localStorage)
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        localStorage.setItem('draft-external-job', JSON.stringify(formData));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, isDirty]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem('draft-external-job');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
        setIsDirty(false);
        toast.info('Draft loaded from previous session');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
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
    setIsDirty(true);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Section collapse/expand functionality
  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Job title is required';
    if (!formData.external_company_name.trim()) errors.external_company_name = 'Company name is required';
    if (!formData.description.trim()) errors.description = 'Job description is required';
    if (!formData.location_city.trim()) errors.location_city = 'Location is required';
    if (!formData.required_skills.trim()) errors.required_skills = 'Required skills are needed';
    
    // Salary validation
    if (formData.salary_min && formData.salary_max) {
      if (parseFloat(formData.salary_min) > parseFloat(formData.salary_max)) {
        errors.salary_max = 'Maximum salary must be greater than minimum salary';
      }
    }
    
    // Email validation
    if (formData.application_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.application_email)) {
      errors.application_email = 'Please enter a valid email address';
    }
    
    // URL validation
    if (formData.application_url && !/^https?:\/\/.+/.test(formData.application_url)) {
      errors.application_url = 'Please enter a valid URL starting with http:// or https://';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
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
      // Clear draft from localStorage
      localStorage.removeItem('draft-external-job');
      navigate('/external-admin/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Failed to create job');
      
      // If there are field-specific errors from the server, show them
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('draft-external-job', JSON.stringify(formData));
    toast.success('Draft saved successfully!');
    setIsDirty(false);
  };

  const handleClearDraft = () => {
    localStorage.removeItem('draft-external-job');
    setFormData({
      title: '',
      description: '',
      summary: '',
      external_company_name: '',
      external_company_website: '',
      external_company_logo: '',
      job_source: 'external',
      source_url: '',
      employment_type: 'full-time',
      experience_level: 'mid',
      category_id: undefined,
      location_type: 'remote',
      location_city: '',
      location_state: '',
      location_country: '',
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      salary_period: 'yearly',
      show_salary: true,
      salary_negotiable: false,
      required_skills: '',
      preferred_skills: '',
      years_experience_min: 0,
      years_experience_max: '',
      education_requirement: '',
      application_type: 'external',
      application_url: '',
      application_email: '',
      application_instructions: '',
      status: 'published'
    });
    setValidationErrors({});
    setIsDirty(false);
    toast.success('Form cleared!');
  };

  // Helper function to render enhanced form fields
  const renderFormField = (fieldName, label, type = 'input', options = {}) => {
    const {
      placeholder = '',
      helperText = '',
      required = false,
      icon: Icon = null,
      rows = 3,
      selectOptions = []
    } = options;

    const hasError = validationErrors[fieldName];
    const fieldValue = formData[fieldName];

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName} className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {type === 'input' && (
          <Input
            id={fieldName}
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className={hasError ? 'border-red-500 focus:border-red-500' : ''}
          />
        )}

        {type === 'textarea' && (
          <Textarea
            id={fieldName}
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={hasError ? 'border-red-500 focus:border-red-500' : ''}
          />
        )}

        {type === 'select' && (
          <Select 
            value={fieldValue || ''}
            onValueChange={(value) => handleInputChange(fieldName, value)}
          >
            <SelectTrigger className={hasError ? 'border-red-500 focus:border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasError && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {hasError}
          </div>
        )}
        
        {helperText && !hasError && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Enhanced Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/external-admin/jobs')}
            className="flex items-center hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              Create External Job
            </h1>
            <p className="text-gray-600 mt-1">
              Post a job from an external source or partner company
            </p>
          </div>
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Form Completion</span>
            <span>{Math.round(formProgress)}%</span>
          </div>
          <Progress value={formProgress} className="w-full" />
        </div>

        {/* Draft Controls */}
        {(isDirty || localStorage.getItem('draft-external-job')) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {isDirty ? 'You have unsaved changes. ' : ''}
                Draft will be auto-saved after 2 seconds of inactivity.
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearDraft}
                >
                  Clear Form
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Job Information */}
        <Card className="shadow-lg">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('basic')}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Basic Job Information
                {formData.title && formData.external_company_name && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              {collapsedSections.has('basic') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              Essential details about the job position and company
            </CardDescription>
          </CardHeader>
          {!collapsedSections.has('basic') && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderFormField('title', 'Job Title', 'input', {
                    placeholder: 'e.g., Senior Frontend Developer',
                    helperText: 'Make it descriptive and specific',
                    required: true,
                    icon: Briefcase
                  })}
                  
                  {renderFormField('external_company_name', 'Company Name', 'input', {
                    placeholder: 'e.g., TechCorp Inc.',
                    helperText: 'Official name of the hiring company',
                    required: true,
                    icon: Building2
                  })}
                </div>
                
                <div className="space-y-4">
                  {renderFormField('summary', 'Job Summary', 'input', {
                    placeholder: 'Brief one-line description of the role',
                    helperText: 'A compelling tagline for the position'
                  })}

                  {renderFormField('external_company_website', 'Company Website', 'input', {
                    placeholder: 'https://company.com',
                    helperText: 'Company\'s official website URL',
                    icon: Globe
                  })}
                </div>
              </div>

              <Separator />

              {renderFormField('description', 'Job Description', 'textarea', {
                placeholder: 'Provide a detailed description of the role, responsibilities, company culture, and what makes this opportunity unique...',
                helperText: 'Be comprehensive - this is what candidates see first',
                required: true,
                rows: 8,
                icon: FileText
              })}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderFormField('employment_type', 'Employment Type', 'select', {
                  placeholder: 'Select employment type',
                  selectOptions: [
                    { value: 'full-time', label: 'Full-time' },
                    { value: 'part-time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'temporary', label: 'Temporary' },
                    { value: 'internship', label: 'Internship' }
                  ]
                })}

                {renderFormField('experience_level', 'Experience Level', 'select', {
                  placeholder: 'Select experience level',
                  selectOptions: [
                    { value: 'internship', label: 'Internship' },
                    { value: 'entry', label: 'Entry Level' },
                    { value: 'mid', label: 'Mid Level' },
                    { value: 'senior', label: 'Senior Level' },
                    { value: 'lead', label: 'Lead/Principal' },
                    { value: 'executive', label: 'Executive' }
                  ]
                })}

                <div>
                  <Label htmlFor="category_id">Job Category</Label>
                  <Select 
                    value={formData.category_id ? formData.category_id.toString() : ''}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Location Information */}
        <Card className="shadow-lg">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('location')}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Location & Work Setup
                {formData.location_city && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              {collapsedSections.has('location') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              Where the job is located and work arrangements
            </CardDescription>
          </CardHeader>
          {!collapsedSections.has('location') && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFormField('location_type', 'Work Type', 'select', {
                  placeholder: 'Select work arrangement',
                  selectOptions: [
                    { value: 'remote', label: 'Remote' },
                    { value: 'hybrid', label: 'Hybrid' },
                    { value: 'onsite', label: 'On-site' }
                  ],
                  icon: MapPin
                })}

                {renderFormField('location_city', 'City', 'input', {
                  placeholder: 'e.g., San Francisco',
                  helperText: 'Primary work location',
                  required: true
                })}

                {renderFormField('location_state', 'State/Province', 'input', {
                  placeholder: 'e.g., California'
                })}

                {renderFormField('location_country', 'Country', 'input', {
                  placeholder: 'e.g., United States'
                })}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Salary Information */}
        <Card className="shadow-lg">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('salary')}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                Compensation Details
                {(formData.salary_min || formData.salary_max) && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              {collapsedSections.has('salary') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              Salary range and compensation details
            </CardDescription>
          </CardHeader>
          {!collapsedSections.has('salary') && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderFormField('salary_min', 'Minimum Salary', 'input', {
                  placeholder: '50000',
                  helperText: 'Enter amount in numbers only'
                })}

                {renderFormField('salary_max', 'Maximum Salary', 'input', {
                  placeholder: '80000',
                  helperText: 'Enter amount in numbers only'
                })}

                {renderFormField('salary_currency', 'Currency', 'select', {
                  placeholder: 'Select currency',
                  selectOptions: [
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'CAD', label: 'CAD ($)' }
                  ]
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFormField('salary_period', 'Pay Period', 'select', {
                  placeholder: 'Select pay period',
                  selectOptions: [
                    { value: 'yearly', label: 'Per Year' },
                    { value: 'monthly', label: 'Per Month' },
                    { value: 'hourly', label: 'Per Hour' }
                  ]
                })}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="salary_negotiable"
                    checked={formData.salary_negotiable || false}
                    onChange={(e) => handleInputChange('salary_negotiable', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="salary_negotiable">Salary is negotiable</Label>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
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
