import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, CheckCircle, AlertTriangle, Briefcase, ChevronDown } from 'lucide-react';
import SectionProgressTracker from '../../components/cv/SectionProgressTracker';
import CVRenderer from '../../components/cv/CVRenderer';
import { generateCV, getUserCVData, getCVStyles } from '../../services/cvBuilderService';

const CVBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('job_id');
  const cvRendererRef = useRef(null);

  // State management
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cvStyles, setCVStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [selectedSections, setSelectedSections] = useState([
    'summary', 'work', 'education', 'skills', 'projects', 'certifications', 'awards', 'references'
  ]);
  
  // Job selection state
  const [jobMode, setJobMode] = useState(jobIdFromUrl ? 'selected' : 'none'); // 'none', 'selected', 'custom'
  const [selectedJobId, setSelectedJobId] = useState(jobIdFromUrl || '');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [customJob, setCustomJob] = useState({
    title: '',
    company: '',
    description: '',
    requirements: ''
  });
  const [showJobSection, setShowJobSection] = useState(true);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState([]);
  const [cvContent, setCvContent] = useState(null);
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);

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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [userResponse, stylesResponse] = await Promise.all([
          getUserCVData(),
          getCVStyles()
        ]);
        
        setUserData(userResponse.data);
        if (stylesResponse.data) {
          setCVStyles(stylesResponse.data);
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
            // Extract unique jobs from applications
            const jobs = jobsData.data?.map(app => app.job).filter(job => job) || [];
            setAvailableJobs(jobs);
          }
        } catch (jobErr) {
          console.log('Could not fetch applied jobs:', jobErr);
          // Not critical, continue without jobs
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load CV builder data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Toggle section selection
  const toggleSection = (sectionId) => {
    const section = availableSections.find(s => s.id === sectionId);
    if (section?.required) return; // Can't deselect required sections

    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Generate CV
  const handleGenerateCV = async () => {
    setIsGenerating(true);
    setGenerationProgress([]);
    setTodos([]);
    setError(null);

    try {
      // Prepare job data based on mode
      let jobData = null;
      if (jobMode === 'selected' && selectedJobId) {
        jobData = { job_id: parseInt(selectedJobId) };
      } else if (jobMode === 'custom' && customJob.title) {
        jobData = { custom_job: customJob };
      }

      const response = await generateCV({
        ...jobData,
        style: selectedStyle,
        sections: selectedSections,
        use_section_by_section: true
      });

      console.log('🎯 Generate CV response:', response);

      if (response.success) {
        console.log('✅ Setting CV content and progress...');
        console.log('   - CV content length:', response.data.cv_content?.length || 0);
        console.log('   - Progress items:', response.data.progress?.length || 0);
        console.log('   - Todos items:', response.data.todos?.length || 0);
        
        setCvContent(response.data.cv_content);
        setGenerationProgress(response.data.progress || []);
        setTodos(response.data.todos || []);
        
        // Show success message
        console.log('✅ CV generated successfully!', response.data);
      } else {
        console.error('❌ Response success=false:', response);
        setError(response.message || 'Failed to generate CV');
      }
    } catch (err) {
      console.error('CV generation error:', err);
      setError(err.message || 'An error occurred while generating CV');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download CV as PDF using client-side export
  const handleDownload = async () => {
    if (!cvContent || !cvRendererRef.current) {
      setError('CV content not ready for export');
      return;
    }

    try {
      // Call the exportToPDF function from CVRenderer
      await cvRendererRef.current.exportToPDF();
      console.log('✅ PDF export initiated successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err.message || 'Failed to export PDF. Please ensure popups are allowed.');
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
            </div>
            {cvContent && (
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Job Selection/Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                onClick={() => setShowJobSection(!showJobSection)}
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
                        onChange={(e) => setJobMode(e.target.value)}
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
                        onChange={(e) => setJobMode(e.target.value)}
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
                        onChange={(e) => setSelectedJobId(e.target.value)}
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
                          onChange={(e) => setCustomJob({ ...customJob, title: e.target.value })}
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
                          onChange={(e) => setCustomJob({ ...customJob, company: e.target.value })}
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
                          onChange={(e) => setCustomJob({ ...customJob, description: e.target.value })}
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
                          onChange={(e) => setCustomJob({ ...customJob, requirements: e.target.value })}
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
                onChange={(e) => setSelectedStyle(e.target.value)}
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
