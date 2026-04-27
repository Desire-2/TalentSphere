import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Download, Eye, Loader2, CheckCircle, AlertTriangle, Briefcase,
  ChevronDown, RefreshCw, History, TrendingUp, Search, UserCircle, X,
  Target, Zap, Award, BarChart3, ClipboardPaste, Sparkles, MapPin,
  GraduationCap, Clock, Brain, ShieldCheck, Maximize2, Minimize2,
  ChevronRight, Star, Layers, Wand2, Palette, Settings2, ListChecks,
  ChevronUp, Info, CheckSquare, Square, Cpu, Lightbulb, TrendingDown,
  PlayCircle, ArrowRight, RotateCcw,
} from 'lucide-react';
import SectionProgressTracker from '../../components/cv/SectionProgressTracker';
import CVRenderer from '../../components/cv/CVRenderer';
import CVVersionHistory from '../../components/cv/CVVersionHistory';
import { generateCV, getUserCVData, getCVStyles, parseJobPosting } from '../../services/cvBuilderService';
import { saveCVVersion, clearAllCVs } from '../../utils/cvStorage';
import apiService from '../../services/api';

// ─── Template metadata ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'professional',
    label: 'Professional',
    desc: 'Classic & ATS-optimised',
    color: '#1d4ed8',
    accent: 'bg-blue-600',
    light: 'bg-blue-50',
    border: 'border-blue-300',
    ring: 'focus:ring-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    preview: ['bg-blue-600', 'bg-blue-100', 'bg-gray-200'],
  },
  {
    id: 'creative',
    label: 'Creative',
    desc: 'Bold & modern flair',
    color: '#7c3aed',
    accent: 'bg-purple-600',
    light: 'bg-purple-50',
    border: 'border-purple-300',
    ring: 'focus:ring-purple-500',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    preview: ['bg-purple-600', 'bg-purple-100', 'bg-gray-200'],
  },
  {
    id: 'modern',
    label: 'Modern',
    desc: 'Teal & contemporary',
    color: '#0d9488',
    accent: 'bg-teal-600',
    light: 'bg-teal-50',
    border: 'border-teal-300',
    ring: 'focus:ring-teal-500',
    text: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    preview: ['bg-teal-600', 'bg-teal-100', 'bg-gray-200'],
  },
];

// ─── Section metadata ─────────────────────────────────────────────────────────
const SECTION_META = [
  { id: 'summary',        icon: FileText,      label: 'Summary',         dataKey: null,             required: true  },
  { id: 'work',           icon: Briefcase,     label: 'Work Experience', dataKey: 'work_experiences', required: true  },
  { id: 'education',      icon: GraduationCap, label: 'Education',       dataKey: 'educations',     required: true  },
  { id: 'skills',         icon: Zap,           label: 'Skills',          dataKey: null,             required: true  },
  { id: 'projects',       icon: Layers,        label: 'Projects',        dataKey: 'projects',       required: false },
  { id: 'certifications', icon: Award,         label: 'Certifications',  dataKey: 'certifications', required: false },
  { id: 'awards',         icon: Star,          label: 'Awards',          dataKey: 'awards',         required: false },
  { id: 'references',     icon: UserCircle,    label: 'References',      dataKey: 'references',     required: false },
];

// ─── Generation phases for animated steps ─────────────────────────────────────
const GEN_PHASES = [
  { key: 'init',         label: 'Initialising ARIA',          icon: Cpu },
  { key: 'analyzing',    label: 'Analysing profile',          icon: Brain },
  { key: 'decoding_job', label: 'Decoding job requirements',  icon: Target },
  { key: 'strategizing', label: 'Planning CV strategy',       icon: Lightbulb },
  { key: 'generating',   label: 'Writing CV draft',           icon: FileText },
  { key: 'humanizing',   label: 'Refining natural language...', icon: Wand2 },
  { key: 'evaluating',   label: 'ATS quality check',          icon: TrendingUp },
  { key: 'complete',     label: 'Finalising',                 icon: CheckCircle },
];

// ─── Reducer ──────────────────────────────────────────────────────────────────
const cvReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':           return { ...state, loading: action.payload };
    case 'SET_USER_DATA':         return { ...state, userData: action.payload };
    case 'SET_SELECTED_STYLE':    return { ...state, selectedStyle: action.payload };
    case 'SET_SELECTED_SECTIONS': return { ...state, selectedSections: action.payload };
    case 'START_GENERATION':      return { ...state, isGenerating: true, error: null, generationProgress: [], todos: [], retryInfo: null, genPhaseIdx: 0 };
    case 'UPDATE_PROGRESS':       return { ...state, generationProgress: action.payload };
    case 'UPDATE_RETRY_INFO':     return { ...state, retryInfo: action.payload };
    case 'SET_GEN_PHASE':         return { ...state, genPhaseIdx: action.payload };
    case 'GENERATION_SUCCESS':
      return {
        ...state,
        isGenerating: false,
        cvContent: action.payload.cvContent,
        atsScore: action.payload.atsScore,
        atsBreakdown: action.payload.atsBreakdown,
        atsImprovements: action.payload.atsImprovements,
        jobMatchAnalysis: action.payload.jobMatchAnalysis || null,
        agentReasoning: action.payload.agentReasoning || null,
        generationMetadata: action.payload.generationMetadata || null,
        generationProgress: action.payload.progress || [],
        todos: action.payload.todos || [],
        error: null,
        isFromCache: false,
        generationTime: action.payload.generationTime,
        currentVersionId: action.payload.currentVersionId,
        genPhaseIdx: GEN_PHASES.length - 1,
      };
    case 'GENERATION_ERROR':
      return { ...state, isGenerating: false, error: action.payload, retryInfo: null, genPhaseIdx: 0 };
    case 'SET_JOB_MODE':          return { ...state, jobMode: action.payload };
    case 'SET_SELECTED_JOB_ID':   return { ...state, selectedJobId: action.payload };
    case 'SET_AVAILABLE_JOBS':    return { ...state, availableJobs: action.payload };
    case 'SET_CUSTOM_JOB':        return { ...state, customJob: action.payload };
    case 'SET_PARSING_JOB':       return { ...state, isParsingJob: action.payload };
    case 'SET_SHOW_ADVANCED_JOB': return { ...state, showAdvancedJobFields: action.payload };
    case 'LOAD_FROM_CACHE':
      return { ...state, cvContent: action.payload.cvContent, atsScore: action.payload.atsScore, isFromCache: true, cacheTimestamp: action.payload.timestamp };
    case 'CLEAR_CACHE':
      return { ...state, cvContent: null, atsScore: null, atsBreakdown: null, atsImprovements: null, jobMatchAnalysis: null, agentReasoning: null, generationMetadata: null, isFromCache: false, cacheTimestamp: null, currentVersionId: null };
    case 'RESTORE_VERSION':
      return { ...state, cvContent: action.payload.cvContent, atsScore: action.payload.atsScore, atsBreakdown: action.payload.atsBreakdown, atsImprovements: action.payload.atsImprovements, selectedStyle: action.payload.selectedStyle, currentVersionId: action.payload.currentVersionId, isFromCache: true, cacheTimestamp: action.payload.timestamp };
    case 'SET_SHOW_VERSION_HISTORY': return { ...state, showVersionHistory: action.payload };
    case 'SET_SHOW_ATS_DETAILS':     return { ...state, showATSDetails: action.payload };
    case 'SET_JOB_SEARCH_QUERY':     return { ...state, jobSearchQuery: action.payload };
    case 'SET_LOADING_JOBS':         return { ...state, loadingJobs: action.payload };
    case 'SET_PROFILE_COMPLETION':   return { ...state, profileCompletion: action.payload };
    case 'SET_SHOW_PROFILE_WARNING': return { ...state, showProfileWarning: action.payload };
    default: return state;
  }
};

