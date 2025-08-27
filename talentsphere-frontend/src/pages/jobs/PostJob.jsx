import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Star,
  AlertCircle,
  CheckCircle,
  Eye,
  Save,
  Send,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Info,
  Briefcase,
  GraduationCap,
  Settings,
  Calendar,
  Mail,
  ExternalLink,
  FileText,
  ImageIcon,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Home,
  Laptop,
  Coffee,
  Award,
  BookOpen,
  Code,
  Sparkles,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { jobsService } from '../../services/jobs';

// Employment types
const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];

// Experience levels
const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' }
];

// Location types
const LOCATION_TYPES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
];

// Application types
const APPLICATION_TYPES = [
  { value: 'internal', label: 'Internal Application' },
  { value: 'external', label: 'External Application' },
  { value: 'email', label: 'Email Application' }
];

// Salary periods
const SALARY_PERIODS = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'hourly', label: 'Hourly' }
];

// Common currencies
const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' }
];

// Validation Helper Component
const ValidationMessage = ({ field, formik, children }) => {
  const error = formik.errors[field];
  const touched = formik.touched[field];
  const value = formik.values[field];
  
  const showError = touched && error;
  const showSuccess = touched && !error && value && value !== '';
  
  return (
    <div className="space-y-2">
      {children}
      <div className="min-h-[20px]">
        {showError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {showSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Looks good!</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Alert Component for better error display
const Alert = ({ children, className = "", variant = "default" }) => {
  const variantClasses = {
    default: "border-gray-200 bg-gray-50 text-gray-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    success: "border-green-200 bg-green-50 text-green-800"
  };

  return (
    <div className={`p-4 rounded-lg border ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = "" }) => (
  <h4 className={`font-medium mb-2 ${className}`}>{children}</h4>
);

const AlertDescription = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

// Validation Summary Component
const ValidationSummary = ({ steps, formik }) => {
  const errorSteps = steps.filter(step => step.validation.status === 'error');
  const incompleteSteps = steps.filter(step => step.validation.status !== 'complete');
  const allMissingFields = incompleteSteps.flatMap(step => 
    step.validation.missingFields || []
  );
  const allFieldErrors = errorSteps.flatMap(step => 
    step.validation.fieldErrors || []
  );

  const overallProgress = steps.length > 0 
    ? (steps.reduce((sum, step) => sum + step.validation.completionRate, 0) / steps.length) 
    : 0;

  if (errorSteps.length === 0 && incompleteSteps.length === 0) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Ready to Publish!</AlertTitle>
        <AlertDescription className="text-green-700">
          <div className="space-y-2">
            <p>All required information has been provided and validated.</p>
            <div className="flex items-center gap-2">
              <Progress value={overallProgress} className="h-2 flex-1" />
              <span className="text-sm font-medium">{Math.round(overallProgress)}% Complete</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={errorSteps.length > 0 ? "error" : "warning"}>
      <AlertCircle className={`h-4 w-4 ${errorSteps.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
      <AlertTitle className={errorSteps.length > 0 ? 'text-red-800' : 'text-yellow-800'}>
        {errorSteps.length > 0 ? 'Validation Issues Found' : 'Incomplete Information'}
      </AlertTitle>
      <AlertDescription className={errorSteps.length > 0 ? 'text-red-700' : 'text-yellow-700'}>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <Progress value={overallProgress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{Math.round(overallProgress)}% Complete</span>
          </div>

          {/* Error Summary */}
          {allFieldErrors.length > 0 && (
            <div>
              <p className="font-medium mb-2">Please fix the following errors:</p>
              <div className="space-y-1">
                {allFieldErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{error.field.replace(/_/g, ' ')}</strong>: {error.message}
                    </span>
                  </div>
                ))}
                {allFieldErrors.length > 5 && (
                  <p className="text-sm ml-5">...and {allFieldErrors.length - 5} more errors</p>
                )}
              </div>
            </div>
          )}

          {/* Missing Fields Summary */}
          {allMissingFields.length > 0 && (
            <div>
              <p className="font-medium mb-2">Missing required information:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allMissingFields.slice(0, 8).map((missing, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded border">
                    <span className="text-sm">{missing.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {missing.step}
                    </Badge>
                  </div>
                ))}
              </div>
              {allMissingFields.length > 8 && (
                <p className="text-sm mt-2">...and {allMissingFields.length - 8} more fields</p>
              )}
            </div>
          )}

          {/* Step Status Summary */}
          <div>
            <p className="font-medium mb-2">Step Status:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {steps.map(step => (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    step.validation.status === 'complete' 
                      ? 'bg-green-100 text-green-800' 
                      : step.validation.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : step.validation.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {step.validation.status === 'complete' && <CheckCircle className="w-3 h-3" />}
                  {step.validation.status === 'error' && <AlertCircle className="w-3 h-3" />}
                  {step.validation.status === 'partial' && <Clock className="w-3 h-3" />}
                  {step.validation.status === 'incomplete' && <div className="w-3 h-3 rounded-full border-2" />}
                  <span className="truncate">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-white/50 rounded border">
            <Info className="w-4 h-4" />
            <span className="text-sm">
              Use the step navigation to complete missing information and fix errors
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Step Components - Moved before PostJobPage to fix component reference issues

const JobDetailsStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-full">
          <Settings className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Job Details</CardTitle>
          <CardDescription>
            Specify the employment type, experience level, and work location
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="employment_type" className="text-sm font-medium">
            Employment Type *
          </Label>
          <Select 
            value={formik.values.employment_type} 
            onValueChange={(value) => formik.setFieldValue('employment_type', value)}
          >
            <SelectTrigger className={`h-12 ${formik.touched.employment_type && formik.errors.employment_type ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.employment_type && formik.errors.employment_type && (
            <p className="text-sm text-red-600">{formik.errors.employment_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_level" className="text-sm font-medium">
            Experience Level *
          </Label>
          <Select 
            value={formik.values.experience_level} 
            onValueChange={(value) => formik.setFieldValue('experience_level', value)}
          >
            <SelectTrigger className={`h-12 ${formik.touched.experience_level && formik.errors.experience_level ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {level.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.experience_level && formik.errors.experience_level && (
            <p className="text-sm text-red-600">{formik.errors.experience_level}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Work Location *</Label>
        <RadioGroup 
          value={formik.values.location_type} 
          onValueChange={(value) => formik.setFieldValue('location_type', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {LOCATION_TYPES.map(type => {
            const icons = {
              'on-site': Home,
              'remote': Laptop,
              'hybrid': Coffee
            };
            const Icon = icons[type.value];
            
            return (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label 
                  htmlFor={type.value}
                  className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors flex-1"
                >
                  <Icon className="w-5 h-5" />
                  <span>{type.label}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {formik.values.location_type && formik.values.location_type !== 'remote' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50"
        >
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City *
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="e.g., San Francisco"
              value={formik.values.city}
              onChange={formik.handleChange}
              className={formik.touched.city && formik.errors.city ? 'border-red-500' : ''}
            />
            {formik.touched.city && formik.errors.city && (
              <p className="text-sm text-red-600">{formik.errors.city}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State/Province *
            </Label>
            <Input
              id="state"
              name="state"
              placeholder="e.g., California"
              value={formik.values.state}
              onChange={formik.handleChange}
              className={formik.touched.state && formik.errors.state ? 'border-red-500' : ''}
            />
            {formik.touched.state && formik.errors.state && (
              <p className="text-sm text-red-600">{formik.errors.state}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country *
            </Label>
            <Input
              id="country"
              name="country"
              placeholder="e.g., United States"
              value={formik.values.country}
              onChange={formik.handleChange}
              className={formik.touched.country && formik.errors.country ? 'border-red-500' : ''}
            />
            {formik.touched.country && formik.errors.country && (
              <p className="text-sm text-red-600">{formik.errors.country}</p>
            )}
          </div>
        </motion.div>
      )}

      {(formik.values.location_type === 'remote' || formik.values.location_type === 'hybrid') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="space-y-2 p-4 bg-purple-50/50 rounded-lg border border-purple-200/50"
        >
          <Label htmlFor="remote_policy" className="text-sm font-medium">
            Remote Work Policy *
          </Label>
          <Textarea
            id="remote_policy"
            name="remote_policy"
            placeholder="Describe your remote work policy, tools provided, communication expectations, etc."
            value={formik.values.remote_policy}
            onChange={formik.handleChange}
            rows={3}
            className={formik.touched.remote_policy && formik.errors.remote_policy ? 'border-red-500' : ''}
          />
          {formik.touched.remote_policy && formik.errors.remote_policy && (
            <p className="text-sm text-red-600">{formik.errors.remote_policy}</p>
          )}
        </motion.div>
      )}
    </CardContent>
  </Card>
);

const CompensationStep = ({ formik }) => {
  const [showSalaryDetails, setShowSalaryDetails] = useState(formik.values.show_salary);

  useEffect(() => {
    setShowSalaryDetails(formik.values.show_salary);
  }, [formik.values.show_salary]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-full">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Compensation Package</CardTitle>
            <CardDescription>
              Set competitive salary ranges and benefits to attract top talent
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Display Salary Information</Label>
            <p className="text-xs text-gray-500">
              Jobs with visible salaries get 30% more applications
            </p>
          </div>
          <Switch
            checked={formik.values.show_salary}
            onCheckedChange={(checked) => {
              formik.setFieldValue('show_salary', checked);
              setShowSalaryDetails(checked);
            }}
          />
        </div>

        <AnimatePresence>
          {showSalaryDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min" className="text-sm font-medium">
                    Minimum Salary
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      placeholder="50000"
                      value={formik.values.salary_min}
                      onChange={formik.handleChange}
                      className={`pl-10 ${formik.touched.salary_min && formik.errors.salary_min ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formik.touched.salary_min && formik.errors.salary_min && (
                    <p className="text-sm text-red-600">{formik.errors.salary_min}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_max" className="text-sm font-medium">
                    Maximum Salary
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      placeholder="80000"
                      value={formik.values.salary_max}
                      onChange={formik.handleChange}
                      className={`pl-10 ${formik.touched.salary_max && formik.errors.salary_max ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formik.touched.salary_max && formik.errors.salary_max && (
                    <p className="text-sm text-red-600">{formik.errors.salary_max}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select 
                    value={formik.values.salary_currency} 
                    onValueChange={(value) => formik.setFieldValue('salary_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_period" className="text-sm font-medium">
                    Pay Period
                  </Label>
                  <Select 
                    value={formik.values.salary_period} 
                    onValueChange={(value) => formik.setFieldValue('salary_period', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_PERIODS.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="salary_negotiable"
                  checked={formik.values.salary_negotiable}
                  onCheckedChange={(checked) => formik.setFieldValue('salary_negotiable', checked)}
                />
                <Label htmlFor="salary_negotiable" className="text-sm">
                  Salary is negotiable
                </Label>
              </div>

              {formik.values.salary_min && formik.values.salary_max && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Salary Preview</span>
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: formik.values.salary_currency 
                    }).format(formik.values.salary_min)} - {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: formik.values.salary_currency 
                    }).format(formik.values.salary_max)} {formik.values.salary_period}
                    {formik.values.salary_negotiable && (
                      <Badge variant="outline" className="ml-2">Negotiable</Badge>
                    )}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

const RequirementsStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-full">
          <GraduationCap className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Requirements & Qualifications</CardTitle>
          <CardDescription>
            Define the skills, education, and experience needed for this role
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="required_skills" className="text-sm font-medium">
          Required Skills *
        </Label>
        <Textarea
          id="required_skills"
          name="required_skills"
          placeholder="React, TypeScript, Node.js, GraphQL, AWS..."
          value={formik.values.required_skills}
          onChange={formik.handleChange}
          rows={3}
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Code className="w-3 h-3" />
          <span>Separate skills with commas - these will appear as tags</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_skills" className="text-sm font-medium">
          Preferred Skills
        </Label>
        <Textarea
          id="preferred_skills"
          name="preferred_skills"
          placeholder="Docker, Kubernetes, Machine Learning, Python..."
          value={formik.values.preferred_skills}
          onChange={formik.handleChange}
          rows={2}
        />
        <p className="text-xs text-gray-500">
          Nice-to-have skills that would make a candidate stand out
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="education_requirement" className="text-sm font-medium">
          Education Requirements
        </Label>
        <Input
          id="education_requirement"
          name="education_requirement"
          placeholder="Bachelor's degree in Computer Science or equivalent experience"
          value={formik.values.education_requirement}
          onChange={formik.handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="years_experience_min" className="text-sm font-medium">
            Minimum Years of Experience
          </Label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="years_experience_min"
              name="years_experience_min"
              type="number"
              min="0"
              placeholder="3"
              value={formik.values.years_experience_min}
              onChange={formik.handleChange}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_experience_max" className="text-sm font-medium">
            Maximum Years of Experience
          </Label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="years_experience_max"
              name="years_experience_max"
              type="number"
              min={formik.values.years_experience_min || 0}
              placeholder="8"
              value={formik.values.years_experience_max}
              onChange={formik.handleChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Skills preview */}
      {formik.values.required_skills && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-center gap-2 text-blue-700 mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Skills Preview</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {formik.values.required_skills.split(',').map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {skill.trim()}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </CardContent>
  </Card>
);

const ApplicationStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-100 rounded-full">
          <Send className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Application Process</CardTitle>
          <CardDescription>
            Configure how candidates should apply for this position
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium">Application Method *</Label>
        <RadioGroup 
          value={formik.values.application_type} 
          onValueChange={(value) => formik.setFieldValue('application_type', value)}
          className="space-y-3"
        >
          {APPLICATION_TYPES.map(type => {
            const icons = {
              'internal': Users,
              'external': ExternalLink,
              'email': Mail
            };
            const Icon = icons[type.value];
            
            return (
              <div key={type.value} className="flex items-center space-x-3">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label 
                  htmlFor={type.value}
                  className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors flex-1"
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-500">
                      {type.value === 'internal' && 'Candidates apply through your platform'}
                      {type.value === 'external' && 'Redirect to external application page'}
                      {type.value === 'email' && 'Candidates send applications via email'}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {formik.values.application_type === 'external' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="application_url" className="text-sm font-medium">
            Application URL *
          </Label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="application_url"
              name="application_url"
              type="url"
              placeholder="https://company.com/careers/apply"
              value={formik.values.application_url}
              onChange={formik.handleChange}
              className={`pl-10 ${formik.touched.application_url && formik.errors.application_url ? 'border-red-500' : ''}`}
            />
          </div>
          {formik.touched.application_url && formik.errors.application_url && (
            <p className="text-sm text-red-600">{formik.errors.application_url}</p>
          )}
        </motion.div>
      )}

      {formik.values.application_type === 'email' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="application_email" className="text-sm font-medium">
            Application Email *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="application_email"
              name="application_email"
              type="email"
              placeholder="careers@company.com"
              value={formik.values.application_email}
              onChange={formik.handleChange}
              className={`pl-10 ${formik.touched.application_email && formik.errors.application_email ? 'border-red-500' : ''}`}
            />
          </div>
          {formik.touched.application_email && formik.errors.application_email && (
            <p className="text-sm text-red-600">{formik.errors.application_email}</p>
          )}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="application_deadline" className="text-sm font-medium">
          Application Deadline
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="application_deadline"
            name="application_deadline"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formik.values.application_deadline ? new Date(formik.values.application_deadline).toISOString().split('T')[0] : ''}
            onChange={(e) => formik.setFieldValue('application_deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-gray-500">
          Leave empty for open-ended applications
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="application_instructions" className="text-sm font-medium">
          Special Instructions
        </Label>
        <Textarea
          id="application_instructions"
          name="application_instructions"
          placeholder="Any additional instructions for applicants..."
          value={formik.values.application_instructions}
          onChange={formik.handleChange}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Required Documents</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_resume"
              checked={formik.values.requires_resume}
              onCheckedChange={(checked) => formik.setFieldValue('requires_resume', checked)}
            />
            <Label htmlFor="requires_resume" className="flex items-center gap-2 cursor-pointer">
              <FileText className="w-4 h-4" />
              Resume
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_cover_letter"
              checked={formik.values.requires_cover_letter}
              onCheckedChange={(checked) => formik.setFieldValue('requires_cover_letter', checked)}
            />
            <Label htmlFor="requires_cover_letter" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="w-4 h-4" />
              Cover Letter
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_portfolio"
              checked={formik.values.requires_portfolio}
              onCheckedChange={(checked) => formik.setFieldValue('requires_portfolio', checked)}
            />
            <Label htmlFor="requires_portfolio" className="flex items-center gap-2 cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              Portfolio
            </Label>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ReviewStep = ({ formik }) => {
  // Import required validation functions and steps from the main component context
  const getFieldValidation = (fieldName, value, formik) => {
    const errors = formik.errors || {};
    const touched = formik.touched || {};
    
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    const hasError = touched[fieldName] && errors[fieldName];
    
    return {
      isEmpty,
      hasError,
      errorMessage: hasError ? errors[fieldName] : null,
      isValid: !isEmpty && !hasError
    };
  };

  const getStepValidation = (step) => {
    let validFields = 0;
    let invalidFields = 0;
    let errorFields = 0;
    let missingFields = [];
    
    // Get conditional fields based on current values
    const getConditionalFields = (baseFields) => {
      let fields = [...baseFields];
      
      // Location fields for non-remote jobs
      if (step.id === 'basic' && formik.values.location_type !== 'remote') {
        fields = fields.filter(f => !['city', 'state'].includes(f));
        fields.push('city', 'state');
      }
      
      // Salary fields when showing salary
      if (step.id === 'compensation' && formik.values.show_salary) {
        fields = fields.filter(f => !['salary_min', 'salary_max', 'salary_currency', 'salary_period'].includes(f));
        fields.push('salary_min', 'salary_max', 'salary_currency', 'salary_period');
      }
      
      // Application method specific fields
      if (step.id === 'application') {
        if (formik.values.application_type === 'email') {
          fields = fields.filter(f => !['application_email', 'application_url'].includes(f));
          fields.push('application_email');
        } else if (formik.values.application_type === 'url') {
          fields = fields.filter(f => !['application_email', 'application_url'].includes(f));
          fields.push('application_url');
        }
      }
      
      return fields;
    };
    
    const conditionalFields = getConditionalFields(step.fields);
    
    conditionalFields.forEach(fieldName => {
      const fieldValidation = getFieldValidation(fieldName, formik.values[fieldName], formik);
      
      if (fieldValidation.isValid) {
        validFields++;
      } else if (fieldValidation.hasError) {
        errorFields++;
        invalidFields++;
      } else if (fieldValidation.isEmpty) {
        missingFields.push(fieldName);
        invalidFields++;
      }
    });
    
    const totalFields = conditionalFields.length;
    const completionRate = totalFields > 0 ? (validFields / totalFields) * 100 : 100;
    
    let status = 'incomplete';
    if (totalFields === 0 || completionRate === 100) {
      status = 'complete';
    } else if (errorFields > 0) {
      status = 'error';
    } else if (validFields > 0) {
      status = 'partial';
    }
    
    return {
      status,
      completionRate,
      validFields,
      invalidFields,
      errorFields,
      missingFields,
      totalFields
    };
  };

  // Get validation status for all steps
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      fields: ['title', 'department', 'location_type', 'employment_type']
    },
    {
      id: 'details',
      title: 'Job Details',
      fields: ['description', 'requirements', 'experience_level']
    },
    {
      id: 'compensation',
      title: 'Compensation',
      fields: ['show_salary']
    },
    {
      id: 'requirements',
      title: 'Requirements',
      fields: ['required_skills', 'education_level']
    },
    {
      id: 'application',
      title: 'Application Method',
      fields: ['application_type']
    }
  ];

  const allStepValidations = steps.map(step => ({
    ...step,
    validation: getStepValidation(step)
  }));

  const incompleteSteps = allStepValidations.filter(step => step.validation.status !== 'complete');
  const errorSteps = allStepValidations.filter(step => step.validation.status === 'error');
  const allMissingFields = incompleteSteps.flatMap(step => 
    step.validation.missingFields.map(field => ({
      field,
      stepTitle: step.title,
      stepId: step.id
    }))
  );

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-full">
            <Eye className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Review & Publish</CardTitle>
            <CardDescription>
              Final review of your job posting before publishing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Validation Summary */}
        {(incompleteSteps.length > 0 || errorSteps.length > 0) && (
          <Alert className={`${errorSteps.length > 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <AlertCircle className={`h-4 w-4 ${errorSteps.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertTitle className={`${errorSteps.length > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              {errorSteps.length > 0 ? 'Validation Errors Found' : 'Incomplete Information'}
            </AlertTitle>
            <AlertDescription className={`${errorSteps.length > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
              <div className="space-y-3 mt-2">
                {errorSteps.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {errorSteps.map(step => (
                        <li key={step.id}>
                          <span className="font-medium">{step.title}</span> has {step.validation.errorFields} validation error{step.validation.errorFields > 1 ? 's' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {allMissingFields.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Missing required information:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {allMissingFields.slice(0, 8).map((missingField, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded border">
                          <span>
                            {typeof missingField === 'string' 
                              ? missingField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : missingField.label || 
                                (typeof missingField.field === 'string' 
                                  ? missingField.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                  : 'Unknown field')
                            }
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {missingField.stepTitle || missingField.step || 'Unknown Step'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {allMissingFields.length > 8 && (
                      <p className="text-sm mt-2">...and {allMissingFields.length - 8} more fields</p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 rounded">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Use the step navigation on the left to complete missing information
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message when everything is complete */}
        {incompleteSteps.length === 0 && errorSteps.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Ready to Publish!</AlertTitle>
            <AlertDescription className="text-green-700">
              All required information has been provided. Your job posting is complete and ready to be published.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Completion Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/50 border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Form Progress</h4>
              <div className="space-y-3">
                {allStepValidations.map(step => (
                  <div key={step.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{step.title}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={step.validation.completionRate} className="w-16 h-2" />
                      <span className="text-xs font-medium text-gray-600 w-10">
                        {Math.round(step.validation.completionRate)}%
                      </span>
                      {step.validation.status === 'complete' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {step.validation.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {step.validation.status === 'partial' && (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Steps:</span>
                  <span className="font-medium">{allStepValidations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Complete Steps:</span>
                  <span className="font-medium text-green-600">
                    {allStepValidations.length - incompleteSteps.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Incomplete Steps:</span>
                  <span className="font-medium text-yellow-600">{incompleteSteps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steps with Errors:</span>
                  <span className="font-medium text-red-600">{errorSteps.length}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Overall Progress:</span>
                    <span className="font-bold">
                      {Math.round(
                        (allStepValidations.reduce((sum, step) => sum + step.validation.completionRate, 0) / 
                         allStepValidations.length) || 0
                      )}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Job Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{formik.values.title || 'Job Title'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>
                {formik.values.location_type === 'remote' ? 'Remote' : 
                 `${formik.values.city || 'City'}, ${formik.values.state || 'State'}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{EMPLOYMENT_TYPES.find(t => t.value === formik.values.employment_type)?.label || 'Employment Type'}</span>
            </div>
            {formik.values.show_salary && formik.values.salary_min && formik.values.salary_max && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: formik.values.salary_currency 
                  }).format(formik.values.salary_min)} - {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: formik.values.salary_currency 
                  }).format(formik.values.salary_max)} {formik.values.salary_period}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Application Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-gray-500" />
              <span>{APPLICATION_TYPES.find(t => t.value === formik.values.application_type)?.label}</span>
            </div>
            {formik.values.application_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Deadline: {new Date(formik.values.application_deadline).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {formik.values.requires_resume && <Badge variant="outline">Resume Required</Badge>}
              {formik.values.requires_cover_letter && <Badge variant="outline">Cover Letter Required</Badge>}
              {formik.values.requires_portfolio && <Badge variant="outline">Portfolio Required</Badge>}
            </div>
          </div>
        </div>
      </div>

      {formik.values.required_skills && (
        <div className="space-y-2">
          <h3 className="font-semibold">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {formik.values.required_skills.split(',').map((skill, index) => (
              <Badge key={index} variant="secondary">{skill.trim()}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-blue-900">Ready to publish?</p>
            <p className="text-sm text-blue-700">
              Your job will be visible to candidates immediately after publishing. 
              You can edit or pause it anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  );
};

const JobPreview = ({ formData }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <CardTitle className="text-2xl">Job Preview</CardTitle>
      <CardDescription>
        This is how your job posting will appear to candidates
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{formData.title}</h2>
            <p className="text-gray-600">Company Name</p>
          </div>
          <Badge variant="secondary">
            {EMPLOYMENT_TYPES.find(t => t.value === formData.employment_type)?.label}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {formData.location_type === 'remote' ? 'Remote' : 
             `${formData.city}, ${formData.state}`}
          </div>
          {formData.show_salary && formData.salary_min && formData.salary_max && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: formData.salary_currency 
              }).format(formData.salary_min)} - {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: formData.salary_currency 
              }).format(formData.salary_max)} {formData.salary_period}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {formData.summary && (
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-gray-700">{formData.summary}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{formData.description}</p>
          </div>

          {formData.required_skills && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.split(',').map((skill, index) => (
                  <Badge key={index} variant="outline">{skill.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PostJobPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCompanyProfileWarning, setShowCompanyProfileWarning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState([]);
  
  // Enhanced form steps
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Job title, description, and category',
      icon: Briefcase,
      fields: ['title', 'description', 'summary', 'category_id']
    },
    {
      id: 'details',
      title: 'Job Details',
      description: 'Employment type, experience, and location',
      icon: Settings,
      fields: ['employment_type', 'experience_level', 'location_type', 'city', 'state', 'country', 'remote_policy']
    },
    {
      id: 'compensation',
      title: 'Compensation',
      description: 'Salary range and benefits',
      icon: DollarSign,
      fields: ['salary_min', 'salary_max', 'salary_currency', 'salary_period', 'show_salary']
    },
    {
      id: 'requirements',
      title: 'Requirements',
      description: 'Skills, education, and experience',
      icon: GraduationCap,
      fields: ['required_skills', 'preferred_skills', 'education_requirement', 'years_experience_min']
    },
    {
      id: 'application',
      title: 'Application Process',
      description: 'How candidates should apply',
      icon: Send,
      fields: ['application_type', 'application_deadline', 'application_email', 'application_url']
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Final review and publication',
      icon: Eye,
      fields: []
    }
  ];

  // Enhanced authentication and role validation
  useEffect(() => {
    const validateUserAccess = async () => {
      // Check authentication
      if (!user) {
        toast.error('Authentication required. Please log in to post a job.');
        navigate('/login', { 
          state: { 
            from: '/post-job',
            message: 'Please log in to access job posting'
          }
        });
        return;
      }
      
      // Validate user role with detailed feedback
      if (user.role !== 'employer' && user.role !== 'admin') {
        toast.error(`Access denied. Only employers can post jobs. Your role: ${user.role || 'unknown'}`);
        
        // Redirect based on user role
        if (user.role === 'job_seeker') {
          navigate('/jobs', { 
            state: { 
              message: 'Looking for jobs? Browse available opportunities here.'
            }
          });
        } else {
          navigate('/', { 
            state: { 
              message: 'You need an employer account to post jobs.'
            }
          });
        }
        return;
      }
      
      // Enhanced company profile validation
      if (user.role === 'employer') {
        if (!user.employer_profile?.company_id) {
          setShowCompanyProfileWarning(true);
          toast.warning('Complete your company profile for better job visibility and candidate trust');
        }
        
        // Validate employer profile completeness
        const requiredFields = ['company_name', 'industry', 'company_size'];
        const missingFields = requiredFields.filter(field => 
          !user.employer_profile?.[field]
        );
        
        if (missingFields.length > 0) {
          toast.info(`Consider adding: ${missingFields.join(', ')} to your company profile`);
        }
      }
      
      // Validate token expiry
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please log in again.');
        navigate('/login', { 
          state: { 
            from: '/post-job',
            message: 'Your session has expired'
          }
        });
        return;
      }
    };

    validateUserAccess();
  }, [user, navigate]);

  // Fetch job categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching job categories...');
        const response = await jobsService.getJobCategories();
        console.log('📦 Categories response:', response);
        
        if (response && response.categories) {
          setCategories(response.categories);
          console.log('✅ Categories loaded:', response.categories.length);
        } else {
          console.warn('⚠️ No categories found in response:', response);
          setCategories([]);
          toast.error('No job categories found');
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        toast.error('Failed to load job categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Enhanced form validation schema with comprehensive checks
  const validationSchema = Yup.object({
    // Basic Information Validation
    title: Yup.string()
      .required('Job title is required')
      .min(5, 'Job title must be at least 5 characters')
      .max(100, 'Job title must be less than 100 characters')
      .matches(/^[a-zA-Z0-9\s\-.,()]+$/, 'Job title contains invalid characters'),
    
    description: Yup.string()
      .required('Job description is required')
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description must be less than 5000 characters'),
    
    summary: Yup.string()
      .max(500, 'Summary must be less than 500 characters'),
    
    employment_type: Yup.string()
      .required('Employment type is required')
      .oneOf(EMPLOYMENT_TYPES.map(t => t.value), 'Invalid employment type'),
    
    experience_level: Yup.string()
      .required('Experience level is required')
      .oneOf(EXPERIENCE_LEVELS.map(l => l.value), 'Invalid experience level'),
    
    category_id: Yup.number()
      .required('Job category is required')
      .positive('Please select a valid category'),
    
    // Location Validation with conditional requirements
    location_type: Yup.string()
      .required('Location type is required')
      .oneOf(LOCATION_TYPES.map(t => t.value), 'Invalid location type'),
    
    city: Yup.string().when('location_type', {
      is: (type) => type !== 'remote',
      then: (schema) => schema
        .required('City is required for on-site/hybrid jobs')
        .min(2, 'City name must be at least 2 characters')
        .max(50, 'City name must be less than 50 characters')
        .matches(/^[a-zA-Z\s\-.']+$/, 'City name contains invalid characters'),
      otherwise: (schema) => schema.nullable()
    }),
    
    state: Yup.string().when('location_type', {
      is: (type) => type !== 'remote',
      then: (schema) => schema
        .required('State/Province is required for on-site/hybrid jobs')
        .min(2, 'State name must be at least 2 characters')
        .max(50, 'State name must be less than 50 characters')
        .matches(/^[a-zA-Z\s\-.']+$/, 'State name contains invalid characters'),
      otherwise: (schema) => schema.nullable()
    }),
    
    country: Yup.string().when('location_type', {
      is: (type) => type !== 'remote',
      then: (schema) => schema
        .required('Country is required for on-site/hybrid jobs')
        .min(2, 'Country name must be at least 2 characters')
        .max(50, 'Country name must be less than 50 characters')
        .matches(/^[a-zA-Z\s\-.']+$/, 'Country name contains invalid characters'),
      otherwise: (schema) => schema.nullable()
    }),
    
    remote_policy: Yup.string().when('location_type', {
      is: (type) => type === 'remote' || type === 'hybrid',
      then: (schema) => schema
        .required('Remote policy is required for remote/hybrid jobs')
        .min(10, 'Remote policy must be at least 10 characters')
        .max(1000, 'Remote policy must be less than 1000 characters'),
      otherwise: (schema) => schema.nullable()
    }),

    // Enhanced Salary Validation
    salary_min: Yup.number()
      .nullable()
      .min(0, 'Minimum salary must be positive')
      .max(10000000, 'Minimum salary seems unusually high')
      .when('show_salary', {
        is: true,
        then: (schema) => schema.required('Minimum salary is required when showing salary'),
        otherwise: (schema) => schema.nullable()
      }),
    
    salary_max: Yup.number()
      .nullable()
      .min(0, 'Maximum salary must be positive')
      .max(10000000, 'Maximum salary seems unusually high')
      .when(['salary_min', 'show_salary'], {
        is: (min, showSalary) => min && min > 0 && showSalary,
        then: (schema) => schema
          .required('Maximum salary is required when showing salary range')
          .min(Yup.ref('salary_min'), 'Maximum salary must be greater than minimum salary'),
        otherwise: (schema) => schema.nullable()
      }),
    
    salary_currency: Yup.string()
      .oneOf(CURRENCIES.map(c => c.value), 'Invalid currency'),
    
    salary_period: Yup.string()
      .oneOf(SALARY_PERIODS.map(p => p.value), 'Invalid salary period'),

    // Skills and Requirements Validation
    required_skills: Yup.string()
      .min(5, 'Required skills must be at least 5 characters')
      .max(1000, 'Required skills must be less than 1000 characters')
      .test('skills-format', 'Skills should be separated by commas', function(value) {
        if (!value) return true;
        const skills = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return skills.length >= 1 && skills.every(skill => skill.length >= 2);
      }),
    
    preferred_skills: Yup.string()
      .max(1000, 'Preferred skills must be less than 1000 characters'),
    
    education_requirement: Yup.string()
      .max(200, 'Education requirement must be less than 200 characters'),
    
    years_experience_min: Yup.number()
      .min(0, 'Experience cannot be negative')
      .max(50, 'Experience years seems unusually high'),
    
    years_experience_max: Yup.number()
      .min(0, 'Experience cannot be negative')
      .max(50, 'Experience years seems unusually high')
      .when('years_experience_min', {
        is: (min) => min !== null && min !== undefined && min !== '',
        then: (schema) => schema.min(Yup.ref('years_experience_min'), 'Maximum experience must be greater than minimum'),
        otherwise: (schema) => schema
      }),

    // Application Method Validation
    application_type: Yup.string()
      .required('Application type is required')
      .oneOf(APPLICATION_TYPES.map(t => t.value), 'Invalid application type'),
    
    application_url: Yup.string().when('application_type', {
      is: 'external',
      then: (schema) => schema
        .required('Application URL is required for external applications')
        .url('Please enter a valid URL (e.g., https://company.com/apply)')
        .matches(/^https?:\/\/.+/, 'URL must start with http:// or https://'),
      otherwise: (schema) => schema.nullable()
    }),
    
    application_email: Yup.string().when('application_type', {
      is: 'email',
      then: (schema) => schema
        .required('Application email is required for email applications')
        .email('Please enter a valid email address')
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
      otherwise: (schema) => schema.nullable()
    }),
    
    application_deadline: Yup.mixed()
      .nullable()
      .test(
        'is-future-date',
        'Application deadline must be at least 24 hours in the future',
        function(value) {
          if (!value) return true;
          const deadline = dayjs(value);
          const minDeadline = dayjs().add(24, 'hours');
          return deadline.isValid() && deadline.isAfter(minDeadline);
        }
      )
      .test(
        'not-too-far',
        'Application deadline should be within 1 year',
        function(value) {
          if (!value) return true;
          const deadline = dayjs(value);
          const maxDeadline = dayjs().add(1, 'year');
          return deadline.isValid() && deadline.isBefore(maxDeadline);
        }
      ),
    
    application_instructions: Yup.string()
      .max(1000, 'Application instructions must be less than 1000 characters')
  });

  // Formik configuration
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      summary: '',
      employment_type: '',
      experience_level: '',
      category_id: '',
      location_type: '',
      city: '',
      state: '',
      country: '',
      is_remote: false,
      remote_policy: '',
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      salary_period: 'yearly',
      salary_negotiable: false,
      show_salary: true,
      required_skills: '',
      preferred_skills: '',
      education_requirement: '',
      years_experience_min: 0,
      years_experience_max: '',
      application_type: 'internal',
      application_deadline: null,
      application_email: '',
      application_url: '',
      application_instructions: '',
      requires_resume: true,
      requires_cover_letter: false,
      requires_portfolio: false,
      status: 'draft'
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        // Enhanced pre-submission validation
        const validationErrors = [];
        
        // Validate required fields with detailed messages
        if (!values.title?.trim()) {
          validationErrors.push('Job title is required and cannot be empty');
        }
        
        if (!values.description?.trim()) {
          validationErrors.push('Job description is required and cannot be empty');
        }
        
        if (!values.category_id) {
          validationErrors.push('Please select a valid job category');
        }
        
        if (!values.employment_type) {
          validationErrors.push('Employment type must be specified');
        }
        
        if (!values.experience_level) {
          validationErrors.push('Experience level must be specified');
        }
        
        if (!values.location_type) {
          validationErrors.push('Location type must be specified');
        }
        
        if (!values.application_type) {
          validationErrors.push('Application method must be specified');
        }
        
        // Conditional validation for location
        if (values.location_type !== 'remote') {
          if (!values.city?.trim()) {
            validationErrors.push('City is required for on-site and hybrid positions');
          }
          if (!values.state?.trim()) {
            validationErrors.push('State/Province is required for on-site and hybrid positions');
          }
          if (!values.country?.trim()) {
            validationErrors.push('Country is required for on-site and hybrid positions');
          }
        }
        
        // Conditional validation for remote policy
        if ((values.location_type === 'remote' || values.location_type === 'hybrid') && !values.remote_policy?.trim()) {
          validationErrors.push('Remote work policy is required for remote and hybrid positions');
        }
        
        // Conditional validation for salary
        if (values.show_salary) {
          if (!values.salary_min || values.salary_min <= 0) {
            validationErrors.push('Minimum salary must be provided and positive when showing salary');
          }
          if (!values.salary_max || values.salary_max <= 0) {
            validationErrors.push('Maximum salary must be provided and positive when showing salary');
          }
          if (values.salary_min && values.salary_max && values.salary_min >= values.salary_max) {
            validationErrors.push('Maximum salary must be greater than minimum salary');
          }
        }
        
        // Conditional validation for application methods
        if (values.application_type === 'external') {
          if (!values.application_url?.trim()) {
            validationErrors.push('Application URL is required for external applications');
          } else if (!/^https?:\/\/.+/.test(values.application_url)) {
            validationErrors.push('Application URL must be a valid web address starting with http:// or https://');
          }
        }
        
        if (values.application_type === 'email') {
          if (!values.application_email?.trim()) {
            validationErrors.push('Application email is required for email applications');
          } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(values.application_email)) {
            validationErrors.push('Please provide a valid email address for applications');
          }
        }
        
        // Validation for application deadline
        if (values.application_deadline) {
          const deadline = dayjs(values.application_deadline);
          if (!deadline.isValid()) {
            validationErrors.push('Application deadline must be a valid date');
          } else if (deadline.isBefore(dayjs().add(24, 'hours'))) {
            validationErrors.push('Application deadline must be at least 24 hours in the future');
          } else if (deadline.isAfter(dayjs().add(1, 'year'))) {
            validationErrors.push('Application deadline should be within 1 year from now');
          }
        }
        
        // Validation for skills format
        if (values.required_skills?.trim()) {
          const skills = values.required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
          if (skills.some(skill => skill.length < 2)) {
            validationErrors.push('Each required skill must be at least 2 characters long');
          }
          if (skills.length > 20) {
            validationErrors.push('Please limit required skills to 20 or fewer');
          }
        }
        
        // Experience validation
        if (values.years_experience_min && values.years_experience_max) {
          if (parseInt(values.years_experience_min) > parseInt(values.years_experience_max)) {
            validationErrors.push('Maximum experience years cannot be less than minimum experience years');
          }
        }
        
        // Show validation errors if any
        if (validationErrors.length > 0) {
          const errorMessage = `Please fix the following issues:\n• ${validationErrors.join('\n• ')}`;
          toast.error(errorMessage, { duration: 8000 });
          return;
        }
        
        // Additional business logic validation
        if (values.title && values.title.length < 5) {
          toast.error('Job title should be descriptive (at least 5 characters)');
          return;
        }
        
        if (values.description && values.description.length < 50) {
          toast.error('Job description should be comprehensive (at least 50 characters)');
          return;
        }
        
        // Category validation
        if (!categories.some(cat => cat.id === parseInt(values.category_id))) {
          toast.error('Please select a valid job category from the list');
          return;
        }
        
        // Handle job submission for users without complete company profile
        let jobData = {
          // Basic required fields - ensure no empty strings
          title: values.title.trim(),
          description: values.description.trim(),
          employment_type: values.employment_type,
          experience_level: values.experience_level,
          location_type: values.location_type,
          application_type: values.application_type,
          status: values.status,
          
          // Properly convert category_id to integer
          category_id: parseInt(values.category_id),
          
          // Convert date to ISO string properly - only if valid
          application_deadline: values.application_deadline && dayjs(values.application_deadline).isValid()
            ? dayjs(values.application_deadline).toISOString() 
            : null,
            
          // Set is_remote based on location_type
          is_remote: values.location_type === 'remote',
          
          // Handle salary fields - ensure they're numbers or null
          salary_min: values.salary_min && parseFloat(values.salary_min) > 0 ? parseFloat(values.salary_min) : null,
          salary_max: values.salary_max && parseFloat(values.salary_max) > 0 ? parseFloat(values.salary_max) : null,
          salary_currency: values.salary_currency || 'USD',
          salary_period: values.salary_period || 'yearly',
          salary_negotiable: Boolean(values.salary_negotiable),
          show_salary: Boolean(values.show_salary),
          
          // Handle experience fields
          years_experience_min: values.years_experience_min ? parseInt(values.years_experience_min) : 0,
          years_experience_max: values.years_experience_max ? parseInt(values.years_experience_max) : null,
          
          // Clean up text fields - convert empty strings to null
          summary: values.summary?.trim() || null,
          education_requirement: values.education_requirement?.trim() || null,
          required_skills: values.required_skills?.trim() || null,
          preferred_skills: values.preferred_skills?.trim() || null,
          application_instructions: values.application_instructions?.trim() || null,
          
          // Location fields - null for remote jobs
          city: values.location_type === 'remote' ? null : (values.city?.trim() || null),
          state: values.location_type === 'remote' ? null : (values.state?.trim() || null),
          country: values.location_type === 'remote' ? null : (values.country?.trim() || null),
          remote_policy: (values.location_type === 'remote' || values.location_type === 'hybrid') 
            ? (values.remote_policy?.trim() || null) : null,
          
          // Application method fields
          application_email: values.application_type === 'email' ? (values.application_email?.trim() || null) : null,
          application_url: values.application_type === 'external' ? (values.application_url?.trim() || null) : null,
          
          // Requirements
          requires_resume: Boolean(values.requires_resume),
          requires_cover_letter: Boolean(values.requires_cover_letter),
          requires_portfolio: Boolean(values.requires_portfolio),
        };

        // Final cleanup - remove any remaining undefined values
        Object.keys(jobData).forEach(key => {
          if (jobData[key] === undefined || jobData[key] === '') {
            jobData[key] = null;
          }
        });

        // Add company_id if available, otherwise let backend handle it
        if (user?.employer_profile?.company_id) {
          jobData.company_id = user.employer_profile.company_id;
        } else if (user.role === 'employer') {
          // For employers without company profile, we'll let the backend create a basic company
          console.log('⚠️ No company profile found, backend will create basic company');
          toast.warning('A basic company profile will be created for you. You can enhance it later.');
        }
        
        // Final data integrity checks
        if (jobData.salary_min && jobData.salary_max && jobData.salary_min >= jobData.salary_max) {
          toast.error('Salary range is invalid: minimum cannot equal or exceed maximum');
          return;
        }
        
        if (jobData.years_experience_max && jobData.years_experience_min > jobData.years_experience_max) {
          toast.error('Experience range is invalid: minimum cannot exceed maximum');
          return;
        }
        
        console.log('🔍 Final job data being sent:', JSON.stringify(jobData, null, 2));
        console.log('🔑 Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
        console.log('👤 Current user:', user);
        
        // Call API to create job
        const response = await jobsService.createJob(jobData);
        
        const successMessage = values.status === 'draft' 
          ? `Job draft saved successfully! You can publish it later from your dashboard.`
          : `Job published successfully! It's now visible to candidates.`;
        
        toast.success(successMessage, { duration: 5000 });
        
        // Show additional success message for users without company profile
        if (!user?.employer_profile?.company_id) {
          setTimeout(() => {
            toast.info('Pro tip: Complete your company profile to increase applications by up to 40%!', {
              duration: 7000,
              action: {
                label: 'Complete Profile',
                onClick: () => navigate('/company-profile?from=postjob')
              }
            });
          }, 1500);
        }
        
        // Enhanced redirection logic
        const shouldGoToDashboard = user.role === 'admin' || 
                                   values.status === 'draft' || 
                                   user.employer_profile?.company_id;
        
        const redirectTo = user.role === 'admin' 
          ? '/admin/jobs' 
          : shouldGoToDashboard 
            ? '/dashboard' 
            : '/company-profile?from=postjob&success=true';
        
        // Show redirect message
        if (!shouldGoToDashboard) {
          toast.success('Redirecting to complete your company profile for better job performance...');
        }
        
        navigate(redirectTo, {
          state: {
            message: values.status === 'draft' 
              ? 'Job saved as draft successfully'
              : 'Job published successfully',
            jobData: { title: values.title, id: response?.job?.id }
          }
        });
        
      } catch (error) {
        console.error('🚨 Job creation failed:', error);
        
        // Log detailed error information
        if (error.response) {
          console.error('🚨 Backend Error Response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('🚨 Network Error - No Response:', error.request);
        } else {
          console.error('🚨 Request Setup Error:', error.message);
        }
        
        // Enhanced error handling with specific messages and actions
        let errorMessage = 'Failed to create job. Please try again.';
        let redirectPath = null;
        let redirectDelay = 0;
        
        if (error.response?.status === 400) {
          // Validation error from backend
          const backendErrors = error.response.data?.errors;
          if (Array.isArray(backendErrors) && backendErrors.length > 0) {
            errorMessage = `Validation errors:\n• ${backendErrors.join('\n• ')}`;
          } else {
            errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid job data. Please check your inputs.';
          }
        } else if (error.response?.status === 403) {
          // Permission error
          errorMessage = 'Permission denied. Please check your account status or contact support.';
          if (error.response.data?.message?.includes('company')) {
            errorMessage += ' You may need to complete your company profile first.';
            redirectPath = '/company-profile?from=postjob&error=permission';
            redirectDelay = 3000;
          }
        } else if (error.response?.status === 401) {
          // Authentication error
          errorMessage = 'Your session has expired or is invalid. Please log in again.';
          redirectPath = '/login?from=postjob&error=session';
          redirectDelay = 2000;
        } else if (error.response?.status === 422) {
          // Unprocessable entity - data validation
          errorMessage = 'Some data could not be processed. Please review your inputs.';
          if (error.response.data?.errors) {
            const errors = Object.entries(error.response.data.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('\n• ');
            errorMessage += `\n\nDetails:\n• ${errors}`;
          }
        } else if (error.response?.status === 429) {
          // Rate limiting
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.response?.status === 500) {
          // Server error - provide specific details
          errorMessage = 'Server error occurred. Our team has been notified. Please try again in a few minutes.';
          if (error.response.data?.details) {
            console.error('🚨 Server Error Details:', error.response.data.details);
          }
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
          
          // Special handling for company-related errors
          if (errorMessage.includes('Company') && errorMessage.includes('required')) {
            errorMessage += '\n\nYou can create a basic company profile or complete your full profile.';
            redirectPath = '/company-profile?from=postjob&error=company';
            redirectDelay = 3000;
          }
        } else if (error.message?.includes('Network Error')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Unable to connect to the server. Please check your connection or try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage, { duration: 8000 });
        
        // Handle redirections for specific errors
        if (redirectPath && redirectDelay > 0) {
          setTimeout(() => {
            navigate(redirectPath, {
              state: {
                errorMessage,
                from: '/post-job',
                formData: values
              }
            });
          }, redirectDelay);
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Enhanced validation and progress tracking with better error messages
  const getFieldValidation = (fieldName) => {
    const value = formik.values[fieldName];
    const error = formik.errors[fieldName];
    const touched = formik.touched[fieldName];
    
    // Check for specific validation states
    if (error && touched) {
      return { status: 'error', message: error };
    }
    
    // Check for completeness based on field type
    const isEmpty = value === '' || value === null || value === undefined;
    if (!isEmpty) {
      // Additional validation for specific field types
      if (fieldName === 'application_url' && value) {
        const urlValid = /^https?:\/\/.+/.test(value);
        return { status: urlValid ? 'complete' : 'error', message: urlValid ? null : 'Invalid URL format' };
      }
      
      if (fieldName === 'application_email' && value) {
        const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
        return { status: emailValid ? 'complete' : 'error', message: emailValid ? null : 'Invalid email format' };
      }
      
      if (fieldName === 'salary_min' || fieldName === 'salary_max') {
        const numValue = parseFloat(value);
        if (numValue <= 0) {
          return { status: 'error', message: 'Salary must be positive' };
        }
        if (fieldName === 'salary_max' && formik.values.salary_min && numValue <= parseFloat(formik.values.salary_min)) {
          return { status: 'error', message: 'Max salary must be greater than min' };
        }
      }
      
      return { status: 'complete', message: null };
    }
    
    return { status: 'incomplete', message: null };
  };

  const getStepValidation = (step) => {
    const requiredFields = step.fields.filter(field => {
      // Define which fields are conditionally required based on form state
      const conditionallyRequired = {
        'city': formik.values.location_type !== 'remote',
        'state': formik.values.location_type !== 'remote', 
        'country': formik.values.location_type !== 'remote',
        'remote_policy': formik.values.location_type === 'remote' || formik.values.location_type === 'hybrid',
        'application_url': formik.values.application_type === 'external',
        'application_email': formik.values.application_type === 'email',
        'salary_min': formik.values.show_salary,
        'salary_max': formik.values.show_salary,
        'salary_currency': formik.values.show_salary,
        'salary_period': formik.values.show_salary
      };

      const alwaysRequired = [
        'title', 'description', 'category_id', 'employment_type', 
        'experience_level', 'location_type', 'application_type'
      ];
      
      return alwaysRequired.includes(field) || conditionallyRequired[field];
    });

    let completedFields = 0;
    let errorFields = 0;
    let missingFields = [];
    let fieldErrors = [];

    requiredFields.forEach(field => {
      const validation = getFieldValidation(field);
      
      if (validation.status === 'complete') {
        completedFields++;
      } else if (validation.status === 'error') {
        errorFields++;
        fieldErrors.push({
          field,
          message: validation.message || formik.errors[field] || 'Validation error'
        });
      } else if (validation.status === 'incomplete') {
        missingFields.push(field);
      }
    });

    const totalRequired = requiredFields.length;
    const completionRate = totalRequired > 0 ? (completedFields / totalRequired) * 100 : 100;
    
    let status;
    if (errorFields > 0) {
      status = 'error';
    } else if (completionRate === 100) {
      status = 'complete';
    } else if (completionRate > 0) {
      status = 'partial';
    } else {
      status = 'incomplete';
    }
    
    return {
      completedFields,
      totalRequired,
      errorFields,
      completionRate,
      status,
      requiredFields,
      missingFields: missingFields.map(field => ({
        field,
        label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        step: step.title
      })),
      fieldErrors
    };
  };

  // Calculate form completion progress - MOVED AFTER formik initialization
  useEffect(() => {
    const allStepValidations = steps.map(step => getStepValidation(step));
    const totalCompleted = allStepValidations.reduce((acc, validation) => acc + validation.completedFields, 0);
    const totalRequired = allStepValidations.reduce((acc, validation) => acc + validation.totalRequired, 0);
    
    setFormProgress(totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0);
  }, [formik.values, formik.errors, formik.touched]);

  // Render step content
  const renderCurrentStep = () => {
    const step = steps[currentStep];
    
    if (previewMode && currentStep === steps.length - 1) {
      return <JobPreview formData={formik.values} />;
    }

    switch (step.id) {
      case 'basic':
        return <BasicInformationStep formik={formik} categories={categories} />;
      case 'details':
        return <JobDetailsStep formik={formik} />;
      case 'compensation':
        return <CompensationStep formik={formik} />;
      case 'requirements':
        return <RequirementsStep formik={formik} />;
      case 'application':
        return <ApplicationStep formik={formik} />;
      case 'review':
        return <ReviewStep formik={formik} />;
      default:
        return <BasicInformationStep formik={formik} categories={categories} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                  Post a New Job
                </h1>
                <p className="text-lg text-gray-600">
                  Create an amazing job opportunity and find your next team member
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
                
                {/* Connection Status */}
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border">
                  {categories.length > 0 ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-yellow-700">Loading...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Form Progress</span>
                <span className="text-sm text-gray-500">{Math.round(formProgress)}% complete</span>
              </div>
              <Progress value={formProgress} className="h-2" />
            </div>
          </motion.div>

          {/* Company Profile Warning */}
          <AnimatePresence>
            {showCompanyProfileWarning && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mb-6"
              >
                <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-yellow-800">Company Profile Incomplete</CardTitle>
                          <CardDescription className="text-yellow-700">
                            Complete your company profile to increase job visibility and attract better candidates
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCompanyProfileWarning(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={() => navigate('/company-profile?from=postjob')}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCompanyProfileWarning(false)}
                      >
                        Continue Anyway
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-700">Loading job categories...</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Step Navigation Sidebar */}
              <div className="lg:col-span-1">
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-lg">Job Creation Steps</CardTitle>
                    <CardDescription>Complete each step to publish your job</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = currentStep === index;
                      const stepValidation = getStepValidation(step);
                      const { status, completionRate, errorFields, missingFields } = stepValidation;
                      
                      const getStepIcon = () => {
                        if (status === 'complete') return <CheckCircle className="w-4 h-4 text-green-600" />;
                        if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-600" />;
                        if (status === 'partial') return <Clock className="w-4 h-4 text-yellow-600" />;
                        return <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />;
                      };

                      const getStepColor = () => {
                        if (isActive) return 'bg-blue-600 text-white';
                        if (status === 'complete') return 'bg-green-50 text-green-700 hover:bg-green-100';
                        if (status === 'error') return 'bg-red-50 text-red-700 hover:bg-red-100';
                        if (status === 'partial') return 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
                        return '';
                      };

                      const getIconBg = () => {
                        if (status === 'complete') return 'bg-green-100';
                        if (status === 'error') return 'bg-red-100';
                        if (status === 'partial') return 'bg-yellow-100';
                        return isActive ? 'bg-blue-100' : 'bg-gray-100';
                      };
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start p-3 h-auto ${getStepColor()}`}
                                onClick={() => setCurrentStep(index)}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`p-2 rounded-full ${getIconBg()}`}>
                                    {getStepIcon()}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="font-medium">{step.title}</div>
                                    <div className="text-xs opacity-70">{step.description}</div>
                                    {step.fields.length > 0 && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Progress value={completionRate} className="h-1 flex-1" />
                                        <span className="text-xs font-medium">
                                          {Math.round(completionRate)}%
                                        </span>
                                      </div>
                                    )}
                                    {status === 'error' && errorFields > 0 && (
                                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errorFields} error{errorFields > 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-2">
                                <p className="font-medium">{step.title}</p>
                                <div className="text-sm">
                                  Status: <span className={`font-medium ${
                                    status === 'complete' ? 'text-green-600' :
                                    status === 'error' ? 'text-red-600' :
                                    status === 'partial' ? 'text-yellow-600' : 'text-gray-600'
                                  }`}>
                                    {status === 'complete' ? 'Complete' :
                                     status === 'error' ? 'Has Errors' :
                                     status === 'partial' ? 'Partially Complete' : 'Not Started'}
                                  </span>
                                </div>
                                {missingFields.length > 0 && (
                                  <div className="text-sm">
                                    <p className="text-gray-600 mb-1">Missing required fields:</p>
                                    <ul className="text-xs list-disc list-inside text-gray-500 space-y-0.5">
                                      {missingFields.slice(0, 3).map((fieldObj, index) => (
                                        <li key={fieldObj.field || index}>
                                          {typeof fieldObj === 'string' 
                                            ? fieldObj.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                            : fieldObj.label || fieldObj.field?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown field'
                                          }
                                        </li>
                                      ))}
                                      {missingFields.length > 3 && (
                                        <li>...and {missingFields.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Main Form Content */}
              <div className="lg:col-span-3">
                <form onSubmit={formik.handleSubmit}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderCurrentStep()}
                    </motion.div>
                  </AnimatePresence>

        {/* Enhanced Navigation Buttons with Validation Feedback */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm border border-white/20">
          <CardContent className="p-6">
            {/* Validation Summary */}
            {currentStep === steps.length - 1 && (
              <div className="mb-6">
                <ValidationSummary 
                  steps={steps.map(step => ({
                    ...step,
                    validation: getStepValidation(step)
                  }))}
                  formik={formik}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      // Validate current step before proceeding
                      const currentStepValidation = getStepValidation(steps[currentStep]);
                      if (currentStepValidation.errorFields > 0) {
                        toast.warning(
                          `Please fix ${currentStepValidation.errorFields} error${currentStepValidation.errorFields > 1 ? 's' : ''} in the current step before proceeding`,
                          { duration: 4000 }
                        );
                        return;
                      }
                      setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  onClick={() => formik.setFieldValue('status', 'draft')}
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        type="submit"
                        onClick={() => formik.setFieldValue('status', 'published')}
                        disabled={submitting || formProgress < 70}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {formProgress < 70 ? `Complete Form (${Math.round(formProgress)}%)` : 'Publish Job'}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formProgress < 70 
                      ? `Complete at least 70% of the form to publish (currently ${Math.round(formProgress)}%)`
                      : 'Publish your job and make it visible to candidates'
                    }
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

// Step Components with Enhanced Validation
const BasicInformationStep = ({ formik, categories }) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Basic Information</CardTitle>
            <CardDescription>
              Start with the essential details about your job opportunity
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
      <ValidationMessage field="title" formik={formik}>
        <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
          Job Title *
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Be specific and descriptive. Include seniority level and key technologies.</p>
            </TooltipContent>
          </Tooltip>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Senior Frontend Developer - React & TypeScript"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`h-12 transition-all ${
            formik.touched.title && formik.errors.title 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : formik.touched.title && formik.values.title && !formik.errors.title
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : 'focus:border-blue-500 focus:ring-blue-200'
          }`}
          maxLength={100}
        />
        {formik.values.title && (
          <div className="text-xs text-gray-500 text-right">
            {formik.values.title.length}/100 characters
          </div>
        )}
      </ValidationMessage>

      <ValidationMessage field="category_id" formik={formik}>
        <Label htmlFor="category_id" className="text-sm font-medium flex items-center gap-2">
          Job Category *
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose the category that best matches your role for better visibility.</p>
            </TooltipContent>
          </Tooltip>
        </Label>
        <Select 
          value={formik.values.category_id.toString()} 
          onValueChange={(value) => {
            formik.setFieldValue('category_id', parseInt(value));
            formik.setFieldTouched('category_id', true);
          }}
        >
          <SelectTrigger className={`h-12 transition-all ${
            formik.touched.category_id && formik.errors.category_id 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : formik.touched.category_id && formik.values.category_id && !formik.errors.category_id
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : 'focus:border-blue-500 focus:ring-blue-200'
          }`}>
            <SelectValue placeholder="Select a job category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ValidationMessage>

      <ValidationMessage field="summary" formik={formik}>
        <Label htmlFor="summary" className="text-sm font-medium flex items-center gap-2">
          Job Summary
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>A brief, compelling summary that appears in search results.</p>
            </TooltipContent>
          </Tooltip>
        </Label>
        <Textarea
          id="summary"
          name="summary"
          placeholder="A brief, compelling summary of the position that will grab candidates' attention..."
          value={formik.values.summary}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={3}
          className={`min-h-[80px] transition-all ${
            formik.touched.summary && formik.errors.summary 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : formik.touched.summary && formik.values.summary && !formik.errors.summary
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : 'focus:border-blue-500 focus:ring-blue-200'
          }`}
          maxLength={500}
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>This appears in job listings and search results</span>
          {formik.values.summary && (
            <span>{formik.values.summary.length}/500 characters</span>
          )}
        </div>
      </ValidationMessage>

      <ValidationMessage field="description" formik={formik}>
        <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
          Job Description *
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Detailed description of responsibilities, requirements, and company culture.</p>
            </TooltipContent>
          </Tooltip>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide a comprehensive description including:
• Key responsibilities and daily tasks
• Technologies and tools you'll work with
• Team structure and collaboration style
• Growth opportunities and career development
• Company culture and values
• What makes this role exciting and unique"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={10}
          className={`min-h-[250px] transition-all ${
            formik.touched.description && formik.errors.description 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
              : formik.touched.description && formik.values.description && !formik.errors.description
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : 'focus:border-blue-500 focus:ring-blue-200'
          }`}
          maxLength={5000}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Code className="w-3 h-3" />
            <span>Supports markdown formatting for better presentation</span>
          </div>
          {formik.values.description && (
            <span className="text-xs text-gray-500">
              {formik.values.description.length}/5000 characters
            </span>
          )}
        </div>
        {formik.values.description && formik.values.description.length < 50 && formik.touched.description && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            <span>Consider adding more details for better candidate engagement (minimum 50 characters)</span>
          </div>
        )}
      </ValidationMessage>
    </CardContent>
  </Card>
);

const JobDetailsStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-full">
          <Settings className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Job Details</CardTitle>
          <CardDescription>
            Specify the employment type, experience level, and work location
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="employment_type" className="text-sm font-medium">
            Employment Type *
          </Label>
          <Select 
            value={formik.values.employment_type} 
            onValueChange={(value) => formik.setFieldValue('employment_type', value)}
          >
            <SelectTrigger className={`h-12 ${formik.touched.employment_type && formik.errors.employment_type ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.employment_type && formik.errors.employment_type && (
            <p className="text-sm text-red-600">{formik.errors.employment_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_level" className="text-sm font-medium">
            Experience Level *
          </Label>
          <Select 
            value={formik.values.experience_level} 
            onValueChange={(value) => formik.setFieldValue('experience_level', value)}
          >
            <SelectTrigger className={`h-12 ${formik.touched.experience_level && formik.errors.experience_level ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {level.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.experience_level && formik.errors.experience_level && (
            <p className="text-sm text-red-600">{formik.errors.experience_level}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Work Location *</Label>
        <RadioGroup 
          value={formik.values.location_type} 
          onValueChange={(value) => formik.setFieldValue('location_type', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {LOCATION_TYPES.map(type => {
            const icons = {
              'on-site': Home,
              'remote': Laptop,
              'hybrid': Coffee
            };
            const Icon = icons[type.value];
            
            return (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label 
                  htmlFor={type.value}
                  className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors flex-1"
                >
                  <Icon className="w-5 h-5" />
                  <span>{type.label}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {formik.values.location_type && formik.values.location_type !== 'remote' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50"
        >
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City *
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="e.g., San Francisco"
              value={formik.values.city}
              onChange={formik.handleChange}
              className={formik.touched.city && formik.errors.city ? 'border-red-500' : ''}
            />
            {formik.touched.city && formik.errors.city && (
              <p className="text-sm text-red-600">{formik.errors.city}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State/Province *
            </Label>
            <Input
              id="state"
              name="state"
              placeholder="e.g., California"
              value={formik.values.state}
              onChange={formik.handleChange}
              className={formik.touched.state && formik.errors.state ? 'border-red-500' : ''}
            />
            {formik.touched.state && formik.errors.state && (
              <p className="text-sm text-red-600">{formik.errors.state}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country *
            </Label>
            <Input
              id="country"
              name="country"
              placeholder="e.g., United States"
              value={formik.values.country}
              onChange={formik.handleChange}
              className={formik.touched.country && formik.errors.country ? 'border-red-500' : ''}
            />
            {formik.touched.country && formik.errors.country && (
              <p className="text-sm text-red-600">{formik.errors.country}</p>
            )}
          </div>
        </motion.div>
      )}

      {(formik.values.location_type === 'remote' || formik.values.location_type === 'hybrid') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="space-y-2 p-4 bg-purple-50/50 rounded-lg border border-purple-200/50"
        >
          <Label htmlFor="remote_policy" className="text-sm font-medium">
            Remote Work Policy *
          </Label>
          <Textarea
            id="remote_policy"
            name="remote_policy"
            placeholder="Describe your remote work policy, tools provided, communication expectations, etc."
            value={formik.values.remote_policy}
            onChange={formik.handleChange}
            rows={3}
            className={formik.touched.remote_policy && formik.errors.remote_policy ? 'border-red-500' : ''}
          />
          {formik.touched.remote_policy && formik.errors.remote_policy && (
            <p className="text-sm text-red-600">{formik.errors.remote_policy}</p>
          )}
        </motion.div>
      )}
    </CardContent>
  </Card>
);

const CompensationStep = ({ formik }) => {
  const [showSalaryDetails, setShowSalaryDetails] = useState(formik.values.show_salary);

  useEffect(() => {
    setShowSalaryDetails(formik.values.show_salary);
  }, [formik.values.show_salary]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-full">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Compensation Package</CardTitle>
            <CardDescription>
              Set competitive salary ranges and benefits to attract top talent
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Display Salary Information</Label>
            <p className="text-xs text-gray-500">
              Jobs with visible salaries get 30% more applications
            </p>
          </div>
          <Switch
            checked={formik.values.show_salary}
            onCheckedChange={(checked) => {
              formik.setFieldValue('show_salary', checked);
              setShowSalaryDetails(checked);
            }}
          />
        </div>

        <AnimatePresence>
          {showSalaryDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min" className="text-sm font-medium">
                    Minimum Salary
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      placeholder="50000"
                      value={formik.values.salary_min}
                      onChange={formik.handleChange}
                      className={`pl-10 ${formik.touched.salary_min && formik.errors.salary_min ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formik.touched.salary_min && formik.errors.salary_min && (
                    <p className="text-sm text-red-600">{formik.errors.salary_min}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_max" className="text-sm font-medium">
                    Maximum Salary
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      placeholder="80000"
                      value={formik.values.salary_max}
                      onChange={formik.handleChange}
                      className={`pl-10 ${formik.touched.salary_max && formik.errors.salary_max ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formik.touched.salary_max && formik.errors.salary_max && (
                    <p className="text-sm text-red-600">{formik.errors.salary_max}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select 
                    value={formik.values.salary_currency} 
                    onValueChange={(value) => formik.setFieldValue('salary_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_period" className="text-sm font-medium">
                    Pay Period
                  </Label>
                  <Select 
                    value={formik.values.salary_period} 
                    onValueChange={(value) => formik.setFieldValue('salary_period', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_PERIODS.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="salary_negotiable"
                  checked={formik.values.salary_negotiable}
                  onCheckedChange={(checked) => formik.setFieldValue('salary_negotiable', checked)}
                />
                <Label htmlFor="salary_negotiable" className="text-sm">
                  Salary is negotiable
                </Label>
              </div>

              {formik.values.salary_min && formik.values.salary_max && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Salary Preview</span>
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: formik.values.salary_currency 
                    }).format(formik.values.salary_min)} - {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: formik.values.salary_currency 
                    }).format(formik.values.salary_max)} {formik.values.salary_period}
                    {formik.values.salary_negotiable && (
                      <Badge variant="outline" className="ml-2">Negotiable</Badge>
                    )}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

const RequirementsStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-full">
          <GraduationCap className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Requirements & Qualifications</CardTitle>
          <CardDescription>
            Define the skills, education, and experience needed for this role
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="required_skills" className="text-sm font-medium">
          Required Skills *
        </Label>
        <Textarea
          id="required_skills"
          name="required_skills"
          placeholder="React, TypeScript, Node.js, GraphQL, AWS..."
          value={formik.values.required_skills}
          onChange={formik.handleChange}
          rows={3}
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Code className="w-3 h-3" />
          <span>Separate skills with commas - these will appear as tags</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_skills" className="text-sm font-medium">
          Preferred Skills
        </Label>
        <Textarea
          id="preferred_skills"
          name="preferred_skills"
          placeholder="Docker, Kubernetes, Machine Learning, Python..."
          value={formik.values.preferred_skills}
          onChange={formik.handleChange}
          rows={2}
        />
        <p className="text-xs text-gray-500">
          Nice-to-have skills that would make a candidate stand out
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="education_requirement" className="text-sm font-medium">
          Education Requirements
        </Label>
        <Input
          id="education_requirement"
          name="education_requirement"
          placeholder="Bachelor's degree in Computer Science or equivalent experience"
          value={formik.values.education_requirement}
          onChange={formik.handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="years_experience_min" className="text-sm font-medium">
            Minimum Years of Experience
          </Label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="years_experience_min"
              name="years_experience_min"
              type="number"
              min="0"
              placeholder="3"
              value={formik.values.years_experience_min}
              onChange={formik.handleChange}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_experience_max" className="text-sm font-medium">
            Maximum Years of Experience
          </Label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="years_experience_max"
              name="years_experience_max"
              type="number"
              min={formik.values.years_experience_min || 0}
              placeholder="8"
              value={formik.values.years_experience_max}
              onChange={formik.handleChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Skills preview */}
      {formik.values.required_skills && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-center gap-2 text-blue-700 mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Skills Preview</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {formik.values.required_skills.split(',').map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {skill.trim()}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </CardContent>
  </Card>
);

const ApplicationStep = ({ formik }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-100 rounded-full">
          <Send className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <CardTitle className="text-2xl">Application Process</CardTitle>
          <CardDescription>
            Configure how candidates should apply for this position
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium">Application Method *</Label>
        <RadioGroup 
          value={formik.values.application_type} 
          onValueChange={(value) => formik.setFieldValue('application_type', value)}
          className="space-y-3"
        >
          {APPLICATION_TYPES.map(type => {
            const icons = {
              'internal': Users,
              'external': ExternalLink,
              'email': Mail
            };
            const Icon = icons[type.value];
            
            return (
              <div key={type.value} className="flex items-center space-x-3">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label 
                  htmlFor={type.value}
                  className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors flex-1"
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-500">
                      {type.value === 'internal' && 'Candidates apply through your platform'}
                      {type.value === 'external' && 'Redirect to external application page'}
                      {type.value === 'email' && 'Candidates send applications via email'}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {formik.values.application_type === 'external' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="application_url" className="text-sm font-medium">
            Application URL *
          </Label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="application_url"
              name="application_url"
              type="url"
              placeholder="https://company.com/careers/apply"
              value={formik.values.application_url}
              onChange={formik.handleChange}
              className={`pl-10 ${formik.touched.application_url && formik.errors.application_url ? 'border-red-500' : ''}`}
            />
          </div>
          {formik.touched.application_url && formik.errors.application_url && (
            <p className="text-sm text-red-600">{formik.errors.application_url}</p>
          )}
        </motion.div>
      )}

      {formik.values.application_type === 'email' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="application_email" className="text-sm font-medium">
            Application Email *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="application_email"
              name="application_email"
              type="email"
              placeholder="careers@company.com"
              value={formik.values.application_email}
              onChange={formik.handleChange}
              className={`pl-10 ${formik.touched.application_email && formik.errors.application_email ? 'border-red-500' : ''}`}
            />
          </div>
          {formik.touched.application_email && formik.errors.application_email && (
            <p className="text-sm text-red-600">{formik.errors.application_email}</p>
          )}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="application_deadline" className="text-sm font-medium">
          Application Deadline
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="application_deadline"
            name="application_deadline"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formik.values.application_deadline ? new Date(formik.values.application_deadline).toISOString().split('T')[0] : ''}
            onChange={(e) => formik.setFieldValue('application_deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-gray-500">
          Leave empty for open-ended applications
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="application_instructions" className="text-sm font-medium">
          Special Instructions
        </Label>
        <Textarea
          id="application_instructions"
          name="application_instructions"
          placeholder="Any additional instructions for applicants..."
          value={formik.values.application_instructions}
          onChange={formik.handleChange}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Required Documents</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_resume"
              checked={formik.values.requires_resume}
              onCheckedChange={(checked) => formik.setFieldValue('requires_resume', checked)}
            />
            <Label htmlFor="requires_resume" className="flex items-center gap-2 cursor-pointer">
              <FileText className="w-4 h-4" />
              Resume
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_cover_letter"
              checked={formik.values.requires_cover_letter}
              onCheckedChange={(checked) => formik.setFieldValue('requires_cover_letter', checked)}
            />
            <Label htmlFor="requires_cover_letter" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="w-4 h-4" />
              Cover Letter
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_portfolio"
              checked={formik.values.requires_portfolio}
              onCheckedChange={(checked) => formik.setFieldValue('requires_portfolio', checked)}
            />
            <Label htmlFor="requires_portfolio" className="flex items-center gap-2 cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              Portfolio
            </Label>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ReviewStep = ({ formik }) => {
  // Import required validation functions and steps from the main component context
  const getFieldValidation = (fieldName, value, formik) => {
    const errors = formik.errors || {};
    const touched = formik.touched || {};
    
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    const hasError = touched[fieldName] && errors[fieldName];
    
    return {
      isEmpty,
      hasError,
      errorMessage: hasError ? errors[fieldName] : null,
      isValid: !isEmpty && !hasError
    };
  };

  const getStepValidation = (step) => {
    let validFields = 0;
    let invalidFields = 0;
    let errorFields = 0;
    let missingFields = [];
    
    // Get conditional fields based on current values
    const getConditionalFields = (baseFields) => {
      let fields = [...baseFields];
      
      // Location fields for non-remote jobs
      if (step.id === 'basic' && formik.values.location_type !== 'remote') {
        fields = fields.filter(f => !['city', 'state'].includes(f));
        fields.push('city', 'state');
      }
      
      // Salary fields when showing salary
      if (step.id === 'compensation' && formik.values.show_salary) {
        fields = fields.filter(f => !['salary_min', 'salary_max', 'salary_currency', 'salary_period'].includes(f));
        fields.push('salary_min', 'salary_max', 'salary_currency', 'salary_period');
      }
      
      // Application method specific fields
      if (step.id === 'application') {
        if (formik.values.application_type === 'email') {
          fields = fields.filter(f => !['application_email', 'application_url'].includes(f));
          fields.push('application_email');
        } else if (formik.values.application_type === 'url') {
          fields = fields.filter(f => !['application_email', 'application_url'].includes(f));
          fields.push('application_url');
        }
      }
      
      return fields;
    };
    
    const conditionalFields = getConditionalFields(step.fields);
    
    conditionalFields.forEach(fieldName => {
      const fieldValidation = getFieldValidation(fieldName, formik.values[fieldName], formik);
      
      if (fieldValidation.isValid) {
        validFields++;
      } else if (fieldValidation.hasError) {
        errorFields++;
        invalidFields++;
      } else if (fieldValidation.isEmpty) {
        missingFields.push(fieldName);
        invalidFields++;
      }
    });
    
    const totalFields = conditionalFields.length;
    const completionRate = totalFields > 0 ? (validFields / totalFields) * 100 : 100;
    
    let status = 'incomplete';
    if (totalFields === 0 || completionRate === 100) {
      status = 'complete';
    } else if (errorFields > 0) {
      status = 'error';
    } else if (validFields > 0) {
      status = 'partial';
    }
    
    return {
      status,
      completionRate,
      validFields,
      invalidFields,
      errorFields,
      missingFields,
      totalFields
    };
  };

  // Get validation status for all steps
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      fields: ['title', 'department', 'location_type', 'employment_type']
    },
    {
      id: 'details',
      title: 'Job Details',
      fields: ['description', 'requirements', 'experience_level']
    },
    {
      id: 'compensation',
      title: 'Compensation',
      fields: ['show_salary']
    },
    {
      id: 'requirements',
      title: 'Requirements',
      fields: ['required_skills', 'education_level']
    },
    {
      id: 'application',
      title: 'Application Method',
      fields: ['application_type']
    }
  ];

  const allStepValidations = steps.map(step => ({
    ...step,
    validation: getStepValidation(step)
  }));

  const incompleteSteps = allStepValidations.filter(step => step.validation.status !== 'complete');
  const errorSteps = allStepValidations.filter(step => step.validation.status === 'error');
  const allMissingFields = incompleteSteps.flatMap(step => 
    step.validation.missingFields.map(field => ({
      field,
      stepTitle: step.title,
      stepId: step.id
    }))
  );

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-full">
            <Eye className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Review & Publish</CardTitle>
            <CardDescription>
              Final review of your job posting before publishing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Validation Summary */}
        {(incompleteSteps.length > 0 || errorSteps.length > 0) && (
          <Alert className={`${errorSteps.length > 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <AlertCircle className={`h-4 w-4 ${errorSteps.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertTitle className={`${errorSteps.length > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              {errorSteps.length > 0 ? 'Validation Errors Found' : 'Incomplete Information'}
            </AlertTitle>
            <AlertDescription className={`${errorSteps.length > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
              <div className="space-y-3 mt-2">
                {errorSteps.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {errorSteps.map(step => (
                        <li key={step.id}>
                          <span className="font-medium">{step.title}</span> has {step.validation.errorFields} validation error{step.validation.errorFields > 1 ? 's' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {allMissingFields.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Missing required information:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {allMissingFields.slice(0, 8).map((missingField, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded border">
                          <span>
                            {typeof missingField === 'string' 
                              ? missingField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : missingField.label || 
                                (typeof missingField.field === 'string' 
                                  ? missingField.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                  : 'Unknown field')
                            }
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {missingField.stepTitle || missingField.step || 'Unknown Step'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {allMissingFields.length > 8 && (
                      <p className="text-sm mt-2">...and {allMissingFields.length - 8} more fields</p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 rounded">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Use the step navigation on the left to complete missing information
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message when everything is complete */}
        {incompleteSteps.length === 0 && errorSteps.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Ready to Publish!</AlertTitle>
            <AlertDescription className="text-green-700">
              All required information has been provided. Your job posting is complete and ready to be published.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Completion Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/50 border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Form Progress</h4>
              <div className="space-y-3">
                {allStepValidations.map(step => (
                  <div key={step.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{step.title}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={step.validation.completionRate} className="w-16 h-2" />
                      <span className="text-xs font-medium text-gray-600 w-10">
                        {Math.round(step.validation.completionRate)}%
                      </span>
                      {step.validation.status === 'complete' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {step.validation.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {step.validation.status === 'partial' && (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Steps:</span>
                  <span className="font-medium">{allStepValidations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Complete Steps:</span>
                  <span className="font-medium text-green-600">
                    {allStepValidations.length - incompleteSteps.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Incomplete Steps:</span>
                  <span className="font-medium text-yellow-600">{incompleteSteps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steps with Errors:</span>
                  <span className="font-medium text-red-600">{errorSteps.length}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Overall Progress:</span>
                    <span className="font-bold">
                      {Math.round(
                        (allStepValidations.reduce((sum, step) => sum + step.validation.completionRate, 0) / 
                         allStepValidations.length) || 0
                      )}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Job Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{formik.values.title || 'Job Title'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>
                {formik.values.location_type === 'remote' ? 'Remote' : 
                 `${formik.values.city || 'City'}, ${formik.values.state || 'State'}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{EMPLOYMENT_TYPES.find(t => t.value === formik.values.employment_type)?.label || 'Employment Type'}</span>
            </div>
            {formik.values.show_salary && formik.values.salary_min && formik.values.salary_max && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: formik.values.salary_currency 
                  }).format(formik.values.salary_min)} - {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: formik.values.salary_currency 
                  }).format(formik.values.salary_max)} {formik.values.salary_period}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Application Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-gray-500" />
              <span>{APPLICATION_TYPES.find(t => t.value === formik.values.application_type)?.label}</span>
            </div>
            {formik.values.application_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Deadline: {new Date(formik.values.application_deadline).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {formik.values.requires_resume && <Badge variant="outline">Resume Required</Badge>}
              {formik.values.requires_cover_letter && <Badge variant="outline">Cover Letter Required</Badge>}
              {formik.values.requires_portfolio && <Badge variant="outline">Portfolio Required</Badge>}
            </div>
          </div>
        </div>
      </div>

      {formik.values.required_skills && (
        <div className="space-y-2">
          <h3 className="font-semibold">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {formik.values.required_skills.split(',').map((skill, index) => (
              <Badge key={index} variant="secondary">{skill.trim()}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-blue-900">Ready to publish?</p>
            <p className="text-sm text-blue-700">
              Your job will be visible to candidates immediately after publishing. 
              You can edit or pause it anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  );
};

const JobPreview = ({ formData }) => (
  <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
    <CardHeader>
      <CardTitle className="text-2xl">Job Preview</CardTitle>
      <CardDescription>
        This is how your job posting will appear to candidates
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{formData.title}</h2>
            <p className="text-gray-600">Company Name</p>
          </div>
          <Badge variant="secondary">
            {EMPLOYMENT_TYPES.find(t => t.value === formData.employment_type)?.label}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {formData.location_type === 'remote' ? 'Remote' : 
             `${formData.city}, ${formData.state}`}
          </div>
          {formData.show_salary && formData.salary_min && formData.salary_max && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: formData.salary_currency 
              }).format(formData.salary_min)} - {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: formData.salary_currency 
              }).format(formData.salary_max)} {formData.salary_period}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {formData.summary && (
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-gray-700">{formData.summary}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{formData.description}</p>
          </div>

          {formData.required_skills && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.split(',').map((skill, index) => (
                  <Badge key={index} variant="outline">{skill.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
  );
};

export default PostJobPage;