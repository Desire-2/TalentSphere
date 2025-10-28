import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Award,
  Paperclip,
  Upload,
  X,
  HelpCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { scholarshipService } from '../../services/scholarship';
import { useAuthStore } from '../../stores/authStore';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';
import { toast } from 'sonner';

const ScholarshipApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { navigateToLogin } = useAuthNavigation();

  // State management
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    
    // Education Information
    current_institution: '',
    study_level: '',
    field_of_study: '',
    current_gpa: '',
    
    // Address
    country: '',
    state: '',
    city: '',
    postal_code: '',
    
    // Application Details
    motivation_essay: '',
    career_goals: '',
    achievements: '',
    financial_need_statement: '',
    
    // Additional Information
    extracurricular_activities: '',
    community_service: '',
    leadership_experience: '',
    additional_information: '',
    
    // Agreement
    agree_to_terms: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigateToLogin({ overridePath: { pathname: `/scholarships/${id}/apply` } });
      return;
    }
    
    if (id) {
      fetchScholarship();
      populatePersonalInfo();
    }
  }, [id, isAuthenticated, navigateToLogin]);

  const fetchScholarship = async () => {
    try {
      setLoading(true);
      const response = await scholarshipService.getScholarshipDetail(id);
      setScholarship(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching scholarship:', err);
      setError('Failed to load scholarship details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const populatePersonalInfo = () => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    
    if (!formData.current_institution?.trim()) newErrors.current_institution = 'Current institution is required';
    if (!formData.study_level) newErrors.study_level = 'Study level is required';
    if (!formData.current_gpa) newErrors.current_gpa = 'Current GPA is required';

    // Email validation
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // GPA validation
    if (formData.current_gpa && (isNaN(formData.current_gpa) || formData.current_gpa < 0 || formData.current_gpa > 4.0)) {
      newErrors.current_gpa = 'GPA must be between 0 and 4.0';
    }

    // Address fields
    if (!formData.country?.trim()) newErrors.country = 'Country is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';

    // Essay requirement
    if (scholarship?.requires_essay && !formData.motivation_essay?.trim()) {
      newErrors.motivation_essay = 'Essay is required for this scholarship';
    }

    // Terms agreement
    if (!formData.agree_to_terms) {
      newErrors.agree_to_terms = 'You must agree to the terms and conditions';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > maxSize) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, images, and Word documents are allowed');
      return;
    }

    try {
      setUploadingFile(true);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      // You would upload to your backend here
      // For now, we'll simulate with local file info
      const fileInfo = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      };

      setUploadedFiles(prev => [...prev, fileInfo]);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare application data
      const applicationData = {
        ...formData,
        files: uploadedFiles,
        submitted_at: new Date().toISOString()
      };

      // Submit application
      const response = await scholarshipService.applyToScholarship(id, applicationData);

      toast.success('Application submitted successfully!');
      
      // Redirect to success page
      setTimeout(() => {
        navigate(`/scholarships/${id}/application-success`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FormField = ({ label, field, type = 'text', placeholder, required, children, tooltip, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={field} className="font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children || (
        <Input
          id={field}
          type={type}
          placeholder={placeholder}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={formErrors[field] ? 'border-red-500' : ''}
        />
      )}
      {formErrors[field] && (
        <p className="text-sm text-red-600">{formErrors[field]}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Scholarship not found'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(scholarship.application_deadline);

  if (deadlinePassed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
            <CardTitle className="text-red-900">Application Closed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-800">
              The application deadline for this scholarship has passed.
            </p>
            <p className="text-sm text-red-700">
              Deadline was: {new Date(scholarship.application_deadline).toLocaleDateString()}
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(`/scholarships/${id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scholarship
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Apply for Scholarship</h1>
                <p className="text-gray-600 text-sm mt-1">{scholarship.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Scholarship Summary Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900">{scholarship.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {scholarship.external_organization_name || 'TalentSphere'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {scholarship.currency} {scholarship.amount_max?.toLocaleString() || 'Varies'}
                </div>
                <div className="text-sm text-gray-600 mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4" />
                  Deadline: {new Date(scholarship.application_deadline).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Application Requirements Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Please ensure all information is accurate and complete. All fields marked with <span className="text-red-500 font-bold">*</span> are required.
          </AlertDescription>
        </Alert>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  field="first_name"
                  placeholder="John"
                  required
                />
                <FormField
                  label="Last Name"
                  field="last_name"
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Email"
                  field="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
                <FormField
                  label="Phone Number"
                  field="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <FormField
                label="Date of Birth"
                field="date_of_birth"
                type="date"
                required
              />
            </CardContent>
          </Card>

          {/* Education Information Section */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Education Information
              </CardTitle>
              <CardDescription>Your academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Current Institution"
                field="current_institution"
                placeholder="e.g., University of California"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Study Level"
                  field="study_level"
                  required
                  tooltip="Your current level of study"
                >
                  <Select value={formData.study_level} onValueChange={(value) => handleInputChange('study_level', value)}>
                    <SelectTrigger className={formErrors.study_level ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select study level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Current GPA"
                  field="current_gpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.0"
                  placeholder="3.8"
                  required
                  tooltip="Your current GPA on a 4.0 scale"
                />
              </div>

              <FormField
                label="Field of Study"
                field="field_of_study"
                placeholder="e.g., Computer Science, Engineering"
              />
            </CardContent>
          </Card>

          {/* Address Information Section */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-green-600" />
                Address Information
              </CardTitle>
              <CardDescription>Your residential address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Country"
                field="country"
                placeholder="e.g., United States"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="State/Province"
                  field="state"
                  placeholder="e.g., California"
                />
                <FormField
                  label="City"
                  field="city"
                  placeholder="e.g., Los Angeles"
                  required
                />
                <FormField
                  label="Postal Code"
                  field="postal_code"
                  placeholder="e.g., 90001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Application Essays Section */}
          {scholarship.requires_essay && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  Application Essays
                </CardTitle>
                <CardDescription>Please answer the following essay prompts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scholarship.essay_topics && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Info className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 whitespace-pre-wrap">
                      {scholarship.essay_topics}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  label="Motivation Essay"
                  field="motivation_essay"
                  required={scholarship.requires_essay}
                  tooltip="Why do you want this scholarship?"
                >
                  <Textarea
                    id="motivation_essay"
                    placeholder="Please explain your motivation for applying to this scholarship and how it will help you achieve your goals..."
                    value={formData.motivation_essay}
                    onChange={(e) => handleInputChange('motivation_essay', e.target.value)}
                    rows={5}
                    className={formErrors.motivation_essay ? 'border-red-500' : ''}
                  />
                </FormField>

                <FormField
                  label="Career Goals"
                  field="career_goals"
                  tooltip="What are your career aspirations?"
                >
                  <Textarea
                    id="career_goals"
                    placeholder="Describe your long-term career goals and how this scholarship will help you achieve them..."
                    value={formData.career_goals}
                    onChange={(e) => handleInputChange('career_goals', e.target.value)}
                    rows={4}
                  />
                </FormField>

                <FormField
                  label="Academic/Professional Achievements"
                  field="achievements"
                  tooltip="Highlight your key achievements"
                >
                  <Textarea
                    id="achievements"
                    placeholder="Describe your academic or professional achievements, awards, or recognitions..."
                    value={formData.achievements}
                    onChange={(e) => handleInputChange('achievements', e.target.value)}
                    rows={4}
                  />
                </FormField>

                <FormField
                  label="Financial Need Statement (Optional)"
                  field="financial_need_statement"
                  tooltip="Explain your financial situation if relevant"
                >
                  <Textarea
                    id="financial_need_statement"
                    placeholder="If applicable, explain how financial aid would help you pursue your education..."
                    value={formData.financial_need_statement}
                    onChange={(e) => handleInputChange('financial_need_statement', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* Additional Experience Section */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-pink-600" />
                Experience & Activities
              </CardTitle>
              <CardDescription>Tell us about your experiences and involvements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Extracurricular Activities"
                field="extracurricular_activities"
                tooltip="Clubs, sports, hobbies you participate in"
              >
                <Textarea
                  id="extracurricular_activities"
                  placeholder="List your extracurricular activities and how they have shaped you..."
                  value={formData.extracurricular_activities}
                  onChange={(e) => handleInputChange('extracurricular_activities', e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField
                label="Community Service & Volunteering"
                field="community_service"
                tooltip="Your community involvement"
              >
                <Textarea
                  id="community_service"
                  placeholder="Describe your community service, volunteer work, or civic engagement..."
                  value={formData.community_service}
                  onChange={(e) => handleInputChange('community_service', e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField
                label="Leadership Experience"
                field="leadership_experience"
                tooltip="Leadership roles you've held"
              >
                <Textarea
                  id="leadership_experience"
                  placeholder="Share leadership roles you've held and what you've learned..."
                  value={formData.leadership_experience}
                  onChange={(e) => handleInputChange('leadership_experience', e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField
                label="Additional Information"
                field="additional_information"
                tooltip="Anything else you'd like us to know"
              >
                <Textarea
                  id="additional_information"
                  placeholder="Share any other information that helps us understand you better..."
                  value={formData.additional_information}
                  onChange={(e) => handleInputChange('additional_information', e.target.value)}
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          {(scholarship.requires_transcript || scholarship.requires_recommendation_letters || scholarship.requires_portfolio) && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Paperclip className="w-5 h-5 text-indigo-600" />
                  Supporting Documents
                </CardTitle>
                <CardDescription>Upload required documents for your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center">
                    <Label className="cursor-pointer flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload files
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    PDF, JPEG, PNG, or Word documents (max 5MB each)
                  </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">Uploaded Files:</h4>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Required Documents Info */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-1">
                      {scholarship.requires_transcript && <p>• Academic Transcript required</p>}
                      {scholarship.requires_recommendation_letters && <p>• {scholarship.num_recommendation_letters || 2} Recommendation Letters required</p>}
                      {scholarship.requires_portfolio && <p>• Portfolio required</p>}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          <Card className="shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agree_to_terms"
                  checked={formData.agree_to_terms}
                  onChange={(e) => handleInputChange('agree_to_terms', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="agree_to_terms" className="cursor-pointer flex-1">
                  <span className="font-medium">I agree to the terms and conditions</span>
                  <p className="text-sm text-gray-600 mt-1">
                    I confirm that the information provided in this application is true and accurate to the best of my knowledge. I understand that providing false information may result in disqualification from this scholarship.
                  </p>
                </Label>
              </div>
              {formErrors.agree_to_terms && (
                <p className="text-sm text-red-600 mt-2">{formErrors.agree_to_terms}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button Section */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/scholarships/${id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8"
              size="lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScholarshipApplication;
