import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateExternalJob.css';
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
  Info,
  HelpCircle,
  Target,
  Zap,
  Calendar,
  Shield
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
import { Switch } from '../../components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import RichTextEditor from '../../components/ui/RichTextEditor';
import MarkdownEditor from '../../components/ui/MarkdownEditor';
import MDEditor from '@uiw/react-md-editor';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const CreateExternalJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editorType, setEditorType] = useState('rich'); // 'rich' or 'markdown'
  
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
      title: 'Application Process',
      icon: FileText,
      description: 'How candidates can apply',
      fields: ['application_type', 'application_url', 'application_email', 'application_instructions']
    }
  ];

  // Calculate form completion percentage
  const formProgress = useMemo(() => {
    const requiredFields = ['title', 'external_company_name', 'description'];
    const allFields = formSections.flatMap(section => section.fields);
    
    const completedFields = allFields.filter(field => {
      const value = formData[field];
      return value !== '' && value !== undefined && value !== null;
    }).length;
    
    const requiredCompleted = requiredFields.filter(field => {
      const value = formData[field];
      return value !== '' && value !== undefined && value !== null;
    }).length;
    
    return {
      percentage: Math.round((completedFields / allFields.length) * 100),
      requiredCompleted: requiredCompleted === requiredFields.length,
      completedFields,
      totalFields: allFields.length
    };
  }, [formData, formSections]);

  // Validation function
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value?.trim()) {
          newErrors[field] = 'Job title is required';
        } else if (value.length < 5) {
          newErrors[field] = 'Job title must be at least 5 characters';
        } else {
          delete newErrors[field];
        }
        break;
      case 'external_company_name':
        if (!value?.trim()) {
          newErrors[field] = 'Company name is required';
        } else {
          delete newErrors[field];
        }
        break;
      case 'description':
        // Strip HTML tags for character count validation
        const textContent = value?.replace(/<[^>]*>/g, '').trim() || '';
        if (!textContent) {
          newErrors[field] = 'Job description is required';
        } else if (textContent.length < 50) {
          newErrors[field] = 'Description should be at least 50 characters (excluding formatting)';
        } else {
          delete newErrors[field];
        }
        break;
      case 'external_company_website':
        if (value && !value.match(/^https?:\/\/.+/)) {
          newErrors[field] = 'Please enter a valid URL';
        } else {
          delete newErrors[field];
        }
        break;
      case 'application_url':
        if (formData.application_type === 'external' && !value?.trim()) {
          newErrors[field] = 'Application URL is required';
        } else if (value && !value.match(/^https?:\/\/.+/)) {
          newErrors[field] = 'Please enter a valid URL';
        } else {
          delete newErrors[field];
        }
        break;
      case 'application_email':
        if (formData.application_type === 'email' && !value?.trim()) {
          newErrors[field] = 'Application email is required';
        } else if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          newErrors[field] = 'Please enter a valid email address';
        } else {
          delete newErrors[field];
        }
        break;
      case 'salary_min':
      case 'salary_max':
        if (value && isNaN(Number(value))) {
          newErrors[field] = 'Please enter a valid number';
        } else if (field === 'salary_max' && formData.salary_min && Number(value) < Number(formData.salary_min)) {
          newErrors[field] = 'Maximum salary should be greater than minimum';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        delete newErrors[field];
    }
    
    setErrors(newErrors);
  };

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
    validateField(field, value);
  };

  // Auto-save draft functionality
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

      await externalAdminService.createExternalJob(jobData);
      toast.success('Draft saved successfully!');
      return true;
    } catch (error) {
      toast.error('Failed to save draft');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const requiredFields = [
      { field: 'title', validator: (val) => val?.trim() },
      { field: 'external_company_name', validator: (val) => val?.trim() },
      { field: 'description', validator: (val) => val?.replace(/<[^>]*>/g, '').trim() }
    ];
    
    const fieldErrors = {};
    
    requiredFields.forEach(({ field, validator }) => {
      if (!validator(formData[field])) {
        fieldErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
    if (formData.application_type === 'external' && !formData.application_url?.trim()) {
      fieldErrors.application_url = 'Application URL is required';
    }
    
    if (formData.application_type === 'email' && !formData.application_email?.trim()) {
      fieldErrors.application_email = 'Application email is required';
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error('Please fix the errors before submitting');
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

  // Component for rendering form fields with validation
  const FormField = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder, 
    required = false, 
    tooltip, 
    icon: Icon,
    children,
    className = ''
  }) => {
    const hasError = errors[field];
    
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <Label htmlFor={field} className={`flex items-center space-x-1 ${required ? 'after:content-["*"] after:text-red-500' : ''}`}>
            {Icon && <Icon className="h-4 w-4" />}
            <span>{label}</span>
          </Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {children || (
          <>
            {type === 'textarea' ? (
              <Textarea
                id={field}
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={placeholder}
                required={required}
                className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
                rows={field === 'description' ? 6 : 3}
              />
            ) : (
              <Input
                id={field}
                type={type}
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={placeholder}
                required={required}
                className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
              />
            )}
          </>
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

  return (
    <div className="min-h-screen bg-gray-50/50 create-job-form">
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
                  <Sparkles className="h-8 w-8 text-blue-600" />
                  <span>Create External Job</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Post a job from an external source or partner company
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Completion</div>
                <div className="flex items-center space-x-2">
                  <Progress value={formProgress.percentage} className="w-20 progress-indicator" />
                  <span className="text-sm font-medium">{formProgress.percentage}%</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center space-x-1"
              >
                {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isPreview ? 'Hide Preview' : 'Preview'}</span>
              </Button>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              {formSections.map((section, index) => {
                const isCompleted = section.fields.some(field => formData[field]);
                const isActive = currentStep === index;
                
                return (
                  <div key={section.id} className={`flex items-center space-x-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    <section.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                );
              })}
            </div>
            
            {!formProgress.requiredCompleted && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  Complete required fields marked with * to publish
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className={`grid ${isPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
          {/* Form Content */}
          <div className="space-y-6">
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
                        tooltip="Use markdown syntax to format your job description. Preview available on the right side."
                        error={errors.description}
                        height={350}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Employment Type" field="employment_type">
                      <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>Full-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="part-time">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>Part-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="contract">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>Contract</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="freelance">
                            <div className="flex items-center space-x-2">
                              <Zap className="h-4 w-4" />
                              <span>Freelance</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="internship">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Internship</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Experience Level" field="experience_level">
                      <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700">Entry Level</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="mid">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Mid Level</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="senior">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">Senior Level</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Job Category" field="category_id">
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
                              .filter(Boolean)
                          ) : (
                            <SelectItem value="loading-placeholder" disabled>
                              Loading categories...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="shadow-sm border-l-4 border-l-green-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span>Company Information</span>
                    <Badge variant="secondary" className="ml-auto">Required</Badge>
                  </CardTitle>
                  <CardDescription>
                    Details about the hiring company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    label="Company Name"
                    field="external_company_name"
                    placeholder="e.g., TechCorp Solutions"
                    required
                    tooltip="The name of the company posting this job"
                    icon={Building2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Company Website"
                      field="external_company_website"
                      type="url"
                      placeholder="https://company.com"
                      tooltip="The official website of the company"
                      icon={Globe}
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

              {/* Location Information */}
              <Card className="shadow-sm border-l-4 border-l-purple-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>Location & Work Type</span>
                  </CardTitle>
                  <CardDescription>
                    Where the work will be performed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField label="Location Type" field="location_type">
                    <Select value={formData.location_type} onValueChange={(value) => handleInputChange('location_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Remote</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="on-site">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>On-site</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hybrid">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>Hybrid</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {formData.location_type !== 'remote' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <FormField
                        label="City"
                        field="location_city"
                        placeholder="e.g., San Francisco"
                      />
                      <FormField
                        label="State/Province"
                        field="location_state"
                        placeholder="e.g., California"
                      />
                      <FormField
                        label="Country"
                        field="location_country"
                        placeholder="e.g., USA"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Salary Information */}
              <Card className="shadow-sm border-l-4 border-l-yellow-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Compensation</span>
                  </CardTitle>
                  <CardDescription>
                    Salary and benefits information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      label="Minimum Salary"
                      field="salary_min"
                      type="number"
                      placeholder="50000"
                      tooltip="The minimum salary for this position"
                    />
                    <FormField
                      label="Maximum Salary"
                      field="salary_max"
                      type="number"
                      placeholder="80000"
                      tooltip="The maximum salary for this position"
                    />
                    <FormField label="Currency" field="salary_currency">
                      <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">🇺🇸 USD</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                          <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Period" field="salary_period">
                      <Select value={formData.salary_period} onValueChange={(value) => handleInputChange('salary_period', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yearly">📅 Yearly</SelectItem>
                          <SelectItem value="monthly">📆 Monthly</SelectItem>
                          <SelectItem value="hourly">⏰ Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.show_salary}
                        onCheckedChange={(checked) => handleInputChange('show_salary', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium">Show Salary Range</Label>
                        <p className="text-xs text-gray-500">Display salary information to job seekers</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Required Skills"
                      field="required_skills"
                      placeholder="React, TypeScript, Node.js"
                      tooltip="Essential skills needed for this role (comma-separated)"
                    />
                    <FormField
                      label="Preferred Skills"
                      field="preferred_skills"
                      placeholder="AWS, Docker, GraphQL"
                      tooltip="Nice-to-have skills that would be beneficial (comma-separated)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Minimum Years of Experience"
                      field="years_experience_min"
                      type="number"
                      placeholder="0"
                      tooltip="Minimum years of relevant experience required"
                    />
                    <FormField
                      label="Maximum Years of Experience"
                      field="years_experience_max"
                      type="number"
                      placeholder="10"
                      tooltip="Maximum years of experience (optional)"
                    />
                  </div>

                  <FormField
                    label="Education Requirement"
                    field="education_requirement"
                    placeholder="e.g., Bachelor's degree in Computer Science"
                    tooltip="Educational qualifications required or preferred"
                  />
                </CardContent>
              </Card>

              {/* Application Information */}
              <Card className="shadow-sm border-l-4 border-l-indigo-500 enhanced-card">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span>Application Process</span>
                    <Badge variant="secondary" className="ml-auto">Required</Badge>
                  </CardTitle>
                  <CardDescription>
                    How candidates can apply for this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField label="Application Type" field="application_type">
                    <Select value={formData.application_type} onValueChange={(value) => handleInputChange('application_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4" />
                            <span>External Link</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Email Application</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {formData.application_type === 'external' ? (
                    <FormField
                      label="Application URL"
                      field="application_url"
                      type="url"
                      placeholder="https://company.com/apply/job-123"
                      required
                      tooltip="Direct link where candidates can apply for this job"
                      icon={ExternalLink}
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
                    disabled={loading}
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
                    disabled={loading || !formProgress.requiredCompleted}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gradient-button"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Create & Publish Job</span>
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
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formProgress.percentage}%</div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
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
                          Job is ready to publish!
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

export default CreateExternalJob;
