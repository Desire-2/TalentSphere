import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Eye, 
  Upload, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Building,
  FileText,
  Tag,
  Globe,
  Mail,
  Phone,
  Plus,
  Trash2,
  Star,
  Calendar,
  Edit3
} from 'lucide-react';
import apiService from '../../services/api';

const JobEditModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  onSave,
  onPreview 
}) => {
  const [job, setJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    city: '',
    state: '',
    country: '',
    is_remote: false,
    employment_type: '',
    experience_level: '',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    company_id: '',
    category_id: '',
    skills: [],
    benefits: [],
    status: 'draft',
    application_deadline: '',
    is_urgent: false,
    is_featured: false
  });

  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [validation, setValidation] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (jobId) {
        fetchJobDetails();
      }
    }
  }, [isOpen, jobId]);

  const fetchInitialData = async () => {
    try {
      const [companiesRes, categoriesRes] = await Promise.all([
        apiService.getCompanies(),
        apiService.getJobCategories()
      ]);
      setCompanies(companiesRes.companies || []);
      setCategories(categoriesRes.categories || []);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getJob(jobId);
      setJob({
        ...response,
        skills: response.skills || [],
        benefits: response.benefits || [],
        salary_min: response.salary_min || '',
        salary_max: response.salary_max || '',
        application_deadline: response.application_deadline 
          ? new Date(response.application_deadline).toISOString().split('T')[0] 
          : ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!job.title.trim()) errors.title = 'Job title is required';
    if (!job.description.trim()) errors.description = 'Job description is required';
    if (!job.employment_type) errors.employment_type = 'Employment type is required';
    if (!job.company_id) errors.company_id = 'Company is required';
    
    if (job.salary_min && job.salary_max) {
      if (parseInt(job.salary_min) > parseInt(job.salary_max)) {
        errors.salary = 'Minimum salary cannot be greater than maximum salary';
      }
    }
    
    if (!job.is_remote && (!job.city || !job.state || !job.country)) {
      errors.location = 'Location is required for non-remote jobs';
    }
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (status = job.status) => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const jobData = {
        ...job,
        status,
        salary_min: job.salary_min ? parseInt(job.salary_min) : null,
        salary_max: job.salary_max ? parseInt(job.salary_max) : null,
        application_deadline: job.application_deadline || null
      };

      let response;
      if (jobId) {
        response = await apiService.updateJob(jobId, jobData);
      } else {
        response = await apiService.createJob(jobData);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave(response);
        if (!jobId) {
          onClose(); // Close modal after creating new job
        }
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setJob(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validation[field]) {
      setValidation(prev => ({ ...prev, [field]: null }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !job.skills.includes(skillInput.trim())) {
      setJob(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setJob(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !job.benefits.includes(benefitInput.trim())) {
      setJob(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefitToRemove) => {
    setJob(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit !== benefitToRemove)
    }));
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(job);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Edit3 className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {jobId ? 'Edit Job' : 'Create New Job'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {jobId ? 'Update job details and requirements' : 'Fill in the job details below'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {success && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Saved successfully!</span>
                  </div>
                )}
                
                <button
                  onClick={handlePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Preview Job"
                >
                  <Eye className="h-5 w-5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error saving job</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'basic', name: 'Basic Info', icon: FileText },
                { id: 'details', name: 'Job Details', icon: Building },
                { id: 'requirements', name: 'Requirements', icon: Users },
                { id: 'compensation', name: 'Compensation', icon: DollarSign }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={job.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validation.title ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g. Senior Frontend Developer"
                        />
                        {validation.title && (
                          <p className="text-red-600 text-sm mt-1">{validation.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company *
                        </label>
                        <select
                          value={job.company_id}
                          onChange={(e) => handleInputChange('company_id', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validation.company_id ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Company</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        {validation.company_id && (
                          <p className="text-red-600 text-sm mt-1">{validation.company_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={job.category_id}
                          onChange={(e) => handleInputChange('category_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employment Type *
                        </label>
                        <select
                          value={job.employment_type}
                          onChange={(e) => handleInputChange('employment_type', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validation.employment_type ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Type</option>
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="freelance">Freelance</option>
                          <option value="internship">Internship</option>
                        </select>
                        {validation.employment_type && (
                          <p className="text-red-600 text-sm mt-1">{validation.employment_type}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Experience Level
                        </label>
                        <select
                          value={job.experience_level}
                          onChange={(e) => handleInputChange('experience_level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Level</option>
                          <option value="entry">Entry Level</option>
                          <option value="mid">Mid Level</option>
                          <option value="senior">Senior Level</option>
                          <option value="lead">Lead/Principal</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description *
                      </label>
                      <textarea
                        value={job.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validation.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                      />
                      {validation.description && (
                        <p className="text-red-600 text-sm mt-1">{validation.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Details Tab */}
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    {/* Location Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">Location</h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={job.is_remote}
                            onChange={(e) => handleInputChange('is_remote', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Remote Position</span>
                        </label>
                      </div>

                      {!job.is_remote && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              value={job.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="San Francisco"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State/Province
                            </label>
                            <input
                              type="text"
                              value={job.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country
                            </label>
                            <input
                              type="text"
                              value={job.country}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="United States"
                            />
                          </div>
                        </div>
                      )}
                      {validation.location && (
                        <p className="text-red-600 text-sm mt-1">{validation.location}</p>
                      )}
                    </div>

                    {/* Application Deadline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={job.application_deadline}
                        onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Job Flags */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-medium text-gray-900">Job Options</h4>
                      
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={job.is_urgent}
                            onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">Mark as Urgent</span>
                            <p className="text-xs text-gray-500">This will highlight the job posting and prioritize it</p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={job.is_featured}
                            onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">Feature this Job</span>
                            <p className="text-xs text-gray-500">Featured jobs get more visibility (additional charges may apply)</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements Tab */}
                {activeTab === 'requirements' && (
                  <div className="p-6 space-y-6">
                    {/* Job Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requirements & Qualifications
                      </label>
                      <textarea
                        value={job.requirements}
                        onChange={(e) => handleInputChange('requirements', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="List the required skills, experience, education, and qualifications..."
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Skills
                      </label>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type a skill and press Enter"
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Benefits & Perks
                      </label>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={benefitInput}
                          onChange={(e) => setBenefitInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type a benefit and press Enter"
                        />
                        <button
                          type="button"
                          onClick={addBenefit}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((benefit, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                          >
                            {benefit}
                            <button
                              type="button"
                              onClick={() => removeBenefit(benefit)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Compensation Tab */}
                {activeTab === 'compensation' && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Salary
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={job.salary_min}
                            onChange={(e) => handleInputChange('salary_min', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="50000"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Salary
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={job.salary_max}
                            onChange={(e) => handleInputChange('salary_max', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="80000"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={job.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>
                    </div>
                    
                    {validation.salary && (
                      <p className="text-red-600 text-sm mt-1">{validation.salary}</p>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Salary Guidelines</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Providing salary ranges increases application rates by 30%</li>
                        <li>• Consider total compensation including benefits</li>
                        <li>• Be competitive within your industry and location</li>
                        <li>• Leave blank if you prefer to discuss during interview</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Status
                </label>
                <select
                  value={job.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save as Draft
              </button>
              
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {jobId ? 'Update & Publish' : 'Create & Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobEditModal;
