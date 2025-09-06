import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Briefcase, Building2, MapPin, DollarSign, Users, 
  ExternalLink, Shield, ArrowLeft, Save, Clock, 
  Sparkles, Target, Info, CheckCircle, AlertCircle, 
  ChevronDown, ChevronUp, Edit, Loader2, Eye,
  RotateCcw, FileText
} from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Switch } from '../../components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import RichTextEditor from '../../components/ui/RichTextEditor';
import MarkdownEditor from '../../components/ui/MarkdownEditor';
import MDEditor from '@uiw/react-md-editor';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const EditExternalJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [editorType, setEditorType] = useState('rich'); // 'rich' or 'markdown'
  const [originalData, setOriginalData] = useState(null); // Store original job data
  
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

  // Fetch job data and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch job data and categories in parallel
        const [jobResponse, categoriesResponse] = await Promise.all([
          externalAdminService.getExternalJobById(id),
          externalAdminService.getJobCategories()
        ]);

        // Store original data for comparison
        setOriginalData(jobResponse);

        // Pre-populate form with job data
        const jobData = jobResponse;
        setFormData({
          title: jobData.title || '',
          description: jobData.description || '',
          summary: jobData.summary || '',
          external_company_name: jobData.external_company_name || '',
          external_company_website: jobData.external_company_website || '',
          external_company_logo: jobData.external_company_logo || '',
          job_source: jobData.job_source || 'external',
          source_url: jobData.source_url || '',
          employment_type: jobData.employment_type || 'full-time',
          experience_level: jobData.experience_level || 'mid',
          category_id: jobData.category_id || undefined,
          location_type: jobData.location_type || 'remote',
          location_city: jobData.city || '',
          location_state: jobData.state || '',
          location_country: jobData.country || '',
          salary_min: jobData.salary_min || '',
          salary_max: jobData.salary_max || '',
          salary_currency: jobData.salary_currency || 'USD',
          salary_period: jobData.salary_period || 'yearly',
          show_salary: jobData.show_salary !== undefined ? jobData.show_salary : true,
          salary_negotiable: jobData.salary_negotiable || false,
          required_skills: jobData.required_skills || '',
          preferred_skills: jobData.preferred_skills || '',
          years_experience_min: jobData.years_experience_min || 0,
          years_experience_max: jobData.years_experience_max || '',
          education_requirement: jobData.education_requirement || '',
          application_type: jobData.application_type || 'external',
          application_url: jobData.application_url || '',
          application_email: jobData.application_email || '',
          application_instructions: jobData.application_instructions || '',
          status: jobData.status || 'published'
        });

        setCategories(categoriesResponse);
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast.error('Failed to load job data');
        navigate('/external-admin/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // Form sections for better organization
  const formSections = [
    {
      id: 'basic',
      title: 'Job Information',
      icon: Briefcase,
      description: 'Basic details about the job position',
      fields: ['title', 'summary', 'description', 'employment_type', 'experience_level', 'category_id']
    },
    {
      id: 'company',
      title: 'Company Information',
      icon: Building2,
      description: 'Details about the hiring company',
      fields: ['external_company_name', 'external_company_website', 'external_company_logo']
    },
    {
      id: 'location',
      title: 'Location & Work Type',
      icon: MapPin,
      description: 'Where the work will be performed',
      fields: ['location_type', 'location_city', 'location_state', 'location_country']
    },
    {
      id: 'compensation',
      title: 'Compensation',
      icon: DollarSign,
      description: 'Salary and benefits information',
      fields: ['salary_min', 'salary_max', 'salary_currency', 'salary_period', 'show_salary', 'salary_negotiable']
    },
    {
      id: 'requirements',
      title: 'Requirements',
      icon: Users,
      description: 'Skills and experience needed',
      fields: ['required_skills', 'preferred_skills', 'years_experience_min', 'years_experience_max', 'education_requirement']
    },
    {
      id: 'application',
      title: 'Application Method',
      icon: ExternalLink,
      description: 'How candidates can apply',
      fields: ['application_type', 'application_url', 'application_email', 'application_instructions']
    }
  ];

  // Calculate form progress
  const formProgress = (() => {
    const requiredFields = ['title', 'description', 'external_company_name', 'employment_type', 'category_id'];
    const optionalFields = ['summary', 'external_company_website', 'external_company_logo', 'required_skills'];
    
    const requiredCompleted = requiredFields.filter(field => formData[field] && formData[field].toString().trim() !== '').length;
    const optionalCompleted = optionalFields.filter(field => formData[field] && formData[field].toString().trim() !== '').length;
    
    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = requiredCompleted + optionalCompleted;
    
    return {
      percentage: Math.round((completedFields / totalFields) * 100),
      requiredCompleted: requiredCompleted === requiredFields.length,
      completedFields,
      totalFields
    };
  })();

  // Form validation
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) newErrors.title = 'Job title is required';
        else if (value.length < 3) newErrors.title = 'Title must be at least 3 characters';
        else delete newErrors.title;
        break;
      case 'description':
        if (!value.trim()) newErrors.description = 'Job description is required';
        else if (value.length < 50) newErrors.description = 'Description must be at least 50 characters';
        else delete newErrors.description;
        break;
      case 'external_company_name':
        if (!value.trim()) newErrors.external_company_name = 'Company name is required';
        else delete newErrors.external_company_name;
        break;
      case 'external_company_website':
        if (value && !value.match(/^https?:\/\/.+/)) newErrors.external_company_website = 'Please enter a valid URL';
        else delete newErrors.external_company_website;
        break;
      case 'application_url':
        if (formData.application_type === 'external' && !value.trim()) {
          newErrors.application_url = 'Application URL is required for external applications';
        } else if (value && !value.match(/^https?:\/\/.+/)) {
          newErrors.application_url = 'Please enter a valid URL';
        } else {
          delete newErrors.application_url;
        }
        break;
      case 'application_email':
        if (formData.application_type === 'email' && !value.trim()) {
          newErrors.application_email = 'Application email is required for email applications';
        } else if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          newErrors.application_email = 'Please enter a valid email address';
        } else {
          delete newErrors.application_email;
        }
        break;
      case 'salary_min':
      case 'salary_max':
        if (value && isNaN(parseInt(value))) {
          newErrors[field] = 'Please enter a valid number';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Save draft functionality
  const saveDraft = async () => {
    const draftData = { ...formData, status: 'draft' };
    try {
      const jobData = {
        ...draftData,
        salary_min: draftData.salary_min ? parseInt(draftData.salary_min) : null,
        salary_max: draftData.salary_max ? parseInt(draftData.salary_max) : null,
        years_experience_min: draftData.years_experience_min ? parseInt(draftData.years_experience_min) : 0,
        years_experience_max: draftData.years_experience_max ? parseInt(draftData.years_experience_max) : null,
        category_id: draftData.category_id ? parseInt(draftData.category_id) : null,
      };

      await externalAdminService.updateExternalJob(id, jobData);
      toast.success('Draft saved successfully!');
      return true;
    } catch (error) {
      toast.error('Failed to save draft');
      return false;
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldErrors = {};
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field]);
    });
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    setUpdating(true);
    
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

      await externalAdminService.updateExternalJob(id, jobData);
      toast.success('External job updated successfully!');
      navigate('/external-admin/jobs');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(error.message || 'Failed to update job');
    } finally {
      setUpdating(false);
    }
  };

  // Reset form to original data
  const handleReset = () => {
    if (originalData) {
      const jobData = originalData;
      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        summary: jobData.summary || '',
        external_company_name: jobData.external_company_name || '',
        external_company_website: jobData.external_company_website || '',
        external_company_logo: jobData.external_company_logo || '',
        job_source: jobData.job_source || 'external',
        source_url: jobData.source_url || '',
        employment_type: jobData.employment_type || 'full-time',
        experience_level: jobData.experience_level || 'mid',
        category_id: jobData.category_id || undefined,
        location_type: jobData.location_type || 'remote',
        location_city: jobData.city || '',
        location_state: jobData.state || '',
        location_country: jobData.country || '',
        salary_min: jobData.salary_min || '',
        salary_max: jobData.salary_max || '',
        salary_currency: jobData.salary_currency || 'USD',
        salary_period: jobData.salary_period || 'yearly',
        show_salary: jobData.show_salary !== undefined ? jobData.show_salary : true,
        salary_negotiable: jobData.salary_negotiable || false,
        required_skills: jobData.required_skills || '',
        preferred_skills: jobData.preferred_skills || '',
        years_experience_min: jobData.years_experience_min || 0,
        years_experience_max: jobData.years_experience_max || '',
        education_requirement: jobData.education_requirement || '',
        application_type: jobData.application_type || 'external',
        application_url: jobData.application_url || '',
        application_email: jobData.application_email || '',
        application_instructions: jobData.application_instructions || '',
        status: jobData.status || 'published'
      });
      setErrors({});
      toast.info('Form reset to original values');
    }
  };

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

  // Enhanced form field component
  const FormField = ({ label, field, type = 'text', placeholder, required, tooltip, icon: Icon, selectOptions, ...props }) => {
    const hasError = errors[field];
    
    return (
      <div className="space-y-2 form-field">
        <div className="flex items-center justify-between">
          <Label htmlFor={field} className="text-sm font-medium flex items-center space-x-2">
            {Icon && <Icon className="h-4 w-4 text-gray-500" />}
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {type === 'textarea' ? (
          <Textarea
            id={field}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={`min-h-[100px] ${hasError ? 'border-red-500' : ''}`}
            {...props}
          />
        ) : type === 'select' ? (
          <Select value={formData[field]} onValueChange={(value) => handleInputChange(field, value)}>
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field}
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={hasError ? 'border-red-500' : ''}
            {...props}
          />
        )}
        
        {hasError && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{hasError}</span>
          </p>
        )}
      </div>
    );
  };

  // Preview component
  const JobPreview = () => (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-800">Job Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{formData.title || 'Job Title'}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              {formData.external_company_name || 'Company Name'}
            </span>
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {formData.location_type === 'remote' ? 'Remote' : 
               `${formData.location_city || 'City'}, ${formData.location_country || 'Country'}`}
            </span>
            <Badge variant="outline">{formData.employment_type}</Badge>
          </div>
        </div>
        
        {formData.summary && (
          <p className="text-gray-700">{formData.summary}</p>
        )}
        
        {(formData.salary_min || formData.salary_max) && (
          <div className="flex items-center text-green-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>
              {formData.salary_min && `$${parseInt(formData.salary_min).toLocaleString()}`}
              {formData.salary_min && formData.salary_max && ' - '}
              {formData.salary_max && `$${parseInt(formData.salary_max).toLocaleString()}`}
              <span className="text-sm text-gray-500 ml-1">
                /{formData.salary_period}
              </span>
            </span>
          </div>
        )}
        
        {formData.description && (
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            {editorType === 'rich' ? (
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.description }}
              />
            ) : (
              <div className="text-gray-700 prose prose-sm max-w-none">
                <MDEditor.Markdown source={formData.description} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Loading job data...</h3>
            <p className="text-gray-600">Please wait while we fetch the job details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 edit-job-form">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/external-admin/jobs')}
                className="flex items-center hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <Edit className="h-8 w-8 text-green-600" />
                  <span>Edit External Job</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Update job details and requirements
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Completion</div>
                <div className="flex items-center space-x-2">
                  <Progress value={formProgress.percentage} className="w-20" />
                  <span className="text-sm font-medium">{formProgress.percentage}%</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isPreview ? 'Hide Preview' : 'Preview'}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className={`space-y-6 ${isPreview ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Information */}
              <Card className="shadow-sm border-l-4 border-l-blue-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span>Job Information</span>
                    <Badge variant="secondary" className="ml-auto">Required</Badge>
                  </CardTitle>
                  <CardDescription>
                    Basic details about the job position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Job Title"
                    field="title"
                    placeholder="e.g., Senior Frontend Developer"
                    required
                    tooltip="A clear, descriptive title that accurately reflects the role"
                    icon={Target}
                  />
                  
                  <FormField
                    label="Job Summary"
                    field="summary"
                    type="textarea"
                    placeholder="Brief one-line description of the role"
                    tooltip="A concise summary that will appear in job listings"
                  />

                  <div className="space-y-4">
                    {/* Editor Type Selector */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border editor-selector">
                      <div>
                        <h4 className="font-medium text-sm">Description Editor</h4>
                        <p className="text-xs text-gray-600">Choose your preferred editing experience</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditorType('rich')}
                          className={`px-3 py-1 text-xs rounded-md transition-colors editor-toggle-btn ${
                            editorType === 'rich' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-700 border hover:bg-gray-50'
                          }`}
                        >
                          📝 Rich Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorType('markdown')}
                          className={`px-3 py-1 text-xs rounded-md transition-colors editor-toggle-btn ${
                            editorType === 'markdown' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-700 border hover:bg-gray-50'
                          }`}
                        >
                          📄 Markdown
                        </button>
                      </div>
                    </div>

                    {/* Rich Text Editor */}
                    {editorType === 'rich' && (
                      <RichTextEditor
                        label="Job Description"
                        field="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Detailed description of the role, responsibilities, and requirements..."
                        required
                        tooltip="Use the rich text editor to format your job description with bold, italic, lists, and more"
                        error={errors.description}
                        height={350}
                      />
                    )}

                    {/* Markdown Editor */}
                    {editorType === 'markdown' && (
                      <MarkdownEditor
                        label="Job Description"
                        field="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Detailed description of the role, responsibilities, and requirements..."
                        required
                        tooltip="Use markdown syntax to format your job description"
                        error={errors.description}
                        height={350}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Employment Type"
                      field="employment_type"
                      type="select"
                      required
                      selectOptions={[
                        { value: 'full-time', label: 'Full-time' },
                        { value: 'part-time', label: 'Part-time' },
                        { value: 'contract', label: 'Contract' },
                        { value: 'temporary', label: 'Temporary' },
                        { value: 'internship', label: 'Internship' },
                        { value: 'freelance', label: 'Freelance' }
                      ]}
                    />
                    
                    <FormField
                      label="Experience Level"
                      field="experience_level"
                      type="select"
                      selectOptions={[
                        { value: 'entry', label: 'Entry Level' },
                        { value: 'mid', label: 'Mid Level' },
                        { value: 'senior', label: 'Senior Level' },
                        { value: 'lead', label: 'Lead' },
                        { value: 'executive', label: 'Executive' }
                      ]}
                    />
                  </div>

                  <FormField
                    label="Job Category"
                    field="category_id"
                    type="select"
                    required
                    placeholder="Select a category"
                    selectOptions={categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
                  />
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="shadow-sm border-l-4 border-l-purple-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span>Company Information</span>
                  </CardTitle>
                  <CardDescription>
                    External company details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Company Name"
                    field="external_company_name"
                    placeholder="e.g., TechCorp Inc."
                    required
                    tooltip="Name of the hiring company"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Company Website"
                      field="external_company_website"
                      type="url"
                      placeholder="https://company.com"
                      tooltip="Company's official website URL"
                    />
                    
                    <FormField
                      label="Company Logo URL"
                      field="external_company_logo"
                      type="url"
                      placeholder="https://company.com/logo.png"
                      tooltip="URL to the company's logo image"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location & Work Setup */}
              <Card className="shadow-sm border-l-4 border-l-green-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span>Location & Work Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Where the work will be performed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Work Type"
                    field="location_type"
                    type="select"
                    selectOptions={[
                      { value: 'remote', label: 'Remote' },
                      { value: 'on-site', label: 'On-site' },
                      { value: 'hybrid', label: 'Hybrid' }
                    ]}
                  />
                  
                  {formData.location_type !== 'remote' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="City"
                        field="location_city"
                        placeholder="e.g., San Francisco"
                      />
                      <FormField
                        label="State/Province"
                        field="location_state"
                        placeholder="e.g., CA"
                      />
                      <FormField
                        label="Country"
                        field="location_country"
                        placeholder="e.g., United States"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compensation */}
              <Card className="shadow-sm border-l-4 border-l-yellow-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Compensation</span>
                  </CardTitle>
                  <CardDescription>
                    Salary range and benefits information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Minimum Salary"
                      field="salary_min"
                      type="number"
                      placeholder="50000"
                      tooltip="Minimum salary offered for this position"
                    />
                    <FormField
                      label="Maximum Salary"
                      field="salary_max"
                      type="number"
                      placeholder="80000"
                      tooltip="Maximum salary offered for this position"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Currency"
                      field="salary_currency"
                      type="select"
                      selectOptions={[
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'GBP', label: 'GBP (£)' },
                        { value: 'CAD', label: 'CAD (C$)' },
                        { value: 'AUD', label: 'AUD (A$)' }
                      ]}
                    />
                    <FormField
                      label="Pay Period"
                      field="salary_period"
                      type="select"
                      selectOptions={[
                        { value: 'yearly', label: 'Per Year' },
                        { value: 'monthly', label: 'Per Month' },
                        { value: 'weekly', label: 'Per Week' },
                        { value: 'daily', label: 'Per Day' },
                        { value: 'hourly', label: 'Per Hour' }
                      ]}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.show_salary}
                        onCheckedChange={(checked) => handleInputChange('show_salary', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium">Show Salary</Label>
                        <p className="text-xs text-gray-500">Display salary information publicly</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.salary_negotiable}
                        onCheckedChange={(checked) => handleInputChange('salary_negotiable', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium">Negotiable</Label>
                        <p className="text-xs text-gray-500">Salary is open to negotiation</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="shadow-sm border-l-4 border-l-red-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-red-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-red-600" />
                    <span>Requirements</span>
                  </CardTitle>
                  <CardDescription>
                    Skills and experience needed for this role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Required Skills"
                    field="required_skills"
                    type="textarea"
                    placeholder="List the essential skills needed for this role..."
                    tooltip="Skills that are mandatory for applicants"
                  />
                  
                  <FormField
                    label="Preferred Skills"
                    field="preferred_skills"
                    type="textarea"
                    placeholder="List additional skills that would be beneficial..."
                    tooltip="Skills that are nice-to-have but not mandatory"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Minimum Experience (Years)"
                      field="years_experience_min"
                      type="number"
                      placeholder="0"
                    />
                    <FormField
                      label="Maximum Experience (Years)"
                      field="years_experience_max"
                      type="number"
                      placeholder="10"
                    />
                  </div>
                  
                  <FormField
                    label="Education Requirement"
                    field="education_requirement"
                    type="textarea"
                    placeholder="e.g., Bachelor's degree in Computer Science or equivalent experience"
                  />
                </CardContent>
              </Card>

              {/* Application Method */}
              <Card className="shadow-sm border-l-4 border-l-indigo-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-indigo-600" />
                    <span>Application Method</span>
                  </CardTitle>
                  <CardDescription>
                    How candidates can apply for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Application Type"
                    field="application_type"
                    type="select"
                    selectOptions={[
                      { value: 'external', label: 'External Link' },
                      { value: 'email', label: 'Email Application' }
                    ]}
                  />

                  {formData.application_type === 'external' ? (
                    <FormField
                      label="Application URL"
                      field="application_url"
                      type="url"
                      placeholder="https://company.com/apply/job-123"
                      required
                      tooltip="Direct link where candidates can apply for this job"
                    />
                  ) : (
                    <FormField
                      label="Application Email"
                      field="application_email"
                      type="email"
                      placeholder="jobs@company.com"
                      required
                      tooltip="Email address where candidates should send their applications"
                    />
                  )}

                  <FormField
                    label="Application Instructions"
                    field="application_instructions"
                    type="textarea"
                    placeholder="Please include your portfolio and cover letter..."
                    tooltip="Additional instructions or requirements for applicants"
                  />
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card className="shadow-sm enhanced-card">
                <CardHeader>
                  <CardTitle 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <span>Advanced Settings</span>
                    </div>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                  <CardDescription>
                    Additional configuration options
                  </CardDescription>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Job Source"
                        field="job_source"
                        placeholder="e.g., LinkedIn, Indeed, Company Website"
                        tooltip="Where this job was originally posted"
                      />
                      <FormField
                        label="Original Source URL"
                        field="source_url"
                        type="url"
                        placeholder="https://linkedin.com/jobs/123456"
                        tooltip="Link to the original job posting"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/external-admin/jobs')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={saveDraft}
                    disabled={updating}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Draft</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4">
                  {!formProgress.requiredCompleted && (
                    <div className="text-sm text-amber-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Complete required fields to publish</span>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={updating || !formProgress.requiredCompleted}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 gradient-button"
                  >
                    {updating ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Update Job</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          {isPreview && (
            <div className="space-y-6">
              <JobPreview />
              
              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formProgress.percentage}%</div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formProgress.completedFields}/{formProgress.totalFields}
                      </div>
                      <div className="text-sm text-gray-600">Fields Filled</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.keys(errors).length > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {Object.keys(errors).length} field(s) need attention
                        </AlertDescription>
                      </Alert>
                    )}

                    {formProgress.requiredCompleted && Object.keys(errors).length === 0 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          Job is ready to update!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditExternalJob;
