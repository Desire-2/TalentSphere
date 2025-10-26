import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  GraduationCap,
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
  Shield,
  Award,
  BookOpen,
  Upload,
  X,
  Loader2
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import MarkdownEditor from '../../components/ui/MarkdownEditor';
import { scholarshipService } from '../../services/scholarship';
import { toast } from 'sonner';

// Ultra-Stable Input Component - CRITICAL: Defined outside component to prevent re-creation
const StableInput = React.memo(({ field, type, value, placeholder, required, className, rows, onInputChange }) => {
  // Create a stable onChange handler - this is the key to preventing focus loss
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    // IMMEDIATE call to parent handler - no processing, no delays
    onInputChange(field, newValue);
  }, [field, onInputChange]);

  // Pre-compute all input properties to avoid recalculation
  const inputProps = useMemo(() => ({
    id: field,
    name: field,
    value: value || '',
    onChange: handleChange,
    placeholder: placeholder || '',
    required: required || false,
    className: className || '',
    // Performance optimizations
    autoComplete: 'off', // Prevent browser autocomplete interference
    spellCheck: false, // Prevent spell check lag
    autoCorrect: 'off', // Prevent mobile auto-correction lag
    autoCapitalize: 'off', // Prevent mobile capitalization delays
    // Additional optimization attributes
    'data-gramm': 'false', // Disable Grammarly
    'data-gramm_editor': 'false', // Disable Grammarly editor
    'data-enable-grammarly': 'false' // Additional Grammarly disable
  }), [field, value, handleChange, placeholder, required, className]);

  if (type === 'textarea') {
    return <Textarea {...inputProps} rows={rows || 3} />;
  }

  return <Input {...inputProps} type={type || 'text'} />;
});

// Add display name for React DevTools
StableInput.displayName = 'StableInput';

// CRITICAL: FormField component defined outside main component to prevent cursor loss
const FormField = React.memo(({ 
  label, 
  field, 
  type = 'text', 
  placeholder, 
  required = false, 
  tooltip, 
  icon: Icon,
  children,
  className = '',
  errors = {},
  formData = {},
  onInputChange
}) => {
  const hasError = errors[field];
  const fieldValue = formData[field] || '';
  
  // Memoized input className to prevent recalculation on every render
  const inputClassName = useMemo(() => 
    `enhanced-input ${hasError ? 'border-red-500 focus:ring-red-500 error-shake' : ''}`,
    [hasError]
  );
  
  return (
    <div className={`enhanced-form-field ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Label 
          htmlFor={field} 
          className={`flex items-center space-x-2 font-semibold ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}
        >
          {Icon && <Icon className="h-4 w-4 text-gray-600" />}
          <span>{label}</span>
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="enhanced-tooltip">
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {children || (
        onInputChange && (
          <StableInput
            key={field} // CRITICAL: Stable key to prevent re-mounting
            field={field}
            type={type}
            value={fieldValue}
            placeholder={placeholder}
            required={required}
            className={inputClassName}
            rows={field === 'description' ? 6 : 3}
            onInputChange={onInputChange}
          />
        )
      )}
      
      {hasError && (
        <div className="error-state mt-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{hasError}</span>
        </div>
      )}
    </div>
  );
});

// Add display name for React DevTools
FormField.displayName = 'FormField';

