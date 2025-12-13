/**
 * Comprehensive Job Seeker Profile Page
 * Enhanced with work experience, education, certifications, projects, and more
 */
import React, { useState, useEffect } from 'react';
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
  TrendingUp, CheckCircle2, AlertCircle, Save
} from 'lucide-react';

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
    loadCompleteProfile();
  }, [isAuthenticated, user, navigate]);
  
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
  
  const loadProfileAnalysis = async () => {
    try {
      const [completeness, keywords] = await Promise.all([
        apiService.get('/profile/completeness-analysis'),
        apiService.get('/profile/keywords-analysis')
      ]);
      
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
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }
  
  // Show error message if profile failed to load
  if (message.type === 'error' && !profileData.personal?.id) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-900">Authentication Required</CardTitle>
              <CardDescription className="text-base">
                Please login to access your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Failed to load profile.</strong> {message.text}
                </AlertDescription>
              </Alert>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900">Why am I seeing this?</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Your session has expired</li>
                  <li>You're not logged in</li>
                  <li>Your authentication token is invalid</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => navigate('/login')} size="lg" className="w-full">
                  Go to Login Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    localStorage.clear();
                    navigate('/login');
                  }}
                  className="w-full"
                >
                  Clear Data & Login Again
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                  ← Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const { overall_score, strength } = profileAnalysis.completeness;
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Navigation */}
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>
      
      {/* Header with Profile Completion */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold">Professional Profile</h1>
            <p className="text-muted-foreground mt-2">
              Build a comprehensive profile that stands out to employers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportText}>
              <Download className="w-4 h-4 mr-2" />
              Export Text
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        {/* Profile Strength Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`text-5xl font-bold ${getCompletionColor(overall_score)}`}>
                    {overall_score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">{strength} Profile</div>
                  <p className="text-muted-foreground">
                    {overall_score >= 80 
                      ? 'Your profile is optimized for maximum visibility!' 
                      : overall_score >= 60
                      ? 'Good progress! Complete a few more sections to stand out.'
                      : 'Complete your profile to attract more opportunities.'}
                  </p>
                  {profileData.preferences.open_to_opportunities && (
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Open to Work
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Progress value={overall_score} className="w-64 h-4" />
                <p className="text-xs text-muted-foreground mt-2">
                  {profileAnalysis.completeness.recommendations?.length || 0} recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Alert Messages */}
      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Profile Sections Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
          <TabsTrigger value="optimization">
            <Lightbulb className="w-4 h-4 mr-2" />
            Optimize
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PersonalInfoSection 
            data={profileData.personal} 
            onUpdate={refreshPersonalInfo} 
          />
          <ProfessionalSummarySection 
            data={profileData.professional} 
            onUpdate={refreshProfessionalInfo} 
          />
          <PreferencesSection 
            data={profileData.preferences} 
            onUpdate={refreshProfessionalInfo} 
          />
        </TabsContent>
        
        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          <WorkExperienceSection 
            data={profileData.workExperiences} 
            onUpdate={refreshWorkExperiences} 
          />
        </TabsContent>
        
        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <EducationSection 
            data={profileData.educations} 
            onUpdate={refreshEducations} 
          />
          <CertificationsSection 
            data={profileData.certifications} 
            onUpdate={refreshCertifications} 
          />
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <SkillsSection 
            data={profileData.professional}
            onUpdate={refreshProfessionalInfo} 
          />
        </TabsContent>
        
        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectsSection 
            data={profileData.projects} 
            onUpdate={refreshProjects} 
          />
        </TabsContent>
        
        {/* Additional Tab */}
        <TabsContent value="additional" className="space-y-6">
          <AwardsSection 
            data={profileData.awards} 
            onUpdate={refreshAwards} 
          />
          <LanguagesSection 
            data={profileData.languages} 
            onUpdate={refreshLanguages} 
          />
          <VolunteerSection 
            data={profileData.volunteerExperiences} 
            onUpdate={refreshVolunteerExperiences} 
          />
          <MembershipsSection 
            data={profileData.professionalMemberships} 
            onUpdate={refreshMemberships} 
          />
        </TabsContent>
        
        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <ProfileOptimization 
            analysis={profileAnalysis} 
            onRefresh={() => loadProfileAnalysis()} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedJobSeekerProfile;
