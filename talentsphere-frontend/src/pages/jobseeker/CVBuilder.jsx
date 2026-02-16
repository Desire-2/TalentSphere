import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, CheckCircle, AlertTriangle, Briefcase, ChevronDown, RefreshCw, Info, History, TrendingUp, Search, UserCircle, X, Target, Zap, Award, BarChart3, ClipboardPaste, Sparkles, MapPin, GraduationCap, Clock } from 'lucide-react';
import SectionProgressTracker from '../../components/cv/SectionProgressTracker';
import CVRenderer from '../../components/cv/CVRenderer';
import CVVersionHistory from '../../components/cv/CVVersionHistory';
import { generateCV, getUserCVData, getCVStyles, parseJobPosting } from '../../services/cvBuilderService';
import { saveCVVersion, getLatestCV, getCVVersions, clearAllCVs } from '../../utils/cvStorage';
import apiService from '../../services/api';

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
        jobMatchAnalysis: action.payload.jobMatchAnalysis || null,
        generationProgress: action.payload.progress || [],
        todos: action.payload.todos || [],
        error: null,
        isFromCache: false,
        cacheTimestamp: null,
        generationTime: action.payload.generationTime,
        currentVersionId: action.payload.currentVersionId
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
    case 'SET_PARSING_JOB':
      return { ...state, isParsingJob: action.payload };
    case 'SET_SHOW_ADVANCED_JOB':
      return { ...state, showAdvancedJobFields: action.payload };
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
        jobMatchAnalysis: null,
        isFromCache: false,
        cacheTimestamp: null,
        currentVersionId: null
      };
    case 'RESTORE_VERSION':
      return {
        ...state,
        cvContent: action.payload.cvContent,
        atsScore: action.payload.atsScore,
        atsBreakdown: action.payload.atsBreakdown,
        atsImprovements: action.payload.atsImprovements,
        selectedStyle: action.payload.selectedStyle,
        currentVersionId: action.payload.currentVersionId,
        isFromCache: true,
        cacheTimestamp: action.payload.timestamp
      };
    case 'SET_SHOW_VERSION_HISTORY':
      return { ...state, showVersionHistory: action.payload };
    case 'SET_SHOW_ATS_DETAILS':
      return { ...state, showATSDetails: action.payload };
    case 'SET_JOB_SEARCH_QUERY':
      return { ...state, jobSearchQuery: action.payload };
    case 'SET_ALL_JOBS':
      return { ...state, allJobs: action.payload };
    case 'SET_LOADING_JOBS':
      return { ...state, loadingJobs: action.payload };
    case 'SET_PROFILE_COMPLETION':
      return { ...state, profileCompletion: action.payload };
    case 'SET_SHOW_PROFILE_WARNING':
      return { ...state, showProfileWarning: action.payload };
    case 'AUTOFILL_FROM_JOB':
      return {
        ...state,
        jobMode: 'selected',
        selectedJobId: String(action.payload.id),
        showJobSection: true
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
  allJobs: [],
  customJob: { title: '', company: '', description: '', requirements: '', required_skills: '', preferred_skills: '', experience_level: '', employment_type: '', education_requirement: '', location: '', years_experience_min: '', years_experience_max: '', full_posting: '' },
  isParsingJob: false,
  showAdvancedJobFields: false,
  showJobSection: true,
  isGenerating: false,
  generationProgress: [],
  cvContent: null,
  atsScore: null,
  atsBreakdown: null,
  atsImprovements: null,
  jobMatchAnalysis: null,
  todos: [],
  error: null,
  currentVersionId: null,
  showVersionHistory: false,
  showATSDetails: false,
  isFromCache: false,
  cacheTimestamp: null,
  generationTime: null,
  retryInfo: null,
  jobSearchQuery: '',
  loadingJobs: false,
  profileCompletion: null,
  showProfileWarning: false
};

const CVBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('job_id');
  const jobTitleFromUrl = searchParams.get('job_title');
  const companyFromUrl = searchParams.get('company');
  const descriptionFromUrl = searchParams.get('description');
  const requirementsFromUrl = searchParams.get('requirements');
  const cvRendererRef = useRef(null);

  // Determine initial job mode from URL params
  const getInitialJobMode = () => {
    if (jobIdFromUrl) return 'selected';
    if (jobTitleFromUrl) return 'custom';
    return 'none';
  };

  // Use reducer for complex state management
  const [state, dispatch] = useReducer(cvReducer, { 
    ...initialState, 
    jobMode: getInitialJobMode(),
    selectedJobId: jobIdFromUrl || '',
    customJob: jobTitleFromUrl ? {
      ...initialState.customJob,
      title: jobTitleFromUrl || '',
      company: companyFromUrl || '',
      description: descriptionFromUrl || '',
      requirements: requirementsFromUrl || ''
    } : initialState.customJob
  });

  // Destructure state for easier access
  const {
    loading, userData, cvStyles, selectedStyle, selectedSections,
    jobMode, selectedJobId, availableJobs, customJob, showJobSection,
    isGenerating, generationProgress, cvContent, atsScore, atsBreakdown, atsImprovements, jobMatchAnalysis,
    todos, error, isFromCache, cacheTimestamp, generationTime, retryInfo,
    isParsingJob, showAdvancedJobFields,
    currentVersionId, showVersionHistory, showATSDetails
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

        // Fetch all available jobs for the searchable selector
        try {
          dispatch({ type: 'SET_LOADING_JOBS', payload: true });
          const jobsResponse = await apiService.getJobs({ per_page: 200 });
          // apiService returns the parsed JSON directly (not wrapped in {data:...})
          // Backend returns { jobs: [...], pagination: {...} }
          const jobs = Array.isArray(jobsResponse)
            ? jobsResponse
            : jobsResponse?.jobs || jobsResponse?.data?.jobs || jobsResponse?.items || [];
          if (jobs.length > 0) {
            dispatch({ type: 'SET_ALL_JOBS', payload: jobs });
            dispatch({ type: 'SET_AVAILABLE_JOBS', payload: jobs });
          }
        } catch (jobErr) {
          console.log('Could not fetch jobs:', jobErr);
        } finally {
          dispatch({ type: 'SET_LOADING_JOBS', payload: false });
        }

        // Check profile completeness from loaded user data
        try {
          const ud = userResponse.data;
          if (ud) {
            const fields = [
              ud.first_name, ud.last_name, ud.email, ud.phone, ud.location,
              ud.profile?.professional_title || ud.profile?.desired_position,
              ud.profile?.skills,
              ud.profile?.years_of_experience,
              ud.profile?.education_level,
              ud.profile?.bio || ud.bio,
            ];
            const hasWorkExp = (ud.work_experiences?.length || 0) > 0;
            const hasEducation = (ud.educations?.length || 0) > 0;

            const totalChecks = fields.length + 2;
            let filled = fields.filter(f => f && String(f).trim()).length;
            if (hasWorkExp) filled++;
            if (hasEducation) filled++;

            const completion = Math.round((filled / totalChecks) * 100);
            dispatch({ type: 'SET_PROFILE_COMPLETION', payload: completion });
            if (completion < 60) {
              dispatch({ type: 'SET_SHOW_PROFILE_WARNING', payload: true });
            }
          }
        } catch (profileErr) {
          console.log('Could not calculate profile completion:', profileErr);
        }

        // Auto-fill from URL params
        if (jobIdFromUrl) {
          dispatch({ type: 'SET_JOB_MODE', payload: 'selected' });
          dispatch({ type: 'SET_SELECTED_JOB_ID', payload: jobIdFromUrl });
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

  // AI-powered job posting parser
  const handleParseJobPosting = async () => {
    if (!customJob.full_posting || customJob.full_posting.trim().length < 30) {
      dispatch({ type: 'SET_ERROR', payload: 'Please paste a complete job posting (at least 30 characters)' });
      return;
    }
    dispatch({ type: 'SET_PARSING_JOB', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const parsed = await parseJobPosting(customJob.full_posting);
      dispatch({
        type: 'SET_CUSTOM_JOB',
        payload: {
          ...customJob,
          title: parsed.title || customJob.title,
          company: parsed.company || customJob.company,
          description: parsed.description || customJob.description,
          requirements: parsed.requirements || customJob.requirements,
          required_skills: Array.isArray(parsed.required_skills) ? parsed.required_skills.join(', ') : (parsed.required_skills || customJob.required_skills),
          preferred_skills: Array.isArray(parsed.preferred_skills) ? parsed.preferred_skills.join(', ') : (parsed.preferred_skills || customJob.preferred_skills),
          experience_level: parsed.experience_level || customJob.experience_level,
          employment_type: parsed.employment_type || customJob.employment_type,
          education_requirement: parsed.education_requirement || customJob.education_requirement,
          location: parsed.location || customJob.location,
          years_experience_min: parsed.years_experience_min || customJob.years_experience_min,
          years_experience_max: parsed.years_experience_max || customJob.years_experience_max,
        }
      });
      dispatch({ type: 'SET_SHOW_ADVANCED_JOB', payload: true });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to parse job posting: ${err.message}` });
    } finally {
      dispatch({ type: 'SET_PARSING_JOB', payload: false });
    }
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
        
        // Save to encrypted version history
        let versionId = null;
        try {
          versionId = saveCVVersion(response.data.cv_content, {
            style: selectedStyle,
            jobTitle: jobMode === 'custom' ? customJob.title : 
                      jobMode === 'selected' ? availableJobs.find(j => j.id === parseInt(selectedJobId))?.title : 
                      'General CV',
            jobId: selectedJobId,
            sections: selectedSections,
            atsScore: response.data.ats_score,
            atsBreakdown: response.data.ats_breakdown,
            atsImprovements: response.data.ats_improvements
          });
          console.log('💾 CV saved to version history (ID:', versionId, ')');
        } catch (storageErr) {
          console.warn('Failed to save CV to version history:', storageErr);
        }
        
        dispatch({
          type: 'GENERATION_SUCCESS',
          payload: {
            cvContent: response.data.cv_content,
            atsScore: response.data.ats_score,
            atsBreakdown: response.data.ats_breakdown,
            atsImprovements: response.data.ats_improvements,
            jobMatchAnalysis: response.data.job_match_analysis || response.data.cv_content?.job_match_analysis || null,
            progress: response.data.progress || [],
            todos: response.data.todos || [],
            generationTime: generationTime.toFixed(2),
            currentVersionId: versionId
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

  // Restore CV from version history
  const handleRestoreVersion = (version) => {
    try {
      dispatch({
        type: 'RESTORE_VERSION',
        payload: {
          cvContent: version.cvContent,
          atsScore: version.metadata.atsScore || null,
          atsBreakdown: version.metadata.atsBreakdown || null,
          atsImprovements: version.metadata.atsImprovements || null,
          currentVersionId: version.id,
          selectedStyle: version.metadata.style || 'professional',
          timestamp: version.timestamp
        }
      });
      dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false });
      console.log('✅ Restored CV version:', version.id);
    } catch (err) {
      console.error('Failed to restore version:', err);
      dispatch({
        type: 'GENERATION_ERROR',
        payload: { 
          message: 'Failed to restore version',
          suggestion: 'The version data may be corrupted. Try another version.',
          code: 'RESTORE_ERROR'
        }
      });
    }
  };

  // Clear cache and start fresh
  const handleClearCache = () => {
    clearAllCVs(); // Clear all CV versions
    dispatch({ type: 'CLEAR_CACHE' });
    console.log('✅ CV cache and version history cleared');
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
        {/* Auto-fill notification from job detail page */}
        {jobIdFromUrl && jobTitleFromUrl && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Generating CV for: <span className="font-bold">{jobTitleFromUrl}</span>
                  {companyFromUrl && <span className="text-blue-700"> at {companyFromUrl}</span>}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Job details have been pre-filled. Click "Generate CV" when ready.
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        )}
        
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
                  onClick={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: !state.showVersionHistory })}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  title="View version history"
                >
                  <History className="w-5 h-5" />
                  History
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_SHOW_ATS_DETAILS', payload: !state.showATSDetails })}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  title="View detailed ATS analysis"
                >
                  <TrendingUp className="w-5 h-5" />
                  ATS Score
                </button>
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
                    title="Clear all cached data and versions"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Warning */}
        {state.showProfileWarning && state.profileCompletion !== null && state.profileCompletion < 60 && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-4">
              <UserCircle className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  Complete Your Profile First
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  Your profile is only <span className="font-bold">{state.profileCompletion}%</span> complete.
                  For the best AI-generated CV, we recommend at least <span className="font-bold">60%</span> profile completion.
                </p>
                <div className="w-full bg-amber-200 rounded-full h-2 mt-3 mb-3">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${state.profileCompletion}%` }}
                  />
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Add your work experience, education, skills, and other details so the AI can generate a comprehensive CV.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/jobseeker/profile')}
                    className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                  >
                    <UserCircle className="w-4 h-4" />
                    Complete Profile
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'SET_SHOW_PROFILE_WARNING', payload: false })}
                    className="px-4 py-2 text-sm text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      <span className="text-sm text-gray-700">Select from job listings</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="jobMode"
                        value="custom"
                        checked={jobMode === 'custom'}
                        onChange={(e) => dispatch({ type: 'SET_JOB_MODE', payload: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">Enter custom job details</span>
                    </label>
                  </div>

                  {/* Searchable Job List */}
                  {jobMode === 'selected' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Search &amp; Select Job
                      </label>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={state.jobSearchQuery}
                          onChange={(e) => dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: e.target.value })}
                          placeholder="Search by job title, company..."
                          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isGenerating}
                        />
                        {state.jobSearchQuery && (
                          <button
                            onClick={() => dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: '' })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Selected Job Badge */}
                      {selectedJobId && (() => {
                        const selectedJob = availableJobs.find(j => String(j.id) === String(selectedJobId));
                        return selectedJob ? (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 truncate">{selectedJob.title}</p>
                              <p className="text-xs text-blue-700 truncate">{selectedJob.company_name || selectedJob.company?.name || 'Company'}</p>
                            </div>
                            <button
                              onClick={() => dispatch({ type: 'SET_SELECTED_JOB_ID', payload: '' })}
                              className="p-1 text-blue-400 hover:text-blue-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null;
                      })()}

                      {/* Job List */}
                      {state.loadingJobs ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span className="text-sm text-gray-500">Loading jobs...</span>
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {(() => {
                            const query = state.jobSearchQuery.toLowerCase();
                            const filtered = query
                              ? availableJobs.filter(job =>
                                  (job.title || '').toLowerCase().includes(query) ||
                                  (job.company_name || job.company?.name || '').toLowerCase().includes(query) ||
                                  (job.location || '').toLowerCase().includes(query)
                                )
                              : availableJobs;
                            
                            if (filtered.length === 0) {
                              return (
                                <div className="p-4 text-center">
                                  <p className="text-sm text-gray-500">
                                    {query ? 'No jobs match your search' : 'No jobs available'}
                                  </p>
                                </div>
                              );
                            }
                            
                            return filtered.slice(0, 50).map((job) => (
                              <button
                                key={job.id}
                                onClick={() => {
                                  dispatch({ type: 'SET_SELECTED_JOB_ID', payload: String(job.id) });
                                  dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: '' });
                                }}
                                disabled={isGenerating}
                                className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors ${
                                  String(selectedJobId) === String(job.id) ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                                }`}
                              >
                                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {job.company_name || job.company?.name || 'Company'}
                                  {job.location ? ` · ${job.location}` : ''}
                                </p>
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{availableJobs.length} jobs available</p>
                    </div>
                  )}

                  {/* Custom Job Details */}
                  {jobMode === 'custom' && (
                    <div className="space-y-4">
                      {/* Paste Full Job Posting */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardPaste className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-800">Paste Full Job Posting</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI-Powered</span>
                        </div>
                        <p className="text-xs text-purple-600 mb-2">
                          Paste the entire job posting below and click "Auto-Parse" to extract all details automatically.
                        </p>
                        <textarea
                          value={customJob.full_posting}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, full_posting: e.target.value } })}
                          placeholder="Paste the full job posting here... (job title, company, description, requirements, qualifications, etc.)"
                          rows={5}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-y bg-white"
                          disabled={isGenerating || isParsingJob}
                        />
                        <button
                          onClick={handleParseJobPosting}
                          disabled={isGenerating || isParsingJob || !customJob.full_posting || customJob.full_posting.trim().length < 30}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isParsingJob ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Parsing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Auto-Parse with AI
                            </>
                          )}
                        </button>
                      </div>

                      <div className="relative flex items-center justify-center">
                        <div className="border-t border-gray-200 w-full"></div>
                        <span className="bg-white px-3 text-xs text-gray-400 absolute">or fill in manually</span>
                      </div>

                      {/* Core Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Description
                        </label>
                        <textarea
                          value={customJob.description}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, description: e.target.value } })}
                          placeholder="Describe the role, responsibilities, and what the company is looking for..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requirements & Qualifications
                        </label>
                        <textarea
                          value={customJob.requirements}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, requirements: e.target.value } })}
                          placeholder="Key requirements, qualifications, certifications needed..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Required Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-blue-500" />
                            Required Skills
                          </span>
                        </label>
                        <input
                          type="text"
                          value={customJob.required_skills}
                          onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, required_skills: e.target.value } })}
                          placeholder="e.g., Python, React, Project Management (comma-separated)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Advanced Fields Toggle */}
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'SET_SHOW_ADVANCED_JOB', payload: !showAdvancedJobFields })}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedJobFields ? 'rotate-180' : ''}`} />
                        {showAdvancedJobFields ? 'Hide' : 'Show'} advanced fields
                        {(customJob.preferred_skills || customJob.experience_level || customJob.location || customJob.education_requirement) && (
                          <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">filled</span>
                        )}
                      </button>

                      {/* Advanced Fields */}
                      {showAdvancedJobFields && (
                        <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3.5 w-3.5 text-amber-500" />
                                Preferred / Nice-to-have Skills
                              </span>
                            </label>
                            <input
                              type="text"
                              value={customJob.preferred_skills}
                              onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, preferred_skills: e.target.value } })}
                              placeholder="e.g., Docker, AWS, Agile (comma-separated)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              disabled={isGenerating}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                                  Experience Level
                                </span>
                              </label>
                              <select
                                value={customJob.experience_level}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, experience_level: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              >
                                <option value="">Auto-detect</option>
                                <option value="junior">Junior / Entry-level</option>
                                <option value="mid">Mid-level</option>
                                <option value="senior">Senior</option>
                                <option value="executive">Executive / Director</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employment Type
                              </label>
                              <select
                                value={customJob.employment_type}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, employment_type: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              >
                                <option value="">Auto-detect</option>
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract / Freelance</option>
                                <option value="internship">Internship</option>
                                <option value="temporary">Temporary</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3.5 w-3.5 text-green-600" />
                                  Education Requirement
                                </span>
                              </label>
                              <select
                                value={customJob.education_requirement}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, education_requirement: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              >
                                <option value="">Auto-detect</option>
                                <option value="High School">High School / GED</option>
                                <option value="Associate's">Associate's Degree</option>
                                <option value="Bachelor's">Bachelor's Degree</option>
                                <option value="Master's">Master's Degree</option>
                                <option value="PhD">PhD / Doctorate</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                                  Location
                                </span>
                              </label>
                              <input
                                type="text"
                                value={customJob.location}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, location: e.target.value } })}
                                placeholder="e.g., Remote, New York, Kigali"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                                  Min Years Exp
                                </span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={customJob.years_experience_min}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, years_experience_min: e.target.value } })}
                                placeholder="e.g., 3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Years Exp
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={customJob.years_experience_max}
                                onChange={(e) => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, years_experience_max: e.target.value } })}
                                placeholder="e.g., 7"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isGenerating}
                              />
                            </div>
                          </div>
                        </div>
                      )}
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
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {/* Job Match Score Badge */}
                    {jobMatchAnalysis && jobMatchAnalysis.relevance_score != null && (
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>Match:</span>
                        <span className={`px-2 py-1 rounded-full font-semibold ${
                          jobMatchAnalysis.relevance_score >= 70 ? 'bg-green-100 text-green-700' :
                          jobMatchAnalysis.relevance_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(jobMatchAnalysis.relevance_score)}%
                        </span>
                      </div>
                    )}
                    <span>ATS Score:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {cvContent.ats_score?.total_score || 0}/100
                    </span>
                  </div>
                </div>

                {/* Job Match Analysis Summary Card */}
                {jobMatchAnalysis && (
                  <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-blue-700" />
                      <h3 className="font-semibold text-blue-900">Job Match Analysis</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      {/* Relevance Score */}
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className={`text-2xl font-bold ${
                          (jobMatchAnalysis.relevance_score || 0) >= 70 ? 'text-green-600' :
                          (jobMatchAnalysis.relevance_score || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(jobMatchAnalysis.relevance_score || 0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Relevance Score</div>
                      </div>
                      
                      {/* Matching Skills Count */}
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                          {(jobMatchAnalysis.matching_skills || []).length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Matching Skills</div>
                      </div>
                      
                      {/* Skill Gaps Count */}
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-amber-600">
                          {(jobMatchAnalysis.skill_gaps || []).length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Skill Gaps</div>
                      </div>
                    </div>

                    {/* Matching Skills */}
                    {jobMatchAnalysis.matching_skills && jobMatchAnalysis.matching_skills.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-medium text-green-800">Matched Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {jobMatchAnalysis.matching_skills.slice(0, 15).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                          {jobMatchAnalysis.matching_skills.length > 15 && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                              +{jobMatchAnalysis.matching_skills.length - 15} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skill Gaps */}
                    {jobMatchAnalysis.skill_gaps && jobMatchAnalysis.skill_gaps.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-amber-800">Skills to Highlight or Develop</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {jobMatchAnalysis.skill_gaps.slice(0, 10).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                          {jobMatchAnalysis.skill_gaps.length > 10 && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
                              +{jobMatchAnalysis.skill_gaps.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transferable Skills */}
                    {jobMatchAnalysis.transferable_skills && jobMatchAnalysis.transferable_skills.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Zap className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-xs font-medium text-purple-800">Transferable Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {jobMatchAnalysis.transferable_skills.slice(0, 8).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Match */}
                    {jobMatchAnalysis.experience_match && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs text-indigo-800">
                            <span className="font-medium">Experience:</span> {typeof jobMatchAnalysis.experience_match === 'string' ? jobMatchAnalysis.experience_match : jobMatchAnalysis.experience_match?.summary || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

        {/* Version History Modal */}
        {state.showVersionHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-purple-600" />
                  CV Version History
                </h2>
                <button
                  onClick={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-500">&times;</span>
                </button>
              </div>
              <div className="p-6">
                <CVVersionHistory
                  currentCVId={state.currentVersionId}
                  onRestore={handleRestoreVersion}
                  onClose={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ATS Details Modal */}
        {state.showATSDetails && atsBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Detailed ATS Analysis
                </h2>
                <button
                  onClick={() => dispatch({ type: 'SET_SHOW_ATS_DETAILS', payload: false })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-500">&times;</span>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Overall Score */}
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {atsScore?.total_score || 0}<span className="text-3xl text-gray-600">/100</span>
                  </div>
                  <p className="text-gray-700 font-medium">Overall ATS Score</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {(atsScore?.total_score || 0) >= 70 && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Excellent - High ATS compatibility</span>
                      </>
                    )}
                    {(atsScore?.total_score || 0) >= 50 && (atsScore?.total_score || 0) < 70 && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">Good - Some improvements needed</span>
                      </>
                    )}
                    {(atsScore?.total_score || 0) < 50 && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700 font-medium">Needs Improvement</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Score Breakdown by Category
                  </h3>
                  <div className="space-y-4">
                    {atsBreakdown && Object.entries(atsBreakdown).map(([category, data]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {category.replace('_', ' ')}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {data.score}/{data.max_score}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              (data.score / data.max_score) >= 0.7 ? 'bg-green-600' :
                              (data.score / data.max_score) >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(data.score / data.max_score) * 100}%` }}
                          />
                        </div>
                        {data.issues && data.issues.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {data.issues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimization Tips */}
                {atsImprovements && atsImprovements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      Optimization Recommendations
                    </h3>
                    <div className="space-y-2">
                      {atsImprovements.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-gray-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVBuilder;
