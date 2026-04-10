/**
 * Comprehensive Job Seeker Profile Page
 * Enhanced with work experience, education, certifications, projects, and more
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  User, Briefcase, GraduationCap, Award, FolderKanban, 
  Languages, Heart, Users, Settings, Download, Lightbulb,
  TrendingUp, CheckCircle2, AlertCircle, Save, ChevronRight,
  Menu, X, Code2, Zap, Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Import sub-components
import PersonalInfoSection from './sections/PersonalInfoSection';
import ProfessionalSummarySection from './sections/ProfessionalSummarySection';
import WorkExperienceSection from './sections/WorkExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import CertificationsSection from './sections/CertificationsSection';
import ProjectsSection from './sections/ProjectsSection';
import AwardsSection from './sections/AwardsSection';
import LanguagesSection from './sections/LanguagesSection';
import VolunteerSection from './sections/VolunteerSection';
import MembershipsSection from './sections/MembershipsSection';
import ReferencesSection from './sections/ReferencesSection';
import PreferencesSection from './sections/PreferencesSection';
import PrivacySection from './sections/PrivacySection';
import ProfileOptimization from './sections/ProfileOptimization';

const EnhancedJobSeekerProfile = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMessageBadge, setShowMessageBadge] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    personal: {},
    professional: {},
    workExperiences: [],
    educations: [],
    certifications: [],
    projects: [],
    awards: [],
    languages: [],
    volunteerExperiences: [],
    professionalMemberships: [],
    references: [],
    preferences: {}
  });
  
  // Profile analysis state
  const [profileAnalysis, setProfileAnalysis] = useState({
    completeness: { overall_score: 0, sections: {}, recommendations: [] },
    keywords: { current_keywords: [], suggested_keywords: [] }
  });
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'job_seeker') {
      console.warn('🔒 User not authenticated or not a job seeker, redirecting to login');
      navigate('/login');
      return;
    }
    // Only fetch once — prevents re-fetch when authStore creates a new user object reference
    // (e.g. after token refresh), which would wipe any unsaved edits
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadCompleteProfile();
    }
  }, [isAuthenticated, user?.role, navigate]);
  
  const loadCompleteProfile = async () => {
    try {
      setLoading(true);
      
      // Use apiService instead of direct fetch for consistent auth handling
      const response = await apiService.get('/profile/complete-profile');
      
      setProfileData({
        personal: response.user || {},
        professional: response.job_seeker_profile || {},
        workExperiences: response.work_experiences || [],
        educations: response.educations || [],
        certifications: response.certifications || [],
        projects: response.projects || [],
        awards: response.awards || [],
        languages: response.languages || [],
        volunteerExperiences: response.volunteer_experiences || [],
        professionalMemberships: response.professional_memberships || [],
        references: response.references || [],
        preferences: response.job_seeker_profile || {}
      });
      
      // Load profile analysis
      await loadProfileAnalysis();
    } catch (error) {
      console.error('Failed to load profile:', error);
      
      // Handle auth errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.error('❌ Authentication failed - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setMessage({ type: 'error', text: `Failed to load profile: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };
  
  // Section-specific refresh functions
  const refreshPersonalInfo = async () => {
    try {
      const response = await apiService.getProfile();
      setProfileData(prev => ({
        ...prev,
        personal: response
      }));
    } catch (error) {
      console.error('Failed to refresh personal info:', error);
    }
  };
  
  const refreshProfessionalInfo = async () => {
    try {
      const response = await apiService.getProfile();
      setProfileData(prev => ({
        ...prev,
        professional: response.job_seeker_profile || {},
        preferences: response.job_seeker_profile || {}
      }));
    } catch (error) {
      console.error('Failed to refresh professional info:', error);
    }
  };
  
  const refreshWorkExperiences = async () => {
    try {
      const data = await apiService.getWorkExperiences();
      setProfileData(prev => ({
        ...prev,
        workExperiences: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh work experiences:', error);
    }
  };
  
  const refreshEducations = async () => {
    try {
      const data = await apiService.getEducations();
      setProfileData(prev => ({
        ...prev,
        educations: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh educations:', error);
    }
  };
  
  const refreshCertifications = async () => {
    try {
      const data = await apiService.getCertifications();
      setProfileData(prev => ({
        ...prev,
        certifications: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh certifications:', error);
    }
  };
  
  const refreshProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProfileData(prev => ({
        ...prev,
        projects: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  };
  
  const refreshAwards = async () => {
    try {
      const data = await apiService.getAwards();
      setProfileData(prev => ({
        ...prev,
        awards: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh awards:', error);
    }
  };
  
  const refreshLanguages = async () => {
    try {
      const data = await apiService.getLanguages();
      setProfileData(prev => ({
        ...prev,
        languages: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh languages:', error);
    }
  };
  
  const refreshVolunteerExperiences = async () => {
    try {
      const data = await apiService.getVolunteerExperiences();
      setProfileData(prev => ({
        ...prev,
        volunteerExperiences: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh volunteer experiences:', error);
    }
  };
  
  const refreshMemberships = async () => {
    try {
      const data = await apiService.getProfessionalMemberships();
      setProfileData(prev => ({
        ...prev,
        professionalMemberships: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh memberships:', error);
    }
  };

  const refreshReferences = async () => {
    try {
      const data = await apiService.getReferences();
      setProfileData(prev => ({
        ...prev,
        references: data || []
      }));
    } catch (error) {
      console.error('Failed to refresh references:', error);
    }
  };
  
  const loadProfileAnalysis = async () => {
    try {
      const [completenessResult, keywordsResult] = await Promise.allSettled([
        apiService.get('/profile/completeness-analysis'),
        apiService.get('/profile/keywords-analysis')
      ]);

      const completeness = completenessResult.status === 'fulfilled'
        ? completenessResult.value
        : { overall_score: 0, sections: {}, recommendations: [] };
      const keywords = keywordsResult.status === 'fulfilled'
        ? keywordsResult.value
        : { current_keywords: [], suggested_keywords: [] };

      console.log('📊 Profile Analysis Loaded:', { completeness, keywords });

      setProfileAnalysis({ completeness, keywords });
    } catch (error) {
      console.error('Failed to load profile analysis:', error);
      // Set default values on error
      setProfileAnalysis({
        completeness: { overall_score: 0, sections: {}, recommendations: [] },
        keywords: { current_keywords: [], suggested_keywords: [] }
      });
    }
  };
  
  const handleExportText = async () => {
    try {
      const response = await apiService.get('/profile/export-text', {}, { responseType: 'blob' });
      
      const blob = new Blob([response], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profileData.personal.first_name}_${profileData.personal.last_name}_Profile.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Profile exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export profile' });
    }
  };
  
  const handleExportJSON = async () => {
    try {
      const data = await apiService.get('/profile/export-json');
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profileData.personal.first_name}_${profileData.personal.last_name}_Profile.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Profile data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export profile data' });
    }
  };
  
  const getCompletionColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get section completion percentage
  const getSectionCompletion = (sectionName) => {
    return profileAnalysis.completeness?.sections?.[sectionName] || 0;
  };

  // Tab configuration with icons
  const tabs = [
    { value: 'overview', label: 'Overview', icon: User, color: 'text-blue-600' },
    { value: 'experience', label: 'Experience', icon: Briefcase, color: 'text-purple-600' },
    { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-green-600' },
    { value: 'skills', label: 'Skills', icon: Zap, color: 'text-yellow-600' },
    { value: 'projects', label: 'Projects', icon: Code2, color: 'text-indigo-600' },
    { value: 'additional', label: 'Credentials', icon: Award, color: 'text-rose-600' },
    { value: 'optimization', label: 'Optimize', icon: Lightbulb, color: 'text-amber-600' }
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Sticky Header Skeleton */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 max-w-7xl py-4">
            <div className="h-10 bg-slate-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
        
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
            
            {/* Card skeleton */}
            <div className="h-40 bg-slate-200 rounded-lg" />
            
            {/* Tabs skeleton */}
            <div className="h-12 bg-slate-200 rounded-lg" />
            
            {/* Content skeleton */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="h-64 bg-slate-200 rounded-lg" />
              <div className="h-64 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error message if profile failed to load
  if (message.type === 'error' && !profileData.personal?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-900">Session Expired</CardTitle>
              <CardDescription className="text-base">
                We couldn't load your profile. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="border-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {message.text}
                </AlertDescription>
              </Alert>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900 text-sm">Common reasons:</h3>
                <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                  <li>Your session has expired</li>
                  <li>You've been logged out</li>
                  <li>Your internet connection is unstable</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2 space-y-2">
                <Button onClick={() => location.reload()} size="lg" className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                  Return to Login
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    localStorage.clear();
                    navigate('/');
                  }}
                  className="w-full text-slate-600"
                >
                  ← Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden sm:inline-flex text-slate-600"
            >
              ← Dashboard
            </Button>
            <div className="hidden sm:flex items-center text-sm text-slate-500 gap-2 min-w-0">
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium text-slate-700">My Profile</span>
            </div>
          </div>
          
          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportText} className="gap-2">
                <Download className="w-4 h-4" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
                <Download className="w-4 h-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Page Header with Profile Card */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Professional Profile</h1>
              <p className="text-slate-600 mt-2">
                Build and showcase your comprehensive career profile
              </p>
            </div>
            {profileData.preferences?.open_to_opportunities && (
              <Badge className="w-fit gap-2 bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                Open to Work
              </Badge>
            )}
          </div>
          
          {/* Profile Strength Card - Enhanced */}
          <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Score */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${getCompletionColor(profileAnalysis.completeness.overall_score)}`}>
                      {profileAnalysis.completeness.overall_score}%
                    </span>
                    <span className="text-sm text-slate-500">Complete</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mt-2">
                    {profileAnalysis.completeness.strength || 'Good'} Profile
                  </p>
                </div>

                {/* Progress & Message */}
                <div className="sm:col-span-2">
                  <Progress 
                    value={profileAnalysis.completeness.overall_score} 
                    className="h-3 mb-3"
                  />
                  <p className="text-sm text-slate-700 mb-3">
                    {profileAnalysis.completeness.overall_score >= 80 
                      ? '🌟 Your profile is optimized for maximum visibility!' 
                      : profileAnalysis.completeness.overall_score >= 60
                      ? '📈 Good progress! Complete a few more sections to stand out.'
                      : '🎯 Complete your profile to attract more opportunities.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profileAnalysis.completeness.recommendations?.length || 0} recommendations available · 
                    Last updated today
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Alert Messages - Floating */}
        {message.text && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
            <Alert className={`${message.type === 'error' 
              ? 'border-red-200 bg-red-50 text-red-800' 
              : 'border-green-200 bg-green-50 text-green-800'}`
            }>
              <div className="flex items-start gap-3">
                {message.type === 'error' ? 
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" /> :
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <AlertDescription className="font-medium">
                    {message.text}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}
        
        {/* Tabs with Enhanced Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation - Multi-line on mobile, single line on desktop */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex sm:grid sm:grid-cols-7 w-full gap-1 bg-slate-100 p-1 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const completion = getSectionCompletion(tab.value);
                return (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="shrink-0 sm:shrink group relative data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${tab.color} transition-colors`} />
                      <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                      {completion > 0 && completion < 100 && tab.value !== 'optimization' && (
                        <Badge 
                          variant="outline" 
                          className="text-xs h-5 px-1.5 flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {completion}%
                        </Badge>
                      )}
                      {completion === 100 && tab.value !== 'optimization' && (
                        <CheckCircle2 className="w-3 h-3 text-green-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PersonalInfoSection 
              data={profileData.personal} 
              onUpdate={refreshPersonalInfo} 
            />
            <ProfessionalSummarySection 
              data={profileData.professional} 
              onUpdate={refreshProfessionalInfo} 
            />
            <div className="xl:col-span-2">
              <PreferencesSection 
                data={profileData.preferences} 
                onUpdate={refreshProfessionalInfo} 
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Work Experience</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {profileData.workExperiences?.length || 0} position{(profileData.workExperiences?.length || 0) !== 1 ? 's' : ''} added
                </p>
              </div>
              <Badge variant="outline">{getSectionCompletion('experience')}% Complete</Badge>
            </div>
            <WorkExperienceSection 
              data={profileData.workExperiences} 
              onUpdate={refreshWorkExperiences} 
            />
          </div>
        </TabsContent>
        
        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Education</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {profileData.educations?.length || 0} qualification{(profileData.educations?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="outline">{getSectionCompletion('education')}% Complete</Badge>
              </div>
              <EducationSection 
                data={profileData.educations} 
                onUpdate={refreshEducations} 
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Certifications</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {profileData.certifications?.length || 0} certification{(profileData.certifications?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <CertificationsSection 
                data={profileData.certifications} 
                onUpdate={refreshCertifications} 
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Skills & Expertise</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Highlight your professional capabilities
                </p>
              </div>
              <Badge variant="outline">{getSectionCompletion('skills')}% Complete</Badge>
            </div>
            <SkillsSection 
              data={profileData.professional}
              onUpdate={refreshProfessionalInfo} 
            />
          </div>
        </TabsContent>
        
        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Projects & Portfolio</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {profileData.projects?.length || 0} project{(profileData.projects?.length || 0) !== 1 ? 's' : ''} showcased
                </p>
              </div>
              <Badge variant="outline">{getSectionCompletion('projects')}% Complete</Badge>
            </div>
            <ProjectsSection 
              data={profileData.projects} 
              onUpdate={refreshProjects} 
            />
          </div>
        </TabsContent>
        
        {/* Credentials Tab (renamed from Additional) */}
        <TabsContent value="additional" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Awards & Recognition</h3>
                  <Badge variant="outline" className="text-xs">{getSectionCompletion('awards')}%</Badge>
                </div>
                <AwardsSection 
                  data={profileData.awards} 
                  onUpdate={refreshAwards} 
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Languages</h3>
                  <Badge variant="outline" className="text-xs">{getSectionCompletion('languages')}%</Badge>
                </div>
                <LanguagesSection 
                  data={profileData.languages} 
                  onUpdate={refreshLanguages} 
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Volunteer Experience</h3>
                  <Badge variant="outline" className="text-xs">{getSectionCompletion('volunteer')}%</Badge>
                </div>
                <VolunteerSection 
                  data={profileData.volunteerExperiences} 
                  onUpdate={refreshVolunteerExperiences} 
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Professional Memberships</h3>
                  <Badge variant="outline" className="text-xs">{getSectionCompletion('memberships')}%</Badge>
                </div>
                <MembershipsSection 
                  data={profileData.professionalMemberships} 
                  onUpdate={refreshMemberships} 
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">References</h3>
                <Badge variant="outline" className="text-xs">{getSectionCompletion('references')}%</Badge>
              </div>
              <ReferencesSection
                data={profileData.references}
                onUpdate={refreshReferences}
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6 mt-6 animate-in fade-in duration-300">
          <ProfileOptimization 
            analysis={profileAnalysis} 
            profileData={profileData}
            onRefresh={() => loadProfileAnalysis()} 
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default EnhancedJobSeekerProfile;
