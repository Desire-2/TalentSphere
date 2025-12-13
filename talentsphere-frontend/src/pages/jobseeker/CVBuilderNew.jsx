import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { 
  Loader2, FileText, Download, Eye, Sparkles, CheckCircle2, 
  Briefcase, GraduationCap, Award, Code, Palette, Zap, Target,
  ArrowRight, Layout, Layers, Save, Trash2, Clock, Users, Plus, X
} from 'lucide-react';
import api from '../../services/api';
import CVRenderer from '../../components/cv/CVRenderer';

const CVBuilderNew = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const cvRendererRef = useRef(null);
  const previewSectionRef = useRef(null);
  
  // CV Builder form state
  const [selectedJobId, setSelectedJobId] = useState('none');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [selectedSections, setSelectedSections] = useState([
    'work', 'education', 'skills', 'summary', 'projects', 'certifications'
  ]);
  
  // References state
  const [references, setReferences] = useState([
    { name: '', position: '', company: '', email: '', phone: '', relationship: '' }
  ]);
  
  // Custom job details state
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobCompany, setCustomJobCompany] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [customJobRequirements, setCustomJobRequirements] = useState('');
  
  // CV output state
  const [cvContent, setCvContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Available sections
  const availableSections = [
    { id: 'work', label: 'Work Experience', icon: Briefcase, color: 'text-blue-600' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-purple-600' },
    { id: 'skills', label: 'Skills', icon: Code, color: 'text-green-600' },
    { id: 'summary', label: 'Professional Summary', icon: FileText, color: 'text-orange-600' },
    { id: 'projects', label: 'Projects', icon: Layers, color: 'text-indigo-600' },
    { id: 'certifications', label: 'Certifications', icon: Award, color: 'text-yellow-600' },
    { id: 'references', label: 'References', icon: Users, color: 'text-pink-600' },
  ];

  useEffect(() => {
    fetchInitialData();
    loadSavedCV();
  }, []);

  // Load saved CV from localStorage
  const loadSavedCV = () => {
    try {
      const savedCV = localStorage.getItem('talentsphere_cv_content');
      const savedConfig = localStorage.getItem('talentsphere_cv_config');
      
      if (savedCV && savedConfig) {
        const cvData = JSON.parse(savedCV);
        const config = JSON.parse(savedConfig);
        
        // Restore CV content
        setCvContent(cvData);
        
        // Restore configuration
        if (config.selectedStyle) setSelectedStyle(config.selectedStyle);
        if (config.selectedSections) setSelectedSections(config.selectedSections);
        if (config.selectedJobId) setSelectedJobId(config.selectedJobId);
        if (config.customJobTitle) setCustomJobTitle(config.customJobTitle);
        if (config.customJobCompany) setCustomJobCompany(config.customJobCompany);
        if (config.customJobDescription) setCustomJobDescription(config.customJobDescription);
        if (config.customJobRequirements) setCustomJobRequirements(config.customJobRequirements);
        if (config.references) setReferences(config.references);
        if (config.lastUpdated) setLastSaved(new Date(config.lastUpdated));
        
        // Show preview if CV exists
        setShowPreview(true);
        
        // Format time for display
        const timeAgo = config.lastUpdated ? formatTimeAgo(new Date(config.lastUpdated)) : '';
        setSuccess(`Previous CV loaded successfully${timeAgo ? ` (saved ${timeAgo})` : ''}. Generate a new one to update.`);
      }
    } catch (err) {
      console.warn('Failed to load saved CV:', err);
    }
  };

  // Save CV to localStorage
  const saveCV = (cvData, config) => {
    try {
      localStorage.setItem('talentsphere_cv_content', JSON.stringify(cvData));
      localStorage.setItem('talentsphere_cv_config', JSON.stringify(config));
      setLastSaved(new Date());
      console.log('CV saved to localStorage');
    } catch (err) {
      console.error('Failed to save CV to localStorage:', err);
    }
  };

  // Clear saved CV
  const clearSavedCV = () => {
    try {
      localStorage.removeItem('talentsphere_cv_content');
      localStorage.removeItem('talentsphere_cv_config');
      setCvContent(null);
      setShowPreview(false);
      setLastSaved(null);
      setSuccess('CV cleared successfully.');
    } catch (err) {
      console.error('Failed to clear saved CV:', err);
    }
  };

  // Format time ago helper
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const userResponse = await api.get('/cv-builder/user-data');
      if (userResponse.success) {
        setUserData(userResponse.data);
      }
      
      // Fetch available CV styles
      const stylesResponse = await api.get('/cv-builder/styles');
      if (stylesResponse.success) {
        setStyles(stylesResponse.data);
      }
      
      // Fetch user's saved/applied jobs
      try {
        const jobsResponse = await api.get('/applications/my-applications?per_page=50');
        if (jobsResponse.applications && jobsResponse.applications.length > 0) {
          const uniqueJobs = jobsResponse.applications
            .map(app => app.job)
            .filter((job, index, self) => 
              index === self.findIndex(j => j.id === job.id)
            );
          setJobs(uniqueJobs);
        }
      } catch (jobsError) {
        console.warn('Failed to load user jobs:', jobsError);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('Failed to load CV builder data. Please refresh the page.');
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

  // Reference management functions
  const addReference = () => {
    setReferences([...references, { 
      name: '', 
      position: '', 
      company: '', 
      email: '', 
      phone: '', 
      relationship: '' 
    }]);
  };

  const removeReference = (index) => {
    if (references.length > 1) {
      setReferences(references.filter((_, i) => i !== index));
    }
  };

  const updateReference = (index, field, value) => {
    const newReferences = [...references];
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  const hasValidReferences = () => {
    return references.some(ref => ref.name.trim() && ref.position.trim());
  };

  const handleGenerateCV = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Debug: Log current state
      console.log('=== CV Generation Debug ===');
      console.log('Selected Job ID:', selectedJobId);
      console.log('Custom Job Title:', customJobTitle);
      console.log('Custom Job Company:', customJobCompany);
      console.log('Custom Job Description:', customJobDescription ? customJobDescription.substring(0, 50) + '...' : 'empty');
      console.log('Custom Job Requirements:', customJobRequirements ? customJobRequirements.substring(0, 50) + '...' : 'empty');
      
      const payload = {
        sections: selectedSections,
        style: selectedStyle
      };
      
      if (selectedJobId && selectedJobId !== 'none') {
        console.log('Using job_id from saved jobs:', selectedJobId);
        payload.job_id = parseInt(selectedJobId);
      } else if (customJobTitle) {
        // Use custom job details if provided
        console.log('Using custom job_data from form fields');
        payload.job_data = {
          title: customJobTitle,
          company_name: customJobCompany,
          description: customJobDescription,
          requirements: customJobRequirements
        };
        console.log('job_data object:', payload.job_data);
      } else {
        console.log('No job target - generating general CV');
      }
      
      console.log('Final payload being sent:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/cv-builder/generate', payload);
      
      console.log('CV Generation Response:', response);
      
      if (!response.success) {
        setError(response.message || 'Failed to generate CV content');
        setLoading(false);
        return;
      }
      
      const cvData = response.data.cv_content;
      console.log('CV Content received:', cvData);
      
      // Add references if included in sections and valid references exist
      if (selectedSections.includes('references') && hasValidReferences()) {
        const validReferences = references.filter(ref => 
          ref.name.trim() && ref.position.trim()
        );
        cvData.references = validReferences;
      }
      
      // Save CV and configuration to localStorage
      const config = {
        selectedStyle,
        selectedSections,
        selectedJobId,
        customJobTitle,
        customJobCompany,
        customJobDescription,
        customJobRequirements,
        references,
        lastUpdated: new Date().toISOString()
      };
      saveCV(cvData, config);
      
      setCvContent(cvData);
      setShowPreview(true);
      setSuccess('✨ AI-powered CV generated and saved! Customize the template and download as PDF.');
      setLoading(false);
      
      // Auto-scroll to preview after a short delay
      setTimeout(() => {
        if (previewSectionRef.current) {
          previewSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    } catch (err) {
      console.error('CV generation failed:', err);
      setError(err.message || 'Failed to generate CV. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!cvRendererRef.current) {
      setError('CV renderer not ready. Please try again.');
      return;
    }

    setExportStatus('loading');
    const exportButton = cvRendererRef.current.querySelector('.export-pdf-button');
    if (exportButton) {
      exportButton.click();
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-blue-600" />
            AI CV Builder
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Create professional, ATS-optimized resumes with AI-powered content generation
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4 text-blue-600" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Target Job */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Target Job (Optional)</Label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
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

                {/* Custom Job Details - Show when "none" is selected */}
                {selectedJobId === 'none' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-xs font-semibold text-blue-900">Custom Job Details (Optional)</Label>
                    <p className="text-xs text-blue-700">Enter job details to tailor your CV for a specific position</p>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Name</Label>
                      <Input
                        value={customJobCompany}
                        onChange={(e) => setCustomJobCompany(e.target.value)}
                        placeholder="e.g., Tech Corp Inc."
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Job Description</Label>
                      <Textarea
                        value={customJobDescription}
                        onChange={(e) => setCustomJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        className="text-sm resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Requirements</Label>
                      <Textarea
                        value={customJobRequirements}
                        onChange={(e) => setCustomJobRequirements(e.target.value)}
                        placeholder="Paste job requirements here..."
                        className="text-sm resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* References Section */}
                {selectedSections.includes('references') && (
                  <div className="space-y-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-semibold text-pink-900 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Professional References
                        </Label>
                        <p className="text-xs text-pink-700 mt-0.5">Add people who can vouch for your work</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addReference}
                        className="h-7 text-xs border-pink-300 hover:bg-pink-100"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {references.map((ref, index) => (
                        <div key={index} className="p-3 bg-white rounded-md border border-pink-200 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-pink-800">Reference {index + 1}</span>
                            {references.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeReference(index)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Full Name *</Label>
                              <Input
                                value={ref.name}
                                onChange={(e) => updateReference(index, 'name', e.target.value)}
                                placeholder="John Doe"
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Position *</Label>
                              <Input
                                value={ref.position}
                                onChange={(e) => updateReference(index, 'position', e.target.value)}
                                placeholder="Senior Manager"
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Company</Label>
                              <Input
                                value={ref.company}
                                onChange={(e) => updateReference(index, 'company', e.target.value)}
                                placeholder="Tech Corp Inc."
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input
                                type="email"
                                value={ref.email}
                                onChange={(e) => updateReference(index, 'email', e.target.value)}
                                placeholder="john@company.com"
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Phone</Label>
                              <Input
                                type="tel"
                                value={ref.phone}
                                onChange={(e) => updateReference(index, 'phone', e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Relationship</Label>
                              <Input
                                value={ref.relationship}
                                onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                                placeholder="Former Manager"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Style */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Design Template</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {styles.find(s => s.id === selectedStyle) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {styles.find(s => s.id === selectedStyle).description}
                    </p>
                  )}
                </div>

                {/* Sections */}
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
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all text-xs
                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                        >
                          <Checkbox checked={isSelected} className="pointer-events-none h-3.5 w-3.5" />
                          <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                          <label className="flex-1 cursor-pointer font-medium">{section.label}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateCV}
                  disabled={loading || selectedSections.length === 0}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {cvContent ? 'Update CV' : 'Generate CV'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Clear CV Button */}
                {cvContent && (
                  <div className="space-y-2">
                    {lastSaved && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-2">
                        <Clock className="h-3 w-3" />
                        <span>Saved {formatTimeAgo(lastSaved)}</span>
                      </div>
                    )}
                    <Button
                      onClick={clearSavedCV}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" />
                      Clear Saved CV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!cvContent ? (
              <Card className="h-[600px] flex items-center justify-center border-dashed border-2">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Your CV Will Appear Here
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Configure your preferences and click "Generate CV" to create your professional resume
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold">CV Generated - {selectedStyle}</span>
                    </div>
                    {lastSaved && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 border-l pl-3">
                        <Save className="h-3.5 w-3.5 text-green-600" />
                        <span>Saved {formatTimeAgo(lastSaved)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {showPreview ? 'Hide' : 'Preview'}
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={exportStatus === 'loading'}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exportStatus === 'loading' ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                </div>

                {/* CV Preview */}
                {showPreview && (
                  <div ref={previewSectionRef}>
                    <Card className="border-2 border-blue-200">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            Live Preview
                          </CardTitle>
                          <div className="text-xs text-gray-500">
                            Template: <span className="font-semibold capitalize">{selectedStyle}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div ref={cvRendererRef} className="bg-white shadow-lg">
                          <CVRenderer
                            cvData={cvContent}
                            selectedTemplate={selectedStyle}
                            onExport={handleExportCallback}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ATS Score */}
                {cvContent.ats_score && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        ATS Compatibility Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className="text-2xl font-bold text-green-600">
                          {cvContent.ats_score.estimated_score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${cvContent.ats_score.estimated_score}%` }}
                        />
                      </div>
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

export default CVBuilderNew;