const EMPTY_CUSTOM_JOB = { title: '', company: '', description: '', requirements: '', required_skills: '', preferred_skills: '', experience_level: '', employment_type: '', education_requirement: '', location: '', years_experience_min: '', years_experience_max: '', full_posting: '' };

const initialState = {
  loading: false, userData: null,
  selectedStyle: 'professional',
  selectedSections: ['summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'],
  jobMode: 'none', selectedJobId: '', availableJobs: [], customJob: { ...EMPTY_CUSTOM_JOB },
  isParsingJob: false, showAdvancedJobFields: false,
  isGenerating: false, genPhaseIdx: 0, generationProgress: [],
  cvContent: null, atsScore: null, atsBreakdown: null, atsImprovements: null,
  jobMatchAnalysis: null, agentReasoning: null, generationMetadata: null,
  todos: [], error: null, currentVersionId: null,
  showVersionHistory: false, showATSDetails: false,
  isFromCache: false, cacheTimestamp: null, generationTime: null, retryInfo: null,
  jobSearchQuery: '', loadingJobs: false,
  profileCompletion: null, showProfileWarning: false,
};

// ─── Mini components ──────────────────────────────────────────────────────────

const ATSRing = ({ score = 0, size = 56 }) => {
  const r = 18, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 22 22)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="22" y="26.5" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
};