const EditScholarship = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingScholarship, setLoadingScholarship] = useState(true);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    summary: '',
    description: '',
    scholarship_type: '',
    category_id: '',
    
    // Organization Information
    external_organization_name: '',
    external_organization_website: '',
    external_organization_logo: '',
    source_url: '',
    
    // Academic Information
    study_level: '',
    field_of_study: '',
    
    // Location
    location_type: 'any',
    country: '',
    city: '',
    state: '',
    
    // Financial Information
    amount_min: '',
    amount_max: '',
    currency: 'USD',
    funding_type: 'full',
    renewable: false,
    duration_years: 1,
    
    // Eligibility Criteria
    min_gpa: '',
    max_age: '',
    nationality_requirements: '',
    gender_requirements: 'any',
    other_requirements: '',
    
    // Application Information
    application_type: 'external',
    application_deadline: '',
    application_email: '',
    application_url: '',
    application_instructions: '',
    required_documents: '',
    
    // Academic Requirements
    requires_transcript: true,
    requires_recommendation_letters: true,
    num_recommendation_letters: 2,
    requires_essay: true,
    essay_topics: '',
    requires_portfolio: false,
    
    // Publishing
    status: 'published'
  });

  // PERFORMANCE OPTIMIZATION: Use useRef for timeout tracking to prevent accumulation
  const validationTimeoutRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchScholarship();
  }, [id]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [
      'title', 'external_organization_name', 'description', 'scholarship_type', 
      'category_id', 'application_deadline'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      return value !== '' && value !== undefined && value !== null;
    });
    
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [formData]);

  const fetchCategories = async () => {
    try {
      const response = await scholarshipService.getScholarshipCategories();
      // Handle different response structures
      const categoryArray = Array.isArray(response) 
        ? response 
        : (response?.data && Array.isArray(response.data) 
          ? response.data 
          : (response?.categories && Array.isArray(response.categories) 
            ? response.categories 
            : []));
      setCategories(categoryArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load scholarship categories');
    }
  };

  const fetchScholarship = async () => {
    try {
      setLoadingScholarship(true);
      const response = await scholarshipService.getExternalScholarshipById(id);
      
      // Handle different response structures
      const scholarship = response?.scholarship || response?.data || response;
      
      if (scholarship) {
        // Format datetime-local value (YYYY-MM-DDTHH:MM)
        let formattedDeadline = '';
        if (scholarship.application_deadline) {
          const deadline = new Date(scholarship.application_deadline);
          if (!isNaN(deadline.getTime())) {
            formattedDeadline = deadline.toISOString().slice(0, 16);
          }
        }

        // Populate form with scholarship data
        setFormData({
          title: scholarship.title || '',
          summary: scholarship.summary || '',
          description: scholarship.description || '',
          scholarship_type: scholarship.scholarship_type || '',
          category_id: scholarship.category_id?.toString() || '',
          
          external_organization_name: scholarship.external_organization_name || '',
          external_organization_website: scholarship.external_organization_website || '',
          external_organization_logo: scholarship.external_organization_logo || '',
          source_url: scholarship.source_url || '',
          
          study_level: scholarship.study_level || '',
          field_of_study: scholarship.field_of_study || '',
          
          location_type: scholarship.location_type || 'any',
          country: scholarship.country || '',
          city: scholarship.city || '',
          state: scholarship.state || '',
          
          amount_min: scholarship.amount_min?.toString() || '',
          amount_max: scholarship.amount_max?.toString() || '',
          currency: scholarship.currency || 'USD',
          funding_type: scholarship.funding_type || 'full',
          renewable: scholarship.renewable || false,
          duration_years: scholarship.duration_years || 1,
          
          min_gpa: scholarship.min_gpa?.toString() || '',
          max_age: scholarship.max_age?.toString() || '',
          nationality_requirements: scholarship.nationality_requirements || '',
          gender_requirements: scholarship.gender_requirements || 'any',
          other_requirements: scholarship.other_requirements || '',
          
          application_type: scholarship.application_type || 'external',
          application_deadline: formattedDeadline,
          application_email: scholarship.application_email || '',
          application_url: scholarship.application_url || '',
          application_instructions: scholarship.application_instructions || '',
          required_documents: scholarship.required_documents || '',
          
          requires_transcript: scholarship.requires_transcript !== false,
          requires_recommendation_letters: scholarship.requires_recommendation_letters !== false,
          num_recommendation_letters: scholarship.num_recommendation_letters || 2,
          requires_essay: scholarship.requires_essay !== false,
          essay_topics: scholarship.essay_topics || '',
          requires_portfolio: scholarship.requires_portfolio || false,
          
          status: scholarship.status || 'published'
        });
      } else {
        toast.error('Scholarship not found');
        navigate('/external-admin/scholarships');
      }
    } catch (error) {
      console.error('Error fetching scholarship:', error);
      toast.error('Failed to load scholarship');
      navigate('/external-admin/scholarships');
    } finally {
      setLoadingScholarship(false);
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value?.trim()) {
          newErrors.title = 'Title is required';
        } else {
          delete newErrors.title;
        }
        break;
      case 'external_organization_name':
        if (!value?.trim()) {
          newErrors.external_organization_name = 'Organization name is required';
        } else {
          delete newErrors.external_organization_name;
        }
        break;
      case 'description':
        if (!value?.replace(/<[^>]*>/g, '').trim()) {
          newErrors.description = 'Description is required';
        } else {
          delete newErrors.description;
        }
        break;
      case 'scholarship_type':
        if (!value) {
          newErrors.scholarship_type = 'Scholarship type is required';
        } else {
          delete newErrors.scholarship_type;
        }
        break;
      case 'category_id':
        if (!value) {
          newErrors.category_id = 'Category is required';
        } else {
          delete newErrors.category_id;
        }
        break;
      case 'application_deadline':
        if (!value) {
          newErrors.application_deadline = 'Application deadline is required';
        } else {
          const deadline = new Date(value);
          const now = new Date();
          if (deadline <= now) {
            newErrors.application_deadline = 'Deadline must be in the future';
          } else {
            delete newErrors.application_deadline;
          }
        }
        break;
      case 'amount_min':
      case 'amount_max':
        if (value && isNaN(value)) {
          newErrors[field] = 'Amount must be a valid number';
        } else if (formData.amount_min && formData.amount_max && parseInt(formData.amount_min) > parseInt(formData.amount_max)) {
          newErrors.amount_max = 'Maximum amount must be greater than minimum';
        } else {
          delete newErrors[field];
          delete newErrors.amount_max;
        }
        break;
      case 'min_gpa':
        if (value && (isNaN(value) || value < 0 || value > 4.0)) {
          newErrors.min_gpa = 'GPA must be between 0 and 4.0';
        } else {
          delete newErrors.min_gpa;
        }
        break;
      case 'max_age':
        if (value && (isNaN(value) || value < 16)) {
          newErrors.max_age = 'Age must be at least 16';
        } else {
          delete newErrors.max_age;
        }
        break;
      case 'external_organization_website':
      case 'source_url':
      case 'application_url':
        if (value && !value.match(/^https?:\/\/.+/)) {
          newErrors[field] = 'Please enter a valid URL starting with http:// or https://';
        } else {
          delete newErrors[field];
        }
        break;
      case 'application_email':
        if (formData.application_type === 'email' && !value?.trim()) {
          newErrors.application_email = 'Email is required for email applications';
        } else if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          newErrors.application_email = 'Please enter a valid email address';
        } else {
          delete newErrors.application_email;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  // Ultra-optimized stable input change handler - CRITICAL FOR INPUT PERFORMANCE
  const stableInputChange = useCallback((field, value) => {
    // IMMEDIATE state update - NO processing, NO delays, NO blocking operations
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // ALL other operations are completely separated and non-blocking
    
    // Clear any existing validation timeout to prevent accumulation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Debounced validation - completely separate from input handling
    validationTimeoutRef.current = setTimeout(() => {
      validateField(field, value);
    }, 500); // Increased delay to reduce interference during typing
  }, []); // CRITICAL: Empty dependency array for absolute stability

  // Wrapper for backward compatibility with existing select components
  const handleInputChange = useCallback((field, value) => {
    stableInputChange(field, value);
  }, [stableInputChange]);

  // Cleanup timeout ref on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const requiredFields = [
      { field: 'title', validator: (val) => val?.trim() },
      { field: 'external_organization_name', validator: (val) => val?.trim() },
      { field: 'description', validator: (val) => val?.replace(/<[^>]*>/g, '').trim() },
      { field: 'scholarship_type', validator: (val) => val },
      { field: 'category_id', validator: (val) => val },
      { field: 'application_deadline', validator: (val) => val }
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
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const scholarshipData = {
        ...formData,
        amount_min: formData.amount_min ? parseInt(formData.amount_min) : null,
        amount_max: formData.amount_max ? parseInt(formData.amount_max) : null,
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        duration_years: parseInt(formData.duration_years) || 1,
        num_recommendation_letters: parseInt(formData.num_recommendation_letters) || 2,
        category_id: parseInt(formData.category_id),
      };

      await scholarshipService.updateScholarship(id, scholarshipData);
      
      toast.success('Scholarship updated successfully!');
      navigate('/external-admin/scholarships');
      
    } catch (error) {
      console.error('Error updating scholarship:', error);
      toast.error(error.response?.data?.error || 'Failed to update scholarship');
    } finally {
      setLoading(false);
    }
  };

  if (loadingScholarship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading scholarship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/external-admin/scholarships')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scholarships
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Scholarship</h1>
              <p className="text-gray-600 mt-1">Update scholarship information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Form Completion</span>
              <span className="text-sm text-gray-600">{Math.round(formProgress)}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Scholarship Information
              </CardTitle>
              <CardDescription>
                Basic details about the scholarship opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Scholarship Title"
                field="title"
                placeholder="e.g., Merit-Based Scholarship for Engineering Students"
                required
                tooltip="A clear, descriptive title for the scholarship"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />

              <FormField
                label="Short Summary"
                field="summary"
                type="textarea"
                placeholder="A brief overview of the scholarship..."
                tooltip="A concise summary that will appear in scholarship listings"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />

              <FormField
                label="Detailed Description"
                field="description"
                required
                tooltip="Complete description including eligibility, benefits, and application process"
              >
                <MarkdownEditor
                  label="Description"
                  field="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a comprehensive description of the scholarship, including eligibility criteria, benefits, and application requirements... (Markdown formatting supported)"
                  height={350}
                  error={errors.description}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Scholarship Type"
                  field="scholarship_type"
                  required
                  tooltip="The type of scholarship being offered"
                >
                  <Select value={formData.scholarship_type} onValueChange={(value) => handleInputChange('scholarship_type', value)}>
                    <SelectTrigger className={errors.scholarship_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select scholarship type" />
                    </SelectTrigger>
                    <SelectContent>
                      {scholarshipService.getScholarshipTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Category"
                  field="category_id"
                  required
                  tooltip="Select the most appropriate category"
                >
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                    <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Details about the scholarship provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Organization Name"
                field="external_organization_name"
                placeholder="e.g., ABC Foundation"
                required
                tooltip="Name of the organization offering this scholarship"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Organization Website"
                  field="external_organization_website"
                  type="url"
                  placeholder="https://organization.com"
                  tooltip="Official website of the organization"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />

                <FormField
                  label="Logo URL"
                  field="external_organization_logo"
                  type="url"
                  placeholder="https://organization.com/logo.png"
                  tooltip="URL to the organization's logo image"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </div>

              <FormField
                label="Source URL"
                field="source_url"
                type="url"
                placeholder="https://original-scholarship-page.com"
                tooltip="Original URL where this scholarship was found"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Academic level and field requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Study Level"
                  field="study_level"
                  tooltip="Academic level this scholarship is for"
                >
                  <Select value={formData.study_level} onValueChange={(value) => handleInputChange('study_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select study level" />
                    </SelectTrigger>
                    <SelectContent>
                      {scholarshipService.getStudyLevels().map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Field of Study"
                  field="field_of_study"
                  placeholder="e.g., Engineering, Medicine, Business"
                  tooltip="Specific field or area of study"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Requirements */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                Location & Eligibility
              </CardTitle>
              <CardDescription>
                Geographic and general eligibility requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Location Type"
                field="location_type"
                tooltip="Geographic scope of this scholarship"
              >
                <Select value={formData.location_type} onValueChange={(value) => handleInputChange('location_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scholarshipService.getLocationTypes().map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {formData.location_type !== 'any' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Country"
                    field="country"
                    placeholder="e.g., United States"
                    errors={errors}
                    formData={formData}
                    onInputChange={handleInputChange}
                  />
                  <FormField
                    label="State/Province"
                    field="state"
                    placeholder="e.g., California"
                    errors={errors}
                    formData={formData}
                    onInputChange={handleInputChange}
                  />
                  <FormField
                    label="City"
                    field="city"
                    placeholder="e.g., Los Angeles"
                    errors={errors}
                    formData={formData}
                    onInputChange={handleInputChange}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Nationality Requirements"
                  field="nationality_requirements"
                  placeholder="e.g., US Citizens, International students welcome"
                  tooltip="Specify any nationality or citizenship requirements"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />

                <FormField
                  label="Gender Requirements"
                  field="gender_requirements"
                  tooltip="Any gender-specific requirements"
                >
                  <Select value={formData.gender_requirements} onValueChange={(value) => handleInputChange('gender_requirements', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {scholarshipService.getGenderRequirements().map(req => (
                        <SelectItem key={req.value} value={req.value}>
                          {req.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Financial Information
              </CardTitle>
              <CardDescription>
                Scholarship amount and funding details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Minimum Amount"
                  field="amount_min"
                  type="number"
                  placeholder="5000"
                  tooltip="Minimum scholarship amount"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
                <FormField
                  label="Maximum Amount"
                  field="amount_max"
                  type="number"
                  placeholder="10000"
                  tooltip="Maximum scholarship amount"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
                <FormField
                  label="Currency"
                  field="currency"
                  tooltip="Currency for the scholarship amount"
                >
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Funding Type"
                  field="funding_type"
                  tooltip="Type of funding provided"
                >
                  <Select value={formData.funding_type} onValueChange={(value) => handleInputChange('funding_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding type" />
                    </SelectTrigger>
                    <SelectContent>
                      {scholarshipService.getFundingTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Duration (Years)"
                  field="duration_years"
                  type="number"
                  placeholder="1"
                  tooltip="Number of years the scholarship covers"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="renewable"
                    checked={formData.renewable}
                    onCheckedChange={(checked) => handleInputChange('renewable', checked)}
                  />
                  <Label htmlFor="renewable">Renewable</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Criteria */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-600" />
                Requirements & Criteria
              </CardTitle>
              <CardDescription>
                Academic and other requirements for applicants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Minimum GPA"
                  field="min_gpa"
                  type="number"
                  placeholder="3.0"
                  tooltip="Minimum GPA required (0-4.0 scale)"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />

                <FormField
                  label="Maximum Age"
                  field="max_age"
                  type="number"
                  placeholder="25"
                  tooltip="Maximum age limit for applicants"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </div>

              <FormField
                label="Other Requirements"
                field="other_requirements"
                type="textarea"
                tooltip="Any additional requirements not covered above"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Application Process */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Application Process
              </CardTitle>
              <CardDescription>
                How students can apply for this scholarship
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Application Type"
                field="application_type"
                required
                tooltip="How students should apply"
              >
                <Select value={formData.application_type} onValueChange={(value) => handleInputChange('application_type', value)}>
                  <SelectTrigger className={errors.application_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select application type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scholarshipService.getApplicationTypes().map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Application Deadline"
                field="application_deadline"
                type="datetime-local"
                required
                tooltip="Last date and time to submit applications"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />

              {formData.application_type === 'external' && (
                <FormField
                  label="Application URL"
                  field="application_url"
                  type="url"
                  placeholder="https://organization.com/apply"
                  required
                  tooltip="URL where students can apply"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              )}

              {formData.application_type === 'email' && (
                <FormField
                  label="Application Email"
                  field="application_email"
                  type="email"
                  placeholder="scholarships@organization.com"
                  required
                  tooltip="Email address where applications should be sent"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              )}

              <FormField
                label="Application Instructions"
                field="application_instructions"
                type="textarea"
                tooltip="Detailed instructions for applicants"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Required Documents
              </CardTitle>
              <CardDescription>
                Documents students need to submit with their application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_transcript"
                      checked={formData.requires_transcript}
                      onCheckedChange={(checked) => handleInputChange('requires_transcript', checked)}
                    />
                    <Label htmlFor="requires_transcript">Academic Transcript Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_recommendation_letters"
                      checked={formData.requires_recommendation_letters}
                      onCheckedChange={(checked) => handleInputChange('requires_recommendation_letters', checked)}
                    />
                    <Label htmlFor="requires_recommendation_letters">Recommendation Letters Required</Label>
                  </div>

                  {formData.requires_recommendation_letters && (
                    <FormField
                      label="Number of Recommendation Letters"
                      field="num_recommendation_letters"
                      type="number"
                      placeholder="2"
                      className="ml-6"
                      errors={errors}
                      formData={formData}
                      onInputChange={handleInputChange}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_essay"
                      checked={formData.requires_essay}
                      onCheckedChange={(checked) => handleInputChange('requires_essay', checked)}
                    />
                    <Label htmlFor="requires_essay">Essay Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_portfolio"
                      checked={formData.requires_portfolio}
                      onCheckedChange={(checked) => handleInputChange('requires_portfolio', checked)}
                    />
                    <Label htmlFor="requires_portfolio">Portfolio Required</Label>
                  </div>
                </div>
              </div>

              {formData.requires_essay && (
                <FormField
                  label="Essay Topics/Prompts"
                  field="essay_topics"
                  type="textarea"
                  tooltip="Specific essay topics or prompts for applicants"
                  errors={errors}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              )}

              <FormField
                label="Additional Required Documents"
                field="required_documents"
                type="textarea"
                tooltip="List any other documents needed"
                errors={errors}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card className="shadow-sm enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-gray-600" />
                Publishing Options
              </CardTitle>
              <CardDescription>
                Choose how to publish this scholarship
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Publication Status"
                field="status"
                tooltip="Whether to publish immediately or save as draft"
              >
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publish Immediately</SelectItem>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/external-admin/scholarships')}
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Scholarship
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScholarship;
