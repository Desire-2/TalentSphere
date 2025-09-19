import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Shield,
  Heart,
  Import,
  Bookmark,
  Star,
  Download,
  Search
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
import MarkdownEditor from '../../components/ui/MarkdownEditor';
import MDEditor from '@uiw/react-md-editor';
import { externalAdminService } from '../../services/externalAdmin';
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
  fieldAnimations = {},
  formData = {},
  onInputChange
}) => {
  const hasError = errors[field];
  const fieldAnimation = fieldAnimations[field] || '';
  const fieldValue = formData[field] || '';
  
  // Memoized input className to prevent recalculation on every render
  const inputClassName = useMemo(() => 
    `enhanced-input ${hasError ? 'border-red-500 focus:ring-red-500 error-shake' : ''}`,
    [hasError]
  );
  
  return (
    <div className={`enhanced-form-field ${className} ${fieldAnimation}`}>
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

const CreateExternalJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateImport, setShowTemplateImport] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isPreview, setIsPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fieldAnimations, setFieldAnimations] = useState({});
  
  // Enhanced Markdown Editor Features
  const [markdownPreview, setMarkdownPreview] = useState(false);
  const [markdownFullscreen, setMarkdownFullscreen] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  
  // JSON Import Feature
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonPreview, setJsonPreview] = useState(null);
  const [importMode, setImportMode] = useState('template'); // 'template' or 'json'
  
  // Markdown templates for job descriptions
  const markdownTemplates = useMemo(() => [
    {
      id: 'professional',
      name: '🏢 Professional',
      icon: Briefcase,
      template: `# Job Title

## Company Overview
Brief description of your company and its mission.

## Role Overview
A compelling summary of the position and its impact.

## Key Responsibilities
- Responsibility 1
- Responsibility 2  
- Responsibility 3
- Responsibility 4

## Required Qualifications
- **Education:** Degree requirements
- **Experience:** Years and type of experience
- **Technical Skills:** List specific technologies
- **Soft Skills:** Communication, leadership, etc.

## Preferred Qualifications
- Additional nice-to-have skills
- Industry experience
- Certifications

## What We Offer
- Competitive compensation
- Health benefits
- Professional development
- Work-life balance

## How to Apply
Application instructions and next steps.`
    },
    {
      id: 'startup',
      name: '🚀 Startup',
      template: `# 🌟 Join Our Amazing Team!

## 🚀 About Us
We're a fast-growing startup revolutionizing [industry]. Our mission is to...

## 💼 The Role
Looking for a passionate [role] to help us scale and make an impact!

## 🎯 What You'll Do
- **Build & Ship:** Create features that users love
- **Innovate:** Solve complex problems with creative solutions
- **Collaborate:** Work with a talented, diverse team
- **Grow:** Learn new technologies and advance your career

## 🛠️ Tech Stack
- Frontend: React, TypeScript, Tailwind
- Backend: Node.js, Python, PostgreSQL
- Cloud: AWS, Docker, Kubernetes
- Tools: Git, Slack, Notion

## 🌟 You're Perfect If...
- ✨ **Experience:** 2+ years in software development
- 🧠 **Mindset:** Startup mentality, ownership-driven
- 🔧 **Skills:** Strong in JavaScript/Python
- 🤝 **Team Player:** Great communication skills

## 🎁 Perks & Benefits
- 💰 Competitive salary + equity
- 🏠 Remote-first culture
- 📚 Learning budget ($2000/year)
- 🏖️ Unlimited PTO
- 💻 Top-tier equipment

## 🚀 Ready to Join?
Send us your resume and a note about why you're excited!`
    },
    {
      id: 'technical',
      name: '⚡ Technical',
      template: `# Senior Software Engineer

## Technical Requirements

### Core Technologies
\`\`\`
Required:
- JavaScript/TypeScript (3+ years)
- React.js, Node.js
- SQL databases (PostgreSQL/MySQL)
- Git version control

Preferred:
- Docker, Kubernetes
- AWS/GCP/Azure
- GraphQL, REST APIs
- Testing frameworks (Jest, Cypress)
\`\`\`

### Architecture Experience
- Microservices design patterns
- Event-driven architecture
- Database design and optimization
- API design and documentation

### Development Practices
- [ ] Test-driven development (TDD)
- [ ] Continuous integration/deployment
- [ ] Code review processes
- [ ] Agile/Scrum methodologies

## Technical Challenges
You'll work on:
1. **Scale:** Handle millions of users
2. **Performance:** Sub-100ms response times
3. **Reliability:** 99.9% uptime
4. **Security:** Enterprise-grade protection

## Code Sample
Please include a GitHub link or code sample demonstrating:
- Clean, readable code
- Problem-solving approach
- Testing strategies

## Interview Process
1. 📞 **Recruiter Call** (30 min)
2. 👨‍💻 **Technical Screen** (60 min)
3. 🔧 **Coding Challenge** (take-home)
4. 🎯 **System Design** (60 min)
5. 🤝 **Team Fit** (45 min)
6. 🎉 **Offer & Reference Check**`
    },
    {
      id: 'creative',
      name: '🎨 Creative',
      template: `# 🎨 Creative Position

## The Canvas
We're looking for a creative visionary to join our design team!

## Your Palette 🎯
**Role:** [Position Title]  
**Team:** Design & Creative  
**Location:** [Location/Remote]  
**Type:** [Full-time/Contract]

## What You'll Paint 🖌️
### Daily Masterpieces
- Create stunning visual designs
- Collaborate with product teams
- Iterate based on user feedback
- Maintain design consistency

### Your Toolkit 🛠️
- **Design:** Figma, Sketch, Adobe CC
- **Prototyping:** Framer, Principle
- **Research:** User interviews, A/B testing
- **Code:** HTML/CSS knowledge helpful

## Your Artist Profile 👩‍🎨
### Must-Haves
- 3+ years design experience
- Strong portfolio showcasing range
- User-centered design mindset
- Excellent communication skills

### Bonus Points
- Motion design experience
- Brand design background
- Frontend development skills
- Startup experience

## The Gallery (Portfolio) 📸
Please share:
- **Behance/Dribbble:** Your best work
- **Case Studies:** Design process examples
- **Range:** Show different project types

## Our Creative Culture 🌈
- **Collaborative:** Weekly design critiques
- **Learning:** Conference budget + time
- **Flexible:** Work your creative hours
- **Impact:** See your designs in production

---
*Ready to create something amazing together?*`
    }
  ], []);
  
  // Refs for debouncing
  const validationTimeoutRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef({});
  
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

  // Auto-save functionality with optimized debouncing
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Increased delay to 5 seconds to reduce database calls during typing

      return () => clearTimeout(timer);
    }
  }, [formData, isDirty]);

  // Fetch templates function
  const fetchTemplates = async () => {
    try {
      const response = await externalAdminService.getJobTemplates({ 
        include_public: true,
        per_page: 50
      });
      if (response && Array.isArray(response.templates)) {
        setTemplates(response.templates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Don't show error toast as templates are optional
      setTemplates([]);
    }
  };

  // Save current form as template
  const handleSaveAsTemplate = useCallback(async () => {
    try {
      // Check if we have minimum required data
      if (!formData.title || !formData.description) {
        toast.error('Please fill in at least the job title and description before saving as template');
        return;
      }
      
      // Prompt for template name
      const templateName = prompt('Enter a name for this template:', formData.title ? `${formData.title} Template` : 'New Job Template');
      if (!templateName) return;
      
      const templateDescription = prompt('Enter a description for this template (optional):', `Template for ${formData.title || 'job posting'}`);
      
      const templateData = {
        name: templateName,
        description: templateDescription || '',
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        title: formData.title,
        summary: formData.summary,
        job_description: formData.description,
        requirements: formData.required_skills,
        preferred_skills: formData.preferred_skills,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        education_requirement: formData.education_requirement,
        location_type: formData.location_type,
        location_city: formData.location_city,
        location_state: formData.location_state,
        location_country: formData.location_country,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        salary_period: formData.salary_period,
        salary_negotiable: formData.salary_negotiable,
        show_salary: formData.show_salary,
        application_type: formData.application_type,
        application_url: formData.application_url,
        application_email: formData.application_email,
        application_instructions: formData.application_instructions,
        is_public: false, // Private by default
        tags: [formData.employment_type, formData.experience_level, formData.location_type].filter(Boolean)
      };
      
      await externalAdminService.createJobTemplate(templateData);
      
      toast.success(`✨ Template "${templateName}" saved successfully!`, {
        description: 'You can now reuse this template for future job postings',
        action: {
          label: 'View Templates',
          onClick: () => window.open('/external-admin/templates', '_blank')
        }
      });
      
      // Refresh templates list
      fetchTemplates();
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  }, [formData, fetchTemplates]);

  // Cleanup timeout refs on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S: Save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
      }
      
      // Ctrl/Cmd + P: Toggle preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsPreview(!isPreview);
      }
      
      // Ctrl/Cmd + T: Toggle template import
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setShowTemplateImport(!showTemplateImport);
      }
      
      // Ctrl/Cmd + Shift + T: Save as template
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (formData.title || formData.description) {
          handleSaveAsTemplate();
        }
      }
      
      // Ctrl/Cmd + Enter: Submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (formProgress.requiredCompleted && !loading) {
          document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
      
      // Escape: Cancel/go back or close template dropdown
      if (e.key === 'Escape') {
        if (showTemplateImport) {
          setShowTemplateImport(false);
        } else {
          navigate('/external-admin/jobs');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreview, formProgress.requiredCompleted, loading, navigate, showTemplateImport, formData.title, formData.description, handleSaveAsTemplate]);

  // Click outside handler for template import dropdown
  // Commented out click outside handler since we're using portal with backdrop
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (showTemplateImport && !event.target.closest('.template-import-dropdown') && !event.target.closest('.template-import-button')) {
  //       setShowTemplateImport(false);
  //     }
  //   };

  //   if (showTemplateImport) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //     return () => document.removeEventListener('mousedown', handleClickOutside);
  //   }
  // }, [showTemplateImport]);

  const handleAutoSave = async () => {
    if (!isDirty) return;
    
    setAutoSaveStatus('saving');
    try {
      // Here you would call your auto-save API
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500));
      setAutoSaveStatus('saved');
      setIsDirty(false);
    } catch (error) {
      setAutoSaveStatus('error');
    }
  };

  // Optimized field animation - disabled for critical input fields to prevent typing lag
  const animateField = useCallback((fieldName) => {
    // Skip animations for critical input fields to prevent performance issues
    const criticalFields = ['title', 'summary', 'external_company_name', 'external_company_website'];
    if (criticalFields.includes(fieldName)) {
      return; // No animations for these fields
    }
    
    // Only animate if field isn't already animating
    if (!fieldAnimations[fieldName]) {
      setFieldAnimations(prev => ({
        ...prev,
        [fieldName]: 'animate-pulse'
      }));
      
      setTimeout(() => {
        setFieldAnimations(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }, 300);
    }
  }, [fieldAnimations]);

  // Memoized editor change handler for rich text and markdown editors
  const memoizedEditorChangeHandler = useCallback((field, value) => {
    // Optimized handler specifically for rich text editors
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Lightweight validation for editors - longer delay to avoid interrupting typing
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = setTimeout(() => {
      validateField(field, value);
    }, 800); // Longer delay for rich text editing
  }, []); // Remove validateField dependency since it has no deps itself

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
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

  // Optimized validation function - DEFINED FIRST to prevent hoisting issues
  const validateField = useCallback((field, value) => {
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      
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
        case 'summary':
          // Summary is optional, only validate if provided
          if (value && value.length > 200) {
            newErrors[field] = 'Summary should be less than 200 characters';
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
        case 'external_company_website':
          if (value && !value.match(/^https?:\/\/.+/)) {
            newErrors[field] = 'Please enter a valid URL';
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
        default:
          // For other fields, remove any existing errors
          delete newErrors[field];
      }
      
      return newErrors;
    });
  }, []); // No dependencies - pure function based on parameters

  // Ultra-optimized stable input change handler - CRITICAL FOR INPUT PERFORMANCE
  const stableInputChange = useCallback((field, value) => {
    // IMMEDIATE state update - NO processing, NO delays, NO blocking operations
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // ALL other operations are completely separated and non-blocking
    
    // Clear any existing validation timeout to prevent accumulation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Debounced validation - completely separate from input handling
    validationTimeoutRef.current = setTimeout(() => {
      // Capture current values to avoid stale closures
      const currentFormData = formData;
      validateField(field, value);
    }, 500); // Increased delay to reduce interference during typing
    
    // Suggestions are completely optional and heavily debounced
    if ((field === 'title' || field === 'external_company_name') && value.length > 3) {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
      suggestionsTimeoutRef.current = setTimeout(() => {
        try {
          if (field === 'title') {
            suggestJobCategory(value);
          } else if (field === 'external_company_name') {
            suggestCompanyInfo(value);
          }
        } catch (error) {
          // Silently ignore suggestion errors to prevent input interruption
          console.log('Suggestion error (non-critical):', error);
        }
      }, 1500); // Even longer delay for suggestions
    }
  }, []); // CRITICAL: Empty dependency array for absolute stability

  // Enhanced Markdown Helper Functions
  const insertMarkdownTemplate = useCallback((template) => {
    setFormData(prev => ({ ...prev, description: template.template }));
    setIsDirty(true);
    toast.success(`✨ ${template.name} template applied!`, {
      description: 'You can now customize the content for your job posting'
    });
  }, []);

  const insertMarkdownSnippet = useCallback((snippet) => {
    const currentText = formData.description || '';
    const newText = currentText + (currentText ? '\n\n' : '') + snippet;
    setFormData(prev => ({ ...prev, description: newText }));
    setIsDirty(true);
  }, [formData.description]);

  const markdownSnippets = useMemo(() => [
    { 
      id: 'responsibilities', 
      name: '📋 Responsibilities', 
      icon: Briefcase,
      snippet: `## Key Responsibilities
- Primary responsibility
- Secondary responsibility
- Additional tasks` 
    },
    { 
      id: 'requirements', 
      name: '✅ Requirements', 
      icon: CheckCircle,
      snippet: `## Required Qualifications
- **Experience:** X years in relevant field
- **Education:** Degree requirements
- **Skills:** List of required skills` 
    },
    { 
      id: 'benefits', 
      name: '🎁 Benefits', 
      icon: Heart,
      snippet: `## What We Offer
- Competitive salary and equity
- Comprehensive health benefits
- Professional development opportunities
- Flexible work arrangements` 
    },
    { 
      id: 'techstack', 
      name: '⚡ Tech Stack', 
      icon: Zap,
      snippet: `## Technical Requirements
\`\`\`
Frontend: React, TypeScript, Tailwind CSS
Backend: Node.js, Python, PostgreSQL
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jest, Cypress
\`\`\`` 
    }
  ], []);

  // Template import functionality
  const handleTemplateImport = useCallback(async (templateId) => {
    try {
      setLoading(true);
      
      // Fetch the template with usage increment
      const response = await externalAdminService.getJobTemplateById(templateId, true);
      const template = response.template;
      
      if (!template) {
        toast.error('Template not found');
        return;
      }
      
      // Map template fields to form data
      const templateFormData = {
        // Basic job information
        title: template.title || '',
        description: template.job_description || '',
        summary: template.summary || '',
        
        // Employment details
        employment_type: template.employment_type || 'full-time',
        experience_level: template.experience_level || 'mid',
        category_id: template.category_id?.toString() || '',
        
        // Location information
        location_type: template.location_type || 'remote',
        location_city: template.location_city || '',
        location_state: template.location_state || '',
        location_country: template.location_country || '',
        
        // Salary information
        salary_min: template.salary_min?.toString() || '',
        salary_max: template.salary_max?.toString() || '',
        salary_currency: template.salary_currency || 'USD',
        salary_period: template.salary_period || 'yearly',
        salary_negotiable: template.salary_negotiable || false,
        show_salary: template.show_salary !== undefined ? template.show_salary : true,
        
        // Requirements
        required_skills: template.requirements || '',
        preferred_skills: template.preferred_skills || '',
        education_requirement: template.education_requirement || '',
        
        // Application information
        application_type: template.application_type || 'external',
        application_url: template.application_url || '',
        application_email: template.application_email || '',
        application_instructions: template.application_instructions || '',
        
        // Keep existing external company info if already filled
        external_company_name: formData.external_company_name || '',
        external_company_website: formData.external_company_website || '',
        external_company_logo: formData.external_company_logo || '',
        source_url: formData.source_url || '',
        job_source: formData.job_source || 'external',
        status: formData.status || 'published'
      };
      
      // Update form data
      setFormData(templateFormData);
      setSelectedTemplate(template);
      setShowTemplateImport(false);
      setIsDirty(true);
      
      // Show success message
      toast.success(`🎉 Template "${template.name}" imported successfully!`, {
        description: 'All fields have been auto-filled. You can now customize as needed.',
        duration: 4000
      });
      
      // Clear any existing errors since we're starting fresh
      setErrors({});
      
    } catch (error) {
      console.error('Error importing template:', error);
      toast.error('Failed to import template');
    } finally {
      setLoading(false);
    }
  }, [formData.external_company_name, formData.external_company_website, formData.external_company_logo, formData.source_url, formData.job_source, formData.status]);

  // JSON Import functionality
  const handleJsonImport = useCallback(() => {
    try {
      if (!jsonText.trim()) {
        setJsonError('Please enter JSON data');
        return;
      }

      // Parse JSON
      const parsedData = JSON.parse(jsonText);
      
      // Validate and map JSON fields to form structure
      const mappedData = {
        // Basic information
        title: parsedData.title || parsedData.job_title || parsedData.name || '',
        summary: parsedData.summary || parsedData.job_summary || parsedData.description_short || '',
        description: parsedData.description || parsedData.job_description || parsedData.details || '',
        
        // Requirements
        required_skills: parsedData.required_skills || parsedData.requirements || parsedData.must_have || '',
        preferred_skills: parsedData.preferred_skills || parsedData.nice_to_have || parsedData.preferred || '',
        education_requirement: parsedData.education_requirement || parsedData.education || parsedData.degree || '',
        
        // Job details
        employment_type: parsedData.employment_type || parsedData.job_type || parsedData.type || 'full-time',
        experience_level: parsedData.experience_level || parsedData.experience || parsedData.level || 'mid',
        
        // Location
        location_type: parsedData.location_type || parsedData.remote_type || (parsedData.is_remote ? 'remote' : 'on-site'),
        location_city: parsedData.location_city || parsedData.city || parsedData.location?.city || '',
        location_state: parsedData.location_state || parsedData.state || parsedData.location?.state || '',
        location_country: parsedData.location_country || parsedData.country || parsedData.location?.country || '',
        
        // Salary
        salary_min: parsedData.salary_min || parsedData.salary?.min || parsedData.compensation?.min || '',
        salary_max: parsedData.salary_max || parsedData.salary?.max || parsedData.compensation?.max || '',
        salary_currency: parsedData.salary_currency || parsedData.currency || 'USD',
        salary_period: parsedData.salary_period || parsedData.salary_type || 'yearly',
        salary_negotiable: parsedData.salary_negotiable || false,
        show_salary: parsedData.show_salary !== false,
        
        // Application
        application_type: parsedData.application_type || parsedData.apply_method || 'external',
        application_url: parsedData.application_url || parsedData.apply_url || parsedData.url || '',
        application_email: parsedData.application_email || parsedData.apply_email || parsedData.email || '',
        application_instructions: parsedData.application_instructions || parsedData.apply_instructions || '',
        
        // Company (if provided)
        external_company_name: parsedData.company_name || parsedData.company || parsedData.employer || formData.external_company_name || '',
        external_company_website: parsedData.company_website || parsedData.website || formData.external_company_website || '',
        external_company_logo: parsedData.company_logo || parsedData.logo || formData.external_company_logo || '',
        
        // Metadata
        category_id: parsedData.category_id || formData.category_id || '',
        source_url: parsedData.source_url || parsedData.url || formData.source_url || '',
        job_source: parsedData.job_source || formData.job_source || 'json_import',
        status: parsedData.status || formData.status || 'draft'
      };

      // Update form data
      setFormData(mappedData);
      setJsonText('');
      setJsonError('');
      setJsonPreview(null);
      setShowJsonImport(false);
      setIsDirty(true);

      // Show success message
      toast.success('🎉 JSON data imported successfully!', {
        description: 'All fields have been auto-filled from the JSON data.',
        duration: 4000
      });

      // Clear any existing errors since we're starting fresh
      setErrors({});

    } catch (error) {
      console.error('Error parsing JSON:', error);
      setJsonError(`Invalid JSON format: ${error.message}`);
    }
  }, [jsonText, formData]);

  // JSON validation and preview
  const handleJsonTextChange = useCallback((value) => {
    setJsonText(value);
    setJsonError('');
    
    if (!value.trim()) {
      setJsonPreview(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setJsonPreview(parsed);
      setJsonError('');
    } catch (error) {
      setJsonPreview(null);
      if (value.trim().length > 10) { // Only show error for substantial input
        setJsonError(`Invalid JSON: ${error.message}`);
      }
    }
  }, []);

  // Generate sample JSON structure
  const generateSampleJson = useCallback(() => {
    const sampleData = {
      title: "Senior Software Engineer",
      summary: "Join our team as a Senior Software Engineer and work on cutting-edge projects.",
      description: "We are looking for an experienced software engineer to join our dynamic development team...",
      required_skills: "5+ years of experience with React, Node.js, JavaScript, Python, SQL",
      preferred_skills: "Experience with AWS, Docker, TypeScript, GraphQL",
      education_requirement: "Bachelor's degree in Computer Science or related field",
      employment_type: "full-time",
      experience_level: "senior",
      location_type: "hybrid",
      location_city: "San Francisco",
      location_state: "CA",
      location_country: "USA",
      salary_min: 120000,
      salary_max: 180000,
      salary_currency: "USD",
      salary_period: "yearly",
      application_type: "external",
      application_url: "https://company.com/careers/apply",
      company_name: "Tech Company Inc",
      company_website: "https://company.com"
    };
    
    setJsonText(JSON.stringify(sampleData, null, 2));
    handleJsonTextChange(JSON.stringify(sampleData, null, 2));
  }, [handleJsonTextChange]);

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!templateSearchTerm) return templates;
    
    const searchLower = templateSearchTerm.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchLower) ||
      template.title.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }, [templates, templateSearchTerm]);

  // Separate suggestion functions - moved outside main flow
  const suggestJobCategory = useCallback((title) => {
    // This could integrate with an AI service or predefined mappings
    const categoryMappings = {
      'developer': 'technology',
      'designer': 'design',
      'manager': 'management',
      'sales': 'sales',
      'marketing': 'marketing',
      'data': 'data-science'
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [keyword, categoryName] of Object.entries(categoryMappings)) {
      if (lowerTitle.includes(keyword)) {
        const category = categories.find(cat => cat && cat.name && cat.name.toLowerCase().includes(categoryName));
        if (category && !formData.category_id) {
          toast.info(`💡 Suggested category: ${category.name}`, {
            action: {
              label: 'Apply',
              onClick: () => handleInputChange('category_id', category.id.toString())
            }
          });
        }
        break;
      }
    }
  }, [categories, formData.category_id]);

  const suggestCompanyInfo = useCallback((companyName) => {
    // Mock company info suggestion - in reality, this could query a company database
    if (companyName.length > 3 && !formData.external_company_website) {
      const suggestedWebsite = `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
      toast.info(`💡 Suggested website: ${suggestedWebsite}`, {
        action: {
          label: 'Apply',
          onClick: () => handleInputChange('external_company_website', suggestedWebsite)
        }
      });
    }
  }, [formData.external_company_website]);

  // Wrapper for backward compatibility with existing select components
  const handleInputChange = useCallback((field, value) => {
    stableInputChange(field, value);
  }, [stableInputChange]);

  // Auto-save draft functionality
  const saveDraft = async () => {
    const draftData = { ...formData, status: 'draft' };
    setAutoSaveStatus('saving');
    
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
      toast.success('✨ Draft saved successfully!', {
        icon: '💾'
      });
      setAutoSaveStatus('saved');
      setIsDirty(false);
      return true;
    } catch (error) {
      toast.error('❌ Failed to save draft');
      setAutoSaveStatus('error');
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
      toast.error('❌ Please fix the errors before submitting', {
        description: `${Object.keys(fieldErrors).length} field(s) need attention`
      });
      
      // Scroll to first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
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
      
      // Show success animation
      setShowSuccessMessage(true);
      toast.success('🎉 External job created successfully!', {
        description: 'Job posting is now live and visible to candidates',
        duration: 4000
      });
      
      // Navigate after a short delay to show success state
      setTimeout(() => {
        navigate('/external-admin/jobs');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('❌ Failed to create job', {
        description: error.message || 'Please try again or contact support'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced preview component
  const JobPreview = () => (
    <Card className="preview-panel border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/80">
      <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-800">Live Preview</CardTitle>
          <Badge className="enhanced-badge ml-auto">Real-time</Badge>
        </div>
        <CardDescription className="text-blue-700">
          See how your job posting will appear to candidates
        </CardDescription>
        {selectedTemplate && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2 text-green-800">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">
                Template: {selectedTemplate.name}
              </span>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                Imported
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Job Header */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
            {formData.title || 'Job Title'}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center px-3 py-1 bg-white rounded-full border">
              <Building2 className="h-4 w-4 mr-1 text-blue-500" />
              {formData.external_company_name || 'Company Name'}
            </span>
            <span className="flex items-center px-3 py-1 bg-white rounded-full border">
              <MapPin className="h-4 w-4 mr-1 text-green-500" />
              {formData.location_type === 'remote' ? 'Remote' : 
               `${formData.location_city || 'City'}, ${formData.location_country || 'Country'}`}
            </span>
            <Badge variant="outline" className="bg-white">{formData.employment_type}</Badge>
            <Badge variant="outline" className="bg-white capitalize">{formData.experience_level} level</Badge>
          </div>
        </div>
        
        {/* Job Summary */}
        {formData.summary && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-700 font-medium">{formData.summary}</p>
          </div>
        )}
        
        {/* Salary Information */}
        {(formData.salary_min || formData.salary_max) && formData.show_salary && (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-700">
              <DollarSign className="h-5 w-5 mr-2" />
              <span className="font-semibold">
                {formData.salary_min && `$${parseInt(formData.salary_min).toLocaleString()}`}
                {formData.salary_min && formData.salary_max && ' - '}
                {formData.salary_max && `$${parseInt(formData.salary_max).toLocaleString()}`}
                <span className="text-sm font-normal text-green-600 ml-1">
                  /{formData.salary_period}
                </span>
              </span>
            </div>
            {formData.salary_negotiable && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                Negotiable
              </Badge>
            )}
          </div>
        )}
        
        {/* Company Info */}
        {(formData.external_company_website || formData.external_company_logo) && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              Company Information
            </h4>
            <div className="flex items-center space-x-3">
              {formData.external_company_logo && (
                <img 
                  src={formData.external_company_logo} 
                  alt="Company Logo" 
                  className="w-10 h-10 rounded object-contain bg-gray-50 border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className="font-medium">{formData.external_company_name}</div>
                {formData.external_company_website && (
                  <a 
                    href={formData.external_company_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Job Description */}
        {formData.description && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Job Description
            </h4>
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-gray-700 prose prose-sm max-w-none">
                <MDEditor.Markdown source={formData.description} />
              </div>
            </div>
          </div>
        )}
        
        {/* Skills & Requirements */}
        {(formData.required_skills || formData.preferred_skills) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Skills & Requirements
            </h4>
            <div className="space-y-3">
              {formData.required_skills && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.required_skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {formData.preferred_skills && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Preferred Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.preferred_skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Application Method */}
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold mb-2 flex items-center text-indigo-800">
            <FileText className="h-4 w-4 mr-1" />
            How to Apply
          </h4>
          {formData.application_type === 'external' ? (
            <div>
              <p className="text-sm text-indigo-700 mb-2">Apply directly through company website:</p>
              {formData.application_url ? (
                <a 
                  href={formData.application_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now
                </a>
              ) : (
                <div className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg">
                  Application URL will appear here
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-indigo-700 mb-2">Send your application to:</p>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                {formData.application_email || 'email@company.com'}
              </div>
            </div>
          )}
          {formData.application_instructions && (
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-sm text-gray-700">{formData.application_instructions}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 create-job-form">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Success Overlay */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="success-state p-8 rounded-2xl max-w-md mx-4 text-center">
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 mx-auto text-white animate-bounce" />
              </div>
              <h3 className="text-xl font-bold mb-2">Job Created Successfully! 🎉</h3>
              <p className="text-white/90">Your job posting is now live and visible to candidates</p>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <div className="enhanced-header p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/external-admin/jobs')}
                className="flex items-center hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
                  <span>Create External Job</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Post a job from an external source or partner company
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Template Import Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Import button clicked, current state:', showTemplateImport);
                    setShowTemplateImport(!showTemplateImport);
                  }}
                  className="template-import-button flex items-center space-x-2 secondary-button bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Import Data</span>
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                    {templates.length}
                  </Badge>
                </Button>
                
                {/* Enhanced Template Import Dropdown */}
                {showTemplateImport && createPortal(
                  (() => {
                    console.log('Rendering template modal portal');
                    return (
                      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
                        {/* Backdrop Overlay */}
                        <div 
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                          onClick={() => {
                            console.log('Backdrop clicked');
                            setShowTemplateImport(false);
                          }}
                        />
                        
                        {/* Template Import Modal */}
                        <div 
                          className="template-import-dropdown relative w-[520px] max-w-[95vw] max-h-[90vh] bg-white rounded-xl border shadow-2xl overflow-hidden"
                          onClick={(e) => {
                            console.log('Modal clicked');
                            e.stopPropagation();
                          }}
                          style={{ 
                            backgroundColor: 'white',
                            zIndex: 1,
                            position: 'relative',
                            border: '2px solid #3b82f6'
                          }}
                        >
                      {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Import Job Data</h3>
                            <p className="text-sm text-blue-100">Choose from templates or paste JSON</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTemplateImport(false)}
                          className="h-8 w-8 p-0 hover:bg-white/20 text-white rounded-full"
                        >
                          ×
                        </Button>
                      </div>
                      
                      {/* Import Mode Tabs */}
                      <div className="flex mt-4 bg-white/10 rounded-lg p-1">
                        <button
                          onClick={() => setImportMode('template')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                            importMode === 'template' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-white hover:bg-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Templates</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setImportMode('json')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                            importMode === 'json' 
                              ? 'bg-white text-purple-600 shadow-sm' 
                              : 'text-white hover:bg-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>JSON Import</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-96 overflow-y-auto">
                      
                      {/* Template Import Mode */}
                      {importMode === 'template' && (
                        <div className="space-y-4">
                          {/* Search Templates */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                              placeholder="Search templates by name, title, or tags..."
                              value={templateSearchTerm}
                              onChange={(e) => setTemplateSearchTerm(e.target.value)}
                              className="template-search-input pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </div>

                          {/* Templates List */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {filteredTemplates.length > 0 ? (
                              filteredTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className="template-card group p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50"
                                  onClick={() => handleTemplateImport(template.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                                          {template.name}
                                        </h4>
                                        {template.is_public && (
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                            Public
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {template.title}
                                      </p>
                                      {template.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                          {template.description}
                                        </p>
                                      )}
                                      {template.tags && template.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {template.tags.slice(0, 3).map((tag, index) => (
                                            <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                              {tag}
                                            </span>
                                          ))}
                                          {template.tags.length > 3 && (
                                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                              +{template.tags.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3 flex items-center space-x-2">
                                      {template.usage_count > 0 && (
                                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                                          <Star className="h-3 w-3" />
                                          <span>{template.usage_count}</span>
                                        </div>
                                      )}
                                      <Import className="h-4 w-4 text-blue-500 group-hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="template-empty-state text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium mb-1">
                                  {templateSearchTerm ? 'No templates match your search' : 'No templates available'}
                                </p>
                                <p className="text-xs">
                                  {templateSearchTerm ? 'Try a different search term' : 'Create your first template by saving a job posting'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* JSON Import Mode */}
                      {importMode === 'json' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">Paste JSON Data</h4>
                              <p className="text-sm text-gray-600">Import job data from JSON format</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={generateSampleJson}
                              className="text-xs"
                            >
                              Sample JSON
                            </Button>
                          </div>

                          {/* JSON Text Area */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Paste your JSON data here..."
                              value={jsonText}
                              onChange={(e) => handleJsonTextChange(e.target.value)}
                              className="min-h-32 font-mono text-sm border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                            />
                            {jsonError && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>{jsonError}</span>
                              </div>
                            )}
                          </div>

                          {/* JSON Preview */}
                          {jsonPreview && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 text-green-800 mb-2">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Valid JSON detected</span>
                              </div>
                              <div className="text-xs text-green-700">
                                <p>• Title: {jsonPreview.title || jsonPreview.job_title || 'Not specified'}</p>
                                <p>• Company: {jsonPreview.company_name || jsonPreview.company || 'Not specified'}</p>
                                <p>• Type: {jsonPreview.employment_type || jsonPreview.job_type || 'Not specified'}</p>
                                <p>• Location: {jsonPreview.location_city || jsonPreview.city || 'Not specified'}</p>
                              </div>
                            </div>
                          )}

                          {/* Import Actions */}
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleJsonImport}
                              disabled={!jsonText.trim() || !!jsonError}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                            >
                              <Import className="h-4 w-4 mr-2" />
                              Import JSON Data
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setJsonText('');
                                setJsonError('');
                                setJsonPreview(null);
                              }}
                              className="px-4"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                    );
                  })()
                , document.body)}
              </div>

              {/* Auto-save status indicator */}
              <div className="flex items-center space-x-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    <span className="text-gray-500">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Save failed</span>
                  </>
                )}
              </div>
              
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
                className="flex items-center space-x-1 secondary-button"
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
                  <div 
                    key={section.id} 
                    className={`flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
                      isActive ? 'text-blue-600 scale-110' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />}
                  </div>
                );
              })}
            </div>
            
            {!formProgress.requiredCompleted && (
              <Alert className="border-amber-200 bg-amber-50 animate-pulse">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  Complete required fields marked with * to publish
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Template Import Success Banner */}
        {selectedTemplate && (
          <Alert className="border-green-200 bg-green-50 mb-6 template-import-success">
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">Template imported successfully!</span>
                  <span className="ml-2">Using "{selectedTemplate.name}" - all fields have been auto-filled.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  ×
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className={`grid ${isPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
          {/* Form Content */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Information */}
              <Card className="enhanced-card form-section shadow-lg border-l-4 border-l-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span>Job Information</span>
                    <Badge variant="secondary" className="enhanced-badge ml-auto">Required</Badge>
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
                    errors={errors}
                    fieldAnimations={fieldAnimations}
                    formData={formData}
                    onInputChange={stableInputChange}
                  />
                  
                  <FormField
                    label="Job Summary"
                    field="summary"
                    placeholder="Brief one-line description of the role"
                    tooltip="A concise summary that will appear in job listings"
                    errors={errors}
                    fieldAnimations={fieldAnimations}
                    formData={formData}
                    onInputChange={stableInputChange}
                  />

                  <div className="space-y-4">
                    {/* Enhanced Markdown Editor Header */}
                    <div className="editor-header p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span>Job Description Editor</span>
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">Enhanced markdown editor with templates and snippets</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-1"
                          >
                            <span>📄</span>
                            <span>Templates</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSnippets(!showSnippets)}
                            className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center space-x-1"
                          >
                            <span>✨</span>
                            <span>Snippets</span>
                          </button>
                        </div>
                      </div>

                      {/* Template Selector */}
                      {showTemplates && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          {Object.entries(markdownTemplates).map(([key, template]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => insertMarkdownTemplate(template)}
                              className="p-2 text-xs bg-white border rounded-md hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="font-medium">{template.name}</div>
                              <div className="text-gray-500 text-xs">{template.description}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Snippet Selector */}
                      {showSnippets && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {markdownSnippets.map((snippet, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => insertMarkdownSnippet(snippet)}
                              className="p-2 text-xs bg-white border rounded-md hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="font-medium">{snippet.name}</div>
                              <div className="text-gray-400 text-xs">{snippet.syntax}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Markdown Editor */}
                    <div className="enhanced-form-field">
                      <MarkdownEditor
                        label="Job Description"
                        field="description"
                        value={formData.description}
                        onChange={memoizedEditorChangeHandler}
                        placeholder="Detailed description of the role, responsibilities, and requirements..."
                        required
                        tooltip="Use markdown syntax to format your job description. Preview available on the right side. Use templates and snippets above for quick formatting."
                        error={errors.description}
                        height={400}
                        showPreview={true}
                        showLineNumbers={true}
                        theme="github"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Employment Type" field="employment_type">
                      <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>Full-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="part-time">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span>Part-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="contract">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-purple-500" />
                              <span>Contract</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="freelance">
                            <div className="flex items-center space-x-2">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              <span>Freelance</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="internship">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-pink-500" />
                              <span>Internship</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Experience Level" field="experience_level">
                      <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entry Level</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="mid">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Mid Level</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="senior">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Senior Level</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Job Category" field="category_id">
                      <Select value={formData.category_id || undefined} onValueChange={(value) => handleInputChange('category_id', value)}>
                        <SelectTrigger className="enhanced-input">
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
                              <div className="flex items-center space-x-2">
                                <div className="loading-spinner w-4 h-4" />
                                <span>Loading categories...</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="enhanced-card form-section shadow-lg border-l-4 border-l-green-500">
                <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span>Company Information</span>
                    <Badge variant="secondary" className="enhanced-badge ml-auto">Required</Badge>
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
                    errors={errors}
                    fieldAnimations={fieldAnimations}
                    formData={formData}
                    onInputChange={stableInputChange}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Company Website"
                      field="external_company_website"
                      type="url"
                      placeholder="https://company.com"
                      tooltip="The official website of the company"
                      icon={Globe}
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />

                    <FormField
                      label="Company Logo URL"
                      field="external_company_logo"
                      type="url"
                      placeholder="https://company.com/logo.png"
                      tooltip="URL to the company's logo image"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                  </div>
                  
                  {/* Company preview */}
                  {(formData.external_company_name || formData.external_company_website || formData.external_company_logo) && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Company Preview
                      </h4>
                      <div className="flex items-center space-x-3">
                        {formData.external_company_logo && (
                          <img 
                            src={formData.external_company_logo} 
                            alt="Company Logo" 
                            className="w-12 h-12 rounded-lg object-contain bg-white border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {formData.external_company_name || 'Company Name'}
                          </div>
                          {formData.external_company_website && (
                            <a 
                              href={formData.external_company_website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                        errors={errors}
                        fieldAnimations={fieldAnimations}
                        formData={formData}
                        onInputChange={stableInputChange}
                      />
                      <FormField
                        label="State/Province"
                        field="location_state"
                        placeholder="e.g., California"
                        errors={errors}
                        fieldAnimations={fieldAnimations}
                        formData={formData}
                        onInputChange={stableInputChange}
                      />
                      <FormField
                        label="Country"
                        field="location_country"
                        placeholder="e.g., USA"
                        errors={errors}
                        fieldAnimations={fieldAnimations}
                        formData={formData}
                        onInputChange={stableInputChange}
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
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                    <FormField
                      label="Maximum Salary"
                      field="salary_max"
                      type="number"
                      placeholder="80000"
                      tooltip="The maximum salary for this position"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
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
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                    <FormField
                      label="Preferred Skills"
                      field="preferred_skills"
                      placeholder="AWS, Docker, GraphQL"
                      tooltip="Nice-to-have skills that would be beneficial (comma-separated)"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Minimum Years of Experience"
                      field="years_experience_min"
                      type="number"
                      placeholder="0"
                      tooltip="Minimum years of relevant experience required"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                    <FormField
                      label="Maximum Years of Experience"
                      field="years_experience_max"
                      type="number"
                      placeholder="10"
                      tooltip="Maximum years of experience (optional)"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                  </div>

                  <FormField
                    label="Education Requirement"
                    field="education_requirement"
                    placeholder="e.g., Bachelor's degree in Computer Science"
                    tooltip="Educational qualifications required or preferred"
                    errors={errors}
                    fieldAnimations={fieldAnimations}
                    formData={formData}
                    onInputChange={stableInputChange}
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
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                  ) : (
                    <FormField
                      label="Application Email"
                      field="application_email"
                      type="email"
                      placeholder="jobs@company.com"
                      required
                      tooltip="Email address where candidates should send their applications"
                      errors={errors}
                      fieldAnimations={fieldAnimations}
                      formData={formData}
                      onInputChange={stableInputChange}
                    />
                  )}

                  <FormField
                    label="Application Instructions"
                    field="application_instructions"
                    type="textarea"
                    placeholder="Please include your portfolio and cover letter..."
                    tooltip="Additional instructions or requirements for applicants"
                    errors={errors}
                    fieldAnimations={fieldAnimations}
                    formData={formData}
                    onInputChange={stableInputChange}
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
                        errors={errors}
                        fieldAnimations={fieldAnimations}
                        formData={formData}
                        onInputChange={stableInputChange}
                      />
                      <FormField
                        label="Original Source URL"
                        field="source_url"
                        type="url"
                        placeholder="https://linkedin.com/jobs/123456"
                        tooltip="Link to the original job posting"
                        errors={errors}
                        fieldAnimations={fieldAnimations}
                        formData={formData}
                        onInputChange={stableInputChange}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Form Actions */}
              <div className="enhanced-card p-6 border-t-4 border-t-indigo-500">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/external-admin/jobs')}
                      className="secondary-button flex items-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Cancel</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={saveDraft}
                      disabled={loading}
                      className="secondary-button flex items-center space-x-2"
                    >
                      {autoSaveStatus === 'saving' ? (
                        <>
                          <div className="loading-spinner w-4 h-4" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Draft</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveAsTemplate}
                      disabled={loading || (!formData.title && !formData.description)}
                      className="secondary-button flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Save as Template</span>
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                    {!formProgress.requiredCompleted && (
                      <div className="text-sm text-amber-600 flex items-center space-x-1 animate-pulse">
                        <AlertCircle className="h-4 w-4" />
                        <span>Complete required fields to publish</span>
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={loading || !formProgress.requiredCompleted}
                      className={`gradient-button flex items-center space-x-2 ${formProgress.requiredCompleted ? 'pulse-glow' : ''}`}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner w-5 h-5" />
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
                
                {/* Progress visualization */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Form Completion</span>
                    <span>{formProgress.completedFields} of {formProgress.totalFields} fields</span>
                  </div>
                  <Progress value={formProgress.percentage} className="h-2 progress-indicator" />
                  
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">{formProgress.percentage}%</div>
                      <div className="text-xs text-blue-700">Complete</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-600">
                        {Object.keys(errors).length === 0 ? '✓' : Object.keys(errors).length}
                      </div>
                      <div className="text-xs text-green-700">
                        {Object.keys(errors).length === 0 ? 'No Errors' : 'Errors'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-lg font-bold text-purple-600">
                        {formProgress.requiredCompleted ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-purple-700">Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          {isPreview && (
            <div className="space-y-6">
              <JobPreview />
              
              {/* Quick Stats & Tips */}
              <Card className="enhanced-card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-800 flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Quick Stats & Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600">{formProgress.percentage}%</div>
                      <div className="text-sm text-purple-700">Complete</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-200">
                      <div className="text-3xl font-bold text-green-600">
                        {formProgress.completedFields}/{formProgress.totalFields}
                      </div>
                      <div className="text-sm text-green-700">Fields Filled</div>
                    </div>
                  </div>
                  
                  {/* Status Indicators */}
                  <div className="space-y-3">
                    {Object.keys(errors).length > 0 && (
                      <Alert className="border-red-200 bg-red-50 error-state">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {Object.keys(errors).length} field(s) need attention
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {formProgress.requiredCompleted && Object.keys(errors).length === 0 && (
                      <Alert className="border-green-200 bg-green-50 success-state">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          🎉 Job is ready to publish!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {autoSaveStatus === 'saved' && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-blue-800">
                          ✨ Changes saved automatically
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {/* Pro Tips */}
                  <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Pro Tips
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-500">•</span>
                        <span>Use specific job titles to attract qualified candidates</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-500">•</span>
                        <span>Include salary range to increase application rates</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-500">•</span>
                        <span>Detailed descriptions get 3x more applications</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-500">•</span>
                        <span>Remote-friendly jobs attract global talent</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Keyboard Shortcuts */}
                  <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      Keyboard Shortcuts
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700">Save Draft</span>
                        <kbd className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Ctrl + S</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700">Toggle Preview</span>
                        <kbd className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Ctrl + P</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700">Template Import</span>
                        <kbd className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Ctrl + T</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700">Save as Template</span>
                        <kbd className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Ctrl + Shift + T</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700">Submit Form</span>
                        <kbd className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Ctrl + Enter</kbd>
                      </div>
                    </div>
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