const Pill = ({ children, color = 'blue', className = '' }) => {
  const map = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[color] || map.blue} ${className}`}>{children}</span>;
};

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-2 my-4">
    <div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-gray-400 font-medium px-1">{label}</span><div className="flex-1 h-px bg-gray-100" />
  </div>
);

const Accordion = ({ title, icon: Icon, badge, defaultOpen = false, children, className = '' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100">{children}</div>}
    </div>
  );
};

const TemplateMiniPreview = ({ colors }) => (
  <div className="w-10 h-14 rounded border border-gray-200 bg-white overflow-hidden flex-shrink-0 shadow-sm">
    <div className={`h-3 w-full ${colors[0]}`} />
    <div className="p-1 space-y-0.5">
      <div className={`h-1 w-7 rounded ${colors[1]}`} />
      <div className={`h-0.5 w-5 rounded ${colors[2]}`} />
      <div className={`h-0.5 w-6 rounded ${colors[2]}`} />
    </div>
  </div>
);

const ScoreBar = ({ label, value, max, className = '' }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className={className}>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600 capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="text-xs font-semibold text-gray-800">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Toast = ({ error, onDismiss, onRetry }) => {
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [error, onDismiss]);
  if (!error) return null;
  const icons = { RATE_LIMITED: '⏳', TIMEOUT: '⏱', NETWORK_ERROR: '🌐', SERVER_ERROR: '🔧' };
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-in slide-in-from-bottom-3 duration-300">
      <div className="bg-white border border-red-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-sm">
          {icons[error.code] || '❌'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{error.message}</p>
          {error.suggestion && <p className="text-xs text-gray-500 mt-0.5">{error.suggestion}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onRetry && ['RATE_LIMITED', 'TIMEOUT', 'NETWORK_ERROR', 'SERVER_ERROR'].includes(error.code) && (
            <button onClick={onRetry} className="px-2.5 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
          <button onClick={onDismiss} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const GenerationProgress = ({ genPhaseIdx, ssePhase, isGenerating }) => {
  const sseIdx = ssePhase ? GEN_PHASES.findIndex(p => p.key === ssePhase.phase) : -1;
  const activeIdx = sseIdx >= 0 ? Math.max(genPhaseIdx, sseIdx) : genPhaseIdx;

  return (
    <div className="space-y-2">
      {GEN_PHASES.map((phase, i) => {
        const Icon = phase.icon;
        const done = i < activeIdx;
        const active = i === activeIdx;
        const pending = i > activeIdx;
        return (
          <div key={phase.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
            active ? 'bg-blue-50 border border-blue-200' :
            done ? 'bg-green-50/60' : 'opacity-40'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              active ? 'bg-blue-600 animate-pulse' :
              done ? 'bg-green-500' : 'bg-gray-200'
            }`}>
              {done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> :
               active ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> :
               <Icon className="w-3 h-3 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${active ? 'text-blue-800' : done ? 'text-green-800' : 'text-gray-400'}`}>
                {phase.label}
              </p>
              {active && ssePhase?.message && (
                <p className="text-xs text-blue-500 mt-0.5 truncate">{ssePhase.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CVBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('job_id');
  const jobTitleFromUrl = searchParams.get('job_title');
  const companyFromUrl = searchParams.get('company');
  const descriptionFromUrl = searchParams.get('description');
  const requirementsFromUrl = searchParams.get('requirements');
  const cvRendererRef = useRef(null);

  const [state, dispatch] = useReducer(cvReducer, {
    ...initialState,
    jobMode: jobIdFromUrl ? 'selected' : jobTitleFromUrl ? 'custom' : 'none',
    selectedJobId: jobIdFromUrl || '',
    customJob: jobTitleFromUrl
      ? { ...EMPTY_CUSTOM_JOB, title: jobTitleFromUrl || '', company: companyFromUrl || '', description: descriptionFromUrl || '', requirements: requirementsFromUrl || '' }
      : { ...EMPTY_CUSTOM_JOB },
  });

  const [showPreviewFullScreen, setShowPreviewFullScreen] = useState(false);
  const [showARIAReasoning, setShowARIAReasoning] = useState(false);
  const [ariaTabs, setAriaTabs] = useState('strategy');
  const [ssePhase, setSsePhase] = useState(null);
  const genTimerRef = useRef(null);

  const {
    loading, userData, selectedStyle, selectedSections,
    jobMode, selectedJobId, availableJobs, customJob,
    isGenerating, genPhaseIdx, generationProgress, cvContent,
    atsScore, atsBreakdown, atsImprovements, jobMatchAnalysis,
    agentReasoning, generationMetadata,
    todos, error, isFromCache, cacheTimestamp, generationTime, retryInfo,
    isParsingJob, showAdvancedJobFields,
    currentVersionId, showVersionHistory, showATSDetails,
    profileCompletion, showProfileWarning, loadingJobs,
  } = state;

  // Simulate gen phase advancement when no SSE feedback
  useEffect(() => {
    if (!isGenerating) { clearInterval(genTimerRef.current); return; }
    let idx = 0;
    genTimerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, GEN_PHASES.length - 2);
      dispatch({ type: 'SET_GEN_PHASE', payload: idx });
    }, 2800);
    return () => clearInterval(genTimerRef.current);
  }, [isGenerating]);

  // ── Load initial data ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const cachedCV = localStorage.getItem('lastGeneratedCV');
        const cachedTS = localStorage.getItem('lastCVTimestamp');
        const cachedStyle = localStorage.getItem('lastCVStyle');
        const cachedATS = localStorage.getItem('lastATSScore');
        if (cachedCV) {
          try {
            dispatch({ type: 'LOAD_FROM_CACHE', payload: { cvContent: JSON.parse(cachedCV), atsScore: cachedATS ? JSON.parse(cachedATS) : null, timestamp: cachedTS } });
            if (cachedStyle) dispatch({ type: 'SET_SELECTED_STYLE', payload: cachedStyle });
          } catch { localStorage.removeItem('lastGeneratedCV'); }
        }

        const [userRes] = await Promise.all([getUserCVData()]);
        dispatch({ type: 'SET_USER_DATA', payload: userRes.data });

        const ud = userRes.data;
        if (ud) {
          const fields = [ud.first_name, ud.last_name, ud.email, ud.phone, ud.location, ud.job_seeker_profile?.professional_title, ud.job_seeker_profile?.skills, ud.job_seeker_profile?.years_of_experience, ud.job_seeker_profile?.education_level];
          const hasWork = (ud.work_experiences?.length || 0) > 0;
          const hasEdu = (ud.educations?.length || 0) > 0;
          const total = fields.length + 2;
          const filled = fields.filter(f => f && String(f).trim()).length + (hasWork ? 1 : 0) + (hasEdu ? 1 : 0);
          const pct = Math.round((filled / total) * 100);
          dispatch({ type: 'SET_PROFILE_COMPLETION', payload: pct });
          if (pct < 60) dispatch({ type: 'SET_SHOW_PROFILE_WARNING', payload: true });
        }

        try {
          dispatch({ type: 'SET_LOADING_JOBS', payload: true });
          const jobsRes = await apiService.getJobs({ per_page: 200 });
          const jobs = Array.isArray(jobsRes) ? jobsRes : jobsRes?.jobs || jobsRes?.data?.jobs || jobsRes?.items || [];
          if (jobs.length > 0) dispatch({ type: 'SET_AVAILABLE_JOBS', payload: jobs });
        } catch { /* jobs are optional */ }
        finally { dispatch({ type: 'SET_LOADING_JOBS', payload: false }); }

      } catch (err) {
        console.error('Load error:', err);
        dispatch({ type: 'GENERATION_ERROR', payload: { message: 'Failed to load CV builder', code: 'LOAD_ERROR' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, []);

  const toggleSection = useCallback((id) => {
    const meta = SECTION_META.find(s => s.id === id);
    if (meta?.required) return;
    const next = selectedSections.includes(id)
      ? selectedSections.filter(s => s !== id)
      : [...selectedSections, id];
    dispatch({ type: 'SET_SELECTED_SECTIONS', payload: next });
  }, [selectedSections]);

  const handleParseJobPosting = async () => {
    if (!customJob.full_posting?.trim() || customJob.full_posting.trim().length < 30) return;
    dispatch({ type: 'SET_PARSING_JOB', payload: true });
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
        },
      });
      dispatch({ type: 'SET_SHOW_ADVANCED_JOB', payload: true });
    } catch (e) {
      dispatch({ type: 'GENERATION_ERROR', payload: { message: `Parse failed: ${e.message}`, code: 'PARSE_ERROR' } });
    } finally {
      dispatch({ type: 'SET_PARSING_JOB', payload: false });
    }
  };

  const handleGenerateCV = async () => {
    dispatch({ type: 'START_GENERATION' });
    setSsePhase(null);
    const startTime = Date.now();
    try {
      let jobData = {};
      if (jobMode === 'selected' && selectedJobId) jobData = { job_id: parseInt(selectedJobId) };
      else if (jobMode === 'custom' && customJob.title) jobData = { custom_job: customJob };

      const response = await generateCV(
        { ...jobData, style: selectedStyle, sections: selectedSections, use_section_by_section: true },
        {
          onRetryWait: ({ attempt, waitSeconds, error: e }) =>
            dispatch({ type: 'UPDATE_RETRY_INFO', payload: { attempt, waitSeconds, errorCode: e.code, message: e.message } }),
          onPhaseUpdate: ({ phase, message: msg }) => setSsePhase({ phase, message: msg }),
        }
      );

      if (response.success) {
        const genTime = ((Date.now() - startTime) / 1000).toFixed(2);
        let versionId = null;
        try {
          versionId = await saveCVVersion(response.data.cv_content, {
            style: selectedStyle,
            jobTitle: jobMode === 'custom' ? customJob.title : jobMode === 'selected' ? (availableJobs.find(j => j.id === parseInt(selectedJobId))?.title || 'Job') : 'General CV',
            jobId: selectedJobId,
            sections: selectedSections,
            atsScore: response.data.ats_score,
          });
        } catch { /* version non-critical */ }

        try {
          localStorage.setItem('lastGeneratedCV', JSON.stringify(response.data.cv_content));
          localStorage.setItem('lastCVTimestamp', new Date().toISOString());
          localStorage.setItem('lastCVStyle', selectedStyle);
          if (response.data.ats_score) localStorage.setItem('lastATSScore', JSON.stringify(response.data.ats_score));
        } catch { /* quota */ }

        dispatch({
          type: 'GENERATION_SUCCESS',
          payload: {
            cvContent: response.data.cv_content,
            atsScore: response.data.ats_score,
            atsBreakdown: response.data.ats_breakdown,
            atsImprovements: response.data.ats_improvements,
            jobMatchAnalysis: response.data.job_match_analysis || response.data.cv_content?.job_match_analysis || null,
            agentReasoning: response.data.agent_reasoning || null,
            generationMetadata: response.data.metadata || null,
            progress: response.data.progress || [],
            todos: response.data.todos || [],
            generationTime: genTime,
            currentVersionId: versionId,
          },
        });
        setSsePhase(null);
      } else {
        throw new Error(response.message || 'Generation failed');
      }
    } catch (err) {
      console.error('CV generation error:', err);
      const errMap = {
        RATE_LIMITED: { message: `Rate limited — wait ${err.retryAfter || 60}s`, suggestion: 'The AI service is busy. Try again shortly.' },
        TIMEOUT:      { message: 'Generation timed out (120s)', suggestion: 'Try selecting fewer sections.' },
        NETWORK_ERROR:{ message: 'Network connection failed', suggestion: 'Check your internet and retry.' },
        SERVER_ERROR: { message: 'Server error — please retry', suggestion: 'The server is temporarily unavailable.' },
      };
      const info = errMap[err.code] || { message: err.message || 'Generation failed', suggestion: 'If this persists, try fewer sections.' };
      dispatch({ type: 'GENERATION_ERROR', payload: { ...info, code: err.code || 'UNKNOWN' } });
      setSsePhase(null);
    }
  };

  const handleRestoreVersion = (version) => {
    dispatch({ type: 'RESTORE_VERSION', payload: { cvContent: version.cvContent, atsScore: version.metadata.atsScore || null, atsBreakdown: version.metadata.atsBreakdown || null, atsImprovements: version.metadata.atsImprovements || null, currentVersionId: version.id, selectedStyle: version.metadata.style || 'professional', timestamp: version.timestamp } });
    dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false });
  };

  const handleDownload = async () => {
    if (!cvContent || !cvRendererRef.current) return;
    try { await cvRendererRef.current.exportToPDF(); }
    catch (e) { console.error('PDF export error:', e); }
  };

  const handleClearCache = () => {
    clearAllCVs();
    ['lastGeneratedCV','lastCVTimestamp','lastCVStyle','lastATSScore'].forEach(k => localStorage.removeItem(k));
    dispatch({ type: 'CLEAR_CACHE' });
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedJobObj = availableJobs.find(j => String(j.id) === String(selectedJobId));
  const atsTotal = atsScore?.total_score || cvContent?.ats_score?.total_score || 0;
  const jobForDisplay = jobMode === 'custom' ? customJob.title : jobMode === 'selected' ? selectedJobObj?.title : null;
  const isReady = !isGenerating && selectedSections.length > 0 && !(jobMode === 'custom' && !customJob.title);
  const activeTpl = TEMPLATES.find(t => t.id === selectedStyle) || TEMPLATES[0];
  const filteredJobs = (() => {
    const q = (state.jobSearchQuery || '').toLowerCase();
    return q ? availableJobs.filter(j => (j.title || '').toLowerCase().includes(q) || (j.company_name || j.company?.name || '').toLowerCase().includes(q)) : availableJobs;
  })();

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">Loading ARIA CV Builder</p>
            <p className="text-sm text-gray-500">Setting up your workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col gap-3">

      {/* ── Profile summary card ── */}
      {userData && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{userData.first_name} {userData.last_name}</p>
              <p className="text-xs text-gray-400 truncate">{userData.job_seeker_profile?.professional_title || 'Professional'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Profile completeness</span>
            <span className="text-xs font-bold text-white">{profileCompletion ?? '—'}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${(profileCompletion ?? 0) >= 80 ? 'bg-green-400' : (profileCompletion ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${profileCompletion ?? 0}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { key: 'work_experiences', label: 'Jobs' },
              { key: 'educations', label: 'Edu' },
              { key: 'certifications', label: 'Certs' },
            ].map(({ key, label }) => (
              <div key={key} className="bg-white/10 rounded-lg py-1.5">
                <div className="text-sm font-bold">{userData[key]?.length || 0}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>

          {(profileCompletion ?? 100) < 60 && (
            <button onClick={() => navigate('/jobseeker/profile')} className="mt-3 w-full py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5">
              <Settings2 className="w-3 h-3" /> Complete your profile
            </button>
          )}
        </div>
      )}

      {/* ── Job target accordion ── */}
      <Accordion
        title="Target Job"
        icon={Target}
        defaultOpen={true}
        badge={jobMode !== 'none' && <Pill color="green"><CheckCircle className="w-3 h-3" /> Set</Pill>}
      >
        <div className="mt-3 space-y-3">
          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl">
            {[['none', 'General'], ['selected', 'Browse'], ['custom', 'Custom']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => dispatch({ type: 'SET_JOB_MODE', payload: val })}
                disabled={isGenerating}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${jobMode === val ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {jobMode === 'none' && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-gray-400" />General CV</p>
              <p className="text-xs text-gray-500">No job targeting. Works well for networking and speculative applications.</p>
            </div>
          )}

          {jobMode === 'selected' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={state.jobSearchQuery || ''}
                  onChange={e => dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: e.target.value })}
                  placeholder="Search jobs…"
                  disabled={isGenerating}
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
                {state.jobSearchQuery && (
                  <button onClick={() => dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {selectedJobId && selectedJobObj && (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 truncate">{selectedJobObj.title}</p>
                    <p className="text-xs text-blue-600 truncate">{selectedJobObj.company_name || selectedJobObj.company?.name}</p>
                  </div>
                  <button onClick={() => dispatch({ type: 'SET_SELECTED_JOB_ID', payload: '' })} className="text-blue-300 hover:text-blue-600 flex-shrink-0 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {loadingJobs ? (
                <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading jobs…
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50 bg-white">
                  {!filteredJobs.length
                    ? <p className="p-4 text-center text-xs text-gray-400">{state.jobSearchQuery ? 'No matches' : 'No jobs available'}</p>
                    : filteredJobs.slice(0, 50).map(job => (
                      <button
                        key={job.id}
                        onClick={() => { dispatch({ type: 'SET_SELECTED_JOB_ID', payload: String(job.id) }); dispatch({ type: 'SET_JOB_SEARCH_QUERY', payload: '' }); }}
                        disabled={isGenerating}
                        className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors ${String(selectedJobId) === String(job.id) ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                      >
                        <p className="text-xs font-semibold text-gray-800 truncate">{job.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{job.company_name || job.company?.name}{job.location ? ` · ${job.location}` : ''}</p>
                      </button>
                    ))
                  }
                </div>
              )}
              <p className="text-xs text-gray-400 text-right">{availableJobs.length} job{availableJobs.length !== 1 ? 's' : ''} available</p>
            </div>
          )}

          {jobMode === 'custom' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">AI Job Parser</span>
                  <Pill color="purple">AI</Pill>
                </div>
                <textarea
                  value={customJob.full_posting}
                  onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, full_posting: e.target.value } })}
                  placeholder="Paste the full job posting here and let AI extract all fields automatically…"
                  rows={3}
                  disabled={isGenerating || isParsingJob}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none resize-none bg-white mb-2"
                />
                <button
                  onClick={handleParseJobPosting}
                  disabled={isGenerating || isParsingJob || !customJob.full_posting || customJob.full_posting.trim().length < 30}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isParsingJob ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Parsing…</> : <><Wand2 className="w-3.5 h-3.5" />Auto-fill from posting</>}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or enter manually</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                  <input type="text" value={customJob.title} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, title: e.target.value } })} placeholder="Software Engineer" disabled={isGenerating} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                  <input type="text" value={customJob.company} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, company: e.target.value } })} placeholder="Acme Corp" disabled={isGenerating} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={customJob.description} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, description: e.target.value } })} placeholder="Role responsibilities…" rows={2} disabled={isGenerating} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Requirements</label>
                <textarea value={customJob.requirements} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, requirements: e.target.value } })} placeholder="Key qualifications…" rows={2} disabled={isGenerating} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Required Skills</label>
                <input type="text" value={customJob.required_skills} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, required_skills: e.target.value } })} placeholder="Python, React, SQL…" disabled={isGenerating} className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <button onClick={() => dispatch({ type: 'SET_SHOW_ADVANCED_JOB', payload: !showAdvancedJobFields })} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedJobFields ? 'rotate-180' : ''}`} />
                {showAdvancedJobFields ? 'Hide' : 'Show'} advanced fields
              </button>

              {showAdvancedJobFields && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Skills</label>
                    <input type="text" value={customJob.preferred_skills} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, preferred_skills: e.target.value } })} placeholder="Docker, AWS…" disabled={isGenerating} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Experience Level</label>
                      <select value={customJob.experience_level} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, experience_level: e.target.value } })} disabled={isGenerating} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white">
                        <option value="">Auto</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Employment Type</label>
                      <select value={customJob.employment_type} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, employment_type: e.target.value } })} disabled={isGenerating} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white">
                        <option value="">Auto</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Location</label>
                      <input type="text" value={customJob.location} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, location: e.target.value } })} placeholder="Remote / City" disabled={isGenerating} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Education</label>
                      <select value={customJob.education_requirement} onChange={e => dispatch({ type: 'SET_CUSTOM_JOB', payload: { ...customJob, education_requirement: e.target.value } })} disabled={isGenerating} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white">
                        <option value="">Any</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {customJob.title && (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-800">Tailored for <strong>{customJob.title}</strong>{customJob.company ? ` at ${customJob.company}` : ''}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Accordion>

      {/* ── Template accordion ── */}
      <Accordion
        title="Template"
        icon={Palette}
        badge={<Pill color="blue">{activeTpl.label}</Pill>}
      >
        <div className="mt-3 space-y-2">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => dispatch({ type: 'SET_SELECTED_STYLE', payload: tpl.id })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left ${
                selectedStyle === tpl.id
                  ? `${tpl.border} ${tpl.light} shadow-sm`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <TemplateMiniPreview colors={tpl.preview} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{tpl.label}</p>
                <p className="text-xs text-gray-500">{tpl.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${selectedStyle === tpl.id ? `${tpl.accent} border-transparent` : 'border-gray-300'}`}>
                {selectedStyle === tpl.id && <div className="w-full h-full rounded-full bg-white scale-50 block" />}
              </div>
            </button>
          ))}
          <p className="text-xs text-gray-400 pt-1">You can switch templates at any time without regenerating.</p>
        </div>
      </Accordion>

      {/* ── Sections accordion ── */}
      <Accordion
        title="Sections"
        icon={ListChecks}
        badge={<Pill color="gray">{selectedSections.length}/{SECTION_META.length}</Pill>}
      >
        <div className="mt-3 space-y-1.5">
          {SECTION_META.map(sec => {
            const Icon = sec.icon;
            const count = sec.dataKey ? (userData?.[sec.dataKey]?.length ?? 0) : null;
            const isOn = selectedSections.includes(sec.id);
            return (
              <label
                key={sec.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  sec.required
                    ? 'bg-blue-50/60 border-blue-100 cursor-default'
                    : isOn
                    ? 'bg-white border-blue-200 shadow-sm cursor-pointer'
                    : 'bg-gray-50 border-gray-100 hover:border-gray-200 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggleSection(sec.id)}
                  disabled={sec.required || isGenerating}
                  className="sr-only"
                />
                <div className={`w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center transition-all ${isOn ? 'text-blue-600' : 'text-gray-300'}`}>
                  {isOn ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </div>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isOn ? 'text-blue-500' : 'text-gray-300'}`} />
                <span className={`flex-1 text-xs font-medium ${isOn ? 'text-gray-800' : 'text-gray-400'}`}>{sec.label}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {count !== null && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                  )}
                  {sec.required && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Fixed</span>}
                </div>
              </label>
            );
          })}
        </div>
      </Accordion>

      {/* ── Generate button ── */}
      <div className="sticky bottom-0 pt-2 pb-1 bg-gray-50/80 backdrop-blur-sm">
        {jobForDisplay && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl mb-2">
            <Target className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-800 truncate">Targeting: <strong className="font-semibold">{jobForDisplay}</strong></p>
          </div>
        )}

        <button
          onClick={handleGenerateCV}
          disabled={!isReady}
          className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{ssePhase ? `${ssePhase.phase.replace(/_/g,' ')}…` : 'Generating…'}</>
          ) : (
            <><Wand2 className="w-4 h-4" />{cvContent ? 'Regenerate CV' : 'Generate CV'}<ArrowRight className="w-4 h-4 ml-auto opacity-60" /></>
          )}
        </button>

        {!isGenerating && (
          <p className="text-center text-xs text-gray-400 mt-1.5">
            {selectedSections.length} sections · {activeTpl.label}
            {jobMode !== 'none' ? ' · Job-tailored' : ' · General'}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Floating action bar (when CV exists) ──────────────────────────── */}
      {cvContent && !showPreviewFullScreen && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm hidden sm:inline">ARIA CV Builder</span>
              {generationTime && <span className="text-xs text-gray-400 hidden md:inline">· {generationTime}s</span>}
              {isFromCache && <Pill color="amber"><Clock className="w-3 h-3" />Cached</Pill>}
            </div>

            {atsTotal > 0 && (
              <button onClick={() => dispatch({ type: 'SET_SHOW_ATS_DETAILS', payload: true })} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors" title="ATS Details">
                <ATSRing score={atsTotal} size={32} />
                <span className="text-xs font-semibold text-gray-600 hidden sm:inline">ATS</span>
              </button>
            )}

            {jobMatchAnalysis?.relevance_score != null && (
              <Pill color={jobMatchAnalysis.relevance_score >= 70 ? 'green' : jobMatchAnalysis.relevance_score >= 40 ? 'amber' : 'red'}>
                <Target className="w-3 h-3" />{Math.round(jobMatchAnalysis.relevance_score)}% Match
              </Pill>
            )}

            <div className="flex items-center gap-0.5 p-1 bg-gray-100 rounded-lg">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => dispatch({ type: 'SET_SELECTED_STYLE', payload: t.id })} title={`${t.label} template`}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${selectedStyle === t.id ? `${t.badge} shadow-sm` : 'text-gray-500 hover:text-gray-800'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {cvContent && !isFromCache && (
              <button onClick={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: true })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <History className="w-3.5 h-3.5" /><span className="hidden sm:inline">History</span>
              </button>
            )}

            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Download PDF</span>
            </button>

            <button onClick={() => setShowPreviewFullScreen(f => !f)} className="p-2 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors" title="Full screen">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Page header ── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-200">
                <Brain className="w-5 h-5 text-white" />
              </div>
              ARIA CV Builder
            </h1>
            <p className="mt-1 text-sm text-gray-500">AI-powered, job-tailored CVs — generated in seconds</p>
          </div>
          {isFromCache && (
            <button onClick={handleClearCache} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100">
              <RotateCcw className="w-3.5 h-3.5" />Clear cached CV
            </button>
          )}
        </div>

        {/* ── URL job autofill notice ── */}
        {jobIdFromUrl && jobTitleFromUrl && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900">Tailoring for <span className="underline">{jobTitleFromUrl}</span>{companyFromUrl && <span className="font-normal text-blue-700"> at {companyFromUrl}</span>}</p>
              <p className="text-xs text-blue-600 mt-0.5">Job details pre-filled. Review settings then click Generate.</p>
            </div>
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          </div>
        )}

        {/* ── Retry banner ── */}
        {retryInfo && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-amber-900">Retrying — Attempt {retryInfo.attempt}/3</p>
              <p className="text-xs text-amber-700 mt-0.5">{retryInfo.message}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <span className="text-3xl font-black text-amber-600 tabular-nums leading-none">{retryInfo.waitSeconds}</span>
              <p className="text-xs text-amber-500">sec</p>
            </div>
          </div>
        )}

        {/* ── Main layout ── */}
        <div className={`grid gap-6 items-start ${showPreviewFullScreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[360px_1fr]'}`}>

          {/* ── Sidebar ── */}
          {!showPreviewFullScreen && (
            <div className="lg:sticky lg:top-[60px] max-h-[calc(100vh-80px)] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <SidebarContent />
            </div>
          )}

          {/* ── Right panel ── */}
          <div className="min-w-0 space-y-4">

            {/* Generating progress */}
            {isGenerating && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-md shadow-blue-50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -right-0.5 -bottom-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-white">ARIA is building your CV…</p>
                    <p className="text-blue-100 text-xs mt-0.5">{ssePhase?.message || 'Analysing your profile and job requirements'}</p>
                  </div>
                </div>
                <div className="p-5">
                  <GenerationProgress genPhaseIdx={genPhaseIdx} ssePhase={ssePhase} isGenerating={isGenerating} />
                </div>
              </div>
            )}

            {/* CV preview */}
            {cvContent && !isGenerating && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Preview header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-800">CV Preview</h2>
                    {generationTime && <span className="text-xs text-gray-400">· {generationTime}s</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {atsTotal > 0 && (
                      <button onClick={() => dispatch({ type: 'SET_SHOW_ATS_DETAILS', payload: true })} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors">
                        <ATSRing score={atsTotal} size={28} />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900 leading-none">{atsTotal}/100</p>
                          <p className="text-xs text-gray-400">ATS Score</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                      </button>
                    )}
                    {showPreviewFullScreen && (
                      <button onClick={() => setShowPreviewFullScreen(false)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline ATS bar */}
                {atsTotal > 0 && (
                  <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${atsTotal >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : atsTotal >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                        style={{ width: `${Math.min(100, atsTotal)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold whitespace-nowrap ${atsTotal >= 70 ? 'text-green-700' : atsTotal >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {atsTotal >= 70 ? '✓ ATS Ready' : atsTotal >= 50 ? '⚠ Needs work' : '✗ Low score'} ({atsTotal})
                    </span>
                  </div>
                )}

                {/* Job match analysis */}
                {jobMatchAnalysis && (
                  <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border-b border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-bold text-indigo-900">Job Match Analysis</span>
                      {jobMatchAnalysis.relevance_score != null && (
                        <Pill color={jobMatchAnalysis.relevance_score >= 70 ? 'green' : jobMatchAnalysis.relevance_score >= 40 ? 'amber' : 'red'}>
                          {Math.round(jobMatchAnalysis.relevance_score)}% match
                        </Pill>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Relevance', val: `${Math.round(jobMatchAnalysis.relevance_score || 0)}%`, color: (jobMatchAnalysis.relevance_score || 0) >= 70 ? 'text-green-600' : (jobMatchAnalysis.relevance_score || 0) >= 40 ? 'text-amber-600' : 'text-red-600' },
                        { label: 'Skills Matched', val: (jobMatchAnalysis.matching_skills || []).length, color: 'text-blue-600' },
                        { label: 'Skill Gaps', val: (jobMatchAnalysis.skill_gaps || []).length, color: 'text-amber-600' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                          <div className={`text-xl font-black ${stat.color}`}>{stat.val}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {jobMatchAnalysis.matching_skills?.length > 0 && (
                      <div className="mb-2.5">
                        <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {jobMatchAnalysis.matching_skills.slice(0, 12).map((s, i) => <Pill key={i} color="green">{s}</Pill>)}
                          {jobMatchAnalysis.matching_skills.length > 12 && <Pill color="gray">+{jobMatchAnalysis.matching_skills.length - 12}</Pill>}
                        </div>
                      </div>
                    )}
                    {jobMatchAnalysis.skill_gaps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Skill Gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {jobMatchAnalysis.skill_gaps.slice(0, 8).map((s, i) => <Pill key={i} color="amber">{s}</Pill>)}
                          {jobMatchAnalysis.skill_gaps.length > 8 && <Pill color="gray">+{jobMatchAnalysis.skill_gaps.length - 8}</Pill>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ARIA Reasoning panel */}
                {agentReasoning && (
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setShowARIAReasoning(p => !p)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 hover:from-purple-100/70 hover:to-indigo-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center">
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-purple-900">How ARIA built your CV</span>
                        {generationMetadata?.quality_gate_passed && <Pill color="green"><ShieldCheck className="w-3 h-3" />Verified</Pill>}
                        {generationMetadata?.internal_revisions > 0 && <Pill color="blue">{generationMetadata.internal_revisions} revision{generationMetadata.internal_revisions !== 1 ? 's' : ''}</Pill>}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-200 flex-shrink-0 ${showARIAReasoning ? 'rotate-180' : ''}`} />
                    </button>

                    {showARIAReasoning && (
                      <div className="bg-white">
                        {/* Tabs */}
                        <div className="flex gap-0 border-b border-gray-100 px-5">
                          {[
                            { key: 'strategy', label: 'Strategy', icon: Lightbulb },
                            { key: 'analysis', label: 'Analysis', icon: Brain },
                            { key: 'decisions', label: 'Decisions', icon: CheckSquare },
                          ].map(tab => (
                            <button
                              key={tab.key}
                              onClick={() => setAriaTabs(tab.key)}
                              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${ariaTabs === tab.key ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                              <tab.icon className="w-3.5 h-3.5" />{tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="p-5 space-y-3">
                          {ariaTabs === 'strategy' && (
                            <>
                              {agentReasoning.match_level && (
                                <div className="flex items-center gap-2">
                                  <Pill color={agentReasoning.match_level === 'HIGH' ? 'green' : agentReasoning.match_level === 'MEDIUM' ? 'amber' : 'red'}>
                                    {agentReasoning.match_level} Match
                                  </Pill>
                                  {agentReasoning.job_match_score != null && <span className="text-sm text-gray-600">Score: <strong>{agentReasoning.job_match_score}%</strong></span>}
                                </div>
                              )}
                              {agentReasoning.strategy_chosen && (
                                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                  <p className="text-xs font-bold text-purple-600 uppercase mb-1">Strategy</p>
                                  <p className="text-sm text-gray-700">{agentReasoning.strategy_chosen}</p>
                                </div>
                              )}
                              {agentReasoning.confidence_score != null && (
                                <div>
                                  <div className="flex justify-between mb-1.5">
                                    <p className="text-xs font-semibold text-gray-600">ARIA Confidence</p>
                                    <span className="text-sm font-black text-indigo-700">{agentReasoning.confidence_score}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, agentReasoning.confidence_score)}%` }} />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          {ariaTabs === 'analysis' && (
                            <div className="space-y-3">
                              {agentReasoning.candidate_analysis && (
                                <div className="p-3 bg-gray-50 rounded-xl">
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Candidate Analysis</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{agentReasoning.candidate_analysis}</p>
                                </div>
                              )}
                              {agentReasoning.job_decoding && (
                                <div className="p-3 bg-blue-50 rounded-xl">
                                  <p className="text-xs font-bold text-blue-400 uppercase mb-1.5">Job Decoded</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{agentReasoning.job_decoding}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {ariaTabs === 'decisions' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-500 uppercase mb-1.5">Writing Style Decisions</p>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  {agentReasoning.writing_style || 'ARIA selected a voice based on the candidate profile and target role, then adjusted wording to sound natural and specific.'}
                                </p>
                              </div>

                              {agentReasoning.key_decisions?.length > 0 ? (
                                <ul className="space-y-2">
                                  {agentReasoning.key_decisions.map((d, i) => (
                                    <li key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                      <p className="text-xs text-gray-700">{d}</p>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500">No additional decision notes were provided for this run.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CV renderer */}
                <div className="p-4 sm:p-6">
                  <CVRenderer
                    ref={cvRendererRef}
                    cvData={cvContent}
                    selectedTemplate={selectedStyle}
                    onExport={(status, msg) => { if (status === 'error') console.error('Export error:', msg); }}
                  />
                </div>
              </div>
            )}

            {/* Empty state */}
            {!cvContent && !isGenerating && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-14 text-center">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-200">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl border-2 border-gray-100 shadow-md flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to build your CV</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
                    Configure your target job in the sidebar, choose a template, and click <strong>Generate CV</strong> — ARIA will craft a tailored, ATS-optimised CV in seconds.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-2xl mx-auto">
                    {[
                      { icon: Target,    color: 'bg-blue-600',   label: 'Analyse',   desc: 'Decodes job requirements & identifies critical keywords' },
                      { icon: Brain,     color: 'bg-purple-600', label: 'Strategise', desc: 'Plans a narrative angle and tailoring strategy' },
                      { icon: Wand2,     color: 'bg-teal-600',   label: 'Generate',  desc: 'Writes achievement-driven, ATS-optimised content' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                        <div className={`w-9 h-9 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <step.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Step {i + 1}: {step.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Profile data chips */}
                  {userData && (
                    <div className="inline-flex flex-wrap justify-center gap-2">
                      {[
                        { key: 'work_experiences', label: 'Work Experience', icon: Briefcase },
                        { key: 'educations',       label: 'Education',       icon: GraduationCap },
                        { key: 'certifications',   label: 'Certifications',  icon: Award },
                        { key: 'projects',         label: 'Projects',        icon: Layers },
                        { key: 'references',       label: 'References',      icon: UserCircle },
                      ].map(({ key, label, icon: Icon }) => {
                        const count = userData[key]?.length || 0;
                        return (
                          <span key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${count > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                            <Icon className="w-3.5 h-3.5" />{count} {label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick start CTA */}
                  <div className="mt-8">
                    <button
                      onClick={handleGenerateCV}
                      disabled={!isReady}
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                      <PlayCircle className="w-5 h-5" />
                      {jobMode !== 'none' ? 'Generate Job-Tailored CV' : 'Generate General CV'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast error ── */}
      <Toast
        error={error}
        onDismiss={() => dispatch({ type: 'GENERATION_ERROR', payload: null })}
        onRetry={handleGenerateCV}
      />

      {/* ── Version History Modal ── */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><History className="w-5 h-5 text-purple-600" />CV Version History</h2>
              <button onClick={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false })} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6">
              <CVVersionHistory currentCVId={currentVersionId} onRestore={handleRestoreVersion} onClose={() => dispatch({ type: 'SET_SHOW_VERSION_HISTORY', payload: false })} />
            </div>
          </div>
        </div>
      )}

      {/* ── ATS Details Modal ── */}
      {showATSDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />ATS Score Breakdown</h2>
              <button onClick={() => dispatch({ type: 'SET_SHOW_ATS_DETAILS', payload: false })} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall score */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overall ATS Score</p>
                  <div className="text-6xl font-black text-gray-900 leading-none">{atsTotal}<span className="text-2xl text-gray-300 font-normal">/100</span></div>
                  <p className={`text-sm font-semibold mt-2 ${atsTotal >= 70 ? 'text-green-700' : atsTotal >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                    {atsTotal >= 70 ? '✓ Excellent ATS compatibility' : atsTotal >= 50 ? '⚠ Good — some improvements needed' : '✗ Needs significant improvement'}
                  </p>
                </div>
                <ATSRing score={atsTotal} size={88} />
              </div>

              {/* Breakdown bars */}
              {atsBreakdown && Object.keys(atsBreakdown).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Category Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(atsBreakdown).map(([cat, data]) => (
                      <div key={cat} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <ScoreBar label={cat} value={data.score} max={data.max_score} />
                        {data.issues?.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {data.issues.map((issue, i) => <li key={i} className="text-xs text-red-600 flex items-start gap-1.5"><span className="mt-0.5">•</span>{issue}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {atsImprovements?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-blue-600" />Recommendations</h3>
                  <div className="space-y-2">
                    {atsImprovements.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <p className="text-xs text-gray-700">{tip}</p>
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
  );
};

export default CVBuilder;
