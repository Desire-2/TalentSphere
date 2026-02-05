import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, CheckCircle, AlertTriangle, Briefcase, ChevronDown, RefreshCw, Info } from 'lucide-react';
import SectionProgressTracker from '../../components/cv/SectionProgressTracker';
import CVRenderer from '../../components/cv/CVRenderer';
import { generateCV, getUserCVData, getCVStyles } from '../../services/cvBuilderService';

// CV Builder State Reducer
const cvReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'SET_CV_STYLES':
      return { ...state, cvStyles: action.payload };
    case 'SET_SELECTED_STYLE':
      return { ...state, selectedStyle: action.payload };
    case 'SET_SELECTED_SECTIONS':
      return { ...state, selectedSections: action.payload };
    case 'START_GENERATION':
      return { ...state, isGenerating: true, error: null, generationProgress: [], todos: [], retryInfo: null };
    case 'UPDATE_PROGRESS':
      return { ...state, generationProgress: action.payload };
    case 'UPDATE_RETRY_INFO':
      return { ...state, retryInfo: action.payload };
    case 'GENERATION_SUCCESS':
      return { 
        ...state, 
        isGenerating: false, 
        cvContent: action.payload.cvContent,
        atsScore: action.payload.atsScore,
        atsBreakdown: action.payload.atsBreakdown,
        atsImprovements: action.payload.atsImprovements,
        generationProgress: action.payload.progress || [],
        todos: action.payload.todos || [],
        error: null,
        isFromCache: false,
        cacheTimestamp: null,
        generationTime: action.payload.generationTime
      };
    case 'GENERATION_ERROR':
      return { 
        ...state, 
        isGenerating: false, 
        error: action.payload,
        retryInfo: null
      };
    case 'SET_JOB_MODE':
      return { ...state, jobMode: action.payload };
    case 'SET_SELECTED_JOB_ID':
      return { ...state, selectedJobId: action.payload };
    case 'SET_AVAILABLE_JOBS':
      return { ...state, availableJobs: action.payload };
    case 'SET_CUSTOM_JOB':
      return { ...state, customJob: action.payload };
    case 'SET_SHOW_JOB_SECTION':
      return { ...state, showJobSection: action.payload };
    case 'LOAD_FROM_CACHE':
      return { 
        ...state, 
        cvContent: action.payload.cvContent,
        atsScore: action.payload.atsScore,
        isFromCache: true,
        cacheTimestamp: action.payload.timestamp
      };
    case 'CLEAR_CACHE':
      return { 
        ...state, 
        cvContent: null,
        atsScore: null,
        atsBreakdown: null,
        atsImprovements: null,
        isFromCache: false,
        cacheTimestamp: null
      };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  userData: null,
  cvStyles: [],
  selectedStyle: 'professional',
  selectedSections: ['summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'],
  jobMode: 'none',
  selectedJobId: '',
  availableJobs: [],
  customJob: { title: '', company: '', description: '', requirements: '' },
  showJobSection: true,
  isGenerating: false,
  generationProgress: [],
  cvContent: null,
  atsScore: null,
  atsBreakdown: null,
  atsImprovements: null,
  todos: [],
  error: null,
  isFromCache: false,
  cacheTimestamp: null,
  generationTime: null,
  retryInfo: null
};

const CVBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('job_id');
  const cvRendererRef = useRef(null);

  // Use reducer for complex state management
  const [state, dispatch] = useReducer(cvReducer, { 
    ...initialState, 
    jobMode: jobIdFromUrl ? 'selected' : 'none',
    selectedJobId: jobIdFromUrl || ''
  });

  // Destructure state for easier access
  const {
    loading, userData, cvStyles, selectedStyle, selectedSections,
    jobMode, selectedJobId, availableJobs, customJob, showJobSection,
    isGenerating, generationProgress, cvContent, atsScore, atsBreakdown, atsImprovements,
    todos, error, isFromCache, cacheTimestamp, generationTime, retryInfo
  } = state;

  // Available sections
  const availableSections = [
    { id: 'summary', label: 'Professional Summary', required: true },
    { id: 'work', label: 'Work Experience', required: true },
    { id: 'education', label: 'Education', required: true },
    { id: 'skills', label: 'Skills & Competencies', required: true },
    { id: 'projects', label: 'Projects', required: false },
    { id: 'certifications', label: 'Certifications', required: false },
    { id: 'awards', label: 'Awards & Achievements', required: false },
    { id: 'references', label: 'Professional References', required: false }
  ];

  // Load initial data and cached CV
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Load cached CV first (immediate display)
        const cachedCV = localStorage.getItem('lastGeneratedCV');
        const cachedTimestamp = localStorage.getItem('lastCVTimestamp');
        const cachedStyle = localStorage.getItem('lastCVStyle');
        const cachedATSScore = localStorage.getItem('lastATSScore');
        
        if (cachedCV) {
          try {
            const parsedCV = JSON.parse(cachedCV);
            let cachedATS = null;
            if (cachedATSScore) {
              cachedATS = JSON.parse(cachedATSScore);
            }
            dispatch({ 
              type: 'LOAD_FROM_CACHE', 
              payload: { 
                cvContent: parsedCV, 
                atsScore: cachedATS,
                timestamp: cachedTimestamp 
              } 
            });
            if (cachedStyle) {
              dispatch({ type: 'SET_SELECTED_STYLE', payload: cachedStyle });
            }
            console.log('✅ Loaded CV from cache:', new Date(cachedTimestamp));
          } catch (parseErr) {
            console.warn('Failed to parse cached CV:', parseErr);
            localStorage.removeItem('lastGeneratedCV');
            localStorage.removeItem('lastCVTimestamp');
            localStorage.removeItem('lastCVStyle');
            localStorage.removeItem('lastATSScore');
          }
        }

        const [userResponse, stylesResponse] = await Promise.all([
          getUserCVData(),
          getCVStyles()
        ]);
        
        dispatch({ type: 'SET_USER_DATA', payload: userResponse.data });
        if (stylesResponse.data) {
          dispatch({ type: 'SET_CV_STYLES', payload: stylesResponse.data });
        }

        // Fetch user's applied jobs for selection
        try {
          const token = localStorage.getItem('token');
          const jobsResponse = await fetch('/api/my-applications', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const jobs = jobsData.data?.map(app => app.job).filter(job => job) || [];
            dispatch({ type: 'SET_AVAILABLE_JOBS', payload: jobs });
          }
        } catch (jobErr) {
          console.log('Could not fetch applied jobs:', jobErr);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        dispatch({ type: 'GENERATION_ERROR', payload: 'Failed to load CV builder data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Toggle section selection
  const toggleSection = (sectionId) => {
    const section = availableSections.find(s => s.id === sectionId);
    if (section?.required) return;

    const newSections = selectedSections.includes(sectionId)
      ? selectedSections.filter(id => id !== sectionId)
      : [...selectedSections, sectionId];
    
    dispatch({ type: 'SET_SELECTED_SECTIONS', payload: newSections });
  };

  // Generate CV with comprehensive error handling
  const handleGenerateCV = async () => {
    dispatch({ type: 'START_GENERATION' });

    try {
      // Prepare job data based on mode
      let jobData = null;
      if (jobMode === 'selected' && selectedJobId) {
        jobData = { job_id: parseInt(selectedJobId) };
      } else if (jobMode === 'custom' && customJob.title) {
        jobData = { custom_job: customJob };
      }

      const startTime = Date.now();

      const response = await generateCV({
        ...jobData,
        style: selectedStyle,
        sections: selectedSections,
        use_section_by_section: true
      }, {
        onRetryWait: ({ attempt, waitSeconds, error }) => {
          dispatch({ 
            type: 'UPDATE_RETRY_INFO',
            payload: { attempt, waitSeconds, errorCode: error.code, message: error.message }
          });
        }
      });

      console.log('🎯 Generate CV response:', response);

      if (response.success) {
        const generationTime = (Date.now() - startTime) / 1000;
        
        console.log('✅ CV generation successful');
        console.log('   - CV content:', response.data.cv_content ? 'Present' : 'Missing');
        console.log('   - ATS Score:', response.data.ats_score || 'N/A');
        console.log('   - Generation time:', generationTime.toFixed(2) + 's');
        
        // Save to localStorage for persistence
        const timestamp = new Date().toISOString();
        try {
          localStorage.setItem('lastGeneratedCV', JSON.stringify(response.data.cv_content));
          localStorage.setItem('lastCVTimestamp', timestamp);
          localStorage.setItem('lastCVStyle', selectedStyle);
          if (response.data.ats_score) {
            localStorage.setItem('lastATSScore', JSON.stringify(response.data.ats_score));
          }
          console.log('💾 CV saved to localStorage');
        } catch (storageErr) {
          console.warn('Failed to save CV to localStorage:', storageErr);
        }
        
        dispatch({
          type: 'GENERATION_SUCCESS',
          payload: {
            cvContent: response.data.cv_content,
            atsScore: response.data.ats_score,
            atsBreakdown: response.data.ats_breakdown,
            atsImprovements: response.data.ats_improvements,
            progress: response.data.progress || [],
            todos: response.data.todos || [],
            generationTime: generationTime.toFixed(2)
          }
        });
      } else {
        throw new Error(response.message || 'Failed to generate CV');
      }
    } catch (err) {
      console.error('CV generation error:', err);
      
      let userMessage = err.message;
      let suggestion = '';
      let code = err.code || 'UNKNOWN';
      
      if (err.code === 'RATE_LIMITED') {
        userMessage = `API is busy (${err.retryAfter || 60}s wait)`;
        suggestion = 'The AI service is experiencing high demand. Try again shortly.';
      } else if (err.code === 'TIMEOUT') {
        userMessage = 'Generation took too long (120s timeout)';
        suggestion = 'Try again or select fewer sections for faster generation.';
      } else if (err.code === 'NETWORK_ERROR') {
        userMessage = 'Network connection failed';
        suggestion = 'Check your internet connection and try again.';
      } else if (err.code === 'GENERATION_ERROR') {
        userMessage = 'CV generation failed';
        suggestion = 'If this persists, try using fewer sections.';
      } else if (err.code === 'SERVER_ERROR') {
        userMessage = 'Server error (try again shortly)';
        suggestion = 'The server is temporarily unavailable. Please try again.';
      }
      
      dispatch({
        type: 'GENERATION_ERROR',
        payload: { message: userMessage, suggestion, code }
      });
    }
  };

  // Clear cache and start fresh
  const handleClearCache = () => {
    localStorage.removeItem('lastGeneratedCV');
    localStorage.removeItem('lastCVTimestamp');
    localStorage.removeItem('lastCVStyle');
    localStorage.removeItem('lastATSScore');
    dispatch({ type: 'CLEAR_CACHE' });
    console.log('✅ CV cache cleared');
  };
  // Download CV as PDF using client-side export
  const handleDownload = async () => {
    if (!cvContent || !cvRendererRef.current) {
      dispatch({ 
        type: 'GENERATION_ERROR',
        payload: { message: 'CV content not ready for export', suggestion: 'Generate a CV first' }
      });
      return;
    }

    try {
      // Call the exportToPDF function from CVRenderer
      await cvRendererRef.current.exportToPDF();
      console.log('✅ PDF export initiated successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      dispatch({
        type: 'GENERATION_ERROR',
        payload: { 
          message: 'Failed to export PDF',
          suggestion: 'Please ensure popups are allowed and try again.'
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                AI CV Builder
              </h1>
              <p className="mt-2 text-gray-600">
                Generate a professional, job-tailored CV in seconds
              </p>
              {isFromCache && cacheTimestamp && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Showing cached CV from {new Date(cacheTimestamp).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {cvContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                {isFromCache && (
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                    title="Clear cached CV and start fresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Retry Info */}
        {retryInfo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-900">
                  Retry in Progress: Attempt {retryInfo.attempt}/3
                </h3>
                <p className="text-sm text-yellow-700 mt-1">{retryInfo.message}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{retryInfo.waitSeconds}</div>
                <div className="text-xs text-yellow-600">seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert - Enhanced */}
        {error && (
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">
                  {error.code === 'RATE_LIMITED' && '⏳ API Rate Limit'}
                  {error.code === 'TIMEOUT' && '⏱️ Generation Timeout'}
                  {error.code === 'NETWORK_ERROR' && '🌐 Network Error'}
                  {!error.code && '❌ Error'}
                </h3>
                <p className="text-sm text-red-700 mt-2">{error.message}</p>
                {error.suggestion && (
                  <p className="text-sm text-red-600 mt-2">💡 {error.suggestion}</p>
                )}
                {error.code === 'RATE_LIMITED' && (
                  <button
                    onClick={handleGenerateCV}
                    disabled={isGenerating}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Job Selection/Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                onClick={() => dispatch({ type: 'SET_SHOW_JOB_SECTION', payload: !showJobSection })}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Target Job (Optional)
                </h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showJobSection ? 'rotate-180' : ''}`} />
              </button>

              {showJobSection && (
                <div className="space-y-4">
                  {/* Job Mode Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="jobMode"
                        value="none"
                        checked={jobMode === 'none'}
                        onChange={(e) => dispatch({ type: 'SET_JOB_MODE', payload: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">General CV (No specific job)</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="jobMode"
                        value="selected"
                        checked={jobMode === 'selected'}
                        onChange={(e) => dispatch({ type: 'SET_JOB_MODE', payload: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">Select from applied jobs</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="jobMode"
                        value="custom"
                        checked={jobMode === 'custom'}
                        onChange={(e) => setJobMode(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">Enter custom job details</span>
                    </label>
                  </div>

                  {/* Select from Jobs */}
                  {jobMode === 'selected' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Job
                      </label>
                      <select
                        value={selectedJobId}
                        onChange={(e) => dispatch({ type: 'SET_SELECTED_JOB_ID', payload: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={isGenerating}
                      >
                        <option value="">Choose a job...</option>
                        {availableJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} - {job.company_name}
                          </option>
                        ))}
                      </select>
                      {availableJobs.length === 0 && (
                        <p className="text-xs text-gray-500 italic">
                          No applied jobs found. Apply to jobs first or use custom job details.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom Job Details */}
                  {jobMode === 'custom' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={customJob.title}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, title: e.target.value } })}
                          placeholder="e.g., Senior Software Engineer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={customJob.company}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, company: e.target.value } })}
                          placeholder="e.g., Tech Corp"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Description
                        </label>
                        <textarea
                          value={customJob.description}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, description: e.target.value } })}
                          placeholder="Brief description of the role..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requirements/Skills
                        </label>
                        <textarea
                          value={customJob.requirements}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, requirements: e.target.value } })}
                          placeholder="Key requirements, skills, qualifications..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  )}

                  {/* Job Mode Info */}
                  {jobMode !== 'none' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">💡 Tip:</span> Your CV will be tailored to match the job requirements and keywords.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">CV Style</h2>
              <select
                value={selectedStyle}
                onChange={(e) => dispatch({ type: 'SET_SELECTED_STYLE', payload: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value="professional">Professional</option>
                <option value="modern">Modern</option>
                <option value="creative">Creative</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            {/* Section Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections to Include</h2>
              <div className="space-y-3">
                {availableSections.map((section) => (
                  <label
                    key={section.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      section.required
                        ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      disabled={section.required || isGenerating}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {section.label}
                        </span>
                        {section.required && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateCV}
              disabled={isGenerating || selectedSections.length === 0 || (jobMode === 'custom' && !customJob.title)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate CV
                </>
              )}
            </button>

            {(jobMode === 'selected' && selectedJobId) || (jobMode === 'custom' && customJob.title) ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-900">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Job-Tailored CV</span>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  CV will be optimized for: {jobMode === 'custom' ? customJob.title : 'selected job'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Preview & Progress Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            {(isGenerating || generationProgress.length > 0) && (
              <SectionProgressTracker
                generationProgress={generationProgress}
                todos={todos}
                isGenerating={isGenerating}
                sectionsRequested={selectedSections}
              />
            )}

            {/* CV Preview */}
            {cvContent && !isGenerating && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    CV Preview
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>ATS Score:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {cvContent.ats_score?.total_score || 0}/100
                    </span>
                  </div>
                </div>
                <CVRenderer 
                  ref={cvRendererRef}
                  cvData={cvContent} 
                  selectedTemplate={selectedStyle}
                  onExport={(status, message) => {
                    if (status === 'error') {
                      setError(message);
                    } else if (status === 'success') {
                      console.log('✅ PDF exported:', message);
                    }
                  }}
                />
              </div>
            )}

            {/* Empty State */}
            {!cvContent && !isGenerating && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No CV Generated Yet
                </h3>
                <p className="text-gray-600">
                  Select your preferred style and sections, then click "Generate CV" to create your professional CV
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
