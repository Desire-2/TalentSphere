import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Loader2, FileText, Download, Eye, Sparkles, CheckCircle2, 
  Briefcase, GraduationCap, Award, Code, Star, TrendingUp,
  Palette, Zap, Target, Users, ChevronRight, ArrowRight,
  Layout, Layers
} from 'lucide-react';
import api from '../../services/api';
import CVRenderer from '../../components/cv/CVRenderer';

const CVBuilder = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const cvRendererRef = useRef(null);
  
  // CV Builder form state
  const [selectedJobId, setSelectedJobId] = useState('none');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [customJobRequirements, setCustomJobRequirements] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [selectedSections, setSelectedSections] = useState([
    'work',
    'education',
    'skills',
    'summary',
    'projects',
    'certifications'
  ]);
  
  // CV output state
  const [cvContent, setCvContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Available sections with icons
  const availableSections = [
    { id: 'work', label: 'Work Experience', default: true, icon: Briefcase, color: 'text-blue-600' },
    { id: 'education', label: 'Education', default: true, icon: GraduationCap, color: 'text-purple-600' },
    { id: 'skills', label: 'Skills & Competencies', default: true, icon: Code, color: 'text-green-600' },
    { id: 'summary', label: 'Professional Summary', default: true, icon: FileText, color: 'text-orange-600' },
    { id: 'projects', label: 'Projects & Portfolio', default: true, icon: Layers, color: 'text-indigo-600' },
    { id: 'certifications', label: 'Certifications & Licenses', default: true, icon: Award, color: 'text-yellow-600' },
    { id: 'awards', label: 'Awards & Recognition', default: false, icon: Star, color: 'text-pink-600' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const userResponse = await api.get('/cv-builder/user-data');
      if (userResponse.success) {
        setUserData(userResponse.data);
      }
      
      // Fetch available CV styles
      try {
        const stylesResponse = await api.get('/cv-builder/styles');
        if (stylesResponse.success) {
          setStyles(stylesResponse.data);
        }
      } catch (stylesError) {
        console.warn('Failed to load styles, using defaults:', stylesError);
        // Set default styles if API fails
        setStyles([
          { id: 'professional', name: 'Professional', description: 'Clean, traditional layout' },
          { id: 'modern', name: 'Modern', description: 'Clean, minimalist design' },
          { id: 'creative', name: 'Creative', description: 'Modern, visually engaging layout' }
        ]);
      }
      
      // Fetch user's saved/applied jobs for quick selection
      try {
        const jobsResponse = await api.get('/applications/my-applications?per_page=50');
        if (jobsResponse.applications && jobsResponse.applications.length > 0) {
          // Extract unique jobs from applications
          const uniqueJobs = jobsResponse.applications
            .map(app => app.job)
            .filter((job, index, self) => 
              index === self.findIndex(j => j.id === job.id)
            );
          setJobs(uniqueJobs);
        }
      } catch (jobsError) {
        console.warn('Failed to load user jobs:', jobsError);
        // Continue without jobs - user can still use custom job input
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError(err.message || 'Failed to load CV builder data. Please refresh the page.');
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter(s => s !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleGenerateCV = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Prepare payload
      const payload = {
        sections: selectedSections,
        style: selectedStyle
      };
      
      // Add job data if selected or custom entered
      if (selectedJobId && selectedJobId !== 'none') {
        payload.job_id = parseInt(selectedJobId);
      } else if (customJobTitle) {
        payload.job_data = {
          title: customJobTitle,
          description: customJobDescription,
          requirements: customJobRequirements
        };
      }
      
      console.log('Generating CV with payload:', payload);
      
      // Use incremental generation endpoint for better rate limit handling
      const response = await api.post('/cv-builder/generate-incremental', payload);
      
      if (!response.success) {
        setError(response.message || 'Failed to generate CV content');
        setLoading(false);
        return;
      }
      
      const cvData = response.data.cv_content;
      setCvContent(cvData);
      setShowPreview(true);
      
      // Show success with generation stats
      const genTime = response.data.generation_time || 0;
      const sectionsCount = response.data.sections_generated?.length || selectedSections.length;
      setSuccess(`✨ AI-powered CV generated successfully! ${sectionsCount} sections in ${genTime}s. Preview below.`);
      setLoading(false);
    } catch (err) {
      console.error('CV generation failed:', err);
      setError(err.message || 'Failed to generate CV. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!cvRendererRef.current) {
        setError('CV renderer not ready. Please try again.');
        return;
      }

      setExportStatus('loading');
      setError(null);
      
      // Trigger PDF export from CVRenderer
      const exportButton = cvRendererRef.current.querySelector('.export-pdf-button');
      if (exportButton) {
        exportButton.click();
      }
      
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.message || 'Failed to download PDF. Please try again.');
      setExportStatus(null);
    }
  };

  const handleExportCallback = (status, details) => {
    setExportStatus(status);
    
    if (status === 'success') {
      setSuccess(`✓ CV downloaded successfully as ${details}!`);
      setTimeout(() => setExportStatus(null), 3000);
    } else if (status === 'error') {
      setError(`Failed to export PDF: ${details}`);
      setExportStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-blue-600" />
                AI CV Builder
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create professional, ATS-optimized resumes with AI
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">ATS Ready</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                <Palette className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-700">8+ Designs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar Configuration */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4 text-blue-600" />
                  Configuration
                </CardTitle>
              <CardDescription>Customize your CV settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Target Job Selection - Compact */}
              <div className="space-y-1.5">
                <Label htmlFor="job-select" className="text-xs font-semibold">Target Job (Optional)</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger id="job-select" className="h-9 text-sm">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General CV</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sections to Include - Compact */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  Include Sections
                </Label>
                <div className="space-y-1.5">
                  {availableSections.map(section => {
                    const Icon = section.icon;
                    const isSelected = selectedSections.includes(section.id);
                    return (
                      <div
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`
                          flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all text-xs
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Checkbox
                          id={section.id}
                          checked={isSelected}
                          className="pointer-events-none h-3.5 w-3.5"
                        />
                        <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                        <label htmlFor={section.id} className="flex-1 cursor-pointer font-medium">
                          {section.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile Summary - Compact */}
              {userData && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Profile Data
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-bold">{userData.work_experiences?.length || 0}</span>
                      <span className="text-gray-600">Jobs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                      <span className="font-bold">{userData.educations?.length || 0}</span>
                      <span className="text-gray-600">Education</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-green-600" />
                      <span className="font-bold">{userData.certifications?.length || 0}</span>
                      <span className="text-gray-600">Certs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5 text-orange-600" />
                      <span className="font-bold">{userData.projects?.length || 0}</span>
                      <span className="text-gray-600">Projects</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button - Compact */}
              <Button
                onClick={handleGenerateCV}
                disabled={loading || selectedSections.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                size="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate CV Designs
                  </>
                )}
              </Button>
              
              {!loading && (
                <p className="text-[10px] text-center text-gray-500">
                  Creates {styles.length || 8} different design options
                </p>
              )}
              {/* Target Job Selection */}
              <div className="space-y-2">
                <Label htmlFor="job-select">Target Job (Optional)</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger id="job-select">
                    <SelectValue placeholder="Select a job to tailor CV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific job (General CV)</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title} - {job.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Job Details */}
              {(!selectedJobId || selectedJobId === 'none') && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Or enter custom job details:</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-title">Job Title</Label>
                    <Input
                      id="custom-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-desc">Job Description</Label>
                    <textarea
                      id="custom-desc"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Paste job description here..."
                      value={customJobDescription}
                      onChange={(e) => setCustomJobDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-req">Job Requirements</Label>
                    <textarea
                      id="custom-req"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Paste requirements here..."
                      value={customJobRequirements}
                      onChange={(e) => setCustomJobRequirements(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Sections to Include */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-600" />
                  Sections to Include
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {availableSections.map(section => {
                    const Icon = section.icon;
                    const isSelected = selectedSections.includes(section.id);
                    return (
                      <div
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-purple-500 bg-purple-50 shadow-sm' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Checkbox
                          id={section.id}
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <Icon className={`h-5 w-5 ${section.color}`} />
                        <label
                          htmlFor={section.id}
                          className="text-sm font-medium flex-1 cursor-pointer select-none"
                        >
                          {section.label}
                        </label>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile Data Summary */}
              {userData && (
                <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative">
                    <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Your Profile Snapshot
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-blue-900">{userData.work_experiences?.length || 0}</div>
                          <div className="text-blue-600">Experience</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-bold text-purple-900">{userData.educations?.length || 0}</div>
                          <div className="text-purple-600">Education</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Award className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-green-900">{userData.certifications?.length || 0}</div>
                          <div className="text-green-600">Certificates</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Code className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-bold text-orange-900">{userData.projects?.length || 0}</div>
                          <div className="text-orange-600">Projects</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="space-y-3">
                <Button
                  onClick={handleGenerateCV}
                  disabled={loading || selectedSections.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating {styles.length} Designs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                      Generate Multiple CV Designs
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-white/50 rounded-lg p-2">
                  <Palette className="h-4 w-4 text-purple-600" />
                  <span>
                    We'll create <span className="font-bold text-purple-600">{styles.length || 8}+ stunning designs</span> for you
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {!cvContent ? (
            <Card className="h-[600px] flex items-center justify-center border-dashed border-2 border-gray-300 bg-white">
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Your CV Designs Will Appear Here
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Configure your preferences and click "Generate CV Designs" to create professional resumes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Compact Action Bar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {generatedDesigns.length} designs generated
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={loading || !selectedDesign}
                    size="sm"
                    className="h-8 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    title={selectedDesign 
                      ? `Download ${generatedDesigns.find(d => d.id === selectedDesign)?.name || 'selected'} design as PDF` 
                      : 'Select a design to download'}
                  >
                    {loading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {selectedDesign 
                      ? `Download ${generatedDesigns.find(d => d.id === selectedDesign)?.name || 'PDF'}` 
                      : 'Download PDF'}
                  </Button>
                </div>
              </div>

              {/* Design Selection Grid - Compact */}
              {generatedDesigns.length > 0 && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Palette className="h-4 w-4 text-blue-600" />
                          Choose Your Design
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Select from {generatedDesigns.length} professionally crafted designs
                        </CardDescription>
                      </div>
                      {selectedDesign && (
                        <div className="text-right">
                          <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            Ready to download
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {generatedDesigns.find(d => d.id === selectedDesign)?.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {generatedDesigns.map((design, index) => {
                        const isSelected = selectedDesign === design.id;
                        return (
                          <button
                            key={design.id}
                            onClick={() => setSelectedDesign(design.id)}
                            className={`
                              relative p-3 border-2 rounded-lg text-left transition-all
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                              }
                            `}
                          >
                            {/* Badge Number */}
                            <div className={`
                              absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                              ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}
                            `}>
                              {index + 1}
                            </div>
                            
                            <div className="mb-1.5">
                              <h4 className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                {design.name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">
                              {design.description}
                            </p>
                            
                            {isSelected && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[10px] font-semibold">Selected</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Compact Preview */}
                    {showPreview && selectedDesign && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-blue-600" />
                            {generatedDesigns.find(d => d.id === selectedDesign)?.name}
                          </h4>
                        </div>
                        <div
                          className="border rounded-lg p-4 bg-white shadow-sm overflow-auto max-h-[600px]"
                          dangerouslySetInnerHTML={{ 
                            __html: generatedDesigns.find(d => d.id === selectedDesign)?.html 
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Compact ATS Score */}
              {cvContent.ats_score && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Compatibility</span>
                      <span className="text-2xl font-bold text-green-600">
                        {cvContent.ats_score.estimated_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${cvContent.ats_score.estimated_score}%` }}
                      />
                    </div>
                    
                    {cvContent.ats_score.strengths?.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-xs font-semibold text-gray-700">Strengths:</h5>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {cvContent.ats_score.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Optimization Tips - Compact */}
              {cvContent.optimization_tips?.length > 0 && cvContent.optimization_tips.length <= 5 && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {cvContent.optimization_tips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-600">{idx + 1}</span>
                          </div>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default CVBuilder;
